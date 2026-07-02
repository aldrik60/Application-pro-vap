import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ProVapLogo } from '../components/ProVapLogo'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
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
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Bon retour parmi nous')
      navigate(from, { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      toast.error(message === 'Invalid login credentials' ? 'Identifiants incorrects' : "Une erreur s'est produite")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '32px 28px' }}>
      <header className="flex justify-center">
        <ProVapLogo height={22} />
      </header>

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <span className="eyebrow text-gold-text">Bon retour</span>
          <h1
            className="display mt-3 text-ink"
            style={{ fontSize: 40, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Pro'Vap <span className="display-italic">Sevrage</span>
          </h1>
          <p className="display-italic text-ink-2 mt-3" style={{ fontSize: 16 }}>
            Votre compagnon vers la liberté
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="login-email" className="eyebrow block mb-2">Adresse email</label>
            <input
              id="login-email"
              type="email"
              className="input text-base"
              placeholder="vous@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="eyebrow block mb-2">Mot de passe</label>
            <input
              id="login-password"
              type="password"
              className="input text-base tracking-widest"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>

          <Link
            to="/forgot-password"
            className="text-center text-sm text-ink-3 hover:text-gold-text transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </form>
      </div>

      <div className="flex flex-col gap-4 items-center">
        <p className="text-center text-sm text-ink-3">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-gold-text font-semibold hover:underline">
            Créer un compte
          </Link>
        </p>
        <Link
          to="/mentions-legales"
          className="text-center text-[11px] text-ink-3 hover:text-ink-2 transition-colors"
          style={{ letterSpacing: '0.08em' }}
        >
          Mentions légales · Politique de confidentialité
        </Link>
      </div>
    </div>
  )
}
