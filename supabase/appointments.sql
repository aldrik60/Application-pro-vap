-- ─────────────────────────────────────────────────────────────────────────────
-- Demandes de rendez-vous conseiller
--
-- Le client demande un RDV depuis Profil → « Mon conseiller Pro'Vap ».
-- La demande est enregistrée ici puis traitée dans le back-office Admin
-- (onglet « Rendez-vous »). Remplace l'ancien lien mailto: peu fiable sur mobile.
--
-- À exécuter une fois dans le SQL editor Supabase (ou via migration).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

create table if not exists public.appointment_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  shop text not null,
  preferred_slot text,
  message text,
  status text not null default 'nouveau' check (status in ('nouveau', 'traite', 'annule')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists appointment_requests_status_idx
  on public.appointment_requests (status, created_at desc);
create index if not exists appointment_requests_shop_idx
  on public.appointment_requests (shop);

alter table public.appointment_requests enable row level security;

-- Le client crée sa propre demande.
create policy "Users insert own appointment requests"
  on public.appointment_requests for insert
  with check (auth.uid() = user_id);

-- Le client peut relire ses propres demandes.
create policy "Users view own appointment requests"
  on public.appointment_requests for select
  using (auth.uid() = user_id);

-- L'admin / conseiller voit et gère toutes les demandes.
create policy "Admins manage appointment requests"
  on public.appointment_requests for all
  using (public.is_admin())
  with check (public.is_admin());
