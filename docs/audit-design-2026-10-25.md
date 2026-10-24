# Audit design et ergonomie mobile, 25 octobre 2026

Relecture par le spécialiste design et ergonomie mobile. Lecture seule : aucun fichier de l'app modifié, aucune connexion, aucune écriture en base.

## Résumé en 5 lignes

1. Deux défauts à corriger avant tout : le logo Pro'Vap est noir sur fond noir en mode sombre (invisible sur connexion, inscription, onboarding et accueil), et sur iPhone le bandeau « Installer Pro'Vap » recouvre le bouton SOS et la barre du bas.
2. Un défaut de feuille de style touche toute l'app : `.input` et `.eyebrow` passent devant les classes Tailwind. Résultat : les champs restent en 14 px, ce qui fait zoomer l'iPhone à chaque saisie, et les petits titres prévus en terracotta s'affichent en gris.
3. Le défilement est porté par `#root` et ne revient jamais en haut quand on change de page. Une adresse inconnue donne une page vide. Un lien de mot de passe expiré bloque sur « Vérification du lien… ».
4. Plusieurs écrans débordent ou coupent du texte entre 320 et 375 px : libellés d'humeur du journal, mois de la date d'arrêt (« Septer »), nom du profil sous la mascotte. Certaines cibles tactiles ne font que 15 à 22 px de haut.
5. Les couleurs tiennent bien dans l'ensemble (texte principal entre 14 et 17:1). Quatre teintes passent sous 4,5:1 et se règlent dans les tokens. La direction de design est respectée, aucune refonte n'est proposée avant le 1er.

**Nombre de constats : 2 BLOQUANT, 18 AVANT LE 1ER, 17 APRÈS LANCEMENT.**

## Méthode

- **Site en ligne** (https://application-pro-vap.vercel.app), navigateur intégré en 375 × 812, en clair et en sombre, plus des contrôles à 320 px : connexion, inscription, mot de passe oublié, réinitialisation, mentions légales, route protégée sans session, adresse inconnue.
- **Écrans connectés** : lus dans le code (`src/pages`, `src/components`, `src/index.css`). Pour les mesures de débordement, j'ai reconstitué dans la page publique les blocs concernés avec les mêmes classes et la même CSS en ligne (humeur du jour, journal, tuiles de l'accueil, carte profil, barre du bas, bandeau d'installation, sélecteurs de date). Les chiffres viennent de ces maquettes, pas d'un vrai compte.
- **Contrastes** : ratios WCAG calculés sur les tokens de `src/index.css`, dans les deux modes.
- **Version** : le site en ligne correspond au commit `8a4fc9e`. La branche locale a 2 commits non poussés (`eadd5e4`, `3d37b02`). Ils ne touchent ni `index.css` ni les composants cités ici, donc les constats faits en ligne restent valables.
- Captures dans `docs/audit-design/` (liste en fin de document).

---

## BLOQUANT

### B1. Logo invisible en mode sombre
- **Écrans** : connexion, inscription, nouveau mot de passe, onboarding, accueil. `src/components/ProVapLogo.tsx:15`, `public/assets/logo-provap-blanc.svg`, `src/index.css:470-472`.
- **Ce que voit le client** : malgré son nom, le fichier « blanc » ne contient aucune couleur de remplissage, donc ses tracés s'affichent en noir pur (vérifié pixel par pixel : 100 % `#000000`). Sur le fond `#1a1a1a`, le contraste est de 1,2:1 et le logo disparaît presque. En mode clair, le filtre existant le rend lisible. Capture `01-connexion-sombre-logo.png`.
- **Correction** (CSS seule, sans toucher au SVG mis en cache par le service worker) : dans `index.css`, juste avant le `@media (prefers-color-scheme: light)` de la ligne 470, ajouter :
  ```css
  .pv-logo, [data-pv-logo] { filter: invert(1); }
  ```
  La règle du mode clair (`invert(1) brightness(0.15)`) reprend la main en clair : le rendu clair actuel ne change pas.

### B2. Le bandeau « Installer Pro'Vap » recouvre le SOS et la barre du bas (iPhone, Android)
- **Écrans** : tous les écrans avec barre du bas, plus le test de Fagerström. `src/components/InstallPrompt.tsx:6` et `:109`.
- **Ce que voit le client** : dans Safari, 3 secondes après l'arrivée sur l'accueil, le bandeau blanc se pose à 16 px du bas. Il couvre la barre de navigation et le bouton SOS (mesuré : bandeau de 706 à 796 px, barre à partir de 734 px, bouton SOS à partir de 716 px). Il ne se ferme que par une croix de 28 px et revient tous les 7 jours. C'est le parcours de tout nouveau client iPhone venu par le QR code. Capture `04-maquette-375-sombre-bandeau-installation.jpg`.
- **Correction** :
  - ligne 109 : `bottom: 'calc(env(safe-area-inset-bottom, 0px) + 104px)'` (le bandeau passe au-dessus de la barre et du SOS) ;
  - ligne 6 : ajouter `'/fagerstrom'` à `HIDDEN_ON`, car le bouton « Enregistrer mon résultat » est en bas de l'écran ;
  - ligne 187 : croix en `w-11 h-11 -m-2` au lieu de `w-7 h-7`.

---

## AVANT LE 1ER

### A1. Les petits titres en terracotta s'affichent en gris
- **Écrans** : 26 endroits, par exemple « Bon retour », « Bienvenue », « Votre résultat », « Recommandation Pro'Vap », catégories des guides, « + 5 heures » sur l'accueil, dates des messages. `src/index.css:211-218`.
- **Ce que voit le client** : `.eyebrow` est écrite hors des couches Tailwind v4 (vérifié dans le CSS compilé), donc elle passe devant `text-gold-text` et `text-flame-text`. Sur la page de connexion, « Bon retour » sort en `rgba(246,241,232,0.55)` au lieu du terracotta. Les accents voulus par la charte disparaissent.
- **Correction** : envelopper uniquement cette règle :
  ```css
  @layer components {
    .eyebrow { /* contenu actuel inchangé */ }
  }
  ```
  Aucun `eyebrow` n'est combiné à une classe de taille Tailwind (vérifié). Le seul effet est que les couleurs prévues réapparaissent.

### A2. L'iPhone zoome à chaque saisie
- **Écrans** : tous les formulaires (connexion, inscription, profil, journal, point d'étape, rendez-vous, sélecteurs de date). `src/index.css:324`.
- **Ce que voit le client** : `.input` impose 14 px et l'emporte sur `text-base` (mesuré en ligne : 14 px sur le champ e-mail de connexion). Safari iOS zoome sur tout champ ou menu sous 16 px. L'écran grossit, puis il faut dézoomer à la main.
- **Correction** : `font-size: 16px;` dans `.input` (ligne 324).

### A3. En changeant de page, on arrive au milieu de l'écran
- **Écrans** : tous. `src/index.css:145-157`, `src/App.tsx:59-64`.
- **Ce que voit le client** : `html, body, #root` ont `height: 100%` et `overflow-x: hidden`, donc c'est `#root` qui défile, pas la fenêtre, et rien ne remet le défilement à zéro. Vérifié en ligne : après un défilement sur l'inscription, la page Mentions légales s'ouvre au même décalage. Dans l'app, si l'on touche « Profil » en bas de l'accueil, Profil s'ouvre déjà défilé.
- **Correction** : dans `App.tsx`, un petit composant placé dans `<BrowserRouter>` :
  ```tsx
  function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => { document.getElementById('root')?.scrollTo(0, 0); window.scrollTo(0, 0) }, [pathname])
    return null
  }
  ```

### A4. Une adresse inconnue affiche une page vide
- **Écrans** : toute URL mal tapée ou ancienne (vérifié : `/page-qui-nexiste-pas` donne un écran charbon vide, sans aucun lien). `src/App.tsx:94`.
- **Correction** : dernière route du `<Routes>` : `<Route path="*" element={<Navigate to="/" replace />} />` (importer `Navigate`).

### A5. Lien de réinitialisation expiré : écran bloqué
- **Écran** : `/reset-password`. `src/pages/ResetPasswordPage.tsx:14-22` et `:48-54`.
- **Ce que voit le client** : sans session valide (lien expiré, déjà utilisé, ou ouvert dans un autre navigateur), l'écran reste sur « Vérification du lien… », sans bouton (vérifié en ligne, 0 lien sur la page).
- **Correction** : un minuteur de 4 s dans le `useEffect` qui passe un état `expired` à vrai. L'écran affiche alors « Ce lien a expiré ou a déjà servi. » et un bouton `btn-primary` vers `/forgot-password`.

### A6. Mentions légales ouvertes depuis l'inscription : « Retour » ne fait rien
- **Écrans** : `src/pages/RegisterPage.tsx:146` (`target="_blank"`), `src/pages/LegalPage.tsx:18` (`navigate(-1)`).
- **Ce que voit le client** : le lien ouvre un nouvel onglet sans historique, donc « Retour » est inactif.
- **Correction** : reprendre la logique déjà écrite dans `SosPage.tsx:43-47` : si `history.state?.idx > 0` alors `navigate(-1)`, sinon `navigate('/login')`.

### A7. Cibles tactiles trop petites sur les écrans publics et la page Boutiques
- **Écrans et mesures (hauteur)** : « Mot de passe oublié ? » 20 px (`LoginPage.tsx:91`), « Créer un compte » 18 px (`LoginPage.tsx:103`), « Mentions légales · … » 17 px (`LoginPage.tsx:107`, `RegisterPage.tsx:179`), « Se connecter » 18 px (`RegisterPage.tsx:175`), lien « politique de confidentialité » 15 px (`RegisterPage.tsx:146`), « Retour à la connexion » 20 px (`ForgotPasswordPage.tsx:35`), « Retour » 20 px (`LegalPage.tsx:17`), téléphone des autres boutiques environ 22 px (`BoutiquesPage.tsx:208-214`), croix du bandeau d'installation 28 px.
- **Correction** : `inline-flex items-center min-h-11 px-2` sur ces liens et boutons (44 px). Pour le téléphone des boutiques : `w-11 h-11 -mr-2 flex items-center justify-center` à la place de `p-1`.

### A8. Journal : les libellés d'humeur débordent de leurs cases
- **Écran** : Journal. `src/pages/JournalPage.tsx:121-138` (libellés ligne 12).
- **Ce que voit le client** : cases de 53 px à 375 px avec `p-3`, texte en capitales espacées. « EXCELLENT » mesure 61 px et dépasse de sa case, « TRÈS DIFFICILE » passe sur deux lignes. À 360 px (Android courant) et à 320 px, presque tous les libellés débordent. Capture `05-maquette-320-clair-debordements.jpg`.
- **Correction** : aligner sur le check-in de l'accueil, qui tient à 375 px : grille `gap-1.5`, boutons `px-1 py-2`, libellé `text-[10px] text-ink-3 font-semibold leading-tight` (sans `uppercase tracking-wider`), et « Très dur » au lieu de « Très difficile » comme sur l'accueil (`HomePage.tsx:616`).

### A9. Profil : un prénom long passe sous la mascotte
- **Écran** : Profil, carte d'identité. `src/pages/ProfilePage.tsx:222-246`.
- **Ce que voit le client** : à 375 px, « Christophe » (26 px) recouvre déjà Vap, placée en absolu en haut à droite. À 320 px, la fin du nom est cachée.
- **Correction** : `className="min-w-0 pr-16"` sur le `<div>` de la ligne 239, et `break-words` sur le `<p>` de la ligne 240.

### A10. Profil : le bouton d'enregistrement est au-dessus de l'« Objectif plaisir »
- **Écran** : Profil. `src/pages/ProfilePage.tsx:366-389`.
- **Ce que voit le client** : il remplit le cadeau et le montant, ne trouve aucun bouton en dessous et quitte l'écran. Ses deux champs sont perdus, alors que c'est « Enregistrer mon profil », plus haut, qui les sauvegarde.
- **Correction** : déplacer le bouton des lignes 366-368 juste après la section « Objectif plaisir » (après la ligne 389).

### A11. Onboarding : « Une autre date » incomplète est ignorée sans prévenir
- **Écran** : onboarding, étape 2. `src/pages/OnboardingPage.tsx:305-320` et `:352`.
- **Ce que voit le client** : s'il choisit « Une autre date » sans remplir les trois menus, « Continuer » marche quand même. À la fin, aucune date n'est enregistrée et l'accueil affiche « indiquez votre date d'arrêt depuis votre profil ». Une date future est aussi acceptée, et le compteur reste alors à 0.
- **Correction** : `disabled={quitChoice === 'custom' && !buildLocalDateStr(quitDay, quitMonth, quitYear)}` sur « Continuer », et sous les menus une ligne `text-[12px] text-ink-3` : « Choisissez le jour, le mois et l'année. » Refuser aussi une date postérieure à aujourd'hui.

### A12. Date d'arrêt : le mois est coupé (« Septer »)
- **Écrans** : Profil (`ProfilePage.tsx:301-314`) et onboarding (`OnboardingPage.tsx:306-319`).
- **Ce que voit le client** : trois colonnes égales avec 16 px de marge à gauche et 36 px à droite. Il reste 39 px pour le mois, qui s'affiche « Septer », « Novem »… Ce sera pire en 16 px (A2). Capture `06-selecteurs-date-mois-coupe.png`.
- **Correction** : grille `grid-cols-[1fr_1.7fr_1.2fr]` et, sur ces trois menus, `style={{ paddingLeft: 10, paddingRight: 26, backgroundPosition: 'right 8px center' }}`.

### A13. Quatre teintes sous le seuil de lisibilité
Détail des ratios dans la section « Contrastes » plus bas. Correctifs proposés dans `src/index.css`, sans changer la direction (le terracotta reste le terracotta) :
- **Sombre** (`@theme`, lignes 27-28, 46-48, 58) : `--color-gold-text`, `--color-flame-text`, `--color-accent-2`, `--color-secondary` passent de `#d4623f` à `#de6e4a` (4,2 à 4,8:1 sur les cartes). `--color-danger` devient `#e2694a` (3,3 à 4,8:1). `--color-success` devient `#8a9b6c` (4,2 à 5,2:1).
- **Clair** (bloc `@media` lignes 100-134) : ajouter `--color-success: #5f6e45;` (3,3 à 4,9:1) et `--color-danger: #b03f22;` (4,2 à 5,2:1).
- `.btn-danger` (ligne 392) : fond fixe `#b03f22` pour garder un texte ivoire lisible (5,2:1) quel que soit le mode.
- **Fagerström** (`FagerstromPage.tsx:80`) : « Dépendance moyenne » utilise `--color-pv-terracotta`, soit 2,4:1 sur fond sombre. Remplacer par `var(--color-flame-text)`.
- **Onglet Vape, plan de descente** (`JourneyPage.tsx:221`) : les taux à venir sont en `--color-ink-4` (2,4:1 en sombre, 1,8:1 en clair). Passer en `var(--color-ink-3)`.
- Écrans concernés : texte orange de 11-12 px sur les cartes (« Journal → », « Dans 3 jours… », « Prochain palier »), étiquettes « bien » et « difficile » de l'historique Vape, résultat Fagerström, montant du kit.

### A14. Accueil : les deux tuiles de chiffres ne sont pas alignées
- **Écran** : accueil. `src/pages/HomePage.tsx:587-607`.
- **Ce que voit le client** : « CIGARETTES ÉVITÉES » tient sur deux lignes et « ÉCONOMIES » sur une seule, donc les deux grands chiffres sont décalés en hauteur (visible sur la capture 04).
- **Correction** : `className="card p-4 flex flex-col justify-between"` sur la tuile.

### A15. Cases à cocher blanches en mode sombre
- **Écrans** : inscription (deux cases de consentement), journal (« J'ai fumé aujourd'hui »). `src/index.css:95-97`.
- **Ce que voit le client** : deux carrés blanc vif sur fond charbon (capture `03-inscription-sombre.jpg`).
- **Correction** : `color-scheme: dark;` dans `:root` (ligne 95) et `color-scheme: light;` dans le `:root` du mode clair (ligne 101). Les cases, menus et barres de défilement natifs suivent alors le thème.

### A16. Fenêtres du bas : le dernier bouton est collé à la barre d'accueil de l'iPhone
- **Écrans** : toutes les fenêtres `Modal` (« Un écart ? », « Nouveau point d'étape », rendez-vous, badge). `src/components/Modal.tsx:102`.
- **Ce que voit le client** : la fenêtre monte du bas avec seulement 16 px de marge. Sur iPhone à encoche, le dernier bouton touche le trait d'accueil. La version plein écran (guides) a le même souci en fin de texte.
- **Correction** : sur le `div` de la ligne 102, `style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}`.

### A17. SOS : l'écran peut se mettre en veille pendant les 3 minutes (à vérifier)
- **Écran** : SOS. `src/pages/SosPage.tsx:49`.
- **Ce que voit le client** : pendant l'exercice, il regarde sans toucher. Avec un verrouillage automatique à 30 s ou 1 min, l'écran s'éteint au milieu de l'exercice.
- **Correction** : demander le maintien de l'écran tant que l'exercice tourne :
  ```tsx
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    navigator.wakeLock?.request('screen').then(l => { lock = l }).catch(() => {})
    return () => { lock?.release() }
  }, [])
  ```
  À tester sur iPhone installé et sur Android (voir la liste de contrôle).

### A18. Bandeau d'installation et fenêtre « Restons en contact » hors charte
- **Écrans** : bandeau d'installation (`InstallPrompt.tsx:124`, `:134`) et fenêtre de notifications (`NotificationToggle.tsx:85`, `:192-226`, `:293`, `:300`, `:311-313`).
- **Ce que voit le client** : le nom « Pro'Vap » et « Restons en contact. » s'affichent en Cormorant Garamond, une police qui n'est plus chargée. Le téléphone la remplace par Georgia italique, un style serif étranger à la charte. Les pastilles et les puces sont en ocre `#cb8002`, réservé à la scène SOS.
- **Correction** : supprimer les `fontFamily: "'Cormorant Garamond'…"` (ou mettre `var(--font-display)`), et remplacer `#cb8002` par `#a2371a` dans ces deux composants.

---

## APRÈS LANCEMENT

1. **Premier écran pour un nouveau client** (`LoginPage.tsx:43-54`, `:100-106`) : le QR code mène à « Bon retour / Se connecter ». Pour quelqu'un qui découvre l'app en boutique, « Créer un compte » n'est qu'un petit lien en bas. Piste : QR vers `/register`, ou deux boutons de même poids (« Créer mon compte » en `btn-primary`, « J'ai déjà un compte » en `btn-ghost`).
2. **Afficher le mot de passe** : ajouter un bouton œil sur les champs mot de passe. Retirer aussi le texte indicatif « •••••••• », qui fait croire que le champ est déjà rempli (`LoginPage.tsx:78`, `RegisterPage.tsx:123`, `ResetPasswordPage.tsx`).
3. **Ressources et Journal difficiles à trouver** : Ressources n'est accessible que par une carte de l'accueil, le Journal par un petit lien ou par Profil. Sur `/contenu`, `/journal`, `/messages` et `/boutiques`, aucun onglet n'est actif et Ressources n'a pas de bouton retour. Piste : un onglet Ressources, ou un en-tête avec retour.
4. **En-têtes hétérogènes** : Journal (`JournalPage.tsx:103`) et Admin (`AdminPage.tsx:665`) utilisent des titres terracotta en capitales, Profil n'a pas de titre (`ProfilePage.tsx:207-209`), les autres pages suivent le modèle petit titre + grand titre + italique. À uniformiser.
5. **Boutons retour à 36-38 px** (`JournalPage.tsx:95`, `MessagesPage.tsx:54`, `BoutiquesPage.tsx:79`) : passer en `w-11 h-11`. Même chose pour les filtres de boutiques des témoignages (`ContentPage.tsx:368-396`, environ 30 px) et les badges de la page Étapes (environ 32 px).
6. **Stades verrouillés peu lisibles** (`BadgesPage.tsx:119`) : `opacity: 0.45` fait tomber la ligne « Jour 30 · … » à 2,1:1 en sombre et 1,9:1 en clair. Garder le texte à pleine opacité et ne griser que l'icône.
7. **États de chargement** : le journal affiche « Votre premier enregistrement apparaîtra ici » pendant le chargement (`JournalPage.tsx:234`). Le message du jour de l'accueil montre d'abord un texte par défaut puis change (`HomePage.tsx:76`). Les 4 guides intégrés sont remplacés par les 10 guides de la base (`ContentPage.tsx:229`). Prévoir des blocs gris de chargement.
8. **Défilement de fond sous les fenêtres** (`Modal.tsx:20-27`) : la fenêtre bloque le défilement de `body` alors que c'est `#root` qui défile, donc la page derrière peut encore bouger sur iPhone.
9. **Barre d'état iPhone** (`index.html:16`, à vérifier) : avec `apple-mobile-web-app-status-bar-style` à `default`, la barre du haut peut rester blanche quand l'app installée est en mode sombre. Si c'est le cas, passer à `black-translucent` et ajouter `env(safe-area-inset-top)` aux en-têtes (chantier plus large).
10. **Grain plein écran** (`index.css:163-172`, à vérifier) : un calque fixe en `mix-blend-mode` au-dessus de tout peut ralentir le défilement sur les Android d'entrée de gamme. Le tester, sinon le réserver aux grandes surfaces.
11. **Onboarding, prix du paquet** (`OnboardingPage.tsx:336-345`) : il faut 18 touches pour aller de 11,20 € à 13,00 €. Permettre la saisie directe.
12. **Pacte personnel** (`ProfilePage.tsx:202`, `:285`) : la date de signature est celle du jour et change chaque jour. Afficher la date d'inscription ou la date d'arrêt.
13. **Boutiques** (`BoutiquesPage.tsx:35-44`, `:71`) : les points de la carte ne suivent pas la géographie (Noyon à l'ouest, Beauvais à l'est). Un client « Autre boutique » voit « Aucune boutique de référence sélectionnée ». À vérifier aussi : l'adresse « provap.fr » affichée pour la boutique en ligne (`OnboardingPage.tsx:26`, `BoutiquesPage.tsx:23`), alors que le site est pro-vap.com.
14. **Accueil à 320 px** : la tuile « 13140 cig. » déborde au-delà de 4 chiffres (gros fumeur à un an). Réduire la taille du chiffre à 28 px au-delà de 4 chiffres.
15. **Fenêtres blanches en mode sombre** : le bandeau d'installation et « Restons en contact » restent blancs alors que les autres fenêtres suivent le thème. À unifier sur le composant `Modal`.
16. **Petites finitions** : numéros cliquables (`tel:3989`, `mailto:` dans les mentions légales et l'accueil). Texte de la réinitialisation (« au moins 8 caractères ») à aligner sur les règles de l'inscription (majuscule, chiffre, caractère spécial). Bref affichage possible d'un « 0 » entre deux phases du SOS (`SosPage.tsx:69`, à vérifier). Le test de Fagerström passe à la question suivante sans confirmation.
17. **Hygiène CSS** : toutes les classes maison (`.page`, `.card`, `.btn-*`, `.input`…) sont hors couche, donc des classes Tailwind posées dessus sont ignorées sans bruit. Exemple : `pb-32` n'a aucun effet sur `.page`, qui garde 96 px, ce qui suffit aujourd'hui. Après le lancement, tout passer dans `@layer components` et revérifier chaque écran. Avant le 1er, seule `.eyebrow` est concernée (A1).

**Hors de mon périmètre, signalé au chef de projet** : l'export RGPD du profil (`ProfilePage.tsx:121-133`) ne contient pas le journal d'humeur (`mood_entries`).

---

## Contrastes (ratios WCAG, cible 4,5:1 pour le texte courant, 3:1 pour le grand texte)

| Couple | Sombre | Clair |
|---|---|---|
| Texte principal `ink` sur fond | 15,5 | 15,5 |
| `ink-2` (72 %) sur fond | 8,5 | 6,5 |
| `ink-3` (petits titres, aides) sur fond / carte | 5,5 / 5,2 | 5,0 / 5,2 |
| `ink-4` (plan de descente) | **2,4** | **1,8** |
| Accent texte `gold-text` sur fond / carte | 4,7 / **4,2** | 6,0 / 6,8 |
| Terracotta `#a2371a` utilisé en texte (Fagerström) | **2,4** | 6,0 |
| `success` sur fond / carte | 4,7 / **4,2** | **3,3 / 3,7** |
| `danger` sur fond / carte | **3,7 / 3,3** | **4,2** / 4,7 |
| Ivoire sur bouton terracotta | 6,0 | 6,0 |
| Ivoire sur bouton danger | **4,2** | **4,2** |
| Logo noir sur fond | **1,2** | (inversé, lisible) |
| SOS : ocre sur dégradé / ivoire 50 % | 4,7 à 6,0 / 4,4 à 4,9 | (toujours sombre) |

Les valeurs en gras sont sous le seuil. Les corrections sont en A13 et B1.

---

## À vérifier à l'œil quand vous vous connectez

Cette liste complète `docs/test-telephone.md` sans la répéter. Mode sombre du téléphone activé, sauf indication contraire.

1. **Logo** : sur l'écran de connexion et l'accueil, le logo Pro'Vap est-il visible en haut ?
2. **Barre d'état** (app installée sur iPhone) : la bande tout en haut (heure, batterie) est-elle sombre comme l'app, ou blanche ?
3. **Bandeau « Installer »** (iPhone dans Safari, avant installation) : laisse-t-il voir le bouton SOS et les quatre onglets ?
4. **Zoom** : en touchant le champ e-mail, le prix du paquet ou la note du journal, l'écran grossit-il tout seul ?
5. **Retour en haut** : descendez tout en bas de l'accueil, puis touchez « Profil ». La page s'ouvre-t-elle en haut ?
6. **SOS** : lancez l'exercice et posez le téléphone 3 minutes sans le toucher. L'écran reste-t-il allumé ?
7. **Journal** : les cinq humeurs sont-elles lisibles, sans texte qui sort des cases ?
8. **Profil** : le mois de la date d'arrêt s'affiche-t-il en entier ? Le prénom passe-t-il sous la mascotte ?
9. **Fenêtres du bas** (« Une cigarette ? Ce n'est pas grave. », « Nouveau point d'étape ») : le dernier bouton est-il bien au-dessus du trait d'accueil de l'iPhone ?
10. **Mode clair** : le résultat du test de Fagerström et les étiquettes vertes et rouges de l'historique Vape se lisent-ils sans effort ?
11. **Android d'entrée de gamme** : le défilement de l'accueil est-il fluide ?
12. **Lien de réinitialisation déjà utilisé** : rouvrez un ancien e-mail de mot de passe oublié. L'écran propose-t-il une sortie ?

---

## Captures (`docs/audit-design/`)

- `01-connexion-sombre-logo.png` : logo noir sur fond sombre, site en ligne.
- `02-connexion-clair.jpg` : connexion en clair, site en ligne (logo lisible, petits liens).
- `03-inscription-sombre.jpg` : inscription en sombre, site en ligne (cases blanches, logo).
- `04-maquette-375-sombre-bandeau-installation.jpg` : maquette à 375 px avec les classes réelles. Bandeau sur la barre du bas, tuiles décalées, prénom sous Vap, débordement « EXCELLENT ».
- `05-maquette-320-clair-debordements.jpg` : même maquette à 320 px en clair. Libellés du journal, prénom masqué.
- `06-selecteurs-date-mois-coupe.png` : sélecteurs de date du profil, mois coupé.
