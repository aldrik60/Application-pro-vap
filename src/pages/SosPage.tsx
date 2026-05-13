import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { X, Pause, Play } from 'lucide-react'

/**
 * SOS — cohérence cardiaque, version sensorielle.
 * Plein écran sombre umber + grain, orbe qui respire 4-7-8.
 * Aucune UI mobile classique : texte serif italique, ambiance cuir/papier brûlé.
 *
 * Cycle 4-7-8 : Inspirez 4s · Retenez 7s · Expirez 8s.
 * 6 cycles complets = ~3 min, durée recommandée pour passer une envie.
 */

type Phase = 'inhale' | 'hold' | 'exhale'

const CYCLES_TOTAL = 6
const PHASE_DURATIONS: Record<Phase, number> = { inhale: 4, hold: 7, exhale: 8 }
const PHASE_ORDER: Phase[] = ['inhale', 'hold', 'exhale']

const PHASE_META: Record<Phase, { eyebrow: string; big: string; sub: string }> = {
  inhale: { eyebrow: 'Inspirez', big: '4', sub: 'Par le nez, lentement.' },
  hold:   { eyebrow: 'Retenez', big: '7', sub: 'Doucement.' },
  exhale: { eyebrow: 'Expirez', big: '8', sub: 'Par la bouche, en relâchant.' },
}

export function SosPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [phaseIdx, setPhaseIdx] = useState(0)        // index dans PHASE_ORDER
  const [secondsInPhase, setSecondsInPhase] = useState(PHASE_DURATIONS.inhale)
  const [cycle, setCycle] = useState(1)
  const [paused, setPaused] = useState(false)
  const [done, setDone] = useState(false)

  const currentPhase = PHASE_ORDER[phaseIdx]
  const meta = PHASE_META[currentPhase]

  useEffect(() => {
    if (done || paused) return
    const tick = setInterval(() => {
      setSecondsInPhase(s => {
        if (s > 1) return s - 1
        // Phase termine, passe à la suivante
        setPhaseIdx(idx => {
          const nextIdx = (idx + 1) % PHASE_ORDER.length
          if (nextIdx === 0) {
            // cycle complet
            setCycle(c => {
              if (c >= CYCLES_TOTAL) {
                setDone(true)
                return c
              }
              return c + 1
            })
          }
          return nextIdx
        })
        return 0 // reset, will be set by phase change effect
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [done, paused])

  // Reset compteur au changement de phase
  useEffect(() => {
    setSecondsInPhase(PHASE_DURATIONS[PHASE_ORDER[phaseIdx]])
  }, [phaseIdx])

  const handleSuccess = async () => {
    try {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('craving_count')
          .eq('id', user.id)
          .single()
        if (profile) {
          await supabase
            .from('profiles')
            .update({ craving_count: (profile.craving_count || 0) + 1 })
            .eq('id', user.id)
        }
      }
      navigate(-1)
    } catch {
      navigate(-1)
    }
  }

  // Écran de fin
  if (done) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-8 py-12 relative overflow-hidden"
        style={{
          background: 'radial-gradient(120% 80% at 50% 30%, #3a2218 0%, #1a0e08 50%, #050302 100%)',
          color: 'var(--color-pv-ivory)',
        }}
      >
        <SOSGrain />
        <div className="relative z-10 flex flex-col items-center" style={{ animation: 'fadeInUp 0.6s ease' }}>
          <p className="eyebrow text-pv-ochre" style={{ letterSpacing: '0.32em' }}>Vous l'avez traversée</p>
          <h1
            className="display-italic mt-6"
            style={{ fontSize: 56, lineHeight: 1.05, color: 'var(--color-pv-ivory)' }}
          >
            L'envie<br/>est passée.
          </h1>
          <p className="text-base text-pv-ivory/70 mt-6 leading-relaxed max-w-xs">
            Vous venez de gagner une victoire silencieuse. Aucun mérite n'est plus durable que celui qu'on accumule chaque jour.
          </p>
          <button onClick={handleSuccess} className="btn-primary mt-10 max-w-xs">
            J'ai tenu
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-pv-ivory/50 text-sm mt-4 p-2"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden flex flex-col"
      style={{
        background: 'radial-gradient(120% 80% at 50% 30%, #3a2218 0%, #1a0e08 50%, #050302 100%)',
        color: 'var(--color-pv-ivory)',
      }}
    >
      <SOSGrain />

      {/* Header */}
      <header
        className="relative z-10 flex items-center justify-between px-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)', paddingBottom: 16 }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Quitter"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-100"
          style={{ border: '1px solid rgba(246,241,232,0.25)', color: 'rgba(246,241,232,0.7)' }}
        >
          <X size={14} strokeWidth={1.5} />
        </button>
        <span
          className="text-pv-ivory/50 font-semibold"
          style={{ fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase' }}
        >
          Cycle {String(cycle).padStart(2, '0')} / {String(CYCLES_TOTAL).padStart(2, '0')}
        </span>
        <button
          onClick={() => setPaused(p => !p)}
          aria-label={paused ? 'Reprendre' : 'Pause'}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity"
          style={{ border: '1px solid rgba(246,241,232,0.25)', color: 'rgba(246,241,232,0.7)' }}
        >
          {paused ? <Play size={14} strokeWidth={1.5} /> : <Pause size={14} strokeWidth={1.5} />}
        </button>
      </header>

      {/* Centre : orbe + chiffre */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-8">
        <p
          className="text-pv-ochre font-semibold"
          style={{ fontSize: 10, letterSpacing: '0.32em', textTransform: 'uppercase' }}
        >
          {meta.eyebrow}
        </p>

        <div className="relative" style={{ width: 260, height: 260, marginTop: 28, marginBottom: 28 }}>
          {/* Cercles concentriques */}
          <div className="absolute rounded-full" style={{ inset: -42, border: '0.5px solid rgba(246,241,232,0.08)' }} />
          <div className="absolute rounded-full" style={{ inset: -20, border: '0.5px solid rgba(246,241,232,0.12)' }} />
          {/* Orbe qui respire */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 0,
              background: 'radial-gradient(60% 60% at 35% 30%, rgba(203,128,2,0.4), rgba(184,72,42,0.4) 55%, rgba(80,30,18,0.7) 100%)',
              boxShadow: '0 0 80px rgba(184,72,42,0.3), inset 0 0 60px rgba(0,0,0,0.5), inset 6px 6px 30px rgba(255,220,200,0.18)',
              animation: paused ? 'none' : 'sosBreathe 19s ease-in-out infinite',
            }}
          />
          {/* Chiffre central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display tabular"
              style={{
                fontSize: 100,
                fontWeight: 400,
                color: 'var(--color-pv-ivory)',
                letterSpacing: '-0.02em',
                textShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            >
              {secondsInPhase}
            </span>
          </div>
        </div>

        <p className="display-italic" style={{ fontSize: 22, lineHeight: 1.35, maxWidth: 260 }}>
          {meta.sub}
        </p>

        <p className="text-pv-ivory/50 text-xs leading-relaxed mt-8" style={{ maxWidth: 280 }}>
          L'envie passera. Elle dure rarement plus de trois minutes — votre souffle la traverse.
        </p>
      </main>

      {/* Indicateur de cycles en bas */}
      <footer className="relative z-10 pb-8 flex justify-center gap-2">
        {Array.from({ length: CYCLES_TOTAL }).map((_, i) => (
          <span
            key={i}
            className="rounded-full transition-all duration-500"
            style={{
              width: i + 1 === cycle ? 22 : 6,
              height: 6,
              background: i < cycle ? 'var(--color-pv-ochre)' : 'rgba(246,241,232,0.18)',
            }}
          />
        ))}
      </footer>

      <style>{`
        @keyframes sosBreathe {
          0%, 100% { transform: scale(0.78); }
          21%      { transform: scale(1); }
          58%      { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

/** Texture de grain (cuir / papier brûlé). */
function SOSGrain() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")",
        mixBlendMode: 'overlay',
        opacity: 0.5,
      }}
    />
  )
}
