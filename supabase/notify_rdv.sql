-- ─────────────────────────────────────────────────────────────────────────────
-- Notification des nouvelles demandes de RDV conseiller (Étape 2)
--
-- À chaque INSERT dans appointment_requests, un trigger appelle (via pg_net,
-- asynchrone) l'Edge Function `notify-rdv` qui :
--   1. envoie un e-mail récapitulatif à l'adresse centrale rdv@pro-vap.fr
--      (SMTP o2switch — secrets SMTP_* à configurer dans les secrets
--      des Edge Functions du dashboard Supabase) ;
--   2. envoie un push web aux appareils des admins (clés VAPID du Vault).
--
-- Sécurité : la fonction est appelée sans JWT (pg_net) mais ne fait confiance
-- qu'à l'id reçu — elle relit la ligne via service_role et ne notifie qu'une
-- fois grâce à la colonne notified_at (claim atomique).
--
-- ⚠️ DÉJÀ APPLIQUÉ EN PROD le 2026-07-22 (migration `notify_rdv_setup`).
--    Ce fichier documente l'état. Ne pas rejouer aveuglément.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pg_net;

alter table public.appointment_requests add column if not exists notified_at timestamptz;

create or replace function public.notify_new_appointment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://cvlutwrbminueqgnsoin.supabase.co/functions/v1/notify-rdv',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  -- Ne bloque jamais la création du RDV si la notification échoue
  return new;
end;
$$;

revoke execute on function public.notify_new_appointment() from anon, authenticated, public;

drop trigger if exists appointment_requests_notify on public.appointment_requests;
create trigger appointment_requests_notify
  after insert on public.appointment_requests
  for each row execute function public.notify_new_appointment();
