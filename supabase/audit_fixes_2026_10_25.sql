-- ─────────────────────────────────────────────────────────────────────────────
-- Corrections de l'audit base et sécurité du 25/10/2026
-- (rapport : docs/audit-base-2026-10-25.md, constats 1, 2, 3, 6, 12, 14)
--
-- Appliqué en prod le 2026-10-25 (migration `audit_fixes_2026_10_25`).
-- Ce fichier documente l'état. Ne pas rejouer aveuglément.
--
-- État AVANT (pour revenir en arrière) :
--   push_messages_read_authenticated : SELECT using (auth.uid() IS NOT NULL)
--   stories_insert_own               : INSERT with check (auth.uid() = user_id)
--   stories_update_own               : UPDATE using (auth.uid() = user_id)
--   profiles_insert_own              : INSERT with check (auth.uid() = id)
--   appointment_requests_user_id_fkey: REFERENCES profiles(id) ON DELETE SET NULL
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Messages ciblés : chacun ne lit que les messages à tous ou ceux qui le visent
alter table public.push_messages add column if not exists target_user_ids uuid[];
drop policy if exists push_messages_read_authenticated on public.push_messages;
create policy push_messages_read_own on public.push_messages
  for select to authenticated
  using (target_user_ids is null or (select auth.uid()) = any (target_user_ids));

-- 2. Témoignages : publication uniquement par l'admin (modération)
drop policy if exists stories_update_own on public.vaper_stories;
alter policy stories_insert_own on public.vaper_stories
  with check ((select auth.uid()) = user_id and is_published = false);

-- 3. Suppression du compte : les demandes de RDV partent avec lui
alter table public.appointment_requests
  drop constraint appointment_requests_user_id_fkey,
  add constraint appointment_requests_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;

-- 6. Nom de boutique unique (nécessaire pour add_amiens.sql)
alter table public.shops add constraint shops_name_key unique (name);

-- 12. Index sur user_id (performances à la montée en charge)
create index if not exists nicotine_checkins_user_id_idx on public.nicotine_checkins(user_id);
create index if not exists vaper_stories_user_id_idx on public.vaper_stories(user_id);
create index if not exists appointment_requests_user_id_idx on public.appointment_requests(user_id);
create index if not exists admin_notes_user_id_idx on public.admin_notes(user_id);

-- 14. Création de profil : jamais avec le rôle admin
alter policy profiles_insert_own on public.profiles
  with check ((select auth.uid()) = id and role = 'user');
