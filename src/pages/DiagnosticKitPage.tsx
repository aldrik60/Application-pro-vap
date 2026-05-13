import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ChevronLeft, Phone } from 'lucide-react'
import { useShop } from '../hooks/useShop'
import type { TobaccoType } from '../types'

const KITS = {
  cbd: {
    name: 'Kit CBD Confort',
    price: 39.90,
    description: 'Spécialement conçu pour accompagner la réduction du cannabis. Ce kit offre une expérience douce avec des e-liquides au CBD pour apaiser les envies.',
    icon: '🌿',
  },
  recreatif: {
    name: 'Kit Récréatif',
    price: 124.90,
    description: 'Pour les vapoteurs souhaitant une expérience premium. Performant et polyvalent, il conviendra aux amateurs de saveurs et de vapeur dense.',
    icon: '✨',
  },
  sevrage: {
    name: 'Kit Sevrage',
    price: 84.90,
    description: 'Idéal pour les fumeurs légers (moins de 10 cigarettes/jour). Simple d\'utilisation et efficace, il vous accompagnera vers la liberté en douceur.',
    icon: '🌱',
  },
  confort: {
    name: 'Kit Confort',
    price: 99.90,
    description: 'Notre kit phare, recommandé pour la grande majorité des fumeurs. Performant, simple et fiable, il s\'adapte à tous les profils de sevrage.',
    icon: '⭐',
  },
}

type KitKey = keyof typeof KITS

const QUESTIONS = [
  {
    id: 'tobacco_type',
    text: 'Quel type de tabac consommez-vous ?',
    options: [
      { label: 'Cigarette industrielle', value: 'industrielle' },
      { label: 'Tabac à rouler', value: 'roulée' },
      { label: 'Cigare', value: 'cigare' },
      { label: 'Cigarillo', value: 'cigarillo' },
      { label: 'Cannabis', value: 'cannabis' },
      { label: 'Mixte (plusieurs types)', value: 'mixte' },
    ],
  },
  {
    id: 'cigs_per_day',
    text: 'Combien de cigarettes fumez-vous par jour en moyenne ?',
    options: [
      { label: 'Moins de 5 cigarettes', value: 'moins_de_5' },
      { label: 'Entre 5 et 10 cigarettes', value: '5-10' },
      { label: 'Entre 10 et 20 cigarettes', value: '10-20' },
      { label: 'Plus de 20 cigarettes', value: 'plus_de_20' },
    ],
  },
  {
    id: 'years_smoking',
    text: 'Depuis combien de temps fumez-vous ?',
    options: [
      { label: 'Moins de 2 ans', value: 'moins_2' },
      { label: 'Entre 2 et 5 ans', value: '2-5' },
      { label: 'Entre 5 et 10 ans', value: '5-10' },
      { label: 'Plus de 10 ans', value: 'plus_10' },
    ],
  },
  {
    id: 'age',
    text: 'Quelle est votre tranche d\'âge ?',
    options: [
      { label: 'Moins de 25 ans', value: 'moins_25' },
      { label: 'Entre 25 et 40 ans', value: '25-40' },
      { label: 'Entre 40 et 55 ans', value: '40-55' },
      { label: 'Plus de 55 ans', value: 'plus_55' },
    ],
  },
  {
    id: 'first_cig',
    text: 'Quand fumez-vous votre première cigarette après le réveil ?',
    options: [
      { label: 'Dans les 5 premières minutes', value: '5min' },
      { label: 'Entre 6 et 30 minutes', value: '6-30min' },
      { label: 'Entre 31 et 60 minutes', value: '31-60min' },
      { label: 'Après plus d\'une heure', value: 'apres_1h' },
    ],
  },
  {
    id: 'night_smoking',
    text: 'Vous réveillez-vous la nuit pour fumer ?',
    options: [
      { label: 'Oui, cela m\'arrive', value: 'oui' },
      { label: 'Non, jamais', value: 'non' },
    ],
  },
  {
    id: 'objective',
    text: 'Quel est votre objectif principal ?',
    options: [
      { label: 'Arrêter de fumer complètement', value: 'arreter' },
      { label: 'Réduire ma consommation', value: 'reduire' },
      { label: 'Sevrage du cannabis', value: 'cannabis' },
      { label: 'Vape récréative (sans sevrage)', value: 'recreatif' },
    ],
  },
  {
    id: 'previous_vape',
    text: 'Avez-vous déjà essayé la cigarette électronique ?',
    options: [
      { label: 'Non, c\'est une première', value: 'non' },
      { label: 'Oui, sans succès', value: 'oui_echec' },
      { label: 'Oui, avec une réduction notable', value: 'oui_reduction' },
      { label: 'Oui, mais j\'ai rechuté', value: 'oui_rechute' },
    ],
  },
  {
    id: 'context',
    text: 'Dans quel contexte utiliserez-vous principalement votre vape ?',
    options: [
      { label: 'Discret (travail, transports en commun)', value: 'discretion' },
      { label: 'Principalement à la maison', value: 'maison' },
      { label: 'Les deux contextes', value: 'les_deux' },
      { label: 'Sorties et soirées', value: 'soiree' },
    ],
  },
]

function getKitKey(answers: Record<string, string>): KitKey {
  const { objective, cigs_per_day, tobacco_type } = answers
  if (objective === 'cannabis' || tobacco_type === 'cannabis') return 'cbd'
  if (objective === 'recreatif') return 'recreatif'
  if ((objective === 'arreter' || objective === 'reduire') &&
    (cigs_per_day === 'moins_de_5' || cigs_per_day === '5-10')) return 'sevrage'
  return 'confort'
}

function getNicotineMg(cigs_per_day: string): number {
  if (cigs_per_day === 'moins_de_5') return 3
  if (cigs_per_day === '5-10') return 6
  if (cigs_per_day === '10-20') return 12
  return 16
}

function getAgeRange(age: string): string {
  if (age === 'moins_25') return 'Moins de 25 ans'
  if (age === '25-40') return '25-40 ans'
  if (age === '40-55') return '40-55 ans'
  return 'Plus de 55 ans'
}

export function DiagnosticKitPage() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  const currentQ = QUESTIONS[step]
  const progressPercent = ((step + 1) / QUESTIONS.length) * 100

  const handleAnswer = (value: string) => {
    setSelected(value)
    const newAnswers = { ...answers, [currentQ.id]: value }
    setAnswers(newAnswers)

    setTimeout(() => {
      setSelected(null)
      if (step < QUESTIONS.length - 1) {
        setStep(s => s + 1)
      } else {
        setIsFinished(true)
      }
    }, 250)
  }

  const kitKey = getKitKey(answers)
  const kit = KITS[kitKey]
  const nicotineMg = getNicotineMg(answers.cigs_per_day || '10-20')

  // Amortization
  const packPrice = profile?.pack_price || 10
  const cigsPerDay = answers.cigs_per_day === 'moins_de_5' ? 3
    : answers.cigs_per_day === '5-10' ? 7
    : answers.cigs_per_day === '10-20' ? 15
    : 25
  const dailySavings = (cigsPerDay / 20) * packPrice
  const daysToAmortize = dailySavings > 0 ? Math.ceil(kit.price / dailySavings) : 0

  const handleSave = async () => {
    if (!user) return
    try {
      setSaving(true)
      const { error } = await supabase.from('profiles').update({
        tobacco_type: (answers.tobacco_type as TobaccoType) || null,
        kit_price: kit.price,
        smoker_profile: kit.name,
        recommended_nicotine_mg: nicotineMg,
        age_range: getAgeRange(answers.age || '25-40'),
      }).eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      toast.success('Votre recommandation a été enregistrée !')
      navigate('/profil')
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const { shop: shopData } = useShop(profile?.preferred_shop ?? null)

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '24px 28px 32px' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-3 text-sm hover:text-ink transition-colors self-start"
        >
          <ChevronLeft size={18} /> Retour
        </button>

        <div className="mt-8">
          <span className="eyebrow text-pv-ochre">Votre recommandation</span>
          <h1
            className="display mt-3 text-ink"
            style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Votre kit <span className="display-italic">idéal.</span>
          </h1>
        </div>

        {/* Kit card */}
        <div className="card p-5 mt-6 accent-left">
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{kit.icon}</span>
              <p className="font-display text-pv-ochre" style={{ fontSize: 22, fontWeight: 500 }}>
                {kit.name}
              </p>
            </div>
            <span className="font-display text-ink whitespace-nowrap" style={{ fontSize: 22, fontWeight: 500 }}>
              {kit.price.toFixed(2)}€
            </span>
          </div>
          <p className="text-sm text-ink-2 leading-relaxed mt-3">{kit.description}</p>

          <div className="flex items-center gap-3 p-3 mt-4"
            style={{ background: 'var(--color-bg-elev)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-line)' }}>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(184, 72, 42, 0.15)',
                border: '1px solid rgba(184, 72, 42, 0.30)',
              }}
            >
              <span className="font-display text-pv-terracotta" style={{ fontSize: 17, fontWeight: 500 }}>
                {nicotineMg}
              </span>
            </div>
            <div>
              <span className="eyebrow block">Taux nicotine recommandé</span>
              <span className="block font-display text-ink text-sm mt-0.5">{nicotineMg} mg/ml</span>
            </div>
          </div>
        </div>

        {/* Amortization */}
        <div className="card p-5 mt-3" style={{ borderColor: 'rgba(122, 138, 94, 0.30)' }}>
          <p className="text-sm text-ink leading-relaxed">
            À <span className="font-semibold text-pv-ochre">{packPrice.toFixed(2)}€</span> le paquet, votre kit sera amorti en environ{' '}
            <span className="font-semibold text-success">{daysToAmortize} jours</span>. Ensuite, chaque euro est un bénéfice net.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer ma recommandation'}
          </button>
          {shopData?.phone && (
            <a href={`tel:${shopData.phone}`} className="btn-ghost flex items-center justify-center gap-2">
              <Phone size={14} strokeWidth={1.4} /> Parler à un conseiller
            </a>
          )}
        </div>

        <p className="text-[11px] text-ink-3 text-center leading-relaxed mt-6">
          Recommandation indicative. Nos conseillers Pro'Vap peuvent affiner ce diagnostic en boutique.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '24px 28px 32px' }}>
      <div className="flex justify-between items-center">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          className="flex items-center gap-2 text-ink-3 text-sm hover:text-ink transition-colors"
        >
          <ChevronLeft size={18} /> {step > 0 ? 'Précédent' : 'Retour'}
        </button>
        <span className="text-[10px] text-ink-3" style={{ letterSpacing: '0.2em' }}>
          {String(step + 1).padStart(2, '0')} / {String(QUESTIONS.length).padStart(2, '0')}
        </span>
      </div>

      <div className="mt-3 rounded-full overflow-hidden" style={{ height: 2, background: 'var(--color-line)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: 'var(--color-pv-ochre)' }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center pt-8">
        <span className="eyebrow text-pv-terracotta">Diagnostic kit · Question {step + 1}</span>
        <h2
          className="display mt-3 text-ink"
          style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.2 }}
        >
          {currentQ.text}
        </h2>

        <div className="flex flex-col gap-2.5 mt-8">
          {currentQ.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(opt.value)}
              className="w-full text-left p-4 transition-all active:scale-[0.98]"
              style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid ' + (selected === opt.value ? 'var(--color-pv-ochre)' : 'var(--color-line)'),
                background: selected === opt.value ? 'rgba(203,128,2,0.06)' : 'var(--color-bg-elev)',
                color: selected === opt.value ? 'var(--color-pv-ochre)' : 'var(--color-ink)',
              }}
            >
              <span className="font-display" style={{ fontSize: 16, fontWeight: 500 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-ink-3 text-center leading-relaxed mt-6">
        Ce diagnostic se base sur votre profil de fumeur, pas sur votre budget.
      </p>
    </div>
  )
}
