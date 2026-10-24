# Relecture santé, publicité et RGPD : Pro'Vap Sevrage (24 octobre 2026)

Relecture faite par un sous-agent Claude (Opus, effort max), en lecture seule, sur le dépôt au commit c94bcc2 et la base de production. **Ce n'est pas un avis d'avocat** : la partie 4 liste ce qu'un avocat doit trancher.

Périmètre lu : 10 articles, 123 messages du jour et 28 badges en base, `faq_items`, `push_messages`, toutes les pages et composants (sauf ChatBot, désactivé), les 3 modèles d'e-mail, l'affiche QR.

## 1. Verdict

1. **Pas lançable en l'état.** 12 textes et 2 points RGPD bloquent : la vape présentée comme efficace pour arrêter, des informations fausses sur la nicotine, des chiffres attribués à tort à l'OMS, une page de vente de kits en ligne, des notifications de « nouveautés » de boutique, deux messages de test visibles de tous, et aucun consentement pour les données de santé.
2. **Corrigeable en un à deux jours** : réécrire des textes en base et dans le code, retirer une page, ajouter des cases de consentement.
3. **Le vrai risque est le principe** : une app de sevrage éditée par un vendeur de vape. À faire valider par un avocat. Repère : en 2023, la cour d'appel de Paris a condamné BAT (Vype) à 50 000 € d'amende, plus 50 000 € pour chacune des deux associations parties civiles.

## 2. Corrections, par gravité

« deux versions » = visible aussi dans la future version store ; « version clients » = masqué en version store (`IS_FULL`).

### Bloquant avant lancement

1. **FAQ « La vape aide-t-elle vraiment à arrêter de fumer ? »** (ContentPage.tsx:130-131, deux versions). Un vendeur de vape vante l'efficacité de son produit pour arrêter : risque de médicament par présentation et de publicité interdite. → Q « Que disent les autorités de santé sur la vape ? » R « Tabac Info Service, le service public d'aide à l'arrêt du tabac, consacre une page à la cigarette électronique. Pour savoir ce qui convient à votre situation, parlez-en à votre médecin, à votre pharmacien ou appelez le 39 89. »
2. **Article « Comment fonctionne le sevrage ? », parties 3 et 4** (+ copie ContentPage.tsx:72-75) : « sans les 7 000 substances toxiques de la fumée », « vous réduisez la dépendance sans souffrir ». Comparaison santé vape/tabac et promesse de résultat. → « 3. LA VAPE : elle apporte de la nicotine sans combustion. Ses effets à long terme sont encore étudiés. » / « 4. BAISSER LE TAUX : baissez par paliers, à votre rythme, quand vous vous sentez stable. En cas de doute, parlez-en à un professionnel de santé. »
3. **FAQ « Quand l'envie de fumer disparaît-elle complètement ? »** (ContentPage.tsx:147) : « La dépendance physique à la nicotine disparaît… La vape aide à maintenir le geste tout en éliminant la dépendance chimique ». Faux pour qui vapote de la nicotine, allégation attachée au produit. → « Les envies de fumer deviennent en général plus rares au fil des semaines. L'habitude peut durer plus longtemps. Tant que vous vapotez avec nicotine, la dépendance à la nicotine reste présente : vous pourrez baisser le taux par paliers, à votre rythme. »
4. **« La nicotine a quitté votre sang »** : messages J3 et J42, badge J2 « Première nuit » (48 h). Faux pour un vapoteur ; et la première nuit tombe à 24 h. → J3 « 72 heures sans cigarette. Le monoxyde de carbone de la fumée a quitté votre sang. » / J42 « Six semaines. Le geste et les habitudes comptent maintenant autant que la nicotine. » / badge « Deux jours » : « 48 heures sans cigarette. Le goût et l'odorat commencent à revenir. »
5. **OMS citée à tort** : J81 « Le risque coronarien recule significativement à partir de maintenant (source : OMS) », badge J545 « Le risque de plusieurs cancers tend à reculer (source : OMS) », HomePage.tsx:35. L'OMS parle de 1 an (cœur), 5 et 10 ans (cancers). → J81 « Bientôt trois mois sans cigarette. Selon l'OMS, un an après l'arrêt du tabac, le risque de maladie coronarienne est environ divisé par deux. » / badge « 18 mois sans cigarette. Une étape qui compte. » / supprimer la ligne 18 mois de HomePage.
6. **Badge J1825 et HomePage.tsx:38** : « risque cardiovasculaire proche d'un non-fumeur » à 5 ans. Inexact (OMS : 15 ans) et, pour un vapoteur, revient à dire que la vape ramène au risque d'un non-fumeur. → « Cinq ans sans cigarette. Un cap remarquable. »
7. **Toux présentée comme « bon signe »** : J23, J51. Peut retarder une consultation. → J23 « Une toux peut apparaître dans les semaines après l'arrêt du tabac. Si elle dure plus de trois semaines, ou s'accompagne de fièvre, de sang ou d'essoufflement, consultez un médecin. » / J51 « Un doute sur une toux ou un essoufflement ? Parlez-en à votre médecin. »
8. **Fagerström** (FagerstromPage.tsx:212 et 77-81) : « Test médical validé par la Haute Autorité de Santé » (faux : la HAS le propose comme outil, 2014) ; score 0-2 « Dépendance faible » + conseil de nicotine (la HAS dit « pas de dépendance »). → « Test de Fagerström en six questions, outil proposé par la Haute Autorité de Santé (2014). Il ne remplace pas l'avis d'un professionnel de santé. » Libellés HAS : Pas de dépendance (0-2), Dépendance faible (3-4), moyenne (5-6), forte ou très forte (7-10).
9. **DiagnosticKitPage** (route /diagnostic-kit, version clients, en ligne sans lien) : kits avec prix, CBD « pour apaiser les envies », kit « Récréatif », « Kit Sevrage… efficace », « chaque euro est un bénéfice net ». → **retirer la page et la route.**
10. **Push « nouveautés de votre boutique »** : NotificationToggle.tsx:313, exemples Admin AdminPage.tsx:986 et 999. Publicité hors magasin. → « Les rappels liés à votre parcours » ; exemple équipe « Un nouveau guide vous attend dans Ressources. » Règle : jamais de produit, prix ou promotion dans un push.
11. **Deux notifications de test** dans `push_messages` (13 et 15 mai), visibles par tout nouvel inscrit avec une pastille « 2 ». → supprimer.
12. **Option « Cannabis »** (ProfilePage.tsx:28 ; DiagnosticKitPage.tsx:48 et 106) : donnée sur un stupéfiant, hors sujet, sans consentement. → retirer.

### À corriger

13. Phrases qui supposent qu'on ne prend plus de nicotine : J12, J45, J52, J53, J62, J68, badge J45, HomePage.tsx:30, « Le stress sans tabac » (« stress basal sera plus bas »), FAQ poids (« la nicotine accélère le métabolisme » ; supprimer « Les bénéfices pour votre santé dépassent largement cet inconvénient »).
14. Statistiques sans source et contradictoires : J6, J25 (90 %), J50 (80 %), badges J7, J50.
15. « Zones à risque » inventées : J35, J65, J70, badges J10 (« zone rouge »), J150.
16. Bénéfices santé ou beauté affirmés : J16, J32, J34, J46, J54, J60, J66, badges J3 « Respiration libre », J60, J730, Vap.tsx:25. → formuler en questions ou en faits sur le monoxyde de carbone.
17. Carte « Prochain jalon santé » (HomePage.tsx:18-39) et article « Les bénéfices heure par heure » : décrivent l'arrêt complet, nicotine comprise. → titre « Repère arrêt de la cigarette », mention « Ces repères concernent l'arrêt de la cigarette (sources : OMS, Tabac Info Service). Les effets à long terme de la vape sont encore étudiés. », retirer le jalon 20 minutes, CO à 8 h « diminué de moitié ».
18. « Vie regagnée » (11 minutes par cigarette, étude de 2000) : retirer ou remplacer par « paquets non achetés ».
19. Calculs faux : J20 (« trois quarts du mois »), J75 et badge J75 (« moitié »/« trois quarts »), J80 (« décennie de jours »), J200, J250 (« Quart d'année »).
20. Pic du sevrage contradictoire (J1, J5, J7, J10, J90) : badges J1, J5, J10, HomePage.tsx:23, article partie 5, Vap.tsx:21.
21. Sans source ou « détox » : J44 (« double les chances »), J47, J82.
22. Injonctions à vapoter : J1, J5, articles « Les 3 premiers jours », « Gérer une envie soudaine » (« Vapotez immédiatement »), « Les situations à risque » (« Votre vape fait le reste »), FAQ ContentPage.tsx:127 et 143. Risque aussi pour Apple (1.4.3).
23. Plaisir et saveurs mis en avant : J43, J105, J113, J118.
24. Références commerciales non masquées en version store : HomePage.tsx:539-540, JourneyPage.tsx:257, OnboardingPage étape 3, MessagesPage.tsx:102-103, FagerstromPage.tsx:145, /boutiques, J15, « Le stress sans tabac » (« kit »).
25. Plan de descente (JourneyPage.tsx:31-38, 207) contradictoire avec la FAQ (4 à 8 semaines par palier), taux introuvables (1,2 mg/ml), allure de posologie. → plan indicatif, paliers espacés, taux existants (12, 9, 6, 3, 0), « 0 mg/ml » au lieu de « Liberté ».
26. Dosages présentés comme prescription (Fagerström, FAQ, « Après un écart », J18) ; ajouter « Grossesse, allaitement, maladie du cœur : demandez l'avis de votre médecin avant de choisir un taux de nicotine. »
27. Économies sans le coût de la vape, « Kit amorti », J71 (700 €), J86 (« pas les buralistes »).
28. 3989 : « service gratuit (prix d'un appel) » ; trois domaines différents (provap.fr, pro-vap.com, pro-vap.fr).
29. Tirets cadratins restants dans le code (HomePage, OnboardingPage, ProfilePage, SosPage, FagerstromPage, ForgotPasswordPage, BottomNav, Vap).
30. Formes genrées : J10, J18, J109, « Gérer une envie soudaine », « Soyez le premier », « client Pro'Vap », « Pas encore arrêté ? », « rappelé », « abonné », « majeur(e) ».
31. Vocabulaire d'échec : « Vous avez craqué ? », « J'ai craqué aujourd'hui », étiquette rouge « Craquage », SOS « L'envie est passée », J22.
32. Table `faq_items` (non affichée) : allégations les plus fortes de la base. → vider ou recopier la FAQ corrigée.
33. manifest.json : retirer la catégorie « medical ».
34. NotificationToggle promet des messages quotidiens et félicitations automatiques : aucun envoi automatique n'existe.
35. « 8 boutiques » / « Picardie » (Ferrières-en-Bray est en Normandie) : « Nos boutiques ».

### À discuter

36. Témoignages « Histoires de vapoteurs » et partage portant la marque.
37. FAQ « conseillers formés au sevrage tabagique » : à prouver.
38. Mascotte stade 1 avec cigarette allumée.
39. « Sceller mon engagement » / « Pacte personnel » daté du jour.
40. SOS 4-7-8 : ajouter « Si la tête vous tourne, respirez normalement et faites une pause. »

### Version store

Textes en base à neutraliser (base partagée) : messages J1, J5, J11, J15, J17, J43, J94, J95, J105, J113, J118 ; articles « Bien utiliser sa vape », « Les 3 premiers jours », « Après un écart », « Le stress sans tabac », « Gérer une envie soudaine », « Comment fonctionne le sevrage ? » ; `faq_items` ; `shops` à l'onboarding ; `push_messages` ; pied des e-mails. Solution : une colonne « réservé version clients ».

## 3. RGPD

1. **Bloquant : pas de consentement explicite pour les données de santé** (art. 9). Une seule case mélange politique, mentions et majorité. → trois cases non cochées à l'inscription : « J'ai 18 ans ou plus. » (obligatoire) ; « J'accepte que Pro'Vap enregistre mes données de suivi (consommation de tabac, taux de nicotine, humeur, résultat du test de dépendance) pour faire fonctionner l'application. Ces informations concernent ma santé. Je peux retirer mon accord à tout moment. » (obligatoire) ; « J'accepte que l'équipe Pro'Vap consulte mon suivi pour m'accompagner. » (facultative). Demander l'accord aux 10 comptes existants.
2. **Bloquant : l'équipe voit plus que ce qu'annonce la politique** : dossier client complet, notes « privées » (alors que la personne y a droit), et les règles `mood_select_admin` et `checkins_select_admin` ouvrent journal et points d'étape de tous les comptes. → retirer ces deux lectures, rendre les notes communicables.
3. Politique incomplète (art. 13-14) : journal, points d'étape, rendez-vous, abonnements push, notes équipe ; destinataires o2switch, Apple/Google/Mozilla, Google Fonts (index.html:19-21), YouTube. Héberger les polices dans l'app.
4. « Aucun transfert hors UE » inexact (Vercel, Supabase, Google Fonts, services push).
5. Durées : pas de facturation ; 5 ans de journaux trop long ; comptes inactifs sans limite ; rendez-vous conservés après suppression du compte.
6. Droits : l'export oublie journal, rendez-vous, notes, abonnements ; la suppression ne supprime pas les rendez-vous ; manquent retrait du consentement, directives après décès, délai de réponse.
7. « chiffrement TLS de bout en bout » : faux, c'est un chiffrement des échanges.
8. N'écrire « DPO » que si un DPO est désigné auprès de la CNIL.
9. « Dernière mise à jour : {today} » : mettre une date fixe.
10. Témoignages : information + case de consentement.
11. Rendez-vous : information + durée de conservation, exemple de saisie sans données de santé.
12. Mentions légales : ajouter téléphones (Pro'Vap, hébergeurs). Identité vérifiée sur le registre : PRO'VAP SAS, SIREN 804 189 322, siège 5 esplanade Marguerite Perey, Compiègne : exact.

Les textes complets proposés pour LegalPage (4.2 à 4.9 et « Destinataires ») sont dans le rapport d'origine, repris dans la session Claude du 24/10.

## 4. Questions pour un avocat

1. L3513-4 : l'app gratuite d'un vendeur de vape, diffusée par QR en boutique, est-elle de la publicité indirecte ? Jusqu'où peut-elle parler de vape ? (CA Paris 20/12/2023, BAT/Vype)
2. L5111-1 : la FAQ, les articles et les dosages font-ils de la vape un médicament par présentation ?
3. Peut-on garder les repères OMS / Tabac Info Service pour des personnes qui vapotent ?
4. Données de santé : base légale, DPO obligatoire (art. 37), analyse d'impact (art. 35), hébergement HDS (L1111-8) ?
5. Responsable de traitement : le registre montre 4 établissements pour ce SIREN, l'app affiche 7 boutiques.
6. Messages commerciaux par push ou e-mail ?
7. Témoignages et bouton Partager : publicité indirecte ?
8. Économies et « Kit amorti » sans le coût de la vape : pratique trompeuse (L121-2 C. conso) ?
9. Responsabilité sur les conseils de dosage (grossesse, maladie cardiaque) ; relecture médicale ?
10. Version store : marque, mascotte, onglet « Vape » face aux règles Apple (1.4.3) et Google.
11. Faut-il des CGU ?

## Non vérifié

App en ligne non ouverte ; `send-push` absente du dépôt ; e-mails réglés dans Supabase ; contrats et certifications des prestataires ; DPO, boîtes rgpd@ et contact@, registre des traitements ; capital social, société exploitant chaque boutique, formation des conseillers ; pas de relecture médicale complète (chiffres clés vérifiés auprès de l'OMS, de la HAS, de Santé publique France et de Tabac Info Service).
