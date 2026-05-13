import React from 'react'

/**
 * Vap — la mascotte Pro'Vap.
 * 6 stades qui évoluent avec le parcours du sevrage.
 * Silhouettes éditoriales terracotta + ocre, sans visage, poses parlantes,
 * scène qui s'ouvre au fil de la progression.
 *
 * Direction artistique : Apple × Hermès (cuir, papier, intention).
 * Port du composant design Claude Design (project/vap.jsx).
 */

export type VapStage = 1 | 2 | 3 | 4 | 5 | 6

export interface VapStageMeta {
  id: VapStage
  day: number
  title: string
  sub: string
}

export const VAP_STAGES: VapStageMeta[] = [
  { id: 1, day: 0,   title: 'Le départ',       sub: 'Le premier jour est le plus dur.' },
  { id: 2, day: 1,   title: 'Premier souffle', sub: 'La fumée commence à se lever.' },
  { id: 3, day: 7,   title: 'Sur ses pieds',   sub: "Une semaine pleine. Le rythme s'installe." },
  { id: 4, day: 30,  title: 'En marche',       sub: 'Un mois. Le corps reprend ses droits.' },
  { id: 5, day: 90,  title: "L'ascension",     sub: 'Trois mois. Le souffle est libre.' },
  { id: 6, day: 365, title: 'Au sommet',       sub: 'Un an sans tabac. Vous êtes le pilier.' },
]

/**
 * Détermine le stade courant à partir du nombre de jours sans tabac.
 */
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

const TER  = '#b8482a'  // terracotta — corps
const OCH  = '#cb8002'  // ocre — chapeau, accents
const CHAR = '#28282d'  // outline / shadow

export function Vap({ stage = 3, size = 200, withScene = false, className = '' }: VapProps) {
  const w = size
  const h = size * 1.2 // 240 / 200

  return (
    <svg
      className={className}
      viewBox="0 0 200 240"
      width={w}
      height={h}
      style={{ overflow: 'visible' }}
      role="img"
      aria-label={`Vap — ${VAP_STAGES[stage - 1].title}`}
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
      {renderPose(stage)}
      <VapShadow stage={stage} />
    </svg>
  )
}

function VapShadow({ stage }: { stage: VapStage }) {
  const widths: Record<VapStage, number> = { 1: 24, 2: 28, 3: 32, 4: 34, 5: 32, 6: 30 }
  const cx: Record<VapStage, number> = { 1: 102, 2: 100, 3: 100, 4: 102, 5: 122, 6: 100 }
  return (
    <ellipse cx={cx[stage]} cy="216" rx={widths[stage]} ry="4" fill="rgba(0, 0, 0, 0.4)" />
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
  if (stage === 5) {
    return (
      <g>
        <circle cx="150" cy="70" r="28" fill={OCH} opacity="0.3" />
        <path d="M-10 200 L 40 160 L 70 175 L 110 130 L 150 165 L 210 145 L 210 220 L -10 220 Z"
          fill={CHAR} opacity="0.25" />
        <path d="M-10 210 L 50 180 L 90 200 L 140 175 L 210 200 L 210 220 L -10 220 Z"
          fill={TER} opacity="0.18" />
      </g>
    )
  }
  if (stage === 6) {
    return (
      <g>
        <circle cx="100" cy="60" r="40" fill={OCH} opacity="0.35" />
        <circle cx="100" cy="60" r="14" fill={OCH} opacity="0.6" />
        <path d="M-10 220 L 40 200 L 80 215 L 100 100 L 120 215 L 160 200 L 210 220 Z"
          fill={CHAR} opacity="0.4" />
      </g>
    )
  }
  return null
}

function renderPose(stage: VapStage) {
  switch (stage) {
    case 1: return <PoseHunched  />
    case 2: return <PoseStanding />
    case 3: return <PoseLooking  />
    case 4: return <PoseWalking  />
    case 5: return <PoseClimbing />
    case 6: return <PoseSummit   />
    default: return <PoseStanding />
  }
}

/* ─── Stade 1 : voûté sur un tabouret, cigarette à la main ───────────────── */
function PoseHunched() {
  return (
    <g>
      {/* Tabouret */}
      <rect x="78" y="178" width="44" height="6" rx="1" fill={CHAR} opacity="0.6" />
      <line x1="84" y1="184" x2="84" y2="208" stroke={CHAR} strokeWidth="2" strokeOpacity="0.6" />
      <line x1="116" y1="184" x2="116" y2="208" stroke={CHAR} strokeWidth="2" strokeOpacity="0.6" />
      {/* Jambes assises */}
      <path d="M 90 178 L 84 210 M 110 178 L 116 210" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      {/* Torse voûté */}
      <path d="M 80 130 Q 78 160, 90 178 L 110 178 Q 122 160, 120 130 Z" fill={TER} />
      {/* Tête penchée */}
      <circle cx="100" cy="116" r="20" fill={TER} />
      {/* Bonnet */}
      <path d="M 80 114 Q 82 92, 100 90 Q 118 92, 120 114 Z" fill={OCH} />
      <path d="M 80 114 L 120 114" stroke={CHAR} strokeWidth="1.2" strokeOpacity="0.4" />
      {/* Bras tenant la cigarette */}
      <path d="M 122 144 Q 138 150, 148 142" stroke={TER} strokeWidth="9" strokeLinecap="round" fill="none" />
      {/* Cigarette */}
      <rect x="148" y="138" width="14" height="2" rx="1" fill="#fff" />
      <rect x="160" y="138" width="3" height="2" fill={OCH} />
      <circle cx="163" cy="139" r="1.4" fill={TER} />
      {/* Fumée */}
      <path d="M 164 138 Q 168 124, 162 112 Q 158 100, 168 90"
        stroke="#938e87" strokeWidth="1.2" fill="none" opacity="0.7" />
    </g>
  )
}

/* ─── Stade 2 : debout, légèrement voûté ─────────────────────────────────── */
function PoseStanding() {
  return (
    <g>
      <path d="M 92 180 L 88 210 M 108 180 L 112 210" stroke={TER} strokeWidth="11" strokeLinecap="round" />
      <path d="M 82 130 Q 80 165, 90 180 L 110 180 Q 120 165, 118 130 Z" fill={TER} />
      <path d="M 82 134 L 78 168" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <path d="M 118 134 L 122 168" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <circle cx="100" cy="116" r="22" fill={TER} />
      <path d="M 79 113 Q 81 86, 100 84 Q 119 86, 121 113 Z" fill={OCH} />
      <ellipse cx="100" cy="85" rx="3" ry="2" fill={CHAR} opacity="0.4" />
      <path d="M 79 113 L 121 113" stroke={CHAR} strokeWidth="1.2" strokeOpacity="0.4" />
    </g>
  )
}

/* ─── Stade 3 : debout droit, regard devant ──────────────────────────────── */
function PoseLooking() {
  return (
    <g>
      <path d="M 92 178 L 90 210 M 108 178 L 110 210" stroke={TER} strokeWidth="11" strokeLinecap="round" />
      <path d="M 82 124 Q 82 160, 90 180 L 110 180 Q 118 160, 118 124 Z" fill={TER} />
      <path d="M 81 130 L 78 168" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <path d="M 119 130 L 122 168" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <circle cx="100" cy="108" r="22" fill={TER} />
      <path d="M 79 106 Q 81 78, 100 76 Q 119 78, 121 106 Z" fill={OCH} />
      <circle cx="100" cy="76" r="4" fill={CHAR} opacity="0.65" />
      <path d="M 79 106 L 121 106" stroke={CHAR} strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M 100 80 Q 96 50, 104 30" stroke={OCH} strokeWidth="1" fill="none" opacity="0.5" strokeDasharray="2 3" />
    </g>
  )
}

/* ─── Stade 4 : marche, écharpe au vent ─────────────────────────────────── */
function PoseWalking() {
  return (
    <g>
      <path d="M 88 178 L 80 212" stroke={TER} strokeWidth="11" strokeLinecap="round" />
      <path d="M 112 178 L 124 210" stroke={TER} strokeWidth="11" strokeLinecap="round" />
      <path d="M 80 124 Q 82 158, 90 180 L 112 180 Q 120 156, 118 122 Z" fill={TER} />
      <path d="M 80 134 L 70 168" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <path d="M 120 132 L 138 154" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <circle cx="102" cy="108" r="22" fill={TER} />
      <path d="M 81 106 Q 83 78, 102 76 Q 121 78, 123 106 Z" fill={OCH} />
      <circle cx="102" cy="76" r="4" fill={CHAR} opacity="0.65" />
      <path d="M 81 106 L 123 106" stroke={CHAR} strokeWidth="1.2" strokeOpacity="0.4" />
      <path d="M 86 122 Q 78 138, 70 132 L 72 144 L 80 138" fill={OCH} />
    </g>
  )
}

/* ─── Stade 5 : escalade ─────────────────────────────────────────────────── */
function PoseClimbing() {
  return (
    <g>
      <path d="M 90 198 L 130 198 L 150 212 L 70 212 Z" fill={CHAR} opacity="0.45" />
      <path d="M 130 198 L 170 178 L 200 196 L 200 212 L 130 212 Z" fill={CHAR} opacity="0.6" />
      <path d="M 108 174 L 102 198" stroke={TER} strokeWidth="11" strokeLinecap="round" />
      <path d="M 130 172 Q 140 184, 138 198" stroke={TER} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M 100 116 Q 104 150, 112 176 L 132 174 Q 132 144, 124 116 Z" fill={TER} />
      <path d="M 116 122 Q 134 100, 148 84" stroke={TER} strokeWidth="9" strokeLinecap="round" fill="none" />
      <circle cx="150" cy="82" r="5" fill={TER} />
      <path d="M 102 128 L 92 156" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <circle cx="118" cy="98" r="20" fill={TER} />
      <path d="M 100 100 Q 100 76, 118 72 Q 138 74, 138 96 Z" fill={OCH} />
      <circle cx="119" cy="73" r="4" fill={CHAR} opacity="0.65" />
    </g>
  )
}

/* ─── Stade 6 : sommet, bras levés, drapeau Pro'Vap ──────────────────────── */
function PoseSummit() {
  return (
    <g>
      <path d="M 70 210 L 130 210 L 138 196 L 62 196 Z" fill={CHAR} opacity="0.7" />
      <path d="M 88 174 L 78 196" stroke={TER} strokeWidth="11" strokeLinecap="round" />
      <path d="M 112 174 L 122 196" stroke={TER} strokeWidth="11" strokeLinecap="round" />
      <path d="M 84 118 Q 80 152, 88 178 L 112 178 Q 120 152, 116 118 Z" fill={TER} />
      <path d="M 86 124 L 60 78" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <path d="M 114 124 L 140 78" stroke={TER} strokeWidth="9" strokeLinecap="round" />
      <circle cx="60" cy="78" r="6" fill={TER} />
      <circle cx="140" cy="78" r="6" fill={TER} />
      <circle cx="100" cy="102" r="22" fill={TER} />
      <path d="M 79 100 Q 81 72, 100 70 Q 119 72, 121 100 Z" fill={OCH} />
      <circle cx="100" cy="68" r="5" fill={CHAR} opacity="0.7" />
      <path d="M 79 100 L 121 100" stroke={CHAR} strokeWidth="1.2" strokeOpacity="0.4" />
      <line x1="140" y1="78" x2="138" y2="44" stroke={CHAR} strokeWidth="1.6" />
      <path d="M 138 44 L 160 50 L 138 56 Z" fill={OCH} />
      <text x="142" y="54" fontFamily="Cormorant Garamond, serif" fontSize="7"
        fill={CHAR} fontStyle="italic" fontWeight="500">P</text>
    </g>
  )
}
