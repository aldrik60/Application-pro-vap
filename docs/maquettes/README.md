# Maquettes d'ergonomie pour l'après-lancement

Trois chantiers tirés du rapport `docs/audit-design-2026-10-25.md` (section « APRÈS LANCEMENT », points 1, 3 et 4). Ce sont ceux qui pèsent le plus pour le client. Rien n'est à faire avant le 1er novembre.

Pour chaque chantier : le problème, deux options au plus, une recommandation. Chaque écran est montré en clair et en sombre, au format iPhone (375 px de large), avec les vraies couleurs, polices et composants de l'app. Aucune refonte : on garde la charte pro-vap.com et on améliore le parcours.

## Comment les ouvrir

Double-cliquez sur un fichier `.html` : il s'ouvre dans votre navigateur. Chaque fichier se suffit à lui-même (logo et mascotte inclus). Il faut juste une connexion internet pour les polices.

- Les étiquettes bleues sont des annotations pour l'équipe, pas des éléments de l'app. Le bouton « Masquer les annotations », en haut de chaque page, les cache.
- Les annotations sont posées sur la version claire ; la version sombre reste propre.
- Les planches du dossier `captures/` montrent les options recommandées sans rien ouvrir.

## Chantier 1. Le premier écran après le QR code

Fichier : [1-premier-ecran.html](1-premier-ecran.html). Planche : [captures/chantier-1-option-a.png](captures/chantier-1-option-a.png)

**Le problème.** Le client qui scanne le QR code en boutique tombe sur « Bon retour » et un formulaire de connexion. Il n'a pas de compte : le seul chemin vers l'inscription est un petit lien en bas, peut-être caché par la barre de Safari sur iPhone.

- **Option A, recommandée** : un écran de bienvenue. Vap au stade 1, une carte papier signée « L'équipe Pro'Vap » qui dit en trois lignes ce que fait l'app, puis deux boutons de même taille : « Créer mon compte » et « J'ai déjà un compte ».
- **Option B** : un QR code par boutique, qui ouvre directement l'inscription avec le nom de la boutique.

**Pourquoi A.** Les QR codes déjà imprimés continuent de marcher, le client qui revient n'est pas oublié, et l'écran dit « on est avec vous » avant de demander un e-mail. On garde de B une idée pour plus tard : quand les QR codes seront réimprimés, y ajouter le nom de la boutique pour la pré-remplir.

## Chantier 2. Trouver Ressources et le Journal

Fichier : [2-acces-ressources-journal.html](2-acces-ressources-journal.html). Planche : [captures/chantier-2-option-a.png](captures/chantier-2-option-a.png)

**Le problème.** Les guides ne s'ouvrent que par une carte tout en bas de l'accueil (9e bloc). Le Journal se trouve par un lien de 11 px ou dans « Réglages » de Profil. Sur ces pages, aucun onglet n'est allumé en bas, et Ressources n'a pas de bouton retour.

- **Option A, recommandée** : un onglet « Guides » dans la barre du bas, à la place d'« Étapes ». Étapes s'ouvre depuis le haut de l'accueil (« Vos étapes : stade 3 sur 6 »), où Vap et la progression sont déjà affichés. « Votre journal » devient un vrai bouton dans la carte humeur.
- **Option B** : la barre ne change pas, trois tuiles Journal, Guides, Boutiques sous le compteur de l'accueil.

**Pourquoi A.** Les guides sont la deuxième aide de l'app après le SOS : avec A, ils sont à un geste depuis n'importe quel écran. Étapes ne perd rien, il faisait doublon avec le haut de l'accueil. La barre garde 5 places avec le SOS au centre.

## Chantier 3. Des en-têtes de page cohérents

Fichier : [3-en-tetes.html](3-en-tetes.html). Planche : [captures/chantier-3-option-a.png](captures/chantier-3-option-a.png)

**Le problème.** Chaque page a son propre haut d'écran : titre terracotta en capitales sur le Journal, simple mot « Profil » sur Profil, titre en italique seul sur Messages, bouton retour de 36 px ici, aucun là.

- **Option A, recommandée** : deux modèles, un seul composant. Page d'onglet : petit titre, grand titre de 36 px. Page secondaire : « Retour » de 44 px, puis le même titre en 30 px. Le fichier donne toutes les mesures et le titre de chaque page.
- **Option B** : une barre fine collée en haut des pages secondaires, avec le titre au centre, comme sur iPhone.

**Pourquoi A.** Quatre pages suivent déjà ce modèle. Il garde le grand titre en capitales, la signature de pro-vap.com, et demande peu de code.

## Ce qu'Antony doit trancher

1. **Vap au stade 1 sur l'écran de bienvenue.** À ce stade, Vap tient encore une cigarette : il part d'où part le client. C'est cohérent avec le parcours, mais on peut préférer le stade 3 (« Sur ses pieds ») pour un premier contact plus optimiste.
2. **Le nom du nouvel onglet** : « Guides » (proposé, court) ou « Ressources » (trop long pour la barre sur les petits téléphones).
3. **Étapes quitte la barre du bas** : c'est le prix de l'option A du chantier 2.
4. **« Retour » écrit en toutes lettres** à côté de la flèche, sur toutes les pages secondaires.

## Ordre conseillé pour le développeur

1. **Chantier 3 d'abord** : le composant d'en-tête commun. Les deux autres chantiers s'en servent.
2. **Chantier 2 ensuite** : l'onglet Guides, l'onglet parent allumé, le bouton Journal.
3. **Chantier 1 enfin** : l'écran `/bienvenue`, à faire avec le point 2 du rapport (bouton pour afficher le mot de passe).

Le détail technique (fichiers à toucher, mesures) est dans l'encadré « Recommandation » en bas de chaque maquette. La planche reste la référence visuelle pour la relecture.

## À savoir

- Les titres des guides, les messages et le prénom « Camille » sont des exemples. Les vrais guides viennent de la base.
- Les couleurs, polices, boutons, cartes, la barre du bas et la mascotte reprennent `src/index.css`, `BottomNav.tsx`, `Vap.tsx` et les écrans de `src/pages/`, tels qu'ils sont au 25 octobre 2026.
- La barre de Safari n'apparaît que sur le chantier 1 : c'est le seul écran vu avant l'installation de l'app.
- Aucun fichier de l'app n'a été modifié.
