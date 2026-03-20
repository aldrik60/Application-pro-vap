import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !name) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          }
        }
      })
      if (error) throw error
      
      toast.success('Compte créé avec succès ! Bienvenue.')
      navigate('/')
    } catch (error: any) {
      toast.error(error.message || 'Une erreur s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page p-6 flex flex-col justify-center min-h-screen pb-6">
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl text-[#B8482A] mb-2">REJOINDRE PRO'VAP</h1>
        <p className="text-[#686868]">Votre aventure commence ici</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-[#F1F1F1] mb-2 font-medium">Prénom ou Pseudo</label>
          <input 
            type="text" 
            className="input text-lg" 
            placeholder="Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

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
          {loading ? 'Création en cours...' : 'Créer mon compte'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-[#686868]">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-[#CB8002] font-semibold hover:underline">
          Se connecter
        </Link>
      </div>
    </div>
  )
}
