import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const PHASES = [
  {
    key: 'INSPIRE',
    label: 'Inspirez',
    emoji: '🌬️',
    color: '#B8482A',
    glow: 'rgba(184,72,42,0.25)',
    tip: 'Remplissez vos poumons lentement...',
    big: true,
  },
  {
    key: 'RETENIR',
    label: 'Retenez',
    emoji: '💫',
    color: '#CB8002',
    glow: 'rgba(203,128,2,0.25)',
    tip: 'Gardez l\'air, sentez la paix...',
    big: true,
  },
  {
    key: 'EXPIRE',
    label: 'Expirez',
    emoji: '✨',
    color: '#2D9B55',
    glow: 'rgba(45,155,85,0.25)',
    tip: 'Relâchez tout le stress...',
    big: false,
  },
]

const TOTAL_DURATION = 180

export function SosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [phaseIdx, setPhaseIdx] = useState(0)
  const [phaseCount, setPhaseCount] = useState(4)
  const [cycle, setCycle] = useState(1)
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION)
  const [done, setDone] = useState(false)

  const phase = PHASES[phaseIdx]

  useEffect(() => {
    if (done) return

    const tick = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setDone(true)
          return 0
        }
        return prev - 1
      })

      setPhaseCount(prev => {
        if (prev <= 1) {
          setPhaseIdx(prevIdx => {
            const next = (prevIdx + 1) % 3
            if (next === 0) setCycle(c => c + 1)
            return next
          })
          return 4
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(tick)
  }, [done])

  const handleSuccess = async () => {
    try {
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('craving_count').eq('id', user.id).single()
        if (profile) {
          await supabase.from('profiles').update({ craving_count: (profile.craving_count || 0) + 1 }).eq('id', user.id)
        }
      }
      toast.success('Bravo d\'avoir résisté !', { icon: '💪', style: { background: '#2D9B55', color: '#fff' } })
      navigate(-1)
    } catch (e) {
      navigate(-1)
    }
  }

  const progress = ((TOTAL_DURATION - timeLeft) / TOTAL_DURATION) * 100
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  // Victory screen
  if (done) {
    return (
      <div className="page p-6 flex flex-col items-center justify-center min-h-screen text-center bg-[#28282D]">
        <div className="text-8xl mb-6" style={{ animation: 'fadeInUp 0.5s ease' }}>🎉</div>
        <h1 className="font-display text-5xl text-[#2D9B55] mb-3 tracking-wider">BRAVO !</h1>
        <p className="text-[#F1F1F1] text-lg mb-2">3 minutes sans craquer !</p>
        <p className="text-[#686868] text-sm mb-2">{cycle} cycles de cohérence cardiaque</p>
        <p className="text-[#CB8002] text-xs font-semibold mb-10 uppercase tracking-wider">Votre rythme cardiaque est apaisé ✓</p>
        <button
          onClick={handleSuccess}
          className="w-full max-w-xs bg-[#2D9B55] text-white rounded-[14px] py-5 font-display text-2xl tracking-wider shadow-[0_4px_20px_rgba(45,155,85,0.4)] transition-transform active:scale-95"
        >
          J'AI TENU ! 💪
        </button>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#686868] text-sm p-2">
          Retour à l'accueil
        </button>
      </div>
    )
  }

  return (
    <div className="page flex flex-col items-center justify-between min-h-screen pb-10 pt-10 text-center bg-[#28282D] px-6">

      {/* Header */}
      <div className="w-full">
        <h1 className="font-display text-3xl tracking-wider mb-1" style={{ color: phase.color }}>
          COHÉRENCE CARDIAQUE
        </h1>
        <p className="text-[#686868] text-xs uppercase tracking-widest mb-3">
          Cycle {cycle} &nbsp;·&nbsp; {minutes}:{seconds.toString().padStart(2, '0')} restantes
        </p>
        {/* Global progress bar */}
        <div className="progress-track max-w-xs mx-auto">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress}%`, backgroundColor: phase.color }}
          />
        </div>
      </div>

      {/* Breathing bubble */}
      <div className="flex flex-col items-center gap-5">

        {/* Outer glow layer 1 */}
        <div className="relative flex items-center justify-center" style={{ width: 300, height: 300 }}>
          <div
            className="absolute rounded-full"
            style={{
              width: phase.big ? 290 : 170,
              height: phase.big ? 290 : 170,
              backgroundColor: phase.glow,
              opacity: 0.35,
              transition: 'all 3.2s ease-in-out',
            }}
          />
          {/* Outer glow layer 2 */}
          <div
            className="absolute rounded-full"
            style={{
              width: phase.big ? 240 : 140,
              height: phase.big ? 240 : 140,
              backgroundColor: phase.glow,
              opacity: 0.45,
              transition: 'all 3.2s ease-in-out',
            }}
          />
          {/* Main bubble */}
          <div
            className="relative rounded-full flex flex-col items-center justify-center"
            style={{
              width: phase.big ? 190 : 120,
              height: phase.big ? 190 : 120,
              background: `radial-gradient(circle at 40% 40%, ${phase.glow}, rgba(30,30,34,0.95))`,
              border: `2px solid ${phase.color}`,
              boxShadow: `0 0 40px ${phase.glow}, 0 0 80px ${phase.glow}`,
              transition: 'all 3.2s ease-in-out',
            }}
          >
            <span className="text-4xl mb-1 transition-all duration-300">{phase.emoji}</span>
            <span
              className="font-display text-xl tracking-widest transition-colors duration-300"
              style={{ color: phase.color }}
            >
              {phase.label}
            </span>
            <span className="text-5xl font-bold text-[#F1F1F1] mt-1 leading-none">{phaseCount}</span>
          </div>
        </div>

        {/* Tip */}
        <p className="text-[#686868] text-sm italic">{phase.tip}</p>

        {/* Phase dots indicator */}
        <div className="flex items-center gap-3">
          {PHASES.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === phaseIdx ? 12 : 8,
                  height: i === phaseIdx ? 12 : 8,
                  backgroundColor: i === phaseIdx ? phase.color : '#2E2E32',
                }}
              />
              <span
                className="text-[9px] uppercase tracking-wider font-semibold transition-colors duration-300"
                style={{ color: i === phaseIdx ? phase.color : '#2E2E32' }}
              >
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleSuccess}
          className="w-full bg-[#2D9B55] text-white rounded-[14px] py-4 font-display text-xl tracking-wider shadow-[0_4px_14px_rgba(45,155,85,0.35)] transition-transform active:scale-95"
        >
          J'AI TENU !
        </button>
        <button onClick={() => navigate(-1)} className="text-[#686868] text-sm p-2 w-full">
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}
