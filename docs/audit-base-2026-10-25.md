# Audit base de données et sécurité : 25 octobre 2026

Projet Supabase `cvlutwrbminueqgnsoin` (plan gratuit, Postgres 17.6). Audit en lecture seule : requêtes SELECT, lecture des Edge Functions, simulation d'un client, de l'admin et d'un visiteur non connecté dans une transaction en lecture seule annulée ensuite. Rien n'a été modifié en base.

## Résumé

1. Le cloisonnement tient : un client ne voit que ses propres lignes, l'admin ne voit ni le journal ni les points d'étape des autres, un visiteur non connecté ne lit que le contenu public. Testé en simulation.
2. Fuite à corriger avant le 1er : un message push envoyé à une boutique ou à quelques clients s'affiche ensuite dans « Messages » chez tous les clients.
3. Deux promesses de la page RGPD ne sont pas tenues : la suppression du compte laisse les demandes de RDV (nom, e-mail, téléphone, message) et l'export n'inclut pas le journal d'humeur.
4. Un client peut publier lui-même son témoignage sans passer par la modération (appel direct à l'API). La table `shops` n'a pas de contrainte d'unicité, donc le script `add_amiens.sql` échouera tel quel.
5. Aucune sauvegarde : le plan gratuit n'en propose pas de restaurable. Il faut une première copie avant le 1er. Quotas larges au lancement (13 Mo sur 500 Mo), mais les envois push vont poser problème à partir de quelques centaines d'abonnés.

**Compte : 0 BLOQUANT, 7 AVANT LE 1ER, 11 APRÈS LANCEMENT.**

---

## Ce qui va bien (vérifié)

- RLS activée sur les 15 tables du schéma `public`.
- Simulation d'un client : il voit 1 profil (le sien), ses humeurs, ses abonnements push, 0 note admin, 0 RDV d'autrui, 0 témoignage non publié d'autrui.
- Simulation de l'admin : il voit les 10 profils et les 6 abonnements, mais seulement ses propres humeurs et points d'étape. La décision du 24/10 est bien appliquée.
- Simulation d'un visiteur non connecté : il lit `badges`, `shops`, `daily_messages`, `content_articles`, `videos`, `faq_items` (contenu public, utilisé aussi par le keep-alive Vercel sur `shops`) et 0 ligne de `mood_entries` ou `nicotine_checkins`. Sur `profiles`, `push_messages` et `vaper_stories`, il reçoit une erreur « permission denied for function is_admin » : aucune donnée ne sort, et l'app ne fait pas ces lectures sans être connectée.
- Rôle admin : le trigger `profiles_prevent_role_change` empêche un client de se donner le rôle admin.
- Les 7 fonctions SECURITY DEFINER ont toutes un `search_path` fixé. `get_vapid_secrets` et `get_daily_push_secret` ne sont exécutables ni par `anon` ni par `authenticated`. `is_admin` et `delete_my_account` sont ouvertes aux connectés, ce qui est voulu (l'alerte de l'advisor est attendue).
- `send-push` : `verify_jwt` actif, puis contrôle `is_admin()` avec le jeton de l'appelant. Seul un admin peut envoyer. La source est maintenant enregistrée dans `supabase/functions/send-push/index.ts` (version 7 déployée, copiée telle quelle).
- `daily-push` : secret comparé en temps constant, une seule tournée par jour grâce à `daily_push_runs`, rien n'est écrit dans `push_messages`.
- `notify-rdv` : appelable par n'importe qui, mais ne fait rien d'autre que notifier une demande existante et pas encore notifiée (voir constat 15).
- Suppression du compte : `delete_my_account` efface `auth.users`, ce qui supprime en cascade `profiles`, puis `mood_entries`, `nicotine_checkins`, `push_subscriptions`, `vaper_stories`, `admin_notes`, ainsi que les sessions et identités Auth. Seule exception : `appointment_requests` (constat 3).
- Aucun bucket Storage, Realtime non utilisé, aucun profil orphelin.

---

## Constats

### 1. Les messages ciblés sont visibles par tous les clients
- **Gravité** : AVANT LE 1ER
- **Concerné** : table `push_messages`, politique `push_messages_read_authenticated`, Edge Function `send-push`
- **Risque** : l'onglet Push de l'admin permet de cibler une boutique ou des clients précis. `send-push` archive chaque envoi dans `push_messages` sans noter la cible, et la politique laisse lire cette table à tout compte connecté. Un message comme « Marie, votre rendez-vous de jeudi est confirmé » apparaît donc dans la page Messages et dans le compteur de non-lus de tous les clients. Dans une app de sevrage, ça touche à la vie privée.
- **En attendant** : n'envoyer que des messages sans rien de personnel.
- **Correction** : enregistrer la cible et filtrer la lecture.
```sql
alter table public.push_messages add column target_user_ids uuid[];
drop policy push_messages_read_authenticated on public.push_messages;
create policy push_messages_read_own on public.push_messages
  for select to authenticated
  using (target_user_ids is null or (select auth.uid()) = any (target_user_ids));
```
Dans `send-push/index.ts`, ajouter à l'`insert` dans `push_messages` :
`target_user_ids: Array.isArray(target) && target.length > 0 ? target : null,`
puis redéployer la fonction (`verify_jwt` reste à true). `MessagesPage` et `useUnreadMessages` suivent la RLS automatiquement, il n'y a rien à changer côté app.

### 2. Un client peut publier son témoignage sans modération
- **Gravité** : AVANT LE 1ER
- **Concerné** : table `vaper_stories`, politiques `stories_insert_own` et `stories_update_own`
- **Risque** : l'app envoie `is_published: false`, mais la base ne l'impose pas. Un client qui appelle l'API directement (avec sa clé de session, visible dans son navigateur) peut créer ou modifier son témoignage avec `is_published = true`. Le texte s'affiche alors à tous dans Ressources, sous la marque Pro'Vap, sans relecture : propos déplacés, allégation santé, publicité.
- **Correction** : l'app ne modifie jamais un témoignage côté client (seul l'admin le fait), on peut donc retirer ce droit.
```sql
drop policy stories_update_own on public.vaper_stories;
alter policy stories_insert_own on public.vaper_stories
  with check ((select auth.uid()) = user_id and is_published = false);
```

### 3. La suppression du compte laisse les demandes de RDV
- **Gravité** : AVANT LE 1ER
- **Concerné** : table `appointment_requests`, clé `appointment_requests_user_id_fkey` (ON DELETE SET NULL)
- **Risque** : à la suppression du compte, la demande reste en base avec le nom, l'e-mail, le téléphone et le message. Seul le lien vers le compte disparaît. La page Confidentialité annonce pourtant que « l'ensemble de vos données est effacé ».
- **Correction** (au choix, la suppression en cascade suit la page légale) :
```sql
alter table public.appointment_requests
  drop constraint appointment_requests_user_id_fkey,
  add constraint appointment_requests_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;
```
Si Antony veut garder une trace des RDV traités, il faut l'écrire dans la page légale, par exemple « demandes de RDV conservées X mois ».

### 4. L'export « Mes données » est incomplet
- **Gravité** : AVANT LE 1ER
- **Concerné** : `src/pages/ProfilePage.tsx`, fonction `handleExportData`
- **Risque** : l'export contient le profil, les points d'étape et les témoignages, mais ni le journal d'humeur (`mood_entries`, la donnée la plus sensible), ni les demandes de RDV, ni la date du consentement. La page légale promet « l'ensemble de vos données » (droit d'accès et de portabilité).
- **Correction** : ajouter au `Promise.all`
  `supabase.from('mood_entries').select('*').eq('user_id', user.id)` et
  `supabase.from('appointment_requests').select('*').eq('user_id', user.id)`,
  puis les placer dans `payload` avec `consentement_suivi_at: user.user_metadata?.consentement_suivi_at ?? null`.
  Les notes conseiller (`admin_notes`) ne sont pas lisibles par le client. Une demande d'accès par e-mail devra les inclure : à prévoir dans la procédure, sans rien changer au code.

### 5. Aucune sauvegarde de la base
- **Gravité** : AVANT LE 1ER
- **Concerné** : tout le projet (plan gratuit)
- **Risque** : le plan gratuit ne propose pas de sauvegarde restaurable depuis le tableau de bord (à vérifier dans Database > Backups). Une mauvaise requête, une migration ratée ou une suspension du projet ferait perdre les journaux des clients, sans retour possible. Les fichiers de `supabase/backups/` ne couvrent que quelques tables de contenu.
- **Correction** :
  - avant le 1er, faire une copie complète depuis le Terminal (Antony saisit lui-même le mot de passe de la base, que personne d'autre ne voit) :
    `npx supabase db dump --db-url "<chaîne de connexion du tableau de bord>" -f provap-schema.sql`
    puis la même commande avec `--data-only -f provap-donnees.sql`.
    Ranger ces fichiers **hors du dépôt Git** : ils contiennent des données de santé.
  - ensuite, une copie par semaine, ou passer au plan Pro (environ 25 $/mois). Le plan Pro donne 7 jours de sauvegardes quotidiennes, met fin à la mise en pause et active la protection des mots de passe fuités (reste connu de l'audit d'août).

### 6. `shops.name` n'est pas unique, le script Amiens échouera
- **Gravité** : AVANT LE 1ER (avant d'exécuter `add_amiens.sql`)
- **Concerné** : table `shops`, fichier `supabase/add_amiens.sql`
- **Risque** : le script termine par `on conflict (name) do nothing`, alors que la table n'a aucune contrainte unique sur `name`. Postgres refusera avec « there is no unique or exclusion constraint matching the ON CONFLICT specification ». La valeur `Amiens` de l'enum serait alors ajoutée, mais pas la boutique.
- **Correction** (les 7 noms actuels sont tous différents, la commande passe) :
```sql
alter table public.shops add constraint shops_name_key unique (name);
```

### 7. Vérifier la première tournée automatique de 9 h
- **Gravité** : AVANT LE 1ER
- **Concerné** : tâche pg_cron `daily-push-9h-paris`, table `daily_push_runs`
- **Risque** : la tâche n'a encore jamais tourné (0 ligne dans `cron.job_run_details` et dans `daily_push_runs`). Si la tournée plante après avoir réservé la date, personne n'est prévenu et il n'y a pas de nouvel essai ce jour-là. Le changement d'heure tombe le 25/10 : 9 h à Paris = 8 h UTC, c'est prévu.
- **Correction** : le 25/10 puis le 26/10 après 9 h 05, lancer
```sql
select run_date, finished_at, result from public.daily_push_runs order by run_date desc limit 3;
select status, return_message, start_time from cron.job_run_details order by start_time desc limit 4;
```
`finished_at` vide avec `started_at` rempli veut dire que la tournée a planté : regarder les logs de l'Edge Function `daily-push`.

### 8. Pas de limite sur les demandes de RDV
- **Gravité** : APRÈS LANCEMENT
- **Concerné** : table `appointment_requests`, trigger `appointment_requests_notify`, Edge Function `notify-rdv`
- **Risque** : chaque demande envoie un e-mail via le SMTP o2switch et un push aux admins. Un compte malveillant ou un script peut en créer des centaines : boîte rdv@ inondée, quota SMTP épuisé (le même compte sert aussi aux e-mails de mot de passe oublié).
- **Correction** :
```sql
create or replace function public.limit_appointment_requests()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.appointment_requests
      where user_id = new.user_id and created_at > now() - interval '24 hours') >= 3 then
    raise exception 'Trop de demandes de rendez-vous en 24 h';
  end if;
  return new;
end $$;
revoke execute on function public.limit_appointment_requests() from public, anon, authenticated;
create trigger appointment_requests_rate_limit
  before insert on public.appointment_requests
  for each row execute function public.limit_appointment_requests();
```

### 9. Abonnements push : n'importe quelle adresse, sans plafond
- **Gravité** : APRÈS LANCEMENT
- **Concerné** : table `push_subscriptions`
- **Risque** : un client peut enregistrer des milliers d'abonnements avec des adresses inventées. `daily-push` et `send-push` essaieraient de les contacter un par un : tournée ralentie ou coupée par les limites des Edge Functions, et des requêtes partent vers des adresses choisies par l'attaquant.
- **Correction** : n'accepter que les services push connus. Les 6 abonnements actuels (Google et Apple) passent.
```sql
alter table public.push_subscriptions add constraint push_subscriptions_endpoint_known
  check (endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/');
```
Si besoin, ajouter un trigger qui plafonne à 10 abonnements par compte, sur le même modèle que le constat 8.

### 10. Les envois push et l'admin cassent au-delà de quelques centaines de clients
- **Gravité** : APRÈS LANCEMENT (à corriger avant environ 150 abonnés), à vérifier
- **Concerné** : Edge Functions `daily-push` et `send-push`, `src/pages/AdminPage.tsx`
- **Risque** :
  - `daily-push` charge les profils avec `.in('id', userIds)` et `send-push` filtre avec `.in('user_id', target)`. La liste d'identifiants part dans l'adresse de la requête, environ 37 caractères par client. Avec quelques centaines de clients, l'adresse devient trop longue : risque d'erreur 414 (à vérifier), et toute la tournée du matin tombe pour tout le monde.
  - L'API renvoie au plus 1 000 lignes par requête. Au-delà, `daily-push` oublie des abonnés sans rien signaler. Dans l'admin, la liste des clients, les statistiques et le ciblage par boutique (calculé dans le navigateur à partir de cette liste) deviennent faux.
- **Correction** : dans `daily-push`, lire les profils `quit_date not null` et les abonnements par pages de 1 000 (`.range()`), sans `.in()`. Dans `send-push`, passer la cible par une fonction SQL (RPC en POST) ou découper en paquets de 100. Dans l'admin, paginer ou compter côté base (`count: 'exact'`).

### 11. Limite de calcul des Edge Functions pour les gros envois
- **Gravité** : APRÈS LANCEMENT, à vérifier
- **Concerné** : `send-push` (tous les abonnés en parallèle), `daily-push` (paquets de 20)
- **Risque** : chaque notification est chiffrée et signée. Sur le plan gratuit, le temps de calcul par appel est limité (environ 2 s, à vérifier dans la doc Supabase). Au-delà de quelques centaines d'abonnés, la fonction peut être coupée en plein envoi.
- **Correction** : après le premier envoi « Tous » de plus de 100 abonnés, chercher « CPU » ou « WORKER_LIMIT » dans les logs des Edge Functions. Si l'erreur apparaît, découper l'envoi en plusieurs appels.

### 12. Performances : index et politiques RLS (advisor)
- **Gravité** : APRÈS LANCEMENT
- **Concerné** : `nicotine_checkins`, `vaper_stories`, `appointment_requests`, `admin_notes`, et 22 politiques RLS
- **Risque** : aucun aujourd'hui (quelques lignes). Plus tard, des pages plus lentes et la base qui travaille plus que nécessaire.
- **Correction** :
```sql
create index if not exists nicotine_checkins_user_id_idx on public.nicotine_checkins(user_id);
create index if not exists vaper_stories_user_id_idx on public.vaper_stories(user_id);
create index if not exists appointment_requests_user_id_idx on public.appointment_requests(user_id);
create index if not exists admin_notes_user_id_idx on public.admin_notes(user_id);
```
Ensuite, réécrire les politiques en remplaçant `auth.uid()` par `(select auth.uid())`, comme le recommande l'advisor « auth_rls_initplan ».

### 13. Droits trop larges par défaut sur les tables et sur `net`
- **Gravité** : APRÈS LANCEMENT, à vérifier
- **Concerné** : toutes les tables de `public`, schéma `net` (extension pg_net, installée dans `public` selon l'advisor)
- **Risque** : `anon` et `authenticated` ont INSERT, UPDATE, DELETE et même TRUNCATE sur toutes les tables. La RLS bloque les écritures, et TRUNCATE n'est pas accessible par l'API, donc ce n'est pas exploitable aujourd'hui. Mais une table créée demain sans RLS serait ouverte en écriture. De même, `anon` peut exécuter `net.http_post`. Ce n'est pas joignable par l'API REST, qui n'expose que `public` (à vérifier dans Settings > API > Exposed schemas).
- **Correction** :
```sql
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;
```
Pour `net`, `revoke execute on all functions in schema net from anon, authenticated;` est à tester d'abord : le trigger RDV tourne en SECURITY DEFINER sous `postgres` et ne devrait pas être touché.

### 14. Création de profil : le rôle n'est pas verrouillé
- **Gravité** : APRÈS LANCEMENT
- **Concerné** : politique `profiles_insert_own`
- **Risque** : théorique. Le trigger d'inscription crée toujours le profil, donc un client ne peut pas en insérer un second. Mais la politique accepterait `role = 'admin'` si un profil manquait, et le trigger anti-changement de rôle ne surveille que les UPDATE.
- **Correction** :
```sql
alter policy profiles_insert_own on public.profiles
  with check ((select auth.uid()) = id and role = 'user');
```

### 15. `notify-rdv` est appelable sans secret
- **Gravité** : APRÈS LANCEMENT
- **Concerné** : Edge Function `notify-rdv` (`verify_jwt` false)
- **Risque** : faible. Un tiers ne peut que relancer la notification d'une demande pas encore notifiée, et il lui faudrait l'UUID. Le mode `healthcheck` indique publiquement si le SMTP est configuré.
- **Correction** : faire comme pour `daily-push`, avec un en-tête secret lu dans le Vault, ajouté par le trigger `notify_new_appointment` et vérifié par la fonction.

### 16. Confirmation de l'e-mail désactivée
- **Gravité** : APRÈS LANCEMENT, à vérifier (décision d'Antony)
- **Concerné** : Auth > Providers > Email
- **Risque** : les 10 comptes ont été confirmés à la seconde même de leur création, et l'inscription envoie directement sur l'accueil. On peut donc créer un compte avec l'adresse de quelqu'un d'autre. Et un client qui se trompe d'adresse ne pourra jamais réinitialiser son mot de passe.
- **Correction** : choix assumé pour faciliter l'inscription en boutique ? Si on active la confirmation, il faut adapter `RegisterPage` (message « vérifiez vos e-mails ») et surveiller le quota d'envoi d'e-mails d'Auth.

### 17. Preuve du consentement modifiable par le client
- **Gravité** : APRÈS LANCEMENT, à vérifier
- **Concerné** : `auth.users.raw_user_meta_data.consentement_suivi_at`
- **Risque** : `user_metadata` est modifiable par le client lui-même (`auth.updateUser`), ce qui fait une preuve fragile. Par ailleurs, aucun des 10 comptes existants n'a cette date : tous ont été créés avant le 24/10. Si certains sont de vrais clients, leur consentement n'est pas enregistré.
- **Correction** : à terme, une table `consents` en insertion seule (client) ou `app_metadata` écrit côté serveur. Pour les comptes existants, supprimer les comptes de test avant le lancement, ou demander l'accord à la prochaine connexion.

### 18. Écarts entre les types TypeScript et la base
- **Gravité** : APRÈS LANCEMENT
- **Concerné** : `src/types/index.ts`, tables `nicotine_checkins`, `admin_notes`, `content_articles`, `videos`, `faq_items`, `profiles`
- **Constat** : les enums sont cohérents (`Shop`, `Feeling`, `MoodLevel`, `AppointmentStatus`, `role`) et toutes les colonnes de `Profile` existent. Petits écarts :
  - champs annoncés non vides alors que la base accepte le vide : `NicotineCheckIn.notes`, `AdminNote.created_by`, `ContentArticle.category`, `Video.is_published`, `Video.order_number` ;
  - `ShopData.address` et `phone` sont typés « peut être vide » alors que la base les impose (sans conséquence) ;
  - `tobacco_type`, `age_range` et `smoker_profile` sont du texte libre en base, sans contrôle des valeurs ;
  - la table `faq_items` (10 lignes) n'est lue nulle part : la FAQ de l'app est écrite en dur. Modifier la table ne change donc rien à l'écran ;
  - `profiles.email` n'est pas mis à jour si le client change d'adresse dans Auth.
- **Correction** : `alter table public.videos alter column is_published set not null, alter column order_number set not null;` (aucune ligne aujourd'hui). Pour le reste, aligner les types sur la base, idéalement en les générant (`supabase gen types`). Décider si la FAQ doit venir de la table ou si la table peut être supprimée.

---

## Quotas du plan gratuit au lancement

| Ressource | Limite gratuite | Aujourd'hui | Avis |
|---|---|---|---|
| Taille de la base | 500 Mo | 13 Mo (dont 1 Mo de données app) | Large : quelques Ko par client et par an |
| Connexions | 60 directes, pooler pour l'API | 13 ouvertes | L'app passe par l'API REST, sans souci |
| Edge Functions | 500 000 appels/mois | 2 appels/jour de cron + envois admin + RDV | Large ; voir constats 10 et 11 pour les gros envois |
| Comptes actifs (MAU) | 50 000 | 10 | Large |
| Mise en pause après 7 jours sans activité | oui | keep-alive Vercel quotidien en place | OK |
| Sauvegardes | aucune restaurable | aucune | Constat 5 |
| Historique pg_cron | sans purge | 2 lignes/jour | Négligeable |

## Restes connus, rappelés sans être recomptés

- Protection des mots de passe fuités : demande le plan Pro (advisor toujours en alerte).
- pg_graphql à désactiver : l'advisor signale les 14 tables visibles dans le schéma GraphQL pour `anon` et `authenticated`. La RLS s'applique aussi par GraphQL, il n'y a donc pas de fuite, mais c'est une porte d'entrée inutile.
