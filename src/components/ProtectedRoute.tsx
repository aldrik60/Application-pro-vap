import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

function Spinner() {
  return <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
}

// Profil pas encore lu : on attend, puis on propose de réessayer. Jamais d'écran
// « indiquez votre date d'arrêt » trompeur, ni de formulaire vide qui écraserait tout.
function ProfileWaiting() {
  const { profileError, refreshProfile, signOut } = useAuth()
  const [slow, setSlow] = useState(false)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(t)
  }, [])

  if (!profileError && !slow) {
    return <div className="page flex items-center justify-center"><Spinner /></div>
  }

  return (
    <div className="page p-6 min-h-screen flex flex-col items-center justify-center text-center gap-4">
      <p className="text-ink font-semibold">Connexion indisponible</p>
      <p className="text-ink-3 text-sm max-w-xs leading-relaxed">
        Vos données sont en sécurité. Elles s'afficheront dès que le réseau sera de retour.
      </p>
      <button
        className="btn-primary max-w-xs"
        disabled={retrying}
        onClick={async () => { setRetrying(true); await refreshProfile(); setRetrying(false) }}
      >
        {retrying ? 'Connexion…' : 'Réessayer'}
      </button>
      <button className="text-ink-3 text-sm underline" style={{ minHeight: 44 }} onClick={() => signOut()}>
        Me déconnecter
      </button>
    </div>
  )
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!profile) {
    return <ProfileWaiting />
  }

  if (requireAdmin && profile.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Onboarding : rediriger les nouveaux utilisateurs qui n'ont pas encore vu les écrans d'introduction.
  // On évite la boucle si on est déjà sur /onboarding.
  if (
    profile.onboarding_completed === false &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
