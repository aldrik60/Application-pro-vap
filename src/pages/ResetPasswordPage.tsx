import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ProVapLogo } from '../components/ProVapLogo'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Le mot de passe doit faire au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      toast.error('Les mots de passe ne correspondent pas.')
      return
    }
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Mot de passe mis à jour.')
      navigate('/', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-bg p-6">
        <p className="text-ink-3 text-sm">Vérification du lien…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '32px 28px' }}>
      <header className="flex justify-center">
        <ProVapLogo height={22} />
      </header>

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <span className="eyebrow text-gold-text">Sécurisé</span>
          <h1
            className="display mt-3 text-ink"
            style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Nouveau <span className="display-italic">mot de passe.</span>
          </h1>
          <p className="text-sm text-ink-2 mt-4 leading-relaxed max-w-[320px] mx-auto">
            Choisissez un mot de passe d'au moins 8 caractères.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="eyebrow block mb-2">Nouveau mot de passe</label>
            <input
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
          </div>
          <div>
            <label className="eyebrow block mb-2">Confirmer</label>
            <input
              type="password"
              className="input text-base tracking-widest"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? 'Mise à jour…' : 'Mettre à jour'}
          </button>
        </form>
      </div>
    </div>
  )
}
