import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const SHOPS = [
  'Noyon', 'Compiègne', 'Clermont', 'Nogent-sur-Oise', 'Breteuil', 'Beauvais', 'Ferrières-en-Bray'
]

const SHOP_PHONES: Record<string, string> = {
  'Noyon': '03 44 44 44 44',
  'Compiègne': '03 44 44 44 44',
  'Clermont': '03 44 44 44 44',
  'Nogent-sur-Oise': '03 44 44 44 44',
  'Breteuil': '03 44 44 44 44',
  'Beauvais': '03 44 44 44 44',
  'Ferrières-en-Bray': '03 44 44 44 44'
}

export function ProfilePage() {
  const { profile, user, refreshProfile, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  
  // Local state for forms
  const [formData, setFormData] = useState({
    quit_date: profile?.quit_date || '',
    cigarettes_per_day: profile?.cigarettes_per_day || 0,
    pack_price: profile?.pack_price || 0,
    preferred_shop: profile?.preferred_shop || '',
    reward_name: profile?.reward_name || '',
    reward_amount: profile?.reward_amount || ''
  })

  // Date states for split dropdowns (for better mobile UX than native date picker sometimes)
  // Simplified for this implementation to use native date for quick prototyping
  // A real split dropdown would require 3 selects and a parsing logic

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSave = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { error } = await supabase.from('profiles').update({
        quit_date: formData.quit_date || null,
        cigarettes_per_day: parseInt(formData.cigarettes_per_day.toString()) || 0,
        pack_price: parseFloat(formData.pack_price.toString()) || 0,
        preferred_shop: formData.preferred_shop || null,
        reward_name: formData.reward_name || null,
        reward_amount: parseFloat(formData.reward_amount.toString()) || null,
      }).eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      toast.success('Profil mis à jour !')
    } catch (e: any) {
      toast.error('Erreur lors de la mise à jour.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page p-4 pb-24 space-y-8">
      <header className="flex justify-between items-center mt-2">
        <h1 className="text-3xl font-display text-[#B8482A] tracking-wider mb-2">MON PROFIL</h1>
        <div className="w-12 h-12 bg-[#CB8002] rounded-full flex items-center justify-center text-[#1E1E22] font-display text-2xl shadow-lg border-2 border-[#1E1E22]">
          {profile?.name?.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Settings Form */}
      <section className="card p-5 space-y-5">
        <h2 className="text-lg font-semibold text-[#F1F1F1] mb-2">Mes Informations</h2>
        
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">Date d'arrêt total</label>
            <input 
              type="date" 
              name="quit_date"
              className="input w-full" 
              value={formData.quit_date}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">Cig. par jour</label>
              <input 
                type="number" 
                name="cigarettes_per_day"
                className="input" 
                min="0"
                value={formData.cigarettes_per_day}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">Prix du paquet (€)</label>
              <input 
                type="number" 
                step="0.1"
                name="pack_price"
                className="input" 
                value={formData.pack_price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">Boutique Pro'Vap</label>
            <select 
              name="preferred_shop" 
              className="input" 
              value={formData.preferred_shop}
              onChange={handleChange}
            >
              <option value="">Choisir une boutique</option>
              {SHOPS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Reward Settings */}
      <section className="card p-5 space-y-5">
        <h2 className="text-lg font-semibold text-[#CB8002] mb-2">Mon Objectif Plaisir</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">Quel cadeau ?</label>
            <input 
              type="text" 
              name="reward_name"
              placeholder="Ex: Voyage, Console de jeu..."
              className="input" 
              value={formData.reward_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs text-[#686868] mb-1.5 ml-1 uppercase tracking-wider font-semibold">Quel montant ? (€)</label>
            <input 
              type="number" 
              name="reward_amount"
              className="input" 
              placeholder="Ex: 500"
              value={formData.reward_amount}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <button onClick={handleSave} className="btn-primary" disabled={loading}>
        {loading ? 'Sauvegarde...' : 'Enregistrer mon profil'}
      </button>

      {/* Counselor Section */}
      {formData.preferred_shop && (
        <section className="card p-5 bg-gradient-to-br from-[#1E1E22] to-[rgba(184,72,42,0.1)] border-[#B8482A]/30 mt-8">
          <h2 className="text-lg font-semibold text-[#F1F1F1] mb-1">Mon Conseiller Pro'Vap</h2>
          <p className="text-sm text-[#CB8002] mb-4">Boutique de {formData.preferred_shop}</p>
          
          <div className="flex gap-3">
            <a 
              href={`tel:${SHOP_PHONES[formData.preferred_shop]}`}
              className="flex-1 btn-secondary text-center flex items-center justify-center gap-2"
            >
              Appeler
            </a>
            <button className="flex-1 btn-primary">
              Rendez-vous
            </button>
          </div>
        </section>
      )}

      <div className="pt-8 w-full border-t border-[#2E2E32] mt-8 flex flex-col gap-4">
        <button className="w-full text-center text-[#F1F1F1] text-sm py-3 border border-[#2E2E32] rounded-xl hover:bg-[#2E2E32]">
          Refaire le test de Fagerström
        </button>
        <button onClick={signOut} className="w-full text-center text-[#C0392B] text-sm py-3 font-medium">
          Me déconnecter
        </button>
      </div>
    </div>
  )
}
