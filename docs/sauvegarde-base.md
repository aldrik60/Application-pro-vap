# Sauvegarde complète de la base (à refaire chaque semaine)

Le plan gratuit de Supabase ne garde aucune sauvegarde que l'on puisse restaurer. Cette copie est donc la seule protection. Comptez 10 minutes.

**Les fichiers obtenus contiennent les données de santé des utilisateurs. Ils ne vont JAMAIS dans le dossier du projet (git), ni dans un e-mail, ni sur un cloud public.**

## Avant de commencer (une seule fois)

1. Installer **Docker Desktop** (docker.com) et le laisser ouvert pendant la copie. La commande de Supabase s'en sert.
2. Ouvrir l'application **Terminal** du Mac.
3. Créer le dossier de rangement, hors du projet :

```bash
mkdir -p ~/Documents/Sauvegardes-ProVap
```

## Chaque semaine

### 1. Récupérer la chaîne de connexion

1. Ouvrir le tableau de bord Supabase, projet **cvlutwrbminueqgnsoin**.
2. Cliquer sur le bouton **Connect** (en haut de l'écran).
3. Choisir **Session pooler** et copier la ligne qui ressemble à :
   `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-….pooler.supabase.com:5432/postgres`
4. Remplacer `[YOUR-PASSWORD]` par le **mot de passe de la base**. Si vous l'avez perdu : tableau de bord → **Database → Settings** → réinitialiser le mot de passe (pensez à le noter dans votre gestionnaire de mots de passe).

Ne collez jamais ce mot de passe dans un message, un e-mail ou une conversation avec Claude.

### 2. Lancer les trois copies

Dans le Terminal, créez d'abord le dossier du jour, puis placez-vous dedans :

```bash
cd ~/Documents/Sauvegardes-ProVap && mkdir "$(date +%Y-%m-%d)" && cd "$(date +%Y-%m-%d)"
```

Collez ensuite la chaîne de connexion dans une variable (remplacez tout le texte entre guillemets par votre chaîne, mot de passe compris) :

```bash
export DB_URL="postgresql://postgres.xxxx:MOTDEPASSE@aws-0-xxxx.pooler.supabase.com:5432/postgres"
```

Puis les trois commandes, l'une après l'autre :

```bash
npx supabase db dump --db-url "$DB_URL" -f roles.sql --role-only
```

```bash
npx supabase db dump --db-url "$DB_URL" -f structure.sql
```

```bash
npx supabase db dump --db-url "$DB_URL" -f donnees.sql --use-copy --data-only
```

- `roles.sql` : les rôles de la base.
- `structure.sql` : les tables, règles de sécurité, fonctions.
- `donnees.sql` : le contenu (comptes, suivis, notifications…).

Quand c'est fini, effacez le mot de passe de la mémoire du Terminal :

```bash
unset DB_URL
```

### 3. Vérifier que la copie n'est pas vide

```bash
ls -lh
```

Les trois fichiers doivent apparaître. `structure.sql` fait en général plusieurs dizaines de Ko, `donnees.sql` plus encore. Un fichier de 0 octet ou de quelques octets signifie que la copie a échoué : recommencez.

Ensuite :

```bash
grep -c "^COPY " donnees.sql
```

Le nombre affiché est le nombre de tables copiées avec leurs données. Il doit être supérieur à 0 (une vingtaine ou plus). Et pour vérifier que les comptes sont dedans :

```bash
grep -c "COPY auth.users" donnees.sql
```

Le résultat doit être **1**.

Si une commande affiche une erreur (« password authentication failed », « connection refused »…) : vérifiez le mot de passe, que Docker est ouvert, et que vous avez bien pris la chaîne **Session pooler**.

### 4. Ranger

- Les fichiers restent dans `~/Documents/Sauvegardes-ProVap/AAAA-MM-JJ/`.
- Gardez les **4 dernières semaines**, supprimez les plus anciennes.
- Idéal : une deuxième copie sur un disque externe ou un coffre chiffré, jamais dans un dossier partagé ni dans le dépôt du projet.

## Ce que la copie ne contient pas

- Les **fonctions Edge** (leur code est dans le dépôt du projet).
- Les **fichiers stockés** (images, vidéos envoyées sur Supabase Storage), s'il y en a.
- Les **réglages du tableau de bord** (e-mail, connexion, clés, secrets).

## En cas de besoin de restauration

Ne restaurez rien vous-même. Gardez les fichiers intacts et demandez à l'équipe technique : la restauration se fait dans un nouveau projet Supabase avec `psql`, et se prépare avec soin.

Source : documentation Supabase, « Backup and Restore using the CLI » et « supabase db dump ».
