-- ═══════════════════════════════════════════════════════════════════════════
-- PRO'VAP — Table des boutiques
-- Exécutez ce script dans SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.shops (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name    TEXT NOT NULL UNIQUE,
  address TEXT,
  phone   TEXT,
  hours   TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accès public en lecture (pas de données sensibles)
ALTER TABLE public.shops DISABLE ROW LEVEL SECURITY;

-- ─── Données des boutiques ────────────────────────────────────────────────────

INSERT INTO public.shops (name, address, phone, hours) VALUES
('Client Internet',    'Service en ligne — rattaché à Compiègne', '03 44 23 85 83', 'Lun–Sam : 10h–12h30 / 14h–19h'),
('Compiègne',          '14 Rue des Lombards, 60200 Compiègne',    '03 44 23 85 83', 'Lun–Sam : 10h–12h30 / 14h–19h'),
('Nogent-sur-Oise',    '12 Rue Gutenberg, 60180 Nogent-sur-Oise', '03 44 56 24 03', 'Lun–Sam : 10h–12h30 / 14h–19h'),
('Beauvais',           '32 Rue Carnot, 60000 Beauvais',           '03 60 36 16 82', 'Lun–Sam : 10h–12h30 / 14h–19h'),
('Noyon',              '5 Place de l''Hôtel de Ville, 60400 Noyon','03 44 97 03 99', 'Lun–Sam : 10h–12h30 / 14h–19h'),
('Clermont',           '8 Rue de la République, 60600 Clermont',  '03 44 77 31 12', 'Lun–Sam : 10h–12h30 / 14h–19h'),
('Breteuil',           '2 Place André Boulloche, 60120 Breteuil', '03 44 04 24 58', 'Lun–Sam : 10h–12h30 / 14h–19h'),
('Ferrières-en-Bray',  '3 Rue de la Libération, 76220 Ferrières', '02 35 09 27 93', 'Lun–Sam : 10h–12h30 / 14h–19h')
ON CONFLICT (name) DO UPDATE SET
  address = EXCLUDED.address,
  phone   = EXCLUDED.phone,
  hours   = EXCLUDED.hours;
