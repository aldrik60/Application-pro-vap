import React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Award, User, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

/* Icônes custom du design — line icons sobres */

const VapeIcon = ({ size = 20, stroke = 1.4 }: { size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="9" width="18" height="6" rx="2"/>
    <path d="M21 12h2"/>
    <path d="M7 9V7M11 9V6M15 9V7"/>
  </svg>
)

const SosIcon = ({ size = 22, stroke = 1.6 }: { size?: number; stroke?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const tabClass = (isActive: boolean) =>
  `relative flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors ${
    isActive ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
  }`

const ActiveDot = () => (
  <span className="absolute top-1 w-1 h-1 rounded-full bg-pv-terracotta" />
)

export function BottomNav() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const sosActive = location.pathname === '/sos'

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-1/2 z-50 bg-bg border-t border-line flex items-stretch w-full"
      style={{
        height: 'calc(78px + env(safe-area-inset-bottom))',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        maxWidth: 480,
        transform: 'translateX(-50%)',
      }}
    >
      <NavLink to="/" end className={({ isActive }) => tabClass(isActive)} aria-label="Accueil">
        {({ isActive }) => (
          <>
            <Home size={20} strokeWidth={1.4} />
            <span className="text-[11px]" style={{ letterSpacing: '0.08em', fontWeight: 500 }}>Accueil</span>
            {isActive && <ActiveDot />}
          </>
        )}
      </NavLink>

      <NavLink to="/badges" className={({ isActive }) => tabClass(isActive)} aria-label="Étapes">
        {({ isActive }) => (
          <>
            <Award size={20} strokeWidth={1.4} />
            <span className="text-[11px]" style={{ letterSpacing: '0.08em', fontWeight: 500 }}>Étapes</span>
            {isActive && <ActiveDot />}
          </>
        )}
      </NavLink>

      {/* SOS central, surélevé */}
      <div className="flex-1 flex justify-center relative">
        <button
          onClick={() => navigate('/sos')}
          aria-label="SOS — j'ai une envie"
          aria-pressed={sosActive}
          className="absolute top-[-18px] w-14 h-14 rounded-full transition-transform active:scale-95"
          style={{
            background: 'var(--color-pv-terracotta)',
            border: '1.5px solid rgba(246,241,232,0.18)',
            boxShadow: '0 8px 24px rgba(184,72,42,0.45), inset 0 1px 0 rgba(255,255,255,0.18)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-pv-ivory)',
            padding: 0,
          }}
        >
          <SosIcon size={22} stroke={1.6} />
          <span className="text-[10px] font-semibold mt-0.5" style={{ letterSpacing: '0.16em' }}>SOS</span>
        </button>
      </div>

      <NavLink to="/parcours" className={({ isActive }) => tabClass(isActive)} aria-label="Vape">
        {({ isActive }) => (
          <>
            <VapeIcon size={20} stroke={1.4} />
            <span className="text-[11px]" style={{ letterSpacing: '0.08em', fontWeight: 500 }}>Vape</span>
            {isActive && <ActiveDot />}
          </>
        )}
      </NavLink>

      <NavLink to="/profil" className={({ isActive }) => tabClass(isActive)} aria-label="Profil">
        {({ isActive }) => (
          <>
            <User size={20} strokeWidth={1.4} />
            <span className="text-[11px]" style={{ letterSpacing: '0.08em', fontWeight: 500 }}>Profil</span>
            {isActive && <ActiveDot />}
          </>
        )}
      </NavLink>

      {profile?.role === 'admin' && (
        <NavLink to="/admin" className={({ isActive }) => tabClass(isActive)} aria-label="Administration">
          {({ isActive }) => (
            <>
              <Settings size={20} strokeWidth={1.4} />
              <span className="text-[11px]" style={{ letterSpacing: '0.08em', fontWeight: 500 }}>Admin</span>
              {isActive && <ActiveDot />}
            </>
          )}
        </NavLink>
      )}
    </nav>
  )
}
