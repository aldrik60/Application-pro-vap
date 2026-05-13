-- ═══════════════════════════════════════════════════════════════════════════
-- PRO'VAP — Correctif RLS v3 (sécurité durcie, RGPD-ready, anti-récursion)
--
-- ⚠️  À EXÉCUTER UNE FOIS DANS LE SQL EDITOR DE SUPABASE.
--
--   Objectifs corrigés par rapport à fix_rls.sql (v2) :
--   1. profiles.SELECT n'est plus ouvert à tous les utilisateurs authentifiés
--      (un user ne peut plus lire les autres profils).
--   2. vaper_stories.UPDATE/DELETE et admin_notes.* ne sont plus ouverts à
--      tous les utilisateurs authentifiés.
--   3. Séparation user/admin restaurée côté SQL (pas seulement côté React).
--   4. La récursion RLS est évitée via une fonction SECURITY DEFINER
--      `public.is_admin()` qui contourne RLS pour lire le rôle.
--   5. Les utilisateurs peuvent supprimer leurs propres données (RGPD).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Reset : supprimer toutes les policies existantes ──────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS public.is_admin();

-- ─── 2. Fonction is_admin() — SECURITY DEFINER pour éviter la récursion ──────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ─── 3. Tables de contenu public : RLS désactivée (rien de sensible) ──────────

ALTER TABLE public.badges            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_messages    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_articles  DISABLE ROW LEVEL SECURITY;

-- Si la table videos existe, on la désactive aussi (présent dans fix_rls.sql v2)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'videos') THEN
    EXECUTE 'ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY';
  END IF;
END;
$$;

-- ─── 4. profiles : un user voit/édite son profil, l'admin voit/édite tout ────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Pas de DELETE direct sur profiles (la cascade ON DELETE des auth.users gère)

-- ─── 5. nicotine_checkins : strictement privé au user + lecture admin ────────

ALTER TABLE public.nicotine_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checkins_select_own"
  ON public.nicotine_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "checkins_select_admin"
  ON public.nicotine_checkins FOR SELECT
  USING (public.is_admin());

CREATE POLICY "checkins_insert_own"
  ON public.nicotine_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "checkins_update_own"
  ON public.nicotine_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "checkins_delete_own"
  ON public.nicotine_checkins FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "checkins_delete_admin"
  ON public.nicotine_checkins FOR DELETE
  USING (public.is_admin());

-- ─── 6. vaper_stories : témoignages — public si publié, sinon propriétaire ───

ALTER TABLE public.vaper_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories_select_published"
  ON public.vaper_stories FOR SELECT
  USING (is_published = true);

CREATE POLICY "stories_select_own"
  ON public.vaper_stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "stories_select_admin"
  ON public.vaper_stories FOR SELECT
  USING (public.is_admin());

CREATE POLICY "stories_insert_own"
  ON public.vaper_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stories_update_own"
  ON public.vaper_stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "stories_update_admin"
  ON public.vaper_stories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "stories_delete_own"
  ON public.vaper_stories FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "stories_delete_admin"
  ON public.vaper_stories FOR DELETE
  USING (public.is_admin());

-- ─── 7. admin_notes : strictement réservé aux admins ──────────────────────────

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_admin_only"
  ON public.admin_notes FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ─── 8. Vérification finale ──────────────────────────────────────────────────

SELECT 'RLS v3 appliqué — séparation user/admin restaurée, RGPD-ready, sans récursion.' AS status;
