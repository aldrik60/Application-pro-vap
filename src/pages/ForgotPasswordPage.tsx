import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { ChevronLeft } from 'lucide-react'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Veuillez entrer votre adresse email.')
      return
    }
    try {
      setLoading(true)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      // Confidentialité : on confirme dans tous les cas.
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg" style={{ padding: '32px 28px' }}>
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 text-ink-3 text-sm hover:text-ink transition-colors self-start"
      >
        <ChevronLeft size={18} /> Retour à la connexion
      </button>

      <div className="flex-1 flex flex-col justify-center pt-10">
        <div className="text-center mb-8">
          <span className="eyebrow text-pv-ochre">Sans souci</span>
          <h1
            className="display mt-3 text-ink"
            style={{ fontSize: 36, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            Mot de passe <span className="display-italic">oublié.</span>
          </h1>
          <p className="text-sm text-ink-2 mt-4 leading-relaxed max-w-[320px] mx-auto">
            Entrez votre adresse email — nous vous enverrons un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="card p-7 text-center">
            <div className="display-italic text-pv-ochre mb-2" style={{ fontSize: 28 }}>
              C'est envoyé.
            </div>
            <p className="text-sm text-ink-2 leading-relaxed mb-5">
              Si un compte existe avec cette adresse, un email contenant un lien de réinitialisation vient d'être envoyé. Pensez à vérifier vos spams.
            </p>
            <Link to="/login" className="btn-primary inline-flex max-w-[280px]">
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="eyebrow block mb-2">Adresse email</label>
              <input
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
            <button type="submit" className="btn-primary mt-2" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer le lien'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
