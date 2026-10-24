-- ─────────────────────────────────────────────────────────────────────────────
-- Notifications automatiques du matin (message du jour / nouveau palier)
--
-- pg_cron appelle l'Edge Function `daily-push` à 7 h et 8 h UTC. La fonction
-- n'envoie qu'à 9 h heure de Paris (8 h UTC l'hiver, 7 h UTC l'été) et une
-- seule fois par jour (date réservée dans daily_push_runs).
--
-- La fonction est appelée sans JWT : elle exige l'en-tête x-daily-secret, égal
-- au secret DAILY_PUSH_SECRET du Vault (généré ici, jamais affiché).
--
-- Appliqué en prod le 2026-10-24 (migrations `daily_push_setup` puis
-- `daily_push_cron`). Ce fichier documente l'état. Ne pas rejouer aveuglément.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. Secret partagé, registre des tournées ────────────────────────────────

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'DAILY_PUSH_SECRET') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'DAILY_PUSH_SECRET',
      'En-tête x-daily-secret attendu par l''Edge Function daily-push'
    );
  end if;
end $$;

create or replace function public.get_daily_push_secret()
returns text
language sql
stable
security definer
set search_path = public, vault
as $$
  select decrypted_secret::text from vault.decrypted_secrets where name = 'DAILY_PUSH_SECRET';
$$;

revoke execute on function public.get_daily_push_secret() from public, anon, authenticated;
grant execute on function public.get_daily_push_secret() to service_role;

create table if not exists public.daily_push_runs (
  run_date    date primary key,
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  result      jsonb
);

alter table public.daily_push_runs enable row level security;
-- Aucune politique : seul service_role (l'Edge Function) y accède.
revoke all on public.daily_push_runs from anon, authenticated;

-- ─── 2. Programmation ────────────────────────────────────────────────────────

create extension if not exists pg_cron;

select cron.schedule(
  'daily-push-9h-paris',
  '0 7,8 * * *',
  $cron$
  select net.http_post(
    url := 'https://cvlutwrbminueqgnsoin.supabase.co/functions/v1/daily-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-daily-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'DAILY_PUSH_SECRET')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);

-- Pour arrêter les envois :  select cron.unschedule('daily-push-9h-paris');
-- Bilan des tournées       :  select * from public.daily_push_runs order by run_date desc;
