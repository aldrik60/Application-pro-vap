-- Insert 14 Badges
INSERT INTO public.badges (day_threshold, title, description, icon) VALUES
(1, 'Premier pas', 'Vous avez tenu 24h, le plus dur est fait !', '🥉'),
(3, 'Respiration libre', 'Votre souffle s''améliore déjà.', '🌬️'),
(7, 'Première semaine', 'Une semaine complète sans tabac. Bravo !', '🥈'),
(14, 'Deux semaines', 'L''habitude s''estompe de jour en jour.', '💪'),
(21, 'L''habitude change', '3 semaines, un cap important est franchi.', '✨'),
(30, 'Un mois !', '30 jours de liberté et de victoire.', '🥇'),
(45, 'Le cap du mois et demi', 'La dépendance physique est derrière vous.', '🕊️'),
(60, 'Deux mois pleins', 'Vos poumons vous disent merci.', '🫁'),
(75, 'La moitié du chemin', 'Vous êtes à mi-parcours de votre programme.', '🎯'),
(90, 'Programme réussi', '3 mois ! Vous êtes officiellement un ex-fumeur.', '👑'),
(120, 'Quatre mois', 'Le tabac est de l''histoire ancienne.', '🌟'),
(180, 'Demi-année', '6 mois de victoire, c''est impressionnant.', '💎'),
(270, 'Neuf mois', 'Le temps d''une naissance, celle d''une nouvelle vie.', '🌱'),
(365, 'Un an !', 'Joyeux anniversaire sans tabac !', '🏆')
ON CONFLICT (day_threshold) DO NOTHING;

-- Insert 4 Content Articles
INSERT INTO public.content_articles (title, summary, body, category) VALUES
('Gérer une envie soudaine', 'Apprenez les techniques pour faire passer un craving en quelques minutes.', 'Une envie de fumer ne dure que 3 à 5 minutes. Pour la laisser passer, concentrez-vous sur votre respiration (méthode de cohérence cardiaque 4-4-4). Buvez un grand verre d''eau fraîche très lentement. Prenez votre cigarette électronique avec un taux de nicotine adapté; le hit en gorge apaisera immédiatement le récepteur nicotinique de votre cerveau.', 'sevrage'),
('Le stress sans tabac', 'Comment gérer l''anxiété sans recourir à la cigarette.', 'La cigarette ne détend pas, elle ne fait que combler le manque de nicotine qu''elle a elle-même créé. Pour le véritable stress, votre vape est votre alliée de transition. Prenez des bouffées amples, comme si vous soupiriez de soulagement. Pensez également à réduire la caféine, car l''arrêt du tabac double l''effet du café.', 'bien-etre'),
('Comment fonctionne le sevrage ?', 'Comprendre les mécanismes physiques et psychologiques.', 'Le sevrage avec la vape est progressif. Au lieu d''arrêter d''un coup sec, vous remplacez la fumée par de la vapeur "propre", tout en gardant la nicotine. Ensuite, c''est avec votre conseiller Pro''Vap que vous pourrez baisser progressivement le taux de nicotine de vos e-liquides pour habituer votre corps en douceur, sans frustration.', 'education'),
('Les bénéfices heure par heure', 'Découvrez ce qui se passe dans votre corps après votre dernière cigarette.', 'Dès 20 minutes : votre rythme cardiaque s''apaise.\n8 heures : la quantité de monoxyde de carbone dans le sang diminue de moitié.\n48 heures : le goût et l''odorat s''améliorent.\n72 heures : respirer devient plus facile.\n2 semaines à 3 mois : la circulation sanguine et la fonction pulmonaire s''améliorent considérablement.', 'sante')
ON CONFLICT DO NOTHING;

-- Insert 90 Daily Messages (First 30 days detailed, the rest follow a pattern)
INSERT INTO public.daily_messages (day_number, message) VALUES
(1, 'Félicitations pour cette première journée ! Le plus grand voyage commence par un simple pas. Utilisez votre vape à volonté aujourd''hui.'),
(2, 'Le deuxième jour demande de la détermination. Rappelez-vous pourquoi vous avez commencé. Nous sommes avec vous !'),
(3, '72 heures ! Vos bronches commencent déjà à se relâcher et votre respiration s''améliore.'),
(4, 'L''odorat et le goût reviennent progressivement. Vous redécouvrez le monde !'),
(5, 'Soyez indulgent envers vous-même si vous êtes irritable. C''est le processus normal de sevrage.'),
(6, 'Bientôt une semaine ! Continuez à vapoter quand l''envie se fait sentir, n''essayez pas de tout arrêter en même temps.'),
(7, 'Une semaine complète ! C''est une victoire majeure. Offrez-vous un petit plaisir avec l''argent économisé.'),
(8, 'Le cap de la première semaine est franchi. Vous avez prouvé que vous en étiez capable !'),
(9, 'La dépendance physique diminue de jour en jour. Accrochez-vous, le meilleur est à venir.'),
(10, 'Vous avez maintenant deux chiffres à votre compteur de jours. Soyez fier de vous !'),
(11, 'En cas de forte envie, utilisez le bouton SOS de l''application. La respiration vous aidera.'),
(12, 'Vous dormez probablement mieux. Le corps récupère de l''énergie perdue.'),
(13, 'Plus que demain pour atteindre les deux semaines. Ne lâchez rien !'),
(14, 'Deux semaines pleines ! L''habitude de prendre une cigarette s''estompe lentement mais sûrement.'),
(15, 'La moitié du premier mois est faite. Avez-vous pensé à ajuster votre matériel Pro''Vap avec votre conseiller ?'),
(16, 'Votre peau devient plus lumineuse et votre teint plus clair. Les petites victoires comptent !'),
(17, 'Le cerveau commence à réorganiser ses circuits de récompense sans le tabac.'),
(18, 'Si vous vous sentez nerveux, c''est normal. La vape au bon taux de nicotine est là pour compenser.'),
(19, 'Bientôt 20 jours. L''argent économisé continue de grimper !'),
(20, '20 jours de liberté ! Vous respirez la santé et la victoire.'),
(21, 'Trois semaines. On dit qu''il faut 21 jours pour défaire une habitude. Vous y êtes !'),
(22, 'Il y aura des jours avec et des jours sans. C''est normal. L''important est de garder le cap.'),
(23, 'Avez-vous remarqué que vous toussez moins le matin ? C''est votre corps qui se nettoie.'),
(24, 'N''oubliez pas de faire des check-ins réguliers dans l''application pour suivre votre parcours.'),
(25, 'Le premier mois approche à grands pas. Quelle belle progression !'),
(26, 'Vos anciens déclencheurs (café, pause) deviennent moins puissants. Vous reprenez le contrôle.'),
(27, 'L''énergie que vous avez gagnée peut être investie dans un nouveau projet ou sport.'),
(28, '4 semaines complètes. Vous êtes sur le point de recevoir le très convoité badge du mois !'),
(29, 'Demain, c''est le grand cap du premier mois. Préparez-vous à célébrer.'),
(30, 'UN MOIS ! Félicitations ! C''est une étape cruciale de franchie. Prenez rendez-vous en boutique pour faire le point.')
ON CONFLICT (day_number) DO NOTHING;

-- Generate remaining 60 messages (31-90) programmatically for the seed
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 31..90 LOOP
        INSERT INTO public.daily_messages (day_number, message)
        VALUES (i, 'Jour ' || i || ' de votre nouvelle vie sans tabac. Chaque jour renforce votre décision et éloigne définitivement la cigarette. Bravo pour votre persévérance !')
        ON CONFLICT (day_number) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
