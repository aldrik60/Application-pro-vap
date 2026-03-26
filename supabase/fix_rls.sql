-- ═══════════════════════════════════════════════════════════════════════════
-- PRO'VAP — Correctif RLS v2 (zéro récursion)
-- Exécutez ce script entier dans SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Supprimer TOUTES les policies existantes ──────────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END;
$$;

-- Supprimer aussi la fonction is_admin si elle existe (pour repartir propre)
DROP FUNCTION IF EXISTS public.is_admin();

-- ─── 2. Désactiver RLS sur les tables de contenu public ───────────────────────
-- Ces tables ne contiennent aucune donnée personnelle sensible

ALTER TABLE public.badges            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_messages    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_articles  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos            DISABLE ROW LEVEL SECURITY;

-- ─── 3. Profiles : accès simple sans récursion ───────────────────────────────
-- Tout utilisateur authentifié peut lire les profils (nécessaire pour l'admin)
-- Chacun ne peut modifier que le sien

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_authenticated"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── 4. Nicotine check-ins : données privées ─────────────────────────────────

ALTER TABLE public.nicotine_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_own"
  ON public.nicotine_checkins FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── 5. Vaper stories : published = public, insertion = propre compte ─────────

ALTER TABLE public.vaper_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories_select"
  ON public.vaper_stories FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "stories_insert"
  ON public.vaper_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_authenticated"
  ON public.vaper_stories FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "stories_delete_authenticated"
  ON public.vaper_stories FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- ─── 6. Admin notes : utilisateurs authentifiés ───────────────────────────────

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_authenticated"
  ON public.admin_notes FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ─── Vérification finale ──────────────────────────────────────────────────────
SELECT 'RLS corrigé v2 — aucune récursion !' AS status;
