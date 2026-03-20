import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const FAGERSTROM_QUESTIONS = [
  {
    id: 1,
    text: "Combien de temps après votre réveil fumez-vous votre première cigarette ?",
    options: [
      { text: "Dans les 5 premières minutes", score: 3 },
      { text: "Entre 6 et 30 minutes", score: 2 },
      { text: "Entre 31 et 60 minutes", score: 1 },
      { text: "Après plus d'une heure", score: 0 }
    ]
  },
  {
    id: 2,
    text: "Trouvez-vous difficile de vous abstenir de fumer dans les endroits où c'est interdit ?",
    options: [
      { text: "Oui", score: 1 },
      { text: "Non", score: 0 }
    ]
  },
  {
    id: 3,
    text: "À quelle cigarette de la journée vous serait-il le plus difficile de renoncer ?",
    options: [
      { text: "La première le matin", score: 1 },
      { text: "N'importe quelle autre", score: 0 }
    ]
  },
  {
    id: 4,
    text: "Combien de cigarettes fumez-vous par jour en moyenne ?",
    options: [
      { text: "10 ou moins", score: 0 },
      { text: "11 à 20", score: 1 },
      { text: "21 à 30", score: 2 },
      { text: "31 ou plus", score: 3 }
    ]
  },
  {
    id: 5,
    text: "Fumez-vous à un rythme plus soutenu le matin que l'après-midi ?",
    options: [
      { text: "Oui", score: 1 },
      { text: "Non", score: 0 }
    ]
  },
  {
    id: 6,
    text: "Fumez-vous même si une maladie vous oblige à rester au lit ?",
    options: [
      { text: "Oui", score: 1 },
      { text: "Non", score: 0 }
    ]
  }
]

export function FagerstromPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>(Array(6).fill(0))
  const [isFinished, setIsFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSelect = (score: number) => {
    const newAnswers = [...answers]
    newAnswers[currentStep] = score
    setAnswers(newAnswers)

    setTimeout(() => {
      if (currentStep < 5) {
        setCurrentStep(prev => prev + 1)
      } else {
        setIsFinished(true)
      }
    }, 300)
  }

  const totalScore = answers.reduce((a, b) => a + b, 0)
  
  let dependencyLevel = ""
  let advice = ""
  let color = ""

  if (totalScore <= 2) {
    dependencyLevel = "Dépendance faible"
    advice = "Votre dépendance physique est faible. La vape avec un taux réduit (3-6mg) suffira à combler les envies comportementales."
    color = "text-[#2D9B55]"
  } else if (totalScore <= 4) {
    dependencyLevel = "Dépendance faible à modérée"
    advice = "Une dépendance légère. Un matériel adapté et un dosage entre 6 et 9mg vous assureront une transition douce."
    color = "text-[#CB8002]"
  } else if (totalScore <= 6) {
    dependencyLevel = "Dépendance modérée"
    advice = "La dépendance physique est bien présente. Nous vous recommandons un e-liquide autour de 12mg pour éviter toute sensation de manque."
    color = "text-[#B8482A]"
  } else {
    dependencyLevel = "Dépendance forte à très forte"
    advice = "Votre dépendance physique est importante. Il est essentiel de commencer avec un fort dosage (16-20mg ou sels de nicotine) pour réussir votre sevrage."
    color = "text-[#C0392B]"
  }

  const handleSave = async () => {
    if (!user) return
    try {
      setSaving(true)
      const { error } = await supabase.from('profiles').update({ fagerstrom_score: totalScore }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Test enregistré avec succès !')
      navigate('/')
    } catch (e: any) {
      toast.error('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (isFinished) {
    return (
      <div className="page p-6 flex flex-col items-center justify-center min-h-screen pb-12 pt-12 text-center bg-[#28282D]">
        <h1 className="font-display text-4xl text-[#F1F1F1] mb-2 tracking-wider">RÉSULTAT DU TEST</h1>
        
        <div className="w-40 h-40 rounded-full border-8 border-[#CB8002] flex items-center justify-center my-8 shadow-[0_0_30px_rgba(203,128,2,0.2)]">
          <div>
            <span className="block text-6xl font-display text-[#CB8002] leading-none mb-1">{totalScore}</span>
            <span className="text-sm text-[#686868] font-bold">/ 10</span>
          </div>
        </div>

        <h2 className={`text-2xl font-bold mb-4 ${color}`}>{dependencyLevel}</h2>
        <div className="card p-6 bg-[#1E1E22] border-[#2E2E32] mb-8 w-full max-w-sm">
          <p className="text-[#F1F1F1] leading-relaxed">{advice}</p>
        </div>

        <button onClick={handleSave} className="btn-primary w-full max-w-sm py-4 text-lg" disabled={saving}>
          {saving ? 'Enregistrement...' : 'Valider & Enregistrer'}
        </button>
      </div>
    )
  }

  const progressPercent = ((currentStep + 1) / 6) * 100
  const question = FAGERSTROM_QUESTIONS[currentStep]

  return (
    <div className="page p-6 flex flex-col min-h-screen bg-[#28282D] pt-12">
      <div className="mb-10 text-center">
         <h1 className="font-display text-4xl text-[#B8482A] mb-4 tracking-wider">TEST DE FAGERSTRÖM</h1>
         <div className="progress-track w-full max-w-xs mx-auto">
            <div className="progress-fill transition-all duration-300" style={{ width: `${progressPercent}%` }} />
         </div>
         <p className="text-[#686868] text-sm mt-3 font-medium tracking-widest">QUESTION {currentStep + 1} / 6</p>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <h2 className="text-2xl font-semibold text-[#F1F1F1] text-center mb-8 leading-snug">
          {question.text}
        </h2>

        <div className="flex flex-col gap-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option.score)}
              className="w-full text-left p-4 rounded-xl border border-[#2E2E32] bg-[#1E1E22] text-[#F1F1F1] hover:border-[#CB8002] hover:bg-[rgba(203,128,2,0.05)] transition-all active:scale-[0.98] active:bg-[rgba(203,128,2,0.1)]"
            >
              <span className="text-lg">{option.text}</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-8 text-center pt-8 border-t border-[#2E2E32]">
         <p className="text-xs text-[#686868]">Ce test médical évalue votre dépendance physique à la nicotine.</p>
      </div>
    </div>
  )
}
