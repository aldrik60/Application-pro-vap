# Pro'Vap Sevrage

Application métier mobile-first pour accompagner les clients Pro'Vap dans leur arrêt du tabac.

## Stack Technique
- React + TypeScript
- Vite
- Tailwind CSS v4
- Supabase (Auth + Base de données + RLS)
- Recharts (Parcours Nicotine)

## Déploiement Initial (Vercel ou Netlify)

1. **Créer le projet Supabase**
   - Créez un projet gratuit sur [Supabase](https://supabase.com).
   - Accédez au tableau de bord SQL et exécutez le script `supabase/schema.sql`.
   - Exécutez ensuite le script `supabase/seed.sql` pour injecter les badges, articles et messages.

2. **Variables d'environnement**
   - Modifiez le fichier `.env` à la racine (ou sur Vercel) et ajoutez :
     ```env
     VITE_SUPABASE_URL=votre_url_projet
     VITE_SUPABASE_ANON_KEY=votre_clef_publique
     ```

3. **Déployer sur Vercel**
   - Reliez votre dépôt GitHub à Vercel.
   - Le *Build Command* est `npm run build` et le *Output Directory* est `dist`.
   - N'oubliez pas de configurer les variables d'environnement dans le dashboad Vercel.

4. **Premier compte Administrateur**
   - Une fois l'application en ligne, créez un compte classique via la page Inscription.
   - Rendez-vous sur votre dashboard Supabase -> Table Editor -> `profiles`.
   - Localisez votre ligne et modifiez la colonne `role` de `user` à `admin`.
   - L'onglet "Admin" apparaîtra dans votre navigateur après rafraîchissement.

## Commandes locales

- `npm install` : Installer les dépendances
- `npm run dev` : Lancer le serveur de développement
- `npm run build` : Construire le projet pour la production
