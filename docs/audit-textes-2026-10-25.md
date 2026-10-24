# Audit des textes clients : Pro'Vap Sevrage (25 octobre 2026)

Relecture en lecture seule du code (commit 3d37b02) et de la base de production (SELECT uniquement). Périmètre : toutes les pages et composants lus par un client, index.html, manifest, notifications automatiques, 3 modèles d'e-mail, et en base les 123 messages du jour, 28 badges, 10 articles, 10 lignes de faq_items, 7 boutiques.

## Résumé

1. **Les textes en base sont propres sur la forme** : aucun tutoiement, aucun tiret cadratin ou demi-cadratin, aucun "\n" littéral, aucun doublon mot pour mot entre deux messages du jour, aucune faute dans les 28 badges. Les pages du code n'ont plus de cadratin visible (il en reste dans ChatBot, non affiché, et dans l'Admin, interne).
2. **Les vrais défauts sont des chiffres et des noms faux** : "Les 8 boutiques" alors que la base en compte 7, "Picardie" (Ferrières-en-Bray est en Normandie) à 5 endroits dont les e-mails, un compteur "+ 1 heures", "Prochain palier J+365" affiché après un an, une respiration SOS annoncée à "3 minutes" qui dure 1 min 54, trois messages du jour fautifs (J14, J40, J79).
3. **Trois erreurs que le client voit sans les chercher** : des messages d'erreur Supabase en anglais (changement de mot de passe, suppression de compte, fin d'onboarding), des tranches (âge, cigarettes, ancienneté) qui se chevauchent (40 ans, 10 cigarettes), et "gratuit" / "non surtaxé" / "3989" dits de trois façons pour Tabac Info Service.
4. **Après J120 les messages tournent en boucle (J91 à J120)** : J100 ("100 jours") et J117 ("4 mois, 6 mois") ne sont plus vrais quand ils reviennent au jour 130 ou 300. Les clients qui indiquent une date d'arrêt ancienne les voient dès l'inscription.
5. **Beaucoup de style à reprendre après le 1er** : répétitions de thèmes (argent, soirées, toux, haleine), vocabulaire flottant (palier, étape, jalon, stade, badge), "e-mail" et "email" mélangés, guillemets droits, espaces avant "?" et "€". Plusieurs points de santé déjà signalés par la relecture juridique du 24/10 sont toujours en place (liste en fin de document).

**Nombre de corrections : 31 AVANT LE 1ER, 44 APRÈS LANCEMENT** (comptage des lignes de tableau, voir fin de document). Hors décompte : 10 points de fait à trancher par Antony et la liste des points juridiques encore présents.

Légende : AVANT = faute visible, faux, anglais, incohérence de chiffres, contradiction. APRÈS = style, répétition, typographie. "L123" = numéro de ligne du fichier.

---

## 1. src/pages/HomePage.tsx (accueil)

| # | Ligne | Texte actuel | Texte proposé | Motif | Gravité |
|---|---|---|---|---|---|
| H1 | L293 | `+ {hoursSmokeFree} heures` (affiche "+ 1 heures") | `+ {hoursSmokeFree} heure{hoursSmokeFree > 1 ? 's' : ''}` | Accord du pluriel | AVANT |
| H2 | L303 (et L57-60) | "Prochain palier · J+365" affiché à vie dès le stade 6 (jour 365 et au-delà) | Masquer la ligne au stade 6, ou afficher "Dernier stade atteint" | Information fausse | AVANT |
| H3 | L196 | "Message copié dans le presse-papier" | "Message copié dans le presse-papiers" | Orthographe | AVANT |
| H4 | L494 (transverse, voir note) | "gratuit, lun-sam 8h-20h" et "Tabac Info Service 3989" | "Tabac Info Service : 39 89 (service gratuit, prix d'un appel), du lundi au samedi, de 8 h à 20 h" | Trois formulations contradictoires | AVANT |
| H5 | L710, L712 | "modifiable d'un tap" / "Un tap suffit" | "modifiable à tout moment" / "Un geste suffit, retrouvez tout dans votre journal." | Anglais oublié | APRÈS |
| H6 | L188, L387, L401, L429 vs L507 | "123€" sans espace, mais "123 €" avec espace en L507 | Toujours "123 €" (espace insécable) | Typographie | APRÈS |
| H7 | L293 vs L366 | "+ 5 heures" puis "et 5h" | Choisir "heures" ou "h" partout | Incohérence | APRÈS |
| H8 | L36 | "Trois ans sans tabac" (jalon sans contenu) | "Trois ans : la cigarette est loin derrière vous." | Phrase vide | APRÈS |
| H9 | L303, L556, L578, daily-push L114, NotificationToggle L312 | "Prochain palier" (stade de Vap), "Nouveau jalon" (badge), "Nouveau palier : {badge}" (notification), "Voir toutes mes étapes" | Un mot par objet : stade (Vap), étape (badge). Ex. notification "Nouvelle étape : {titre}", "Nouvelle étape" dans la modale, "Prochain stade de Vap · J+90" | Vocabulaire flottant (palier, jalon, étape, stade, badge, collection) | APRÈS |

Note H4 : le même défaut est en ContentPage L440-442 ("accompagnement gratuit et confidentiel ... 3989"), LegalPage L152 ("appel non surtaxé") et dans l'article "Après un écart" (dernière phrase). Une seule correction, quatre endroits. Proposition pour ContentPage et l'article : "Pour un accompagnement confidentiel, contactez Tabac Info Service au 39 89 (service gratuit, prix d'un appel)." Pour LegalPage : "(service gratuit, prix d'un appel, du lundi au samedi, de 8 h à 20 h)". À confirmer sur tabac-info-service.fr avant mise en ligne.

## 2. Autres pages et composants (code)

| # | Fichier:ligne | Texte actuel | Texte proposé | Motif | Gravité |
|---|---|---|---|---|---|
| P1 | ProfilePage.tsx:464 | "Les 8 boutiques" | "Nos boutiques" | 7 en base | AVANT |
| P2 | BoutiquesPage.tsx:89 | "Les <i>8 boutiques</i>" | "Nos <i>boutiques</i>" (ou compteur calculé sur la table shops) | 7 en base | AVANT |
| P3 | BoutiquesPage.tsx:134 | "Picardie · 8 points de vente" | "Nos boutiques et la boutique en ligne" | Chiffre faux, Picardie faux | AVANT |
| P4 | ProfilePage.tsx:509 | "Pro'Vap Sevrage · v1.0 · Picardie" | "Pro'Vap Sevrage · v1.0" | Ferrières-en-Bray est en Normandie | AVANT |
| P5 | ContentPage.tsx:163 (FAQ) | "Nos boutiques en Picardie sont là pour vous accompagner." | "Nos boutiques sont là pour vous accompagner." | Géographie fausse | AVANT |
| P6 | OnboardingPage.tsx:27 et BoutiquesPage.tsx:23 | "Site provap.fr" / "provap.fr" | "pro-vap.com" si c'est le site officiel (la charte et les mentions légales disent pro-vap.com) | Trois domaines différents dans le code | AVANT |
| P7 | ProfilePage.tsx:32 | "25-40 ans", "40-55 ans", "Plus de 55 ans" | "Moins de 25 ans", "25 à 39 ans", "40 à 54 ans", "55 ans et plus" | Tranches qui se chevauchent. 8 profils portent l'ancienne valeur : prévoir un UPDATE | AVANT |
| P8 | ContentPage.tsx:135 (FAQ taux) | "5 à 10 cigarettes/jour → 6 mg/ml" puis "10 à 20 cigarettes/jour → 12 mg/ml" | "5 à 9 cigarettes par jour → 6 mg/ml", "10 à 20 cigarettes par jour → 12 mg/ml" | 10 cigarettes dans deux tranches | AVANT |
| P9 | DiagnosticKitPage.tsx:57-58, 67-68, 77-78, 150-151 | "Entre 5 et 10", "Entre 10 et 20", "Entre 2 et 5 ans", "Entre 5 et 10 ans", "Entre 25 et 40 ans", "Entre 40 et 55 ans" | "De 5 à 9", "De 10 à 20", "De 2 à 4 ans", "De 5 à 10 ans", "De 25 à 39 ans", "De 40 à 54 ans" (et getAgeRange aligné sur P7) | Bornes partagées | AVANT |
| P10 | ContentPage.tsx:151 (FAQ) | "l'impression de vaper excessivement" | "l'impression de vapoter beaucoup" | "vaper" n'existe pas, le reste de l'app dit "vapoter" | AVANT |
| P11 | ProfilePage.tsx:558 | "votre profil, vos check-ins, vos témoignages" | "votre profil, vos points d'étape nicotine, votre journal d'humeur, vos rendez-vous, vos témoignages" | Anglais oublié (et liste incomplète) | AVANT |
| P12 | ProfilePage.tsx:162, ResetPasswordPage.tsx:41, OnboardingPage.tsx:124 | Affichent `error.message` de Supabase tel quel (anglais, ex. "New password should be different from the old password.") | Suppression : "Impossible de supprimer le compte pour le moment. Réessayez dans quelques instants." Mot de passe : "Impossible de mettre à jour le mot de passe. Vérifiez qu'il respecte les consignes et qu'il diffère de l'ancien." Onboarding : "Erreur lors de l'enregistrement. Réessayez." | Anglais visible par le client | AVANT |
| P13 | ResetPasswordPage.tsx:72 et :27 | "Choisissez un mot de passe d'au moins 8 caractères." / "doit faire au moins 8 caractères" | "Choisissez un mot de passe d'au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial." (même règle que l'inscription) | Règle incomplète, d'où les erreurs anglaises | AVANT |
| P14 | SosPage.tsx:18 (6 cycles de 4+7+8 s = 1 min 54) face à HomePage.tsx:511 "trois minutes de respiration", :514 "Respirer 3 minutes", SosPage.tsx:13 "~3 min" | Passer CYCLES_TOTAL à 9 (2 min 51), ou écrire "deux minutes" aux trois endroits | Durée annoncée fausse | AVANT |
| P15 | SosPage.tsx:121 | "Vous venez de gagner une victoire silencieuse." | "Vous venez de remporter une victoire silencieuse." | On remporte une victoire | AVANT |
| P16 | MessagesPage.tsx:101-104 | "Activez les notifications depuis votre profil pour recevoir les messages de votre conseiller." (affiché aussi à qui les a déjà activées, et la page ne montre jamais le message du jour, qui n'est pas archivé) | "Les messages de l'équipe Pro'Vap s'afficheront ici. Votre message du jour arrive en notification chaque matin à 9 h." Bouton "Activer les notifications" seulement si elles sont désactivées | Texte en contradiction avec les notifications automatiques | AVANT |
| P17 | NotificationToggle.tsx:144 | "Recevez vos messages quotidiens, rappels et félicitations ..." | "Recevez votre message du jour et vos félicitations aux paliers atteints, directement sur votre téléphone." | Aucun "rappel" n'existe | AVANT |
| P18 | DiagnosticKitPage.tsx:279 | "Ensuite, chaque euro est un bénéfice net." | "Ensuite, vos économies continuent de s'accumuler, hors e-liquides et résistances." | Faux (l'e-liquide et les résistances coûtent) | AVANT |
| P19 | Vap.tsx:21 (stade 1) | "Le premier jour est le plus dur." | "Un jour à la fois." | Contredit les badges J1 et J3 et l'article (pic dans les 3 premiers jours) | AVANT |
| P20 | ContentPage.tsx:13-122 (STATIC_ARTICLES, affichés si la base ne répond pas) | Anciennes versions des articles, différentes de la base ("Les premières 72h", parties 3 et 4 de "Comment fonctionne le sevrage ?", etc.) | Recopier les 10 articles de la base, ou supprimer le repli | Deux versions du même contenu | AVANT |
| P21 | JourneyPage.tsx:165 | "prochaine descente prévue J+12" | "prochaine descente prévue dans 12 jours" | "J+" désigne un jour écoulé ailleurs dans l'app | APRÈS |
| P22 | JourneyPage.tsx:389 | placeholder "Ex: FR/M" | "Nom de votre e-liquide" | Jargon incompréhensible | APRÈS |
| P23 | JournalPage.tsx:236 | "Votre premier enregistrement apparaîtra ici juste après." | "Votre premier enregistrement apparaîtra ici." | "juste après quoi ?" | APRÈS |
| P24 | JournalPage.tsx:12 vs HomePage.tsx:616 | "Très difficile" / "Très dur" pour le même niveau | "Très difficile" partout | Incohérence | APRÈS |
| P25 | JourneyPage.tsx:344, JournalPage.tsx:222, LegalPage.tsx:119 et :121 | Guillemets droits `"..."` | « ... » | Typographie française | APRÈS |
| P26 | ContentPage.tsx:482 | "(500 caractères max)" | "(500 caractères maximum)" | Abréviation | APRÈS |
| P27 | ContentPage.tsx:147 (FAQ) | "deviennent en général rares entre 3 semaines et 3 mois. Après 3 mois sans fumer, elles sont rares et faibles." | "deviennent en général plus rares entre 3 semaines et 3 mois. Après 3 mois sans fumer, elles sont rares et faibles." (ou fusionner en une phrase) | Répétition de "rares" | APRÈS |
| P28 | ProfilePage.tsx:244 | "Membre · 5 jours" | "5 jours sans tabac" | Se lit comme l'ancienneté de compte | APRÈS |
| P29 | ProfilePage.tsx:252, 329, 339 | "Cig. évitées", "Cig. par jour", "Prix paquet (€)" | "Cigarettes évitées", "Cigarettes par jour", "Prix du paquet (€)" | Abréviations | APRÈS |
| P30 | LoginPage:58, RegisterPage:103, ForgotPasswordPage:16, 52, 62, 71, ProfilePage:523, LegalPage:83, 122, e-mails | "email" et "e-mail" mélangés, parfois dans la même page (Forgot : L52 "e-mail", L62 "email") | "e-mail" partout | Incohérence | APRÈS |
| P31 | LegalPage.tsx:72 | Titre "POLITIQUE DE CONFIDENTIALITÉ" sans le numéro 4 alors que les sous-parties sont 4.1 à 4.10 | "4. Politique de confidentialité" au même style que les titres 1, 2, 3, 5 | Numérotation | APRÈS |
| P32 | NotificationToggle.tsx:205, 235 | "cliquez sur « J'ai réactivé, réessayer »" (sur téléphone) | "appuyez sur ..." | Cohérence tactile | APRÈS |
| P33 | InstallPrompt.tsx:153 | "pour un accès rapide, hors-ligne." | "pour un accès rapide, même hors connexion." | Virgule bancale | APRÈS |
| P34 | DiagnosticKitPage.tsx:269 et :32 | "Taux nicotine recommandé" ; "recommandé pour la grande majorité des fumeurs" | "Taux de nicotine recommandé" ; "adapté à la plupart des profils" | Faute de langue ; quantité non prouvée | APRÈS |
| P35 | lib/dates.ts:9-10 | Mois en liste déroulante : "Janvier" ... "Décembre" | "janvier" ... "décembre" (ou garder pour des listes, mais les dates affichées en texte sont en minuscules) | Majuscules incohérentes | APRÈS |

Notes : (a) les toasts alternent point final et absence de point (JourneyPage L82 et L87 sans point, les autres avec) : à uniformiser avec P25, sans urgence. (b) Aucun tutoiement trouvé dans le code client. (c) ChatBot.tsx n'est pas affiché (App.tsx:47), mais il contient des cadratins, "7 boutiques en Picardie" avec de faux numéros de téléphone, des prix de kits et "Votre santé s'améliore dès que vous arrêtez" : ne pas le réactiver tel quel en V2.

## 3. index.html, manifest, e-mails, notifications

| # | Fichier:ligne | Texte actuel | Texte proposé | Motif | Gravité |
|---|---|---|---|---|---|
| T1 | index.html:11 | `content="Pro'Vap Sevrage - Votre compagnon de sevrage tabagique"` | `content="Pro'Vap Sevrage : votre compagnon de sevrage tabagique"` | Tiret utilisé comme cadratin | AVANT |
| T2 | supabase/email-templates/confirm-signup.html, reset-password.html, change-email.html (pied de page) | "Réseau de boutiques en Picardie · Votre compagnon vers la liberté" | "Réseau de boutiques Pro'Vap · Votre compagnon vers la liberté" | Picardie faux. À recoller dans le tableau de bord Supabase (Auth, Templates) | AVANT |
| T3 | AdminPage.tsx:234, :798 ; notify-rdv/index.ts:96-98, 108, 147 | Cadratins dans l'écran Admin et l'e-mail de rendez-vous reçu par l'équipe | Remplacer par ":" ou une virgule | Non lus par un client | APRÈS |

public/manifest.json et public/sw.js : aucun défaut de texte. La catégorie "medical" du manifest est déjà signalée par la relecture juridique (point 33). Les titres de notification automatique ("Jour N · Votre message du jour", "Nouveau palier : ...") sont corrects sur la forme (voir H9 pour le mot "palier").

## 4. Table daily_messages (123 lignes, jours 1 à 120, 180, 365, 730)

Contrôles faits en SQL : 0 tutoiement, 0 cadratin, 0 "\n", 0 doublon exact, 0 espace insécable. Les phrases ci-dessous sont à remplacer dans la colonne `message` (une ligne par jour).

| # | Jour | Texte actuel | Texte proposé | Motif | Gravité |
|---|---|---|---|---|---|
| D1 | 14 | "Quinze jours sans clope. Votre haleine, vos vêtements, votre voiture ont changé." | "Deux semaines sans clope. Votre haleine, vos vêtements, votre voiture ont changé." | J13 dit "Demain, deux semaines" : 14 jours, pas 15 | AVANT |
| D2 | 40 | "Quarante jours. Symbolique fort dans beaucoup de cultures." | "40 jours. Un chiffre qui compte dans beaucoup de traditions." | "Symbolique fort" est incorrect ; chiffres comme J45 et J50 | AVANT |
| D3 | 79 | "Que diriez-vous à un fumeur qui débute aujourd'hui ?" | "Que diriez-vous à un fumeur qui arrête aujourd'hui ?" | "Débute" se lit comme un débutant qui commence à fumer | AVANT |
| D4 | 91, 99, 100, 117 (série rejouée après J120, HomePage.tsx:40-42 et 108-131, daily-push L24-25 et L100-102) | J100 "100 jours. Trois chiffres. ..." ; J117 "Fixez-vous un prochain cap : 4 mois, 6 mois." ; J99 "ne défait pas trois mois" ; J91 "Le cap des 90 est passé." | Sortir 91, 99, 100 et 117 de la série en boucle (ou la limiter à J101-J116 sauf 117), en gardant ces messages pour leur jour propre | Faux au jour 130, 160, 300 : "100 jours" affiché à quelqu'un qui en est à 130 | AVANT |
| D5 | 9, 43 | "Apéro ou sortie ce week-end ?" / "Apéro entre amis ce week-end ?" | J9 : "Un apéro ou une sortie dans les jours qui viennent ? Anticipez votre réponse maintenant, pas dans l'instant." J43 : "Un apéro entre amis bientôt ? Kit chargé, taux suffisant, plan B en tête." | Le jour de l'app ne tombe pas sur un week-end ; thème répété en J9, J43, J95, J105 | APRÈS |
| D6 | 13 et 42 | J13 "Le geste compte plus que la nicotine" ; J42 "Le geste compte maintenant autant que la nicotine" | J13 : "Demain, deux semaines. Le geste compte de plus en plus." | "plus" puis "autant", sans cohérence | APRÈS |
| D7 | 23 et 51 | Deux messages sur la toux qui reprennent la même formule | J51 : "Un doute sur une toux ou un essoufflement ? Parlez-en à votre médecin." (proposition déjà faite par la relecture juridique) | Répétition | APRÈS |
| D8 | 19 et 97 | J19 "Pensez à ce que vous comptiez vous offrir avec l'argent économisé." / J97 "Pensez à ce que vous ferez de l'argent économisé." | J97 : "Un projet concret aide à tenir. Notez-le dans votre objectif plaisir, sur le profil." | Quasi même phrase (l'argent revient aussi en J48, J86, J110) | APRÈS |
| D9 | 14 et 74 | "Votre haleine, vos vêtements, votre voiture ont changé." / "Votre haleine, vos vêtements, votre maison ne sentent plus le tabac. Vos proches l'ont remarqué." | J74 : "Votre maison et vos vêtements ne sentent plus le tabac. Vos proches l'ont peut-être remarqué." | Répétition ; "l'ont remarqué" affirme un fait | APRÈS |
| D10 | 49 | "50 jours demain. Un cap rare." | "50 jours demain." | Même forme que J59, J69, J89 ; "rare" non prouvé | APRÈS |
| D11 | 30 | "Un mois. C'est rare. Beaucoup essaient, peu y arrivent. Vous, oui." | "Un mois. Trente jours tenus, un après l'autre." | Opposition implicite avec ceux qui n'y arrivent pas, non prouvée | APRÈS |
| D12 | 90 | "Vous avez fait ce que peu réussissent. Cette force restera." | "90 jours. Trois mois tenus, jour après jour. Cette force restera." | Même défaut que D11 | APRÈS |
| D13 | 31 | "Le mois passé est derrière. Le mois qui s'ouvre se joue dans la durée, pas l'effort." | "Le premier mois est derrière vous. Le suivant se joue dans la durée, pas dans l'effort." | "Passé" et "derrière" disent la même chose | APRÈS |
| D14 | 57 | "Votre objectif initial était-il bien dimensionné ? Affinez-le si besoin." | "Votre objectif de départ vous convient-il encore ? Ajustez-le si besoin." | Jargon | APRÈS |
| D15 | 118 | "... gâche le plaisir et réveille l'envie d'autre chose." | "... gâche le plaisir et peut réveiller l'envie de fumer." | "D'autre chose" est vague | APRÈS |
| D16 | 54 | "Votre corps n'est plus exposé au monoxyde de carbone de la fumée. Chaque semaine compte." | "Votre corps n'est plus exposé au monoxyde de carbone de la fumée." | Deuxième phrase vide | APRÈS |
| D17 | 52, 67, 72 | J52 "Sept semaines" (jour 52 = 7 sem. 3 j) ; J67 "Presque un trimestre" (67 sur 90) ; J72 "Dix semaines" (redit J70 "70 jours") | J52 "Plus de sept semaines." ; J67 "Plus de deux mois sans tabac. C'est considérable." ; J72 "Dix semaines et deux jours. Votre rapport au tabac n'est plus le même." | Durées approximatives | APRÈS |
| D18 | 65 et 101 (aussi 38, 64, 98, 109) | Deux messages sur les soirées / après-repas ; quatre sur "inspirer un proche" | Garder J101 (plus concret), reformuler J65 : "Les soirées restent un cap délicat. Choisissez à l'avance ce que vous ferez de vos mains." ; fusionner deux des quatre messages "proche" | Répétitions de thèmes | APRÈS |
| D19 | 30 messages (ceux qui ont "?", "!" ou ":") | Espace normale avant la ponctuation haute, qui peut passer à la ligne | Espace insécable avant ? ! : ; | Typographie | APRÈS |

## 5. Table badges (28 lignes)

Aucune faute, aucun tiret cadratin ni demi-cadratin, aucun "\n". **0 correction.** Deux observations hors décompte : les icônes se répètent (3 et 5 : 🌬️ ; 120, 300, 730 : 🌟 ; 365 et 545 : 🏆 ; 75 et 1095 : 🎯 ; 180 et 1825 : 💎) et le délai du monoxyde de carbone diffère entre le badge J2 (48 h), le message J3 (72 h) et l'article (8 h), voir "Points de fait à trancher".

## 6. Table content_articles (10 lignes)

| # | Article | Texte actuel | Texte proposé | Motif | Gravité |
|---|---|---|---|---|---|
| F1 | "Comment fonctionne le sevrage ?", partie 2 (et ContentPage.tsx:69) | "Les premières 72h sont les plus intenses" | "Les 72 premières heures sont les plus intenses" | Ordre des mots et "72 h" | AVANT |
| F2 | "Gérer une envie soudaine", étape 5 (et ContentPage.tsx:35) | `"Dans 5 minutes, ça sera passé."` | « Dans 5 minutes, ce sera passé. » | Guillemets français, "ce sera" | APRÈS |
| F3 | "Gérer une envie soudaine", étape 2 | "La technique 4-4-4 est redoutable" | "La technique 4-4-4 est efficace" | "Redoutable" s'entend comme une menace | APRÈS |
| F4 | "Le stress sans tabac", étape 3 | `LA TECHNIQUE "5-4-3-2-1"` | `LA TECHNIQUE « 5-4-3-2-1 »` | Guillemets | APRÈS |
| F5 | "Les bénéfices heure par heure" | Titre "heure par heure" alors que la liste va jusqu'à 10 ans ; sources citées deux fois (début et fin) | Titre "Les bénéfices au fil du temps" ; garder la mention des sources à un seul endroit | Titre qui ne correspond pas | APRÈS |
| F6 | "Prise en main de l'application", étape 3 | "Votre compteur, le message du jour, vos économies, et votre humeur du jour en un geste." | "Votre compteur, le message du jour, vos économies et votre humeur du jour en un geste." | Virgule avant "et" | APRÈS |

Les 5 autres articles ("Bouger, dormir, manger", "Après un écart", "Bien utiliser sa vape", "Les situations à risque", "Les 3 premiers jours") n'ont pas de faute, hors la formule Tabac Info Service de la note H4.

## 7. Table faq_items (10 lignes, non affichée)

La FAQ visible est écrite en dur dans ContentPage.tsx:124-166. La table n'est lue nulle part.

| # | Ligne | Texte actuel | Texte proposé | Motif | Gravité |
|---|---|---|---|---|---|
| G1 | 10 lignes | 4 cadratins (Q2, Q5, Q9, Q10), "encas", "Ne précipitez pas" (verbe sans complément), tranches de nicotine différentes de la FAQ du code (16 mg au-dessus d'un paquet), "tous les 10 à 15 jours" face à "1 à 3 semaines" dans le code, "4 à 6 semaines" face à "4 à 8" | Vider la table, ou la remplacer par la FAQ du code | Contenu périmé et contradictoire, risque s'il est un jour affiché | APRÈS |

## 8. Table shops (7 lignes)

| # | Boutique | Texte actuel | Texte proposé | Motif | Gravité |
|---|---|---|---|---|---|
| S1 | Adresses | "1 Av. Descartes" (Beauvais), "103 Av. de l'Europe" (Nogent), "Rte de Beauvais" (Ferrières), "88 Rue d'Amiens" (Breteuil), "41 Rue de la République" (Clermont) mais "3 rue Marguerite Perey" (Compiègne) | "avenue", "route", et "rue" en minuscule partout | Abréviations et majuscules incohérentes | APRÈS |
| S2 | Horaires | "10h-19h" ; Clermont "Mardi au samedi" quand les six autres sont "Lundi au samedi" | "10 h-19 h" ; vérifier que Clermont est bien fermé le lundi | Typographie ; confirmer l'info | APRÈS |

Nombre de boutiques : 7 en base, aucune ne manque pour l'affichage actuel. L'ajout d'Amiens (supabase/add_amiens.sql) fera 8 boutiques plus la boutique en ligne : P1 à P3 deviennent justes avec "Nos boutiques" sans chiffre.

---

## Points de fait à trancher par Antony (hors décompte)

1. **Monoxyde de carbone** : l'article dit "8 heures : CO normalisé", le badge J2 dit "48 heures ... a quitté votre sang", le message J3 dit "72 heures ... a quitté votre sang". À aligner sur une seule source (Tabac Info Service).
2. **Pic du manque** : Vap stade 1 (P19), badge J1 ("2 ou 3 prochains jours"), badge J3 ("pic maintenant"), article ("72 premières heures"), J8 ("l'intensité baisse à partir d'ici"), J7 de la carte santé ("le plus intense est passé"). Cohérent sauf le stade 1, corrigé en P19.
3. **Article "Le stress sans tabac"** : "des endorphines, les mêmes molécules que la nicotine stimule" est approximatif.
4. **Domaine du site** : pro-vap.com (charte, mentions légales), provap.fr (onboarding, boutique en ligne), pro-vap.fr (adresse rdv@). À confirmer, voir P6.
5. **Tabac Info Service** : confirmer la mention "39 89 (service gratuit, prix d'un appel)" avant de l'écrire partout.
6. **Taux de départ** : la FAQ propose 3, 6, 12, 16 mg/ml selon le nombre de cigarettes, le test de Fagerström propose 3-6, 6-9, 12, 16-20, la page Vape part de 12 mg/ml par défaut. Trois logiques pour un même conseil.
7. **Durée de vie d'une résistance** : "1 à 3 semaines" (article, FAQ) contre "10 à 15 jours" (faq_items, non affichée).
8. **Horaires de Clermont** : fermé le lundi ou erreur de saisie.
9. **Prix du paquet par défaut** : 11,20 € à l'onboarding. Si le paquet moyen est plus cher en 2026, J71 ("bien plus de 700 €") reste vrai, mais les économies affichées seront sous-estimées.
10. **Amiens** : la boutique sera ajoutée à l'ouverture ; penser aux 4 listes écrites en dur (Onboarding, Profil, Boutiques, type Shop) et à la carte.

## Points juridiques et santé déjà signalés le 24/10 et encore en place

À vérifier par le chef de projet (non recomptés ici) : message J6 (statistique et "craquent"), J16, J32, J34, J46, J47, J60, J66 (teint, ongles, cheveux), J82 (eau qui "nettoie"), J86 ("pas les buralistes") ; article "Comment fonctionne le sevrage ?" parties 3 et 4 ("sans le goudron ni le monoxyde de carbone de la fumée, qui contient plus de 7 000 substances", "vous réduisez la dépendance sans souffrir") encore présents en base ; FAQ poids ("la nicotine accélère le métabolisme", "Les bénéfices pour votre santé dépassent largement cet inconvénient") ; carte "Vie regagnée" (11 minutes par cigarette) ; conseils de dosage du test de Fagerström ("Démarrez fort", "suffira") ; "Sceller mon engagement" ; manifest catégorie "medical". Décisions d'Antony respectées : la FAQ sur la vape, les kits, DiagnosticKit, "Kit amorti" et l'option Cannabis ne sont pas remis en cause.

## Décompte

Une ligne de tableau = une correction (la ligne H4 couvre quatre endroits, la ligne P12 trois fichiers).

| Source | AVANT LE 1ER | APRÈS LANCEMENT |
|---|---|---|
| 1. HomePage | 4 | 5 |
| 2. Autres pages et composants | 20 | 15 |
| 3. index.html, e-mails, Admin | 2 | 1 |
| 4. daily_messages | 4 | 15 |
| 5. badges | 0 | 0 |
| 6. content_articles | 1 | 5 |
| 7. faq_items | 0 | 1 |
| 8. shops | 0 | 2 |
| **Total** | **31** | **44** |
