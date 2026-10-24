import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { unsubscribeUserFromPush } from '../lib/pushNotifications'
import { Profile } from '../types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  // Vrai quand la lecture du profil a échoué (réseau coupé, serveur injoignable) :
  // à distinguer d'un compte sans profil.
  profileError: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileError: false,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (error) { setProfileError(true); return }
      setProfileError(false)
      if (data) setProfile(data as Profile)
    } catch {
      setProfileError(true)
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  const signOut = async () => {
    // Détache cet appareil du compte : sinon, sur un téléphone partagé, la
    // personne suivante recevrait les notifications de ce compte.
    try { await unsubscribeUserFromPush() } catch { /* on déconnecte quand même */ }
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setProfileError(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    // On ne relit le profil qu'à la connexion ou après une modification du compte :
    // le renouvellement de session (toutes les heures) ne doit pas effacer une saisie en cours.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) { setProfile(null); return }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') fetchProfile(session.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileError, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
