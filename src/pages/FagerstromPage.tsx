import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ChevronLeft } from 'lucide-react'

const FAGERSTROM_QUESTIONS = [
  {
    id: 1,
    text: "Combien de temps après votre réveil fumez-vous votre première cigarette ?",
    options: [
      { text: 'Dans les 5 premières minutes', score: 3 },
      { text: 'Entre 6 et 30 minutes',         score: 2 },
      { text: 'Entre 31 et 60 minutes',        score: 1 },
      { text: "Après plus d'une heure",        score: 0 },
    ],
  },
  {
    id: 2,
    text: "Trouvez-vous difficile de vous abstenir de fumer dans les endroits où c'est interdit ?",
    options: [{ text: 'Oui', score: 1 }, { text: 'Non', score: 0 }],
  },
  {
    id: 3,
    text: 'À quelle cigarette de la journée vous serait-il le plus difficile de renoncer ?',
    options: [
      { text: 'La première du matin', score: 1 },
      { text: "N'importe quelle autre", score: 0 },
    ],
  },
  {
    id: 4,
    text: 'Combien de cigarettes fumez-vous par jour en moyenne ?',
    options: [
      { text: '10 ou moins',  score: 0 },
      { text: '11 à 20',      score: 1 },
      { text: '21 à 30',      score: 2 },
      { text: '31 ou plus',   score: 3 },
    ],
  },
  {
    id: 5,
    text: "Fumez-vous à un rythme plus soutenu le matin que l'après-midi ?",
    options: [{ text: 'Oui', score: 1 }, { text: 'Non', score: 0 }],
  },
  {
    id: 6,
    text: 'Fumez-vous même si une maladie vous oblige à rester au lit ?',
    options: [{ text: 'Oui', score: 1 }, { text: 'Non', score: 0 }],
  },
]

export function FagerstromPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>(Array(6).fill(0))
  const [selected, setSelected] = useState<number | null>(null)
  const [isFinished, setIsFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSelect = (score: number, idx: number) => {
    setSelected(idx)
    const newAnswers = [...answers]
    newAnswers[currentStep] = score
    setAnswers(newAnswers)
    setTimeout(() => {
      setSelected(null)
      if (currentStep < 5) setCurrentStep(p => p + 1)
      else setIsFinished(true)
    }, 280)
  }

  const totalScore = answers.reduce((a, b) => a + b, 0)

  const interpretation = (() => {
    if (totalScore <= 2) return { level: 'Dépendance faible', advice: 'Votre dépendance physique est faible. La vape avec un taux réduit (3 à 6 mg/ml) suffira à combler les envies comportementales.', color: 'var(--color-success)' }
    if (totalScore <= 4) return { level: 'Dépendance faible à modérée', advice: 'Une dépendance légère. Un dosage entre 6 et 9 mg/ml vous assurera une transition douce.', color: 'var(--color-gold-text)' }
    if (totalScore <= 6) return { level: 'Dépendance modérée', advice: 'La dépendance physique est présente. Nous recommandons un e-liquide autour de 12 mg/ml pour éviter le manque.', color: 'var(--color-pv-terracotta)' }
    return { level: 'Dépendance forte à très forte', advice: "Votre dépendance est importante. Démarrez fort (16 à 20 mg/ml ou sels de nicotine) — la descente viendra ensuite.", color: 'var(--color-danger)' }
  })()

  const handleSave = async () => {
    if (!user) return
    try {
      setSaving(true)
      const { error } = await supabase.from('profiles').update({ fagerstrom_score: totalScore }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Test enregistré')
      navigate(-1)
    } catch {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '32px 28px' }}>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-ink-3 text-sm hover:text-ink transition-colors self-start"
        >
          <ChevronLeft size={18} /> Retour
        </button>

        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <span className="eyebrow text-gold-text">Votre résultat</span>
          <h1
            className="display mt-3 text-ink"
            style={{ fontSize: 28 }}
          >
            Test de <span className="display-italic">Fagerström.</span>
          </h1>

          <div
            className="my-8 flex flex-col items-center justify-center"
            style={{
              width: 180, height: 180,
              borderRadius: 999,
              border: '1px solid var(--color-line-strong)',
              background: 'var(--color-bg-elev)',
            }}
          >
            <span
              className="font-display tabular"
              style={{ fontSize: 72, color: interpretation.color, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.04em' }}
            >
              {totalScore}
            </span>
            <span className="display-italic text-ink-3 text-sm mt-1">sur 10</span>
          </div>

          <p
            className="display-italic"
            style={{ fontSize: 22, color: interpretation.color }}
          >
            « {interpretation.level} »
          </p>

          <div className="card p-5 mt-6 max-w-[340px] text-left">
            <span className="eyebrow text-flame-text">Recommandation Pro'Vap</span>
            <p className="text-sm text-ink leading-relaxed mt-3">
              {interpretation.advice}
            </p>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary mt-6" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer mon résultat'}
        </button>
      </div>
    )
  }

  const question = FAGERSTROM_QUESTIONS[currentStep]
  const progressPercent = ((currentStep + 1) / 6) * 100

  return (
    <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '24px 28px 32px' }}>
      <div className="flex justify-between items-center">
        <button
          onClick={() => currentStep > 0 ? setCurrentStep(p => p - 1) : navigate(-1)}
          className="flex items-center gap-2 text-ink-3 text-sm hover:text-ink transition-colors"
        >
          <ChevronLeft size={18} /> {currentStep > 0 ? 'Précédent' : 'Retour'}
        </button>
        <span className="text-[11px] text-ink-3" style={{ letterSpacing: '0.2em' }}>
          0{currentStep + 1} / 06
        </span>
      </div>

      <div className="mt-3 rounded-full overflow-hidden" style={{ height: 2, background: 'var(--color-line)' }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progressPercent}%`, background: 'var(--color-gold-text)' }}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center pt-8">
        <span className="eyebrow text-flame-text">Question {currentStep + 1}</span>
        <h2
          className="display mt-3 text-ink"
          style={{ fontSize: 28, fontWeight: 400, letterSpacing: '-0.015em', lineHeight: 1.2 }}
        >
          {question.text}
        </h2>

        <div className="flex flex-col gap-2.5 mt-8">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option.score, idx)}
              className="w-full text-left p-4 transition-all active:scale-[0.98]"
              style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid ' + (selected === idx ? 'var(--color-gold-text)' : 'var(--color-line)'),
                background: selected === idx ? 'rgba(203,128,2,0.06)' : 'var(--color-bg-elev)',
                color: selected === idx ? 'var(--color-gold-text)' : 'var(--color-ink)',
              }}
            >
              <span className="font-display" style={{ fontSize: 18, fontWeight: 500 }}>{option.text}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-ink-3 text-center mt-8 leading-relaxed">
        Test médical validé par la Haute Autorité de Santé. Évalue la dépendance physique à la nicotine.
      </p>
    </div>
  )
}
