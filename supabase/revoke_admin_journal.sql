-- ─────────────────────────────────────────────────────────────────────────────
-- Le journal d'humeur et les points d'étape nicotine sont personnels :
-- seule la personne concernée y accède. Aucun écran Admin ne les utilisait.
-- Décision d'Antony du 2026-10-24 (consentement santé, RGPD art. 9).
--
-- Déjà appliqué sur la base de prod (projet cvlutwrbminueqgnsoin).
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists mood_select_admin on public.mood_entries;
drop policy if exists checkins_select_admin on public.nicotine_checkins;
drop policy if exists checkins_delete_admin on public.nicotine_checkins;
