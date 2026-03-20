import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInAsDemo } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      
      toast.success('Bon retour parmi nous !')
      navigate(from, { replace: true })
    } catch (error: any) {
      toast.error(error.message === 'Invalid login credentials' ? 'Identifiants incorrects' : 'Une erreur s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = () => {
    signInAsDemo()
    toast.success('Mode démo activé !')
    navigate(from, { replace: true })
  }

  return (
    <div className="page p-6 flex flex-col justify-center min-h-screen pb-6 bg-[#28282D]">
      <div className="absolute top-10 left-0 w-full flex justify-center">
        <div className="w-24 h-24 bg-[#1E1E22] rounded-full border border-[#2E2E32] flex items-center justify-center p-4">
          {/* Logo placeholder - replace with actual icon if available */}
          <span className="font-display text-4xl text-[#B8482A]">PV</span>
        </div>
      </div>

      <div className="text-center mb-10 mt-16">
        <h1 className="font-display text-5xl text-[#B8482A] mb-2">PRO'VAP SEVRAGE</h1>
        <p className="text-[#686868]">Votre compagnon vers la liberté</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-[#F1F1F1] mb-2 font-medium">Adresse Email</label>
          <input 
            type="email" 
            className="input text-lg" 
            placeholder="vous@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm text-[#F1F1F1] mb-2 font-medium">Mot de passe</label>
          <input 
            type="password" 
            className="input text-lg tracking-widest" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? 'Connexion en cours...' : 'Se connecter'}
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#2E2E32]"></div>
          <span className="flex-shrink-0 mx-4 text-[#686868] text-sm font-medium">OU</span>
          <div className="flex-grow border-t border-[#2E2E32]"></div>
        </div>

        <button type="button" onClick={handleDemo} className="btn-secondary" disabled={loading}>
          Naviguer en mode Démo
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-[#686868]">
        Pas encore de compte ?{' '}
        <Link to="/register" className="text-[#CB8002] font-semibold hover:underline">
          Créer un compte
        </Link>
      </div>
    </div>
  )
}
