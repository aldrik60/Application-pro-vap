-- ═══════════════════════════════════════════════════════════════════════════
-- PRO'VAP — Security Hardening (état appliqué en prod 2026-05-13)
-- Migrations Supabase: security_hardening_role_lock_rls_revoke,
--                     refine_prevent_role_change_allow_sql_admin,
--                     revoke_security_definer_from_anon
-- ═══════════════════════════════════════════════════════════════════════════
-- Ce fichier documente l'état RLS et les protections sécurité de la prod.
-- ⚠️ NE PAS rejouer aveuglément : la prod est déjà à jour. Pour info uniquement.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Anti self-promotion admin : bloque la modification de role pour les users
-- authentifiés non-admin. Laisse passer le contexte SQL admin (auth.uid() IS NULL)
-- pour permettre la promotion initiale d'un admin via le dashboard Supabase.
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'role cannot be changed by non-admin users';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_change ON public.profiles;
CREATE TRIGGER profiles_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();

-- 2. RLS sur contenu public (read = all, write = admin)
ALTER TABLE public.daily_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_messages_public_read"   ON public.daily_messages   FOR SELECT USING (true);
CREATE POLICY "daily_messages_admin_manage"  ON public.daily_messages   FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "content_articles_public_read"  ON public.content_articles FOR SELECT USING (true);
CREATE POLICY "content_articles_admin_manage" ON public.content_articles FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "badges_public_read"   ON public.badges  FOR SELECT USING (true);
CREATE POLICY "badges_admin_manage"  ON public.badges  FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "videos_public_read"   ON public.videos  FOR SELECT USING (true);
CREATE POLICY "videos_admin_manage"  ON public.videos  FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. faq_items et shops : public read + admin manage
CREATE POLICY "faq_items_public_read"   ON public.faq_items FOR SELECT USING (true);
CREATE POLICY "faq_items_admin_manage"  ON public.faq_items FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "shops_public_read"   ON public.shops FOR SELECT USING (true);
CREATE POLICY "shops_admin_manage"  ON public.shops FOR ALL    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Durcissement REVOKE EXECUTE sur les fonctions SECURITY DEFINER
-- handle_new_user reste utilisable comme trigger mais n'est plus appelable via REST
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- prevent_role_change : trigger uniquement
REVOKE EXECUTE ON FUNCTION public.prevent_role_change() FROM anon, authenticated, PUBLIC;

-- delete_my_account : authenticated seulement
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon, PUBLIC;

-- is_admin : authenticated seulement (utilisé par les policies RLS)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, PUBLIC;
