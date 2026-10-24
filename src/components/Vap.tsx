import React from 'react'

/**
 * Vap — la mascotte Pro'Vap.
 * 6 stades qui évoluent avec le parcours du sevrage.
 * Une illustration SVG par stade (public/assets/vap), posée sur une scène
 * qui s'ouvre au fil de la progression.
 */

export type VapStage = 1 | 2 | 3 | 4 | 5 | 6

export interface VapStageMeta {
  id: VapStage
  day: number
  title: string
  sub: string
}

// eslint-disable-next-line react-refresh/only-export-components
export const VAP_STAGES: VapStageMeta[] = [
  { id: 1, day: 0,   title: 'Le départ',       sub: 'Un jour à la fois.' },
  { id: 2, day: 1,   title: 'Premier souffle', sub: 'La fumée commence à se lever.' },
  { id: 3, day: 7,   title: 'Sur ses pieds',   sub: "Une semaine pleine. Le rythme s'installe." },
  { id: 4, day: 30,  title: 'En marche',       sub: 'Un mois. Le corps reprend ses droits.' },
  { id: 5, day: 90,  title: "L'ascension",     sub: 'Trois mois. Le souffle est libre.' },
  { id: 6, day: 365, title: 'Au sommet',       sub: 'Un an sans tabac. Vous êtes le pilier.' },
]

/**
 * Détermine le stade courant à partir du nombre de jours sans tabac.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function vapStageFromDays(days: number): VapStage {
  let stage: VapStage = 1
  for (const s of VAP_STAGES) {
    if (days >= s.day) stage = s.id
  }
  return stage
}

interface VapProps {
  stage?: VapStage
  size?: number
  withScene?: boolean
  className?: string
}

const TER  = '#a2371a'  // terracotta brique (charte site)
const OCH  = '#d4623f'  // terracotta clair — accents de scène

// Une illustration par stade. Elles ont la même hauteur mais pas la même
// largeur : object-fit les centre dans la boîte, pieds en bas.
const VAP_IMAGES: Record<VapStage, string> = {
  1: '/assets/vap/vap-1-premier-jour.svg',
  2: '/assets/vap/vap-2-premier-souffle.svg',
  3: '/assets/vap/vap-3-sur-ses-pieds.svg',
  4: '/assets/vap/vap-4-en-marche.svg',
  5: '/assets/vap/vap-5-ascension.svg',
  6: '/assets/vap/vap-6-au-sommet.svg',
}

// Zone de la boîte (viewBox 200 × 240) occupée par l'illustration : les pieds
// touchent y = 214, juste au-dessus de l'ombre.
const ART_TOP = 8
const ART_BOTTOM = 214

export function Vap({ stage = 3, size = 200, withScene = false, className = '' }: VapProps) {
  const w = size
  const h = size * 1.2 // 240 / 200

  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'block', flexShrink: 0, width: w, height: h }}
      role="img"
      aria-label={`Vap : ${VAP_STAGES[stage - 1].title}`}
    >
      <svg
        viewBox="0 0 200 240"
        width={w}
        height={h}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        aria-hidden
      >
        <defs>
          <radialGradient id={`vap-smoke-${stage}`} cx="50%" cy="60%" r="50%">
            <stop offset="0%"   stopColor="rgba(147, 142, 135, 0.55)" />
            <stop offset="100%" stopColor="rgba(147, 142, 135, 0)" />
          </radialGradient>
          <linearGradient id={`vap-sky-${stage}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor={OCH} stopOpacity="0.35" />
            <stop offset="100%" stopColor={TER} stopOpacity="0" />
          </linearGradient>
        </defs>

        {withScene && <VapScene stage={stage} />}
        <VapShadow stage={stage} />
      </svg>
      <img
        src={VAP_IMAGES[stage]}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          left: 0,
          top: `${(ART_TOP / 240) * 100}%`,
          width: '100%',
          height: `${((ART_BOTTOM - ART_TOP) / 240) * 100}%`,
          objectFit: 'contain',
          objectPosition: '50% 100%',
        }}
      />
    </span>
  )
}

function VapShadow({ stage }: { stage: VapStage }) {
  // Pas d'ombre à l'escalade (5) ni dans le transat (6) : il n'est pas posé au sol.
  if (stage > 4) return null
  const widths: Record<number, number> = { 1: 40, 2: 40, 3: 40, 4: 48 }
  const cx: Record<number, number> = { 1: 112, 2: 112, 3: 110, 4: 103 }
  return (
    <ellipse cx={cx[stage]} cy={ART_BOTTOM + 1} rx={widths[stage]} ry="4" fill="rgba(0, 0, 0, 0.4)" />
  )
}

function VapScene({ stage }: { stage: VapStage }) {
  if (stage === 1) {
    return (
      <g>
        <circle cx="60" cy="120" r="36" fill={`url(#vap-smoke-${stage})`} />
        <circle cx="140" cy="140" r="42" fill={`url(#vap-smoke-${stage})`} />
        <circle cx="100" cy="80" r="30" fill={`url(#vap-smoke-${stage})`} />
      </g>
    )
  }
  if (stage === 2) {
    return (
      <g>
        <circle cx="160" cy="70" r="28" fill={`url(#vap-smoke-${stage})`} opacity="0.7" />
        <circle cx="40" cy="90" r="24" fill={`url(#vap-smoke-${stage})`} opacity="0.5" />
      </g>
    )
  }
  if (stage === 3) {
    return (
      <line x1="20" y1="170" x2="180" y2="170"
        stroke={TER} strokeWidth="0.6" strokeOpacity="0.3" strokeDasharray="2 4" />
    )
  }
  if (stage === 4) {
    return (
      <g>
        <circle cx="160" cy="80" r="32" fill={`url(#vap-sky-${stage})`} />
        <circle cx="160" cy="80" r="8" fill={OCH} opacity="0.4" />
      </g>
    )
  }
  // Stades 5 et 6 : le rocher et le transat sont déjà dans l'illustration,
  // la scène se limite au soleil.
  if (stage === 5) {
    return <circle cx="150" cy="70" r="28" fill={OCH} opacity="0.3" />
  }
  if (stage === 6) {
    return (
      <g>
        <circle cx="100" cy="60" r="40" fill={OCH} opacity="0.35" />
        <circle cx="100" cy="60" r="14" fill={OCH} opacity="0.6" />
      </g>
    )
  }
  return null
}
