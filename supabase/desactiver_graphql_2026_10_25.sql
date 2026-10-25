-- Désactivation de GraphQL (pg_graphql), 25/10/2026, accord d'Antony.
-- Pourquoi : l'app n'utilise pas GraphQL (aucun appel dans src/ ni dans les fonctions).
-- Le module laissait voir le nom des tables (28 avertissements de sécurité Supabase).
-- Les données restaient protégées par les règles d'accès (RLS) ; l'app passe par l'API REST.
--
-- État avant : extension pg_graphql 1.5.11, schéma « graphql » (10 objets),
-- schéma « graphql_public » (1 fonction), déclencheurs Supabase
-- issue_pg_graphql_access, issue_graphql_placeholder, graphql_watch_ddl, graphql_watch_drop.
-- Méthode officielle : https://supabase.com/docs/guides/database/extensions/pg_graphql

drop extension if exists pg_graphql;

-- RETOUR ARRIÈRE (si un jour on a besoin de GraphQL) :
-- create extension pg_graphql with schema graphql;
