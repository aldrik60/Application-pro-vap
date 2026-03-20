import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Profile } from '../types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
  signInAsDemo: () => void
}

const mockDemoUser = { id: 'demo-user-123', email: 'demo@provap.fr' } as User
const mockDemoProfile: Profile = {
  id: 'demo-user-123',
  email: 'demo@provap.fr',
  name: 'Utilisateur Démo',
  role: 'admin',
  quit_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  cigarettes_per_day: 15,
  pack_price: 10.50,
  preferred_shop: 'Compiègne',
  fagerstrom_score: 5,
  reward_name: 'Console de jeu',
  reward_amount: 500,
  craving_count: 3,
  created_at: new Date().toISOString()
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
  signInAsDemo: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo] = useState(false)

  const fetchProfile = async (userId: string) => {
    if (isDemo) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
  }

  const refreshProfile = async () => {
    if (isDemo) return
    if (user) await fetchProfile(user.id)
  }

  const signOut = async () => {
    if (isDemo) {
      setIsDemo(false)
      setUser(null)
      setProfile(null)
      return
    }
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const signInAsDemo = () => {
    setIsDemo(true)
    setUser(mockDemoUser)
    setProfile(mockDemoProfile)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut, signInAsDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
