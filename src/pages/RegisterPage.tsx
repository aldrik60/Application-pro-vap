import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ProVapLogo } from '../components/ProVapLogo'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (!acceptTerms) {
      toast.error('Vous devez accepter la politique de confidentialité.')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) throw error
      toast.success('Compte créé. Bienvenue.')
      navigate('/')
    } catch (error) {
      const raw = error instanceof Error ? error.message : ''
      const lower = raw.toLowerCase()
      let message = "Une erreur s'est produite"
      if (lower.includes('already registered') || lower.includes('already in use') || lower.includes('user already')) {
        message = 'Un compte existe déjà avec cette adresse email.'
      } else if (lower.includes('invalid') && lower.includes('email')) {
        message = 'Adresse email invalide.'
      } else if (lower.includes('password') && (lower.includes('short') || lower.includes('at least'))) {
        message = 'Mot de passe trop court (minimum 8 caractères).'
      } else if (lower.includes('password') && lower.includes('character')) {
        message = 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.'
      } else if (lower.includes('rate limit') || lower.includes('too many')) {
        message = 'Trop de tentatives. Patientez quelques minutes.'
      } else if (lower.includes('weak') || lower.includes('compromis') || lower.includes('pwned')) {
        message = 'Ce mot de passe a déjà été divulgué dans une fuite de données. Choisissez-en un autre.'
      }
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '32px 28px' }}>
      <header className="flex justify-center">
        <ProVapLogo height={22} />
      </header>

      <div className="flex-1 flex flex-col justify-center pt-6">
        <div className="text-center mb-8">
          <span className="eyebrow text-gold-text">Bienvenue</span>
          <h1
            className="display mt-3 text-ink"
            style={{ fontSize: 28 }}
          >
            Votre aventure <span className="display-italic">commence ici.</span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="register-name" className="eyebrow block mb-2">Prénom ou pseudo</label>
            <input
              id="register-name"
              type="text"
              className="input text-base"
              placeholder="Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={loading}
              autoComplete="given-name"
              required
            />
          </div>

          <div>
            <label htmlFor="register-email" className="eyebrow block mb-2">Adresse email</label>
            <input
              id="register-email"
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
            <label htmlFor="register-password" className="eyebrow block mb-2">Mot de passe</label>
            <input
              id="register-password"
              type="password"
              className="input text-base tracking-widest"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="text-[12px] text-ink-3 mt-1.5 leading-relaxed">
              8 caractères minimum, avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial.
            </p>
          </div>

          <label className="flex items-start gap-3 text-xs text-ink-3 leading-relaxed">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
              disabled={loading}
              className="mt-0.5 accent-[var(--color-pv-terracotta)] w-5 h-5 shrink-0"
            />
            <span>
              J'ai lu et j'accepte la{' '}
              <Link to="/mentions-legales" className="text-gold-text hover:underline" target="_blank" rel="noopener noreferrer">
                politique de confidentialité
              </Link>{' '}
              et les mentions légales. Je confirme être majeur(e).
            </span>
          </label>

          <button type="submit" className="btn-primary mt-2" disabled={loading || !acceptTerms}>
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4 items-center">
        <p className="text-center text-sm text-ink-3">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-gold-text font-semibold hover:underline">
            Se connecter
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
