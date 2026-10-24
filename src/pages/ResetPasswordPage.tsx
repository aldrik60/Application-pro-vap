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
  const [expired, setExpired] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Lien expiré ou déjà utilisé : Supabase renvoie une erreur dans l'adresse
    const params = `${window.location.hash} ${window.location.search}`
    if (params.includes('error=') || params.includes('error_code=')) setExpired(true)

    let isReady = false
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { isReady = true; setReady(true) }
    })
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { isReady = true; setReady(true) }
    })
    // Sans session au bout de 8 secondes, le lien n'est plus valable
    const t = setTimeout(() => { if (!isReady) setExpired(true) }, 8000)
    return () => { subscription.unsubscribe(); clearTimeout(t) }
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
      const raw = error instanceof Error ? error.message : ''
      toast.error(/different from the old/i.test(raw)
        ? "Choisissez un mot de passe différent de l'ancien."
        : /weak|characters|should contain/i.test(raw)
          ? 'Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.'
          : 'La mise à jour n\'a pas abouti. Réessayez ou demandez un nouveau lien.')
    } finally {
      setLoading(false)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-bg p-6 gap-4">
        {expired ? (
          <>
            <p className="text-ink font-semibold">Ce lien a expiré ou a déjà servi.</p>
            <p className="text-ink-3 text-sm max-w-xs leading-relaxed">
              Demandez un nouveau lien : il arrive par e-mail en quelques minutes.
            </p>
            <button className="btn-primary max-w-xs" onClick={() => navigate('/forgot-password', { replace: true })}>
              Recevoir un nouveau lien
            </button>
          </>
        ) : (
          <p className="text-ink-3 text-sm">Vérification du lien…</p>
        )}
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
            style={{ fontSize: 28 }}
          >
            Nouveau <span className="display-italic">mot de passe.</span>
          </h1>
          <p className="text-sm text-ink-2 mt-4 leading-relaxed max-w-[320px] mx-auto">
            Au moins 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="reset-password" className="eyebrow block mb-2">Nouveau mot de passe</label>
            <input
              id="reset-password"
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
            <label htmlFor="reset-confirm" className="eyebrow block mb-2">Confirmer</label>
            <input
              id="reset-confirm"
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
