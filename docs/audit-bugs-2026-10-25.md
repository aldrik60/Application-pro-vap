# Chasse aux bugs du code front, 25 octobre 2026

Relecture complète de `src/` (routes, pages, composants, lib, contexte, types), de `public/sw.js`, et contrôle du schéma réel de la base (tables, colonnes, contraintes, règles d'accès, fonctions) en lecture seule. `npm run lint` : aucune erreur. `npm run build` : réussi (TypeScript sans erreur).

## Résumé

1. Un seul blocage : après chaque mise en ligne, un client qui a gardé l'app ouverte peut tomber sur un écran rouge en anglais (« Something went wrong ») sans bouton pour relancer. Hors connexion, même chose sur une page pas encore visitée.
2. Le profil peut effacer la date d'arrêt sans prévenir (date incomplète ou impossible, ou profil pas encore chargé) : le compteur du client disparaît.
3. Plusieurs petites gênes faciles à corriger : objectif plaisir sans bouton d'enregistrement visible, double appui qui saute une question ou crée deux points d'étape, état des notifications faux après désactivation, lien de mot de passe expiré qui tourne à l'infini, page blanche sur une adresse inconnue.
4. Messages : un message envoyé à un seul client ou à une seule boutique apparaît dans l'onglet Notifications de tous les clients. Suppression de compte et export RGPD incomplets (demandes de rendez-vous gardées, journal d'humeur absent de l'export).
5. Les requêtes vers la base visent toutes des tables et colonnes qui existent. Calculs vérifiés justes : jours, économies, cigarettes évitées, Fagerström (total sur 10, seuils corrects), plan de descente. Seul défaut de calcul : le jour change à 1 h ou 2 h du matin au lieu de minuit (sans conséquence sur la notification de 9 h).

Décompte : **1 BLOQUANT**, **14 AVANT LE 1ER** (dont 2 « à vérifier » au test du jeudi), **9 APRÈS LANCEMENT**.

---

## BLOQUANT

### B1. Écran d'erreur en anglais, sans issue, après une mise en ligne ou hors connexion

- **Où** : `src/main.tsx:19-28` (écran d'erreur), `src/App.tsx:11-28` (pages chargées à la demande), `public/sw.js:36-48` et `vercel.json:2-4`.
- **Ce que voit le client** : il a ouvert l'app le matin, vous mettez en ligne une correction à midi, il revient dans l'app (l'iPhone l'a gardée en mémoire) et touche un onglet qu'il n'avait pas encore ouvert. L'app demande un fichier de l'ancienne version, qui n'existe plus. Vercel renvoie la page d'accueil à la place, le service worker la garde en cache sous le nom du fichier, et l'app plante. Le client voit en rouge « Something went wrong. » suivi de lignes de code. Dans l'app installée il n'y a pas de bouton « recharger » : il doit fermer l'app de force, ce que beaucoup ne savent pas faire. Même chose hors connexion sur une page jamais ouverte. Le risque est fort la semaine du lancement, avec des corrections mises en ligne chaque jour.
- **Correction proposée** (environ 20 lignes) :
  1. Dans `src/main.tsx`, recharger une fois quand un morceau de l'app manque (Vite déclenche cet événement) :
     ```ts
     window.addEventListener('vite:preloadError', () => {
       try {
         if (sessionStorage.getItem('provap_reload')) return
         sessionStorage.setItem('provap_reload', '1')
       } catch { /* stockage indisponible : on recharge quand même */ }
       window.location.reload()
     })
     ```
  2. Remplacer l'écran d'erreur par un écran en français, au vouvoiement, avec un bouton :
     ```tsx
     <div style={{ padding: 24, textAlign: 'center' }}>
       <h1>Un instant…</h1>
       <p>L'application vient d'être mise à jour.</p>
       <button onClick={() => window.location.reload()}>Relancer l'application</button>
     </div>
     ```
     (sans afficher le message technique au client).
  3. Dans `public/sw.js` lignes 38-47 : ne mettre en cache que les vraies réponses (`if (res.ok && !res.headers.get('content-type')?.includes('text/html'))` pour les fichiers `.js`/`.css`), et ne pas renvoyer `index.html` à la place d'un fichier JS manquant. Monter `CACHE_NAME` en `v14`.

---

## AVANT LE 1ER

### A1. Le profil efface la date d'arrêt sans prévenir

- **Où** : `src/pages/ProfilePage.tsx:96-98`.
- **Ce que voit le client** : il veut corriger sa date et choisit par exemple « 31 » puis « Novembre », ou vide un des trois menus. Il appuie sur « Enregistrer mon profil » et voit « Profil mis à jour ». En réalité la date est enregistrée vide : son compteur disparaît et l'accueil lui redemande de « Configurer mon profil ».
- **Correction** : refuser l'enregistrement si la date est incomplète ou impossible, au lieu d'écrire `null`.
  ```ts
  const qd = buildLocalDateStr(quitDay, quitMonth, quitYear)
  const partiel = quitDay || quitMonth || quitYear
  if (partiel && !qd) { toast.error("Date d'arrêt incomplète ou impossible."); return }
  if (qd && qd > todayLocalDateStr()) { toast.error("La date d'arrêt ne peut pas être dans le futur."); return }
  // puis : quit_date: qd || null
  ```

### A2. Profil pas chargé : pages vides, et un enregistrement écrase tout

- **Où** : `src/contexts/AuthContext.tsx:27-34` (l'erreur de lecture du profil est ignorée), `src/components/ProtectedRoute.tsx:32-40`, `src/pages/ProfilePage.tsx:51-61` et `92-106`.
- **Ce que voit le client** : si la lecture du profil échoue (réseau faible en boutique, coupure), `profile` reste vide. L'accueil affiche « Bonjour, indiquez votre date d'arrêt » comme pour un nouveau compte, et le Profil montre un formulaire vide (0 cigarette, 0 €). S'il appuie sur « Enregistrer », la date, les cigarettes, le prix et la boutique sont remplacés par du vide. Juste après la connexion, l'accueil affiche aussi cet écran « Bonjour » pendant une fraction de seconde.
- **Correction** : dans `ProtectedRoute`, tant que `user` existe mais pas encore `profile`, afficher le rond de chargement (avec, après 8 secondes, un bouton « Réessayer » qui appelle `refreshProfile`). Dans `ProfilePage`, ajouter `if (!user || !profile) return` en tête de `handleSave`.

### A3. Objectif plaisir : pas de bouton d'enregistrement sous les champs

- **Où** : `src/pages/ProfilePage.tsx:366-389`.
- **Ce que voit le client** : il remplit « Quel cadeau vous offrirez-vous ? » et « Montant cible », puis cherche un bouton dessous : il n'y en a pas. Le seul bouton est plus haut, dans « Mes informations ». Il quitte la page et perd sa saisie.
- **Correction** : déplacer le bouton « Enregistrer mon profil » sous la carte Objectif plaisir, ou en ajouter un second identique (même `handleSave`).

### A4. Date d'arrêt dans le futur, ou date personnalisée incomplète à l'inscription

- **Où** : `src/pages/OnboardingPage.tsx:91-99` et `114-118`, `src/lib/dates.ts:27-36`, `src/pages/HomePage.tsx:87-90`.
- **Ce que voit le client** : à l'inscription, il choisit « Une autre date » et (a) n'en remplit qu'une partie, ou choisit le 31 février : l'app enregistre sans date, sans rien dire, et l'accueil lui demande d'aller dans son profil ; (b) choisit une date à venir (il arrête lundi prochain) : l'accueil affiche « Vous tenez bon depuis 0 jour » jusqu'à cette date.
- **Correction** : sur le bouton « Continuer » de l'étape 2, si « Une autre date » est choisi et que `buildLocalDateStr(...)` renvoie `''` ou une date après aujourd'hui, afficher un message (« Choisissez une date complète, aujourd'hui ou avant ») et rester sur l'étape. Ne proposer dans les menus que les jours passés de l'année en cours.

### A5. Vape : double enregistrement du point d'étape, « taux actuel » parfois faux

- **Où** : `src/pages/JourneyPage.tsx:70-89` (bouton sans blocage), `58-62` (tri), `385` (champ taux).
- **Ce que voit le client** : (a) un double appui sur « Valider mon étape » crée deux points d'étape identiques ; (b) s'il corrige son taux le même jour (deux saisies), l'ordre n'est pas garanti et « Taux actuel » peut afficher l'ancien ; (c) le champ accepte un taux négatif.
- **Correction** : ajouter un état `saving` (bouton désactivé pendant l'envoi), trier aussi par heure de création, et borner le champ.
  ```ts
  .order('date', { ascending: true })
  .order('created_at', { ascending: true })
  ```
  ```tsx
  <input id="checkin-mg" type="number" step="0.1" min="0" max="50" ... />
  ```

### A6. Test de Fagerström (et diagnostic kit) : un double appui saute une question

- **Où** : `src/pages/FagerstromPage.tsx:63-73`, `src/pages/DiagnosticKitPage.tsx:167-180`.
- **Ce que voit le client** : deux appuis rapprochés sur une réponse programment deux passages à la question suivante. La question d'après est sautée et compte 0 point : le score est faussé (par exemple « Dépendance moyenne » au lieu de « forte »), donc le conseil de taux de nicotine aussi.
- **Correction** : ignorer les appuis pendant la petite animation.
  ```ts
  const handleSelect = (score: number, idx: number) => {
    if (selected !== null) return
    ...
  }
  ```
  (même ligne en tête de `handleAnswer` dans DiagnosticKitPage).

### A7. Notifications : l'interrupteur affiche un état faux

- **Où** : `src/components/NotificationToggle.tsx:22-24` et `60-66`, `src/lib/pushNotifications.ts:30-51` et `102`.
- **Ce que voit le client** : (a) il appuie sur « Désactiver », puis revient plus tard sur le Profil : l'app affiche de nouveau « Notifications Pro'Vap activées », alors qu'il ne reçoit plus rien. L'état est lu dans l'autorisation du téléphone (toujours accordée), pas dans l'abonnement réel. (b) Si l'enregistrement en base échoue, le message dit « Permission refusée », ce qui est faux.
- **Correction** : au chargement, vérifier l'abonnement réel.
  ```ts
  useEffect(() => {
    const s = getPushSupport()
    if (s !== 'permission-granted') { setStatus(s); return }
    navigator.serviceWorker.ready
      .then(r => r.pushManager.getSubscription())
      .then(sub => setStatus(sub ? 'permission-granted' : 'permission-default'))
      .catch(() => setStatus(s))
  }, [])
  ```
  Et dans `handleEnable`, distinguer « autorisation refusée » d'« erreur d'enregistrement, réessayez ».

### A8. Onglet Notifications : messages personnels visibles par tous, lien externe en page blanche

- **Où** : `src/pages/MessagesPage.tsx:28-35`, `101-111` et `122` ; côté serveur `supabase/functions/send-push/index.ts:91-104` et la règle d'accès `push_messages_read_authenticated` (tout client connecté lit tout l'historique).
- **Ce que voit le client** : (a) quand vous envoyez un message à un seul client ou à une seule boutique depuis l'Admin, il est archivé sans destinataire : **tous les clients** le voient dans leur onglet Notifications et ont une pastille « non lu ». Un message du type « Bonjour Paul, votre commande est prête » serait lu par tout le monde. (b) Les messages du jour de 9 h ne sont pas archivés (choix voulu), donc un client qui reçoit chaque matin une notification ouvre la cloche et lit « Aucun message pour l'instant. Activez les notifications », alors qu'elles sont activées. (c) Si l'URL saisie dans l'Admin est une adresse complète (`https://pro-vap.com/...`), « Ouvrir → » mène à une page blanche.
- **Correction** :
  - En attendant une vraie correction, consigne pour l'équipe : **n'envoyer d'ici le lancement que des messages collectifs** (« Tous »).
  - Correction propre (après le 1er) : n'archiver dans `push_messages` que les envois à tous, ou ajouter une colonne de destinataires et filtrer la lecture.
  - Texte vide : « Les messages de l'équipe Pro'Vap apparaîtront ici. Votre message du jour est sur l'accueil. », et n'afficher le bouton « Activer » que si les notifications sont coupées.
  - Lien : `msg.url.startsWith('http') ? window.open(msg.url, '_blank') : navigate(msg.url)`.

### A9. Adresse inconnue : page blanche

- **Où** : `src/App.tsx:64-94` (aucune route « par défaut »).
- **Ce que voit le client** : une adresse mal tapée, un ancien lien, un lien de message erroné ou `/diagnostic-kit` en mode « lite » affichent une page entièrement blanche, sans menu.
- **Correction** : dernière ligne dans `<Routes>` :
  ```tsx
  <Route path="*" element={<Navigate to="/" replace />} />
  ```
  (ajouter `Navigate` à l'import de `react-router-dom`).

### A10. Lien « mot de passe oublié » expiré : « Vérification du lien… » sans fin

- **Où** : `src/pages/ResetPasswordPage.tsx:14-22` et `48-54`.
- **Ce que voit le client** : il ouvre le lien reçu par e-mail le lendemain, ou une deuxième fois. Le lien n'est plus valable, l'adresse contient `#error=...otp_expired`, et la page reste sur « Vérification du lien… » sans message ni bouton.
- **Correction** : si l'adresse contient `error=` (ou après 6 secondes sans session), afficher « Ce lien a expiré ou a déjà servi. » avec un bouton vers `/forgot-password`.
  ```ts
  if (window.location.hash.includes('error=')) setExpired(true)
  const t = setTimeout(() => setExpired(e => e || !readyRef.current), 6000)
  ```

### A11. Suppression de compte incomplète

- **Où** : `src/pages/ProfilePage.tsx:149-167` et `556-559` ; fonction en base `delete_my_account` ; contrainte `appointment_requests_user_id_fkey ... ON DELETE SET NULL`.
- **Ce que voit le client** : le texte promet que « toute donnée associée » est supprimée. En base, ses demandes de rendez-vous (nom, e-mail, téléphone, message) restent, seulement détachées du compte. Le reste part bien (profil, journal, points d'étape, témoignages, abonnements aux notifications, notes admin).
- **Correction** (base, une ligne dans la fonction, avant la suppression de l'utilisateur) :
  ```sql
  DELETE FROM public.appointment_requests WHERE user_id = uid;
  ```
  Ou bien, si vous voulez garder ces demandes pour la boutique, le dire dans le texte de la fenêtre et dans la politique de confidentialité.

### A12. Export RGPD incomplet

- **Où** : `src/pages/ProfilePage.tsx:117-133`.
- **Ce que voit le client** : le fichier « Exporter mes données » contient le profil, les points d'étape et les témoignages, mais **pas le journal d'humeur** (`mood_entries`) ni les demandes de rendez-vous.
- **Correction** : ajouter deux lectures au `Promise.all`.
  ```ts
  supabase.from('mood_entries').select('*').eq('user_id', user.id),
  supabase.from('appointment_requests').select('*').eq('user_id', user.id),
  ```
  puis `mood_entries: moods ?? []` et `appointment_requests: rdv ?? []` dans `payload`.

### A13. À vérifier au test du jeudi : boutons du bas des fenêtres sous la barre d'accueil iPhone

- **Où** : `src/components/Modal.tsx:84` et `102`.
- **Ce que voit le client** : les fenêtres (point d'étape, écart, suppression de compte, rendez-vous) s'ouvrent depuis le bas. Le bas de la fenêtre n'a pas de marge pour la barre d'accueil de l'iPhone : le dernier bouton peut se retrouver en partie dessous, surtout avec le clavier ouvert.
- **Correction si confirmé** : sur la zone de contenu, `style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}`.

### A14. À vérifier au test du jeudi : export des données dans l'app installée sur iPhone

- **Où** : `src/pages/ProfilePage.tsx:134-140`.
- **Ce que voit le client** : dans l'app installée sur l'écran d'accueil, le téléchargement d'un fichier peut ne rien faire ou ouvrir un aperçu sans bouton retour. De plus, le lien de téléchargement est libéré tout de suite après le clic, ce que Safari supporte mal.
- **Correction si confirmé** : libérer le lien plus tard (`setTimeout(() => URL.revokeObjectURL(url), 10000)`), et sur iPhone préférer le menu de partage (`navigator.share({ files: [new File([blob], nom, { type: 'application/json' })] })` quand `navigator.canShare` le permet).

---

## APRÈS LANCEMENT

### P1. Le jour change à 1 h ou 2 h du matin, pas à minuit

- **Où** : `src/pages/HomePage.tsx:87-90`, `src/pages/BadgesPage.tsx:29-31`, `src/pages/ProfilePage.tsx:85-87`, `src/pages/AdminPage.tsx:38` et `114`.
- **Ce que voit le client** : la date d'arrêt (AAAA-MM-JJ) est lue comme minuit à Londres. En France, le compteur passe au jour suivant à 1 h (hiver) ou 2 h (été), et « + X heures » est décalé d'autant. Entre 1 h et 2 h la nuit d'un changement d'heure, l'accueil et l'écran Étapes peuvent différer d'un jour. Pas d'effet sur la notification de 9 h : `daily-push` compte les jours en date de Paris, et à 9 h les deux calculs donnent le même nombre.
- **Correction** : lire la date en heure locale (`parseISO(profile.quit_date)` de date-fns, ou `new Date(y, m - 1, d)`) dans ces cinq endroits.

### P2. Message du jour périmé après « Redémarrer mon compteur »

- **Où** : `src/pages/HomePage.tsx:111-131`.
- **Ce que voit le client** : après un redémarrage, le compteur passe à 0 mais la carte garde le message de l'ancien jour, signé « jour 0 », jusqu'à ce qu'il quitte l'accueil.
- **Correction** : au début de l'effet, `if (daysSmokeFree <= 0) { setDailyMessage("Aujourd'hui compte. Demain aussi."); return }`.

### P3. Formulaire du profil remis à zéro pendant la saisie

- **Où** : `src/pages/ProfilePage.tsx:70-82`, déclenché par `src/contexts/AuthContext.tsx:55-59`.
- **Ce que voit le client** : quand la session se renouvelle (environ toutes les heures, ou au retour dans l'app), le profil est relu et le formulaire reprend les valeurs enregistrées : ce qu'il était en train de taper disparaît.
- **Correction** : ne remplir le formulaire qu'au premier chargement (`useRef` « déjà initialisé »), ou ne relire le profil que sur les événements `SIGNED_IN` et `USER_UPDATED`.

### P4. Erreurs de lecture ignorées : écrans vides trompeurs, faux « succès » côté Admin

- **Où** : client : `JourneyPage.tsx:58-64`, `BadgesPage.tsx:36-42`, `JournalPage.tsx:37-53`, `MessagesPage.tsx:28-35`, `HomePage.tsx:113-140`. Admin : `AdminPage.tsx:95-100` (note), `222`, `289`, `421`, `506` (suppressions).
- **Ce que voit le client** : hors connexion, « Vape » affiche « Aucun point d'étape pour le moment », et l'écran Étapes affiche 0 badge, comme si tout était perdu. Côté Admin, une note ou une suppression qui échoue affiche quand même « Note enregistrée » ou fait disparaître la ligne.
- **Correction** : tester `error` à chaque appel et afficher « Connexion impossible, réessayez » au lieu de l'état vide. Côté Admin : `const { error } = await ...; if (error) throw error`.

### P5. `localStorage` sans protection

- **Où** : `HomePage.tsx:148`, `154`, `173` ; `MessagesPage.tsx:23`, `37` ; `hooks/useUnreadMessages.ts:20` ; `components/InstallPrompt.tsx:14`, `22`.
- **Ce que voit le client** : rien en temps normal. Si le stockage est bloqué (navigation privée stricte, stockage plein), la page concernée plante.
- **Correction** : deux petites fonctions `safeGet` / `safeSet` dans `src/lib/` avec `try/catch`, utilisées partout.

### P6. Clic sur une notification : l'app s'ouvre sans aller sur la bonne page

- **Où** : `public/sw.js:121-133`.
- **Ce que voit le client** : pour une notification de message du jour (`url: '/'`), n'importe quelle fenêtre ouverte « contient » `/`. L'app revient donc là où elle était (par exemple le journal) au lieu de l'accueil. Pour un palier (`/badges`), une deuxième fenêtre peut s'ouvrir.
- **Correction** : prendre la première fenêtre ouverte et faire `await client.navigate(url); return client.focus()`, puis `openWindow(url)` seulement s'il n'y en a aucune.

### P7. Téléphone partagé : notifications du compte précédent

- **Où** : `src/pages/ProfilePage.tsx:492`, `src/contexts/AuthContext.tsx:40-44`.
- **Ce que voit le client** : après « Me déconnecter », l'abonnement du téléphone reste lié à l'ancien compte. Si quelqu'un d'autre se connecte sur ce téléphone, il continue de recevoir le « Jour N » de la personne précédente.
- **Correction** : dans `signOut`, appeler `unsubscribeUserFromPush()` (dans un `try/catch`) avant `supabase.auth.signOut()`.

### P8. SOS : l'option « réduire les animations » n'est pas respectée

- **Où** : `src/pages/SosPage.tsx:356-362` (la classe `sos-no-motion` n'est posée sur aucun élément) ; `51-71` (changements d'état imbriqués dans le minuteur, qui fonctionnent en production mais faussent le décompte en mode développement).
- **Ce que voit le client** : les personnes qui ont demandé moins d'animations sur leur téléphone voient quand même l'orbe pulser.
- **Correction** : ajouter `className="sos-no-motion ..."` sur le conteneur principal (ligne 139). Le minuteur peut être réécrit plus tard avec un seul état « secondes écoulées ».

### P9. Page « Diagnostic kit » inaccessible depuis l'app (pour information)

- **Où** : `src/App.tsx:91-93`.
- **Ce que voit le client** : rien. Aucun bouton ne mène à `/diagnostic-kit` : la page n'est joignable qu'en tapant l'adresse. Si c'est voulu (page gardée en réserve), rien à faire. Si la page doit servir en boutique, il faut ajouter un lien (Profil → Réglages, par exemple). Elle a aussi le défaut du double appui (A6). Enfin, « Enregistrer ma recommandation » inscrit le prix du kit dans le profil : l'accueil déduit alors ce prix des économies, même si le client n'a pas acheté ce kit.

---

## Contrôles sans anomalie

- **Schéma** : toutes les tables et colonnes interrogées par le front existent (`profiles`, `mood_entries`, `nicotine_checkins`, `badges`, `daily_messages`, `content_articles`, `videos`, `vaper_stories`, `shops`, `push_messages`, `push_subscriptions`, `appointment_requests`, `admin_notes`). Les listes de valeurs (humeurs, ressentis, boutiques) correspondent aux types de `src/types/index.ts`. L'enregistrement de l'humeur en un appui garde bien la note et la case « J'ai fumé » du journal, grâce à la contrainte unique `(user_id, date)`.
- **Calculs** : cigarettes évitées = jours × cigarettes par jour ; économies = jours × (prix du paquet / 20) × cigarettes par jour ; le plan de descente part du premier taux saisi et descend par 20, 16, 12, 9, 6, 3, 0 mg/ml toutes les 6 semaines. Fagerström : 6 questions, total sur 10, seuils 0-2, 3-4, 5-6 et 7-10 conformes au barème. Pas de division par zéro (des valeurs par défaut sont prévues).
- **Inscription** : la confirmation par e-mail est désactivée dans Supabase (les comptes sont confirmés à la création), donc l'enchaînement inscription → accueil → parcours de bienvenue fonctionne. Si vous l'activez un jour, `RegisterPage.tsx:44-45` et `LoginPage.tsx:30` devront prévenir le client (« Confirmez votre adresse e-mail »).
- **Vidéos** : la table `videos` est vide, donc la rubrique Vidéos n'apparaît pas dans Ressources. Ce n'est pas un bug ; à savoir si des vidéos étaient prévues au lancement.
- **Données actuelles** : aucune date d'arrêt dans le futur en base ; 2 profils sans date ; 3 profils qui n'ont pas terminé le parcours de bienvenue (ils y seront renvoyés à la connexion, c'est le comportement prévu).
