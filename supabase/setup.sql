-- ═══════════════════════════════════════════════════════════════════════════
-- PRO'VAP SEVRAGE — Supabase Setup & Seed
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── TABLES ──────────────────────────────────────────────────────────────────

-- Profiles (étend auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  quit_date DATE,
  cigarettes_per_day INTEGER DEFAULT 0,
  pack_price NUMERIC(6,2) DEFAULT 0,
  tobacco_type TEXT CHECK (tobacco_type IN ('industrielle','roulée','cigare','cigarillo','cannabis','mixte')),
  preferred_shop TEXT CHECK (preferred_shop IN ('Noyon','Compiègne','Clermont','Nogent-sur-Oise','Breteuil','Beauvais','Ferrières-en-Bray')),
  fagerstrom_score INTEGER,
  reward_name TEXT,
  reward_amount NUMERIC(10,2),
  kit_price NUMERIC(6,2),
  smoker_profile TEXT,
  recommended_nicotine_mg INTEGER,
  age_range TEXT,
  craving_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Messages
CREATE TABLE IF NOT EXISTS daily_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INTEGER NOT NULL UNIQUE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_threshold INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content Articles
CREATE TABLE IF NOT EXISTS content_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'sevrage',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nicotine Check-ins
CREATE TABLE IF NOT EXISTS nicotine_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  nicotine_mg NUMERIC(4,1) NOT NULL,
  eliquid_name TEXT DEFAULT '',
  feeling TEXT CHECK (feeling IN ('difficile','neutre','bien','excellent')) DEFAULT 'bien',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vaper Stories
CREATE TABLE IF NOT EXISTS vaper_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  shop TEXT,
  story_text TEXT NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Notes
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TRIGGER: auto-create profile on signup ───────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── HELPER FUNCTION : is_admin() ────────────────────────────────────────────
-- SECURITY DEFINER permet de contourner le RLS lors de la lecture de profiles,
-- évitant la récursion infinie des policies admin.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nicotine_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaper_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles"  ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (public.is_admin());

-- Daily messages: public read (données non sensibles)
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read daily_messages"   ON daily_messages FOR SELECT USING (true);
CREATE POLICY "Admins manage daily_messages" ON daily_messages FOR ALL    USING (public.is_admin());

-- Badges: public read
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read badges"   ON badges FOR SELECT USING (true);
CREATE POLICY "Admins manage badges" ON badges FOR ALL    USING (public.is_admin());

-- Content articles: public read
ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read articles"   ON content_articles FOR SELECT USING (true);
CREATE POLICY "Admins manage articles" ON content_articles FOR ALL    USING (public.is_admin());

-- Videos: public read
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read videos"   ON videos FOR SELECT USING (true);
CREATE POLICY "Admins manage videos" ON videos FOR ALL    USING (public.is_admin());

-- Nicotine check-ins: données privées
CREATE POLICY "Users manage own checkins"  ON nicotine_checkins FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "Admins view all checkins"   ON nicotine_checkins FOR SELECT USING (public.is_admin());

-- Vaper stories
ALTER TABLE vaper_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published stories" ON vaper_stories FOR SELECT USING (is_published = true);
CREATE POLICY "Users insert own stories"      ON vaper_stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all stories"     ON vaper_stories FOR ALL    USING (public.is_admin());

-- Admin notes: admins uniquement
CREATE POLICY "Admins manage notes" ON admin_notes FOR ALL USING (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 18 BADGES ───────────────────────────────────────────────────────────────

INSERT INTO badges (day_threshold, title, description, icon) VALUES
  (1,    'Premier souffle',   'Votre rythme cardiaque est normalisé',             '💨'),
  (3,    '72h de liberté',    'Le CO a été éliminé de votre sang',                '🩸'),
  (7,    'Une semaine',       'Votre goût et votre odorat reviennent',            '👃'),
  (14,   'Deux semaines',     'Votre circulation sanguine est améliorée',         '❤️'),
  (21,   'Trois semaines',    'De nouvelles habitudes se forment',                '🧠'),
  (30,   'Un mois',           'Vos poumons entament leur récupération',           '🫁'),
  (45,   '45 jours',          'Votre énergie est retrouvée',                      '⚡'),
  (60,   'Deux mois',         'Votre capacité respiratoire a augmenté de 10%',   '🏃'),
  (75,   '75 jours',          'Votre système immunitaire est renforcé',           '🛡️'),
  (90,   'Trois mois',        'Votre dépendance physique est terminée',           '🔓'),
  (120,  '4 mois',            'Votre risque cardiovasculaire est en baisse',      '💪'),
  (180,  '6 mois',            'Vos poumons sont nettoyés à 50%',                 '✨'),
  (270,  '9 mois',            'Vos infections ont été divisées par 2',            '🦠'),
  (365,  'Un an',             'Votre risque coronarien a été divisé par 2',      '🏆'),
  (545,  '18 mois',           'Votre risque de cancer a été divisé par 3',       '🌟'),
  (730,  '2 ans',             'Vos poumons fonctionnent comme ceux d''un non-fumeur', '🫧'),
  (1095, '3 ans',             'Vous avez atteint la liberté totale',             '🕊️'),
  (1825, '5 ans',             'Votre risque cardiovasculaire est normalisé',     '🎊')
ON CONFLICT (day_threshold) DO NOTHING;

-- ─── 90 MESSAGES QUOTIDIENS ───────────────────────────────────────────────────

INSERT INTO daily_messages (day_number, message) VALUES
  (1,  'Bravo ! Vous avez franchi le premier pas. Chaque heure compte, et vous venez de vivre les plus difficiles.'),
  (2,  'Le CO a quitté votre sang. Vos cellules respirent mieux. Continuez, vous êtes sur la bonne voie.'),
  (3,  'Votre odorat et votre goût s''éveillent à nouveau. Ce café du matin va commencer à avoir un goût différent.'),
  (4,  'Le plus dur est derrière vous. Les envies vont s''espacer progressivement. Tenez bon.'),
  (5,  'Cinq jours de liberté ! Vous avez prouvé que vous en étiez capable. Maintenant, continuez à avancer.'),
  (6,  'Votre circulation sanguine s''améliore. Vos mains et vos pieds sont mieux irrigués. Sentez-vous cette chaleur ?'),
  (7,  'Une semaine ! Vous avez traversé les sept jours les plus difficiles. Votre cerveau réapprend à fonctionner sans nicotine.'),
  (8,  'Les cils bronchiques se régénèrent et évacuent le mucus accumulé. Continuez à vous hydrater.'),
  (9,  'Votre énergie revient progressivement. Les matins sans tabac sont plus clairs, plus calmes.'),
  (10, 'Dix jours ! Vos poumons sont en plein travail de nettoyage. Vous pouvez en être fier.'),
  (11, 'Les envies de fumer durent de moins en moins longtemps. Votre cerveau s''adapte.'),
  (12, 'Votre peau s''oxygène mieux. Les changements sont encore discrets, mais ils ont commencé.'),
  (13, 'Hier vous étiez à J+12. Demain vous serez à J+14. Chaque journée compte dans ce voyage.'),
  (14, 'Deux semaines ! Votre circulation sanguine est sensiblement améliorée. Marchez, bougez, respirez.'),
  (15, 'Vous êtes passé à travers 15 jours d''envies, de doutes, de victoires. Quel courage !'),
  (16, 'Votre capacité pulmonaire augmente de semaine en semaine. Chaque respiration est plus efficace.'),
  (17, 'Notez vos victoires. Chaque envie surmontée mérite d''être célébrée, même discrètement.'),
  (18, 'Votre qualité de sommeil peut s''améliorer ces prochains jours. Votre corps se régule.'),
  (19, 'Pensez à ce que vous faites avec les économies réalisées. Vous méritez ce plaisir.'),
  (20, 'Vingt jours déjà ! Votre dépendance physique faiblit chaque jour un peu plus.'),
  (21, 'Trois semaines ! Les nouvelles habitudes se consolident. Votre cerveau recâble ses circuits.'),
  (22, 'Rappelez-vous pourquoi vous avez commencé ce chemin. Cette raison est toujours valide.'),
  (23, 'Les envies sont des vagues. Elles montent, atteignent un pic, puis redescendent. Attendez qu''elles passent.'),
  (24, 'Votre système cardiovasculaire vous remercie chaque jour un peu plus.'),
  (25, 'Vingt-cinq jours de liberté. Vous avez décidé de prendre soin de vous, et cela se voit.'),
  (26, 'Votre respiration est plus fluide lors des efforts. Prenez l''escalier, vous le méritez.'),
  (27, 'Entourez-vous de personnes qui soutiennent votre démarche. Leur soutien est précieux.'),
  (28, 'Quatre semaines ! Vous avez traversé un cycle complet. Bravo.'),
  (29, 'Votre risque d''infarctus a déjà commencé à diminuer. Chaque jour sans tabac, c''est de la vie gagnée.'),
  (30, 'Un mois ! Un mois entier de liberté. Vos poumons entament une récupération active. Célébrez cette étape !'),
  (31, 'Vous entrez dans votre deuxième mois. La route est tracée. Continuez.'),
  (32, 'Les anciens fumeurs rapportent souvent que le mois 2 est plus serein. Vous allez voir.'),
  (33, 'Votre concentration s''améliore. La nicotine perturbe l''attention. Sans elle, votre cerveau est plus clair.'),
  (34, 'Faites le point : combien d''argent avez-vous économisé ? Que ferez-vous de cette somme ?'),
  (35, 'Votre souffle lors de l''effort s''améliore. Même une simple montée d''escalier devient plus facile.'),
  (36, 'La dépendance psychologique s''estompe aussi. Les situations associées à la cigarette perdent leur emprise.'),
  (37, 'Vous avez traversé 37 jours d''envies, de doutes et de victoires. Vous êtes plus fort que vous ne le pensez.'),
  (38, 'Votre peau reflète les changements intérieurs. L''oxygénation améliore votre teint progressivement.'),
  (39, 'Bientôt 40 jours. Chaque pas compte dans ce voyage vers la liberté.'),
  (40, 'Quarante jours ! Votre corps a éliminé une quantité considérable de toxines depuis le début.'),
  (41, 'Votre système immunitaire se renforce. Votre corps combat mieux les infections.'),
  (42, 'Six semaines de liberté. Votre nouveau style de vie prend racine profondément.'),
  (43, 'Vos proches ont peut-être remarqué un changement dans votre façon de respirer, de bouger, de parler.'),
  (44, 'La patience est la clé du sevrage. Chaque jour, votre cerveau guérit un peu plus.'),
  (45, 'Quarante-cinq jours ! Votre énergie est retrouvée. Vous avez accompli quelque chose de remarquable.'),
  (46, 'Plus de la moitié du chemin vers J+90 est parcouru. La dépendance physique sera bientôt un souvenir.'),
  (47, 'Utilisez votre énergie retrouvée. Bougez, créez, explorez. Vous avez du temps et de la santé à investir.'),
  (48, 'Votre risque de maladies respiratoires diminue chaque semaine qui passe.'),
  (49, 'Sept semaines ! Vous avez traversé les pires tempêtes et vous êtes toujours debout.'),
  (50, 'Cinquante jours ! Un demi-siècle de jours libres. C''est une victoire à célébrer.'),
  (51, 'Continuez à vous hydrater. L''eau aide à éliminer les dernières toxines et réduit les envies.'),
  (52, 'Votre capacité pulmonaire continue de progresser. Respirez profondément et appréciez ce souffle.'),
  (53, 'Vous avez prouvé à vous-même que vous en étiez capable. Gardez cette certitude.'),
  (54, 'Votre sommeil est probablement plus réparateur. La nicotine perturbait vos cycles de sommeil.'),
  (55, 'Plus que 35 jours pour atteindre J+90 et la fin de la dépendance physique.'),
  (56, 'Huit semaines de liberté. Votre résistance et votre détermination sont admirables.'),
  (57, 'Pensez aux personnes qui vous sont chères. Votre bonne santé est un cadeau pour elles aussi.'),
  (58, 'Votre goût et votre odorat se sont pleinement rétablis. Savourez chaque repas, chaque parfum.'),
  (59, 'Presque deux mois ! La ligne d''arrivée de la dépendance physique est en vue.'),
  (60, 'Deux mois ! Votre capacité respiratoire a augmenté de 10%. Sentez la différence dans vos poumons.'),
  (61, 'Vous entrez dans votre troisième mois. La dépendance physique s''efface progressivement.'),
  (62, 'Votre cœur vous remercie. Chaque battement est moins sollicité depuis que vous avez arrêté.'),
  (63, 'Neuf semaines de liberté. Vous avez reconstruit une relation saine avec votre corps.'),
  (64, 'Continuez à pratiquer des activités qui vous font du bien. Elles remplacent durablement la cigarette.'),
  (65, 'Votre risque de cancers liés au tabac commence à diminuer significativement.'),
  (66, 'Deux mois et une semaine ! Chaque jour vous éloigne de la dépendance et vous rapproche de la liberté totale.'),
  (67, 'Votre cerveau a appris à se passer de nicotine. C''est une reprogrammation profonde.'),
  (68, 'Partagez votre expérience avec d''autres. Votre témoignage pourrait inspirer quelqu''un à commencer.'),
  (69, 'Soixante-neuf jours de victoires quotidiennes. Vous êtes remarquable.'),
  (70, 'Soixante-dix jours ! Vous avez parcouru plus de 77% du chemin vers J+90.'),
  (71, 'La fatigue que vous ressentiez peut-être au début est remplacée par une vitalité croissante.'),
  (72, 'Plus que 18 jours pour atteindre la fin de la dépendance physique. Vous y êtes presque.'),
  (73, 'Votre système nerveux s''est adapté à l''absence de nicotine. Les envies sont de plus en plus rares.'),
  (74, 'Dix semaines et demie. Votre corps est en pleine régénération depuis le premier jour.'),
  (75, 'Soixante-quinze jours ! Votre système immunitaire est sensiblement renforcé. Vous tombez moins malade.'),
  (76, 'Plus que deux semaines pour atteindre J+90. La dépendance physique sera bientôt un souvenir.'),
  (77, 'Onze semaines de liberté ! Vous avez transformé votre vie, une journée à la fois.'),
  (78, 'Votre endurance physique s''est améliorée. Les activités qui vous essoufflaient avant sont plus accessibles.'),
  (79, 'Continuez à vous entourer de bienveillance et d''encouragements. Vous le méritez.'),
  (80, 'Quatre-vingts jours ! Il reste exactement 10 jours avant la fin officielle de la dépendance physique.'),
  (81, 'Votre corps a travaillé sans relâche depuis J+1 pour se réparer. Honorez cet effort.'),
  (82, 'Chaque envie non cédée a renforcé vos circuits neuronaux de résistance. Vous êtes neurologiquement plus fort.'),
  (83, 'Plus que 7 jours ! La dernière ligne droite avant J+90.'),
  (84, 'Douze semaines de liberté. Votre transformation est profonde et durable.'),
  (85, 'Cinq jours pour J+90. Votre dépendance physique touche à sa fin.'),
  (86, 'Votre confiance en vous s''est renforcée à travers ce parcours. Vous savez désormais que vous pouvez relever les défis.'),
  (87, 'Trois jours ! Soixante-douze heures nous séparent de J+90.'),
  (88, 'Demain vous serez à J+89. Après-demain, la dépendance physique sera officiellement terminée.'),
  (89, 'Dernière nuit avant J+90 ! Vous méritez une immense fierté.'),
  (90, 'J+90 ! FÉLICITATIONS ! Votre dépendance physique à la nicotine est terminée. Vous avez accompli quelque chose d''extraordinaire. Pro''Vap est fier de vous.')
ON CONFLICT (day_number) DO NOTHING;

-- ─── 4 ARTICLES DE CONTENU ───────────────────────────────────────────────────

INSERT INTO content_articles (title, summary, body, category) VALUES
(
  'Gérer une envie soudaine',
  'Les envies de fumer sont intenses mais brèves. Voici comment les traverser sans craquer.',
  E'Une envie de fumer dure rarement plus de 3 à 5 minutes. Si vous pouvez traverser ce pic, la sensation s''atténue d''elle-même.\n\n1. VAPOTEZ IMMÉDIATEMENT\nVotre e-cigarette est votre premier allié. Quelques bouffées suffisent souvent à calmer l''envie grâce à la nicotine, qui agit en quelques secondes.\n\n2. RESPIREZ PROFONDÉMENT\nLa technique 4-4-4 est redoutable : inspirez lentement sur 4 secondes, retenez votre souffle 4 secondes, expirez sur 4 secondes. Répétez 3 fois.\n\n3. BUVEZ UN GRAND VERRE D''EAU\nL''eau refroidit la gorge et occupe les mains. Buvez lentement, une gorgée à la fois.\n\n4. CHANGEZ D''ENVIRONNEMENT\nSi vous êtes dans un endroit associé à la cigarette, bougez. Un simple changement de pièce peut suffire.\n\n5. CHRONOMÉTREZ L''ENVIE\nRegardez votre montre et dites-vous : "Dans 5 minutes, ça sera passé." Vous devenez plus fort à chaque fois que vous résistez.',
  'sevrage'
),
(
  'Le stress sans tabac',
  'Le tabac semblait calmer le stress. Comment gérer ses émotions autrement ?',
  E'Le tabac crée l''illusion de réduire le stress, mais en réalité, il ne fait que soulager le manque de nicotine qu''il a lui-même créé.\n\n1. LA RESPIRATION ABDOMINALE\nPosez une main sur votre ventre. Inspirez en gonflant le ventre sur 4 secondes, expirez sur 6 secondes. 5 cycles activent le système nerveux parasympathique.\n\n2. L''ACTIVITÉ PHYSIQUE\n30 minutes de marche libèrent des endorphines — les mêmes molécules que la nicotine stimule.\n\n3. LA TECHNIQUE "5-4-3-2-1"\nNommez 5 choses que vous voyez, 4 que vous entendez, 3 que vous touchez, 2 que vous sentez, 1 que vous goûtez.\n\n4. ANTICIPEZ VOS DÉCLENCHEURS\nIdentifiez vos situations de stress habituelles. Prévoyez votre kit à portée et une stratégie pour chacune.',
  'bien-être'
),
(
  'Comment fonctionne le sevrage ?',
  'Comprendre ce qui se passe dans votre corps vous aide à mieux traverser cette période.',
  E'Comprendre le sevrage, c''est déjà le maîtriser à moitié.\n\n1. LA DÉPENDANCE À LA NICOTINE\nLa nicotine se fixe sur des récepteurs du cerveau et déclenche une libération de dopamine. Votre cerveau finit par s''y attendre. Sans nicotine, il manque de dopamine : c''est le manque.\n\n2. LES SYMPTÔMES DU SEVRAGE\nLes premières 72h sont les plus intenses. Après J+7, les symptômes s''atténuent. Après J+21, votre cerveau commence à se recâbler.\n\n3. LE RÔLE DE LA VAPE\nLa cigarette électronique délivre de la nicotine sans combustion, supprimant le manque sans les 7 000 substances toxiques de la fumée.\n\n4. LA DÉSENSIBILISATION DES RÉCEPTEURS\nEn descendant progressivement le taux de nicotine, vous réduisez la dépendance sans souffrir.\n\n5. LA GUÉRISON EST RÉELLE\nÀ J+30, vos poumons se régénèrent. À J+90, la dépendance physique est terminée. À J+1 an, votre risque cardiovasculaire a diminué de moitié.',
  'science'
),
(
  'Les bénéfices heure par heure',
  'Ce qui se passe dans votre corps dès que vous arrêtez de fumer.',
  E'⏱ 20 MINUTES\nVotre rythme cardiaque et votre pression artérielle baissent.\n\n🕐 8 HEURES\nLe taux de monoxyde de carbone est normalisé. L''oxygène circule correctement.\n\n📅 24 HEURES\nVotre risque de crise cardiaque commence à diminuer.\n\n📅 48 HEURES\nLes terminaisons nerveuses du goût et de l''odorat commencent à se régénérer.\n\n📅 72 HEURES (J+3)\nLes bronches se relâchent, la respiration est plus facile.\n\n📅 2 SEMAINES À 3 MOIS\nLa circulation s''améliore. Les poumons fonctionnent mieux de semaine en semaine.\n\n📅 1 À 9 MOIS\nLes cils bronchiques se régénèrent. L''énergie revient.\n\n📅 1 AN\nVotre risque de maladie coronarienne est deux fois moins élevé.\n\n📅 5 ANS\nVotre risque d''AVC est comparable à celui d''un non-fumeur.\n\n📅 10 ANS\nLe risque de cancer du poumon est divisé par deux.',
  'santé'
)
ON CONFLICT DO NOTHING;
