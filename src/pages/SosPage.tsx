import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CircularProgress } from '../components/CircularProgress'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const SUPPORT_MESSAGES = [
  "Une envie ne dure que 3 à 5 minutes. Concentrez-vous sur votre respiration.",
  "La nicotine de votre e-liquide va faire effet dans quelques instants.",
  "Rappelez-vous pourquoi vous avez décidé d'arrêter. Vous en êtes capable !",
  "Prenez un grand verre d'eau bu lentement pour apaiser votre gorge.",
  "Chaque envie surmontée vous rend plus fort et diminue la prochaine.",
  "La liberté est au bout de l'effort. Respirez profondément.",
  "Pensez à votre santé qui s'améliore à chaque instant.",
  "Changez d'activité pendant 5 minutes pour distraire votre cerveau.",
  "Votre corps se nettoie. C'est le processus normal de guérison.",
  "Ne laissez pas 3 minutes d'envie ruiner tous vos efforts !"
]

export function SosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // 3 minutes countdown
  const DURATION = 180 
  const [timeLeft, setTimeLeft] = useState(DURATION)
  
  // Breathing animation states
  const [breatheState, setBreatheState] = useState<'INSPIRE' | 'RETENIR' | 'EXPIRE'>('INSPIRE')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Pick random message
    setMessage(SUPPORT_MESSAGES[Math.floor(Math.random() * SUPPORT_MESSAGES.length)])

    // Timer countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Breathing guide (4s in, 4s hold, 4s out) -> 12s cycle
    const breather = setInterval(() => {
      setBreatheState(prev => {
        if (prev === 'INSPIRE') return 'RETENIR'
        if (prev === 'RETENIR') return 'EXPIRE'
        return 'INSPIRE'
      })
    }, 4000)

    return () => {
      clearInterval(timer)
      clearInterval(breather)
    }
  }, [])

  const handleSuccess = async () => {
    try {
      if (user) {
        // Increment craving_count via RPC or direct update
        const { data: profile } = await supabase.from('profiles').select('craving_count').eq('id', user.id).single()
        if (profile) {
          await supabase.from('profiles').update({ craving_count: (profile.craving_count || 0) + 1 }).eq('id', user.id)
        }
      }
      toast.success('Bravo d\'avoir résisté !', {
        icon: '💪',
        style: { background: '#2D9B55', color: '#fff' }
      })
      navigate(-1)
    } catch (e) {
      console.error(e)
      navigate(-1) // Navigate back anyway
    }
  }

  const progress = ((DURATION - timeLeft) / DURATION) * 100
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="page p-6 flex flex-col items-center justify-between min-h-screen pb-12 pt-12 text-center bg-[#28282D]">
      <div>
        <h1 className="font-display text-4xl text-[#C0392B] mb-2 tracking-wider">URGENCE SOS</h1>
        <p className="text-[#686868] text-sm">Respirez au rythme du cercle</p>
      </div>

      <div className={`relative transition-transform duration-1000 ease-in-out ${
        breatheState === 'INSPIRE' ? 'scale-125' :
        breatheState === 'RETENIR' ? 'scale-125' :
        'scale-100'
      }`}>
        <CircularProgress progress={progress} size={260} strokeWidth={8}>
          <div className="flex flex-col items-center">
            <span className={`font-display text-4xl tracking-widest ${
              breatheState === 'INSPIRE' ? 'text-[#B8482A]' :
              breatheState === 'RETENIR' ? 'text-[#CB8002]' :
              'text-[#2D9B55]'
            }`}>
              {breatheState}
            </span>
            <span className="text-3xl font-mono font-medium text-[#F1F1F1] mt-2">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
        </CircularProgress>
      </div>

      <div className="w-full max-w-sm mt-8">
        <div className="card p-5 border-[#C0392B]/30 bg-gradient-to-t from-[#C0392B]/10 to-transparent mb-8">
          <p className="text-[#F1F1F1] italic font-medium">"{message}"</p>
        </div>

        <button 
          onClick={handleSuccess} 
          className="w-full bg-[#2D9B55] text-white rounded-xl py-5 font-display text-2xl tracking-wider shadow-[0_4px_14px_rgba(45,155,85,0.39)] transition-transform active:scale-95"
        >
          J'AI TENU !
        </button>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 text-[#686868] underline text-sm p-2 w-full"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}
