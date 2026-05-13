import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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
          {/* Onde la plus extérieure — respiration lente du décor */}
          <div
            className="absolute rounded-full"
            style={{
              inset: -72,
              border: '0.5px solid rgba(246,241,232,0.05)',
              animation: paused ? 'none' : 'sosRingFar 19s ease-in-out infinite',
            }}
          />
          {/* Cercle médian */}
          <div
            className="absolute rounded-full"
            style={{
              inset: -42,
              border: '0.5px solid rgba(246,241,232,0.09)',
              animation: paused ? 'none' : 'sosRingMid 19s ease-in-out infinite',
            }}
          />
          {/* Cercle proche, teinté ochre */}
          <div
            className="absolute rounded-full"
            style={{
              inset: -16,
              border: '1px solid rgba(203,128,2,0.18)',
              animation: paused ? 'none' : 'sosRingNear 19s ease-in-out infinite',
            }}
          />

          {/* Halo lumineux flou qui s'expand */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: -30,
              background:
                'radial-gradient(circle, rgba(203,128,2,0.35) 0%, rgba(184,72,42,0.18) 45%, transparent 75%)',
              filter: 'blur(24px)',
              animation: paused ? 'none' : 'sosHaloPulse 19s ease-in-out infinite',
            }}
          />

          {/* Onde d'énergie qui se propage (radial expansion) */}
          {!paused && (
            <div
              key={`wave-${cycle}-${phaseIdx}`}
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: 0,
                border: '1px solid rgba(203,128,2,0.6)',
                animation: 'sosWave 2.4s ease-out forwards',
              }}
            />
          )}

          {/* Orbe principal qui respire */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 0,
              background:
                'radial-gradient(60% 60% at 35% 30%, rgba(203,128,2,0.55), rgba(184,72,42,0.48) 55%, rgba(80,30,18,0.8) 100%)',
              boxShadow:
                '0 0 100px rgba(184,72,42,0.45), inset 0 0 60px rgba(0,0,0,0.5), inset 6px 6px 30px rgba(255,220,200,0.22)',
              animation: paused ? 'none' : 'sosBreathe 19s ease-in-out infinite',
            }}
          />

          {/* Reflet intérieur qui rotation lente */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              inset: 12,
              background:
                'conic-gradient(from 0deg, transparent 0%, rgba(255,220,200,0.12) 25%, transparent 50%, rgba(203,128,2,0.1) 75%, transparent 100%)',
              mixBlendMode: 'overlay',
              animation: paused ? 'none' : 'sosShimmer 12s linear infinite',
            }}
          />

          {/* Chiffre central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              key={`num-${currentPhase}-${secondsInPhase}`}
              className="font-display tabular"
              style={{
                fontSize: 100,
                fontWeight: 400,
                color: 'var(--color-pv-ivory)',
                letterSpacing: '-0.02em',
                textShadow: '0 4px 24px rgba(0,0,0,0.5), 0 0 30px rgba(203,128,2,0.3)',
                animation: paused ? 'none' : 'sosNumberPop 1s ease-out',
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
        /* Cycle 4-7-8 = 19s. Phases: 0→21% inhale, 21→58% hold, 58→100% exhale */
        @keyframes sosBreathe {
          0%   { transform: scale(0.7);  filter: brightness(0.72) saturate(0.85); }
          21%  { transform: scale(1.04); filter: brightness(1.28) saturate(1.18); }
          58%  { transform: scale(1.00); filter: brightness(1.05) saturate(1.00); }
          100% { transform: scale(0.7);  filter: brightness(0.72) saturate(0.85); }
        }
        @keyframes sosHaloPulse {
          0%   { opacity: 0.35; transform: scale(0.88); }
          21%  { opacity: 0.95; transform: scale(1.12); }
          58%  { opacity: 0.65; transform: scale(1.04); }
          100% { opacity: 0.35; transform: scale(0.88); }
        }
        @keyframes sosRingNear {
          0%, 100% { transform: scale(0.94); opacity: 0.55; }
          21%      { transform: scale(1.08); opacity: 1; }
          58%      { transform: scale(1.04); opacity: 0.82; }
        }
        @keyframes sosRingMid {
          0%, 100% { transform: scale(0.96); opacity: 0.5; }
          21%      { transform: scale(1.05); opacity: 0.9; }
          58%      { transform: scale(1.03); opacity: 0.7; }
        }
        @keyframes sosRingFar {
          0%, 100% { transform: scale(0.98); opacity: 0.35; }
          21%      { transform: scale(1.03); opacity: 0.7; }
          58%      { transform: scale(1.02); opacity: 0.55; }
        }
        @keyframes sosWave {
          0%   { transform: scale(1);   opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes sosShimmer {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes sosNumberPop {
          0%   { transform: scale(0.85); opacity: 0.4; filter: blur(2px); }
          30%  { transform: scale(1.06); opacity: 1;   filter: blur(0); }
          100% { transform: scale(1);    opacity: 1;   filter: blur(0); }
        }
        @keyframes fadeInUp {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sos-no-motion, .sos-no-motion * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
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
