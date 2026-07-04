-- ─────────────────────────────────────────────────────────────────────────────
-- Ajoute « Autre boutique » au choix de boutique.
--
-- Pour les personnes qui ne sont pas (encore) clientes d'une des 7 boutiques
-- Pro'Vap. Elles peuvent quand même choisir une référence et demander un RDV.
--
-- `preferred_shop` est un enum : il faut y ajouter la valeur pour que la
-- sauvegarde du profil accepte ce choix. (appointment_requests.shop est du
-- text, donc pas concerné.)
--
-- Déjà appliqué sur la base de prod (projet cvlutwrbminueqgnsoin).
-- ─────────────────────────────────────────────────────────────────────────────

alter type public.preferred_shop_enum add value if not exists 'Autre boutique';
