import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle } from 'lucide-react'
import { CircularProgress } from '../components/CircularProgress'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { differenceInDays, differenceInHours } from 'date-fns'
import toast from 'react-hot-toast'

export function HomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [dailyMessage, setDailyMessage] = useState('Chaque jour est une nouvelle victoire. Continuez ainsi !')
  
  const quitDate = profile?.quit_date ? new Date(profile.quit_date) : null
  const now = new Date()
  
  const daysSmokeFree = quitDate ? Math.max(0, differenceInDays(now, quitDate)) : 0
  const hoursSmokeFree = quitDate ? Math.max(0, differenceInHours(now, quitDate)) % 24 : 0
  
  // Stats calculations
  const cigsAvoided = daysSmokeFree * (profile?.cigarettes_per_day || 0)
  const moneySaved = daysSmokeFree * ((profile?.pack_price || 0) / 20) * (profile?.cigarettes_per_day || 0)
  const lifeGainedMin = cigsAvoided * 11
  const lifeGainedHours = Math.floor(lifeGainedMin / 60)
  const lifeGainedDays = Math.floor(lifeGainedHours / 24)
  
  // Progress Ring: Cap at 365 days, or just cycle 100% per month to keep it dynamic
  const progressPercent = Math.min(100, (daysSmokeFree / 30) * 100) 
  
  // Reward progress
  const rewardCost = profile?.reward_amount || 0
  const rewardProgress = rewardCost > 0 ? Math.min(100, (moneySaved / rewardCost) * 100) : 0

  useEffect(() => {
    // Fetch daily message
    if (daysSmokeFree > 0 && daysSmokeFree <= 90) {
      supabase.from('daily_messages')
        .select('message')
        .eq('day_number', daysSmokeFree)
        .single()
        .then(({ data }) => {
          if (data) setDailyMessage(data.message)
        })
    }
  }, [daysSmokeFree])

  if (!profile?.quit_date) {
    return (
      <div className="page p-6 flex flex-col items-center justify-center text-center">
        <h2 className="font-display text-3xl text-[#F1F1F1] mb-4">BIENVENUE {profile?.name?.toUpperCase()} !</h2>
        <p className="text-[#686868] mb-8">Pour commencer votre suivi, veuillez configurer votre profil et indiquer votre date d'arrêt.</p>
        <button className="btn-primary" onClick={() => navigate('/profil')}>
          Configurer mon profil
        </button>
      </div>
    )
  }

  return (
    <div className="page p-4 pb-24 space-y-6">
      <header className="flex justify-between items-center mt-2">
        <h1 className="font-display text-3xl text-[#CB8002] tracking-wide">PRO'VAP SEVRAGE</h1>
        <button className="p-2.5 rounded-full bg-[#1E1E22] border border-[#2E2E32] text-[#F1F1F1] transition-transform active:scale-95">
          <Bell size={20} />
        </button>
      </header>
      
      {/* Progress Ring */}
      <div className="flex flex-col items-center justify-center py-6">
        <CircularProgress progress={progressPercent} size={220} strokeWidth={16}>
          <span className="font-display text-6xl text-[#F1F1F1] leading-none mb-1">{daysSmokeFree}</span>
          <span className="text-sm text-[#686868] font-medium uppercase tracking-wider">Jours</span>
          {hoursSmokeFree > 0 && (
            <span className="text-xs text-[#B8482A] font-bold mt-1">ET {hoursSmokeFree} HEURES</span>
          )}
        </CircularProgress>
      </div>

      {/* Daily Motivation Card */}
      <div className="card p-4 bg-gradient-to-r from-[rgba(184,72,42,0.1)] to-transparent border-[#B8482A]/30">
        <p className="text-[#F1F1F1] text-sm leading-relaxed italic">
          "{dailyMessage}"
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          label="Évitées" 
          value={cigsAvoided} 
          unit="cig." 
          textColorClass="text-[#F1F1F1]"
        />
        <StatCard 
          label="Économies" 
          value={moneySaved.toFixed(2)} 
          unit="€" 
          textColorClass="text-[#CB8002]"
        />
      </div>
      <div className="grid grid-cols-1">
        <StatCard 
          label="Vie regagnée" 
          value={lifeGainedDays > 0 ? `${lifeGainedDays}j ${lifeGainedHours%24}h` : `${lifeGainedHours}h`} 
          textColorClass="text-[#B8482A]"
        />
      </div>

      {/* Reward Progress */}
      {profile.reward_name && profile.reward_amount && (
        <div className="card p-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="block text-xs text-[#686868] font-medium uppercase tracking-wider mb-1">Objectif Plaisir</span>
              <span className="block text-[#F1F1F1] font-semibold">{profile.reward_name}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-[#CB8002]">{Math.floor(moneySaved)}€</span>
              <span className="text-xs text-[#686868]"> / {profile.reward_amount}€</span>
            </div>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill-gold" 
              style={{ width: `${rewardProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* SOS Button */}
      <Link to="/sos" className="block mt-6">
        <button className="flex items-center justify-center gap-3 w-full bg-[#C0392B] text-white rounded-xl py-5 font-display text-2xl tracking-wider shadow-[0_4px_14px_rgba(192,57,43,0.39)] transition-transform active:scale-95 animate-pulse-ring">
          <AlertTriangle size={24} />
          J'AI UNE ENVIE !
        </button>
      </Link>
    </div>
  )
}
