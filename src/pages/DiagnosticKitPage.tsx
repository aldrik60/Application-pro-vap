import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ChevronLeft, ShoppingBag, Phone } from 'lucide-react'

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

const SHOP_PHONES: Record<string, string> = {
  'Noyon': '03 44 44 44 44',
  'Compiègne': '03 44 20 56 78',
  'Clermont': '03 44 50 20 20',
  'Nogent-sur-Oise': '03 44 55 30 30',
  'Breteuil': '03 22 29 10 10',
  'Beauvais': '03 44 06 40 40',
  'Ferrières-en-Bray': '02 35 90 00 00',
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
        tobacco_type: (answers.tobacco_type as any) || null,
        kit_price: kit.price,
        smoker_profile: kit.name,
        recommended_nicotine_mg: nicotineMg,
        age_range: getAgeRange(answers.age || '25-40'),
      }).eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      toast.success('Votre recommandation a été enregistrée !')
      navigate('/profil')
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (isFinished) {
    const shopPhone = profile?.preferred_shop ? SHOP_PHONES[profile.preferred_shop] : null

    return (
      <div className="page p-6 pb-12 min-h-screen bg-[#28282D]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#686868] mb-8 mt-2"
        >
          <ChevronLeft size={20} /> Retour
        </button>

        <h1 className="font-display text-4xl text-[#B8482A] tracking-wider mb-1">VOTRE KIT IDÉAL</h1>
        <p className="text-[#686868] text-sm mb-8">Recommandation personnalisée selon votre profil</p>

        {/* Kit Card */}
        <div className="card p-5 mb-4 accent-left">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{kit.icon}</span>
              <h2 className="font-display text-2xl text-[#CB8002] tracking-wider leading-tight">{kit.name}</h2>
            </div>
            <span className="text-xl font-bold text-[#F1F1F1] whitespace-nowrap">{kit.price.toFixed(2)}€</span>
          </div>
          <p className="text-sm text-[#686868] leading-relaxed mb-4">{kit.description}</p>

          <div className="flex items-center gap-3 p-3 bg-[#28282D] rounded-[14px] border border-[#2E2E32]">
            <div className="w-11 h-11 rounded-full bg-[rgba(184,72,42,0.15)] border border-[#B8482A]/30 flex items-center justify-center">
              <span className="font-display text-lg text-[#B8482A]">{nicotineMg}</span>
            </div>
            <div>
              <span className="block text-[10px] text-[#686868] uppercase font-bold tracking-wider mb-0.5">Taux de nicotine recommandé</span>
              <span className="block text-[#F1F1F1] font-semibold text-sm">{nicotineMg} mg/ml</span>
            </div>
          </div>
        </div>

        {/* Amortization */}
        <div className="card p-4 mb-4 border-[#2D9B55]/30 bg-[rgba(45,155,85,0.05)]">
          <p className="text-sm text-[#F1F1F1] leading-relaxed">
            💰 À <span className="font-semibold text-[#CB8002]">{packPrice.toFixed(2)}€</span> le paquet, votre kit sera amorti en environ{' '}
            <span className="font-bold text-[#2D9B55]">{daysToAmortize} jours</span>.
            Ensuite, chaque euro est un bénéfice pour votre santé et votre portefeuille.
          </p>
        </div>

        {/* Reassurance */}
        {kit.price >= 84.90 && (
          <div className="card p-4 mb-6 border-[#B8482A]/20 bg-[rgba(184,72,42,0.05)]">
            <p className="text-sm text-[#F1F1F1] leading-relaxed">
              💡 Un paquet coûte en moyenne 10€. Ce kit représente moins de 10 paquets de cigarettes.
              Investir dans votre santé est le meilleur placement qui soit.
            </p>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button onClick={handleSave} className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer ma recommandation'}
          </button>

          {shopPhone && (
            <a href={`tel:${shopPhone}`} className="btn-secondary flex items-center justify-center gap-2">
              <Phone size={16} /> Parler à un conseiller
            </a>
          )}

          <button onClick={() => navigate('/profil')} className="flex items-center justify-center gap-2 w-full text-[#686868] text-sm py-3 border border-[#2E2E32] rounded-[14px]">
            <ShoppingBag size={16} /> Voir en boutique Pro'Vap
          </button>
        </div>

        <p className="text-[10px] text-[#686868] text-center leading-relaxed">
          Cette recommandation est donnée à titre indicatif. Nos conseillers Pro'Vap peuvent affiner ce diagnostic lors de votre visite en boutique.
        </p>
      </div>
    )
  }

  return (
    <div className="page p-6 min-h-screen bg-[#28282D] pt-10">
      <button
        onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
        className="flex items-center gap-2 text-[#686868] mb-6"
      >
        <ChevronLeft size={20} /> {step > 0 ? 'Question précédente' : 'Retour'}
      </button>

      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl text-[#B8482A] mb-4 tracking-wider">DIAGNOSTIC KIT</h1>
        <div className="progress-track w-full max-w-xs mx-auto">
          <div className="progress-fill transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-[#686868] text-sm mt-3 font-medium tracking-widest">
          QUESTION {step + 1} / {QUESTIONS.length}
        </p>
      </div>

      <div className="max-w-md mx-auto w-full">
        <h2 className="text-xl font-semibold text-[#F1F1F1] text-center mb-8 leading-snug">
          {currentQ.text}
        </h2>

        <div className="flex flex-col gap-3">
          {currentQ.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(opt.value)}
              className={`w-full text-left p-4 rounded-[14px] border transition-all active:scale-[0.98] ${
                selected === opt.value
                  ? 'border-[#CB8002] bg-[rgba(203,128,2,0.1)] text-[#CB8002]'
                  : 'border-[#2E2E32] bg-[#1E1E22] text-[#F1F1F1] hover:border-[#CB8002]/40 hover:bg-[rgba(203,128,2,0.03)]'
              }`}
            >
              <span className="text-base font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-xs text-[#686868]">
          Ce diagnostic ne tient pas compte du budget. Il se base uniquement sur votre profil de fumeur.
        </p>
      </div>
    </div>
  )
}
