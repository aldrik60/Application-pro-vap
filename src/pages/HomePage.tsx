import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, Trophy } from 'lucide-react'
import { CircularProgress } from '../components/CircularProgress'
import { StatCard } from '../components/StatCard'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { differenceInHours } from 'date-fns'

const HEALTH_MILESTONES = [
  { day: 0, hours: 0.33, label: '20 minutes', description: 'Rythme cardiaque normalisé' },
  { day: 0, hours: 8, label: '8 heures', description: 'CO éliminé du sang' },
  { day: 1, hours: 0, label: 'J+1', description: 'Premier souffle plus léger' },
  { day: 3, hours: 0, label: 'J+3', description: 'Goût et odorat en réveil' },
  { day: 7, hours: 0, label: 'J+7', description: 'Une semaine de liberté' },
  { day: 14, hours: 0, label: 'J+14', description: 'Circulation sanguine améliorée' },
  { day: 21, hours: 0, label: 'J+21', description: 'Habitude qui se forme' },
  { day: 30, hours: 0, label: 'J+30', description: 'Poumons en récupération active' },
  { day: 45, hours: 0, label: 'J+45', description: 'Énergie retrouvée' },
  { day: 60, hours: 0, label: 'J+60', description: 'Capacité respiratoire +10%' },
  { day: 75, hours: 0, label: 'J+75', description: 'Système immunitaire renforcé' },
  { day: 90, hours: 0, label: 'J+90', description: 'Dépendance physique terminée' },
  { day: 120, hours: 0, label: 'J+120', description: 'Risque cardiovasculaire en baisse' },
  { day: 180, hours: 0, label: 'J+180', description: 'Poumons nettoyés à 50%' },
  { day: 270, hours: 0, label: 'J+270', description: 'Infections divisées par 2' },
  { day: 365, hours: 0, label: '1 an', description: 'Risque coronarien divisé par 2' },
  { day: 545, hours: 0, label: '18 mois', description: 'Risque cancer divisé par 3' },
  { day: 730, hours: 0, label: '2 ans', description: 'Poumons comme non-fumeur' },
  { day: 1095, hours: 0, label: '3 ans', description: 'Liberté totale' },
  { day: 1825, hours: 0, label: '5 ans', description: 'Risque cardiovasculaire normalisé' },
]

function getNextMilestone(totalHours: number) {
  for (const m of HEALTH_MILESTONES) {
    const milestoneHours = m.day * 24 + m.hours
    if (totalHours < milestoneHours) {
      const hoursLeft = milestoneHours - totalHours
      const daysLeft = Math.floor(hoursLeft / 24)
      const hrsLeft = Math.round(hoursLeft % 24)
      return { ...m, daysLeft, hrsLeft }
    }
  }
  return null
}

export function HomePage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [dailyMessage, setDailyMessage] = useState('Chaque jour est une nouvelle victoire. Continuez ainsi !')

  const quitDate = profile?.quit_date ? new Date(profile.quit_date) : null
  const now = new Date()

  const totalHours = quitDate ? Math.max(0, differenceInHours(now, quitDate)) : 0
  const daysSmokeFree = Math.floor(totalHours / 24)
  const hoursSmokeFree = totalHours % 24

  // Stats calculations
  const cigsAvoided = daysSmokeFree * (profile?.cigarettes_per_day || 0)
  const moneySaved = daysSmokeFree * ((profile?.pack_price || 0) / 20) * (profile?.cigarettes_per_day || 0)
  const kitPrice = profile?.kit_price || 0
  const netSavings = moneySaved - kitPrice

  const lifeGainedMin = cigsAvoided * 11
  const lifeGainedHours = Math.floor(lifeGainedMin / 60)
  const lifeGainedDays = Math.floor(lifeGainedHours / 24)

  // Progress ring: cycles every 30 days
  const progressPercent = Math.min(100, ((daysSmokeFree % 30) / 30) * 100)

  // Reward progress
  const rewardCost = profile?.reward_amount || 0
  const rewardProgress = rewardCost > 0 ? Math.min(100, (Math.max(0, netSavings) / rewardCost) * 100) : 0

  // Next milestone
  const nextMilestone = getNextMilestone(totalHours)

  useEffect(() => {
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
        <div className="text-6xl mb-6">🌱</div>
        <h2 className="font-display text-3xl text-[#F1F1F1] mb-4">
          BIENVENUE {profile?.name?.toUpperCase()} !
        </h2>
        <p className="text-[#686868] mb-8 leading-relaxed">
          Pour commencer votre suivi de sevrage, veuillez configurer votre profil et indiquer votre date d'arrêt.
        </p>
        <button className="btn-primary" onClick={() => navigate('/profil')}>
          Configurer mon profil
        </button>
      </div>
    )
  }

  return (
    <div className="page p-4 pb-32 space-y-5">
      <header className="flex justify-between items-center mt-2">
        <h1 className="font-display text-3xl text-[#CB8002] tracking-wide">PRO'VAP SEVRAGE</h1>
        <button className="p-2.5 rounded-full bg-[#1E1E22] border border-[#2E2E32] text-[#F1F1F1] transition-transform active:scale-95">
          <Bell size={20} />
        </button>
      </header>

      {/* Progress Ring */}
      <div className="flex flex-col items-center justify-center py-4">
        <CircularProgress progress={progressPercent} size={220} strokeWidth={16}>
          <span className="font-display text-6xl text-[#F1F1F1] leading-none mb-1">{daysSmokeFree}</span>
          <span className="text-sm text-[#686868] font-medium uppercase tracking-wider">
            {daysSmokeFree === 1 ? 'Jour' : 'Jours'}
          </span>
          {hoursSmokeFree > 0 && (
            <span className="text-xs text-[#B8482A] font-bold mt-1">ET {hoursSmokeFree}H</span>
          )}
        </CircularProgress>
      </div>

      {/* Daily Motivation */}
      <div className="card p-4 accent-left border-[#B8482A] bg-[rgba(184,72,42,0.05)]">
        <p className="text-[10px] text-[#B8482A] font-bold uppercase tracking-wider mb-2">
          Message du jour {daysSmokeFree <= 90 ? `J+${daysSmokeFree}` : ''}
        </p>
        <p className="text-[#F1F1F1] text-sm leading-relaxed italic">"{dailyMessage}"</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Cigarettes évitées"
          value={cigsAvoided}
          unit="cig."
          textColorClass="text-[#F1F1F1]"
        />
        <StatCard
          label="Économies brutes"
          value={moneySaved.toFixed(2)}
          unit="€"
          textColorClass="text-[#CB8002]"
        />
      </div>
      <div className="grid grid-cols-1">
        <StatCard
          label="Vie regagnée"
          value={lifeGainedDays > 0 ? `${lifeGainedDays}j ${lifeGainedHours % 24}h` : `${lifeGainedHours}h`}
          textColorClass="text-[#B8482A]"
        />
      </div>

      {/* Kit Amortization Card */}
      {kitPrice > 0 && (
        <div className="card p-4">
          <p className="text-[10px] text-[#686868] font-bold uppercase tracking-wider mb-3">
            Kit Pro'Vap — Amortissement
          </p>
          {netSavings < 0 ? (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#F1F1F1]">
                  Kit amorti dans{' '}
                  <span className="font-bold text-[#B8482A]">
                    {Math.ceil(Math.abs(netSavings) / ((profile.pack_price || 10) / 20 * (profile.cigarettes_per_day || 10)))} jours
                  </span>
                </span>
                <span className="text-xs text-[#C0392B] font-semibold">{netSavings.toFixed(2)}€</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, (moneySaved / kitPrice) * 100)}%`, backgroundColor: '#C0392B' }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-[#2D9B55] font-semibold">Kit amorti ! 🎉</span>
                <span className="text-sm font-bold text-[#2D9B55]">+{netSavings.toFixed(2)}€</span>
              </div>
              <div className="progress-track">
                <div className="h-full rounded-full bg-[#2D9B55] transition-all" style={{ width: '100%' }} />
              </div>
              <p className="text-xs text-[#686868] mt-2">
                Bénéfice net : <span className="text-[#2D9B55] font-semibold">{netSavings.toFixed(2)}€</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Next Health Milestone */}
      {nextMilestone && (
        <div className="card p-4 accent-left bg-[rgba(203,128,2,0.03)]">
          <div className="flex items-start gap-3">
            <Trophy size={20} className="text-[#CB8002] mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-[#686868] font-bold uppercase tracking-wider mb-1">
                Prochain jalon de santé
              </p>
              <p className="text-[#F1F1F1] font-semibold text-sm">{nextMilestone.description}</p>
              <p className="text-xs text-[#CB8002] mt-1">
                Dans{' '}
                {nextMilestone.daysLeft > 0
                  ? `${nextMilestone.daysLeft} jour${nextMilestone.daysLeft > 1 ? 's' : ''}${nextMilestone.hrsLeft > 0 ? ` et ${nextMilestone.hrsLeft}h` : ''}`
                  : `${nextMilestone.hrsLeft} heure${nextMilestone.hrsLeft > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reward Progress */}
      {profile.reward_name && profile.reward_amount && (
        <div className="card p-4">
          <div className="flex justify-between items-end mb-3">
            <div>
              <span className="block text-[10px] text-[#686868] font-bold uppercase tracking-wider mb-1">
                Objectif Plaisir
              </span>
              <span className="block text-[#F1F1F1] font-semibold">{profile.reward_name}</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-[#CB8002]">{Math.max(0, Math.floor(netSavings))}€</span>
              <span className="text-xs text-[#686868]"> / {profile.reward_amount}€</span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill-gold" style={{ width: `${rewardProgress}%` }} />
          </div>
          {rewardProgress < 100 && (
            <p className="text-xs text-[#686868] mt-2">
              Dans {Math.ceil((profile.reward_amount - Math.max(0, netSavings)) / ((profile.pack_price || 10) / 20 * (profile.cigarettes_per_day || 10)))} jours vous pourrez vous l'offrir
            </p>
          )}
        </div>
      )}

      {/* SOS Button */}
      <Link to="/sos" className="block mt-2">
        <button className="flex items-center justify-center gap-3 w-full bg-[#C0392B] text-white rounded-[14px] py-5 font-display text-2xl tracking-wider shadow-[0_4px_14px_rgba(192,57,43,0.39)] transition-transform active:scale-95">
          <AlertTriangle size={24} />
          J'AI UNE ENVIE !
        </button>
      </Link>
    </div>
  )
}
