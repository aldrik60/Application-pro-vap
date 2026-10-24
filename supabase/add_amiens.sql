-- ─────────────────────────────────────────────────────────────────────────────
-- Ajoute la boutique d'Amiens (8e boutique).
--
-- NE PAS APPLIQUER avant l'ouverture : la boutique deviendrait visible et
-- sélectionnable par les clients. Préparé le 2026-10-24.
--
-- Base : `preferred_shop_enum` (utilisé par profiles.preferred_shop et
-- vaper_stories.shop) doit connaître la valeur, puis la table `shops` porte
-- l'adresse, le téléphone et les horaires affichés dans l'app.
-- Compléter les XXX avant d'exécuter.
--
-- Code à mettre à jour le même jour (listes encore écrites en dur) :
--   - src/types/index.ts           type Shop : ajouter | 'Amiens'
--   - src/pages/OnboardingPage.tsx  liste des boutiques
--   - src/pages/ProfilePage.tsx     liste des boutiques
--   - src/pages/BoutiquesPage.tsx   liste + position sur la carte
-- (La page Ressources et le ciblage push lisent déjà la table `shops`.)
-- ─────────────────────────────────────────────────────────────────────────────

alter type public.preferred_shop_enum add value if not exists 'Amiens';

insert into public.shops (name, address, phone, hours)
values ('Amiens', 'XXX, 80000 Amiens', 'XXX', 'Lundi au samedi 10h-19h')
on conflict (name) do nothing;
