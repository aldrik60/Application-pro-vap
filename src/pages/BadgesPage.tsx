import { useEffect, useState } from 'react'
import { BadgeCard } from '../components/BadgeCard'
import { supabase } from '../lib/supabase'
import { Badge } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { differenceInDays } from 'date-fns'

const STATIC_BADGES: Omit<Badge, 'id'>[] = [
  { day_threshold: 1,    title: 'Premier souffle',   description: 'Rythme cardiaque normalisé',         icon: '💨' },
  { day_threshold: 3,    title: '72h de liberté',    description: 'CO éliminé du sang',                  icon: '🩸' },
  { day_threshold: 7,    title: 'Une semaine',        description: 'Goût et odorat qui reviennent',       icon: '👃' },
  { day_threshold: 14,   title: 'Deux semaines',      description: 'Circulation améliorée',               icon: '❤️' },
  { day_threshold: 21,   title: 'Trois semaines',     description: 'Habitude qui se forme',               icon: '🧠' },
  { day_threshold: 30,   title: 'Un mois',            description: 'Poumons en récupération',             icon: '🫁' },
  { day_threshold: 45,   title: '45 jours',           description: 'Énergie retrouvée',                   icon: '⚡' },
  { day_threshold: 60,   title: 'Deux mois',          description: 'Capacité respiratoire +10%',          icon: '🏃' },
  { day_threshold: 75,   title: '75 jours',           description: 'Système immunitaire renforcé',        icon: '🛡️' },
  { day_threshold: 90,   title: 'Trois mois',         description: 'Dépendance physique terminée',        icon: '🔓' },
  { day_threshold: 120,  title: '4 mois',             description: 'Risque cardiovasculaire en baisse',   icon: '💪' },
  { day_threshold: 180,  title: '6 mois',             description: 'Poumons nettoyés à 50%',              icon: '✨' },
  { day_threshold: 270,  title: '9 mois',             description: 'Infections divisées par 2',           icon: '🦠' },
  { day_threshold: 365,  title: 'Un an',              description: 'Risque coronarien divisé par 2',      icon: '🏆' },
  { day_threshold: 545,  title: '18 mois',            description: 'Risque cancer divisé par 3',          icon: '🌟' },
  { day_threshold: 730,  title: '2 ans',              description: 'Poumons comme non-fumeur',            icon: '🫧' },
  { day_threshold: 1095, title: '3 ans',              description: 'Liberté totale',                      icon: '🕊️' },
  { day_threshold: 1825, title: '5 ans',              description: 'Risque cardiovasculaire normalisé',   icon: '🎊' },
]

export function BadgesPage() {
  const { profile } = useAuth()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)

  const daysSmokeFree = profile?.quit_date
    ? Math.max(0, differenceInDays(new Date(), new Date(profile.quit_date)))
    : 0

  useEffect(() => {
    supabase.from('badges')
      .select('*')
      .order('day_threshold', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setBadges(data as Badge[])
        } else {
          // Fallback: use static badges with synthetic IDs
          setBadges(STATIC_BADGES.map((b, i) => ({ ...b, id: String(i) })))
        }
        setLoading(false)
      })
  }, [])

  const unlockedCount = badges.filter(b => daysSmokeFree >= b.day_threshold).length
  const progressPercent = badges.length > 0 ? (unlockedCount / badges.length) * 100 : 0

  if (loading) {
    return (
      <div className="page p-4 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-[#B8482A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="page p-4 pb-24">
      <header className="mb-6 mt-2 text-center">
        <h1 className="text-3xl font-display text-[#B8482A] tracking-wider mb-1">MES BADGES</h1>
        <p className="text-[#686868] text-sm">Collectionnez vos victoires de santé</p>
      </header>

      {/* Progress Overview */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#F1F1F1] font-medium text-sm">Progression globale</span>
          <span className="text-xl font-bold font-display tracking-widest text-[#CB8002]">
            {unlockedCount} / {badges.length}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill-gold" style={{ width: `${progressPercent}%` }} />
        </div>
        {unlockedCount > 0 && (
          <p className="text-xs text-[#686868] mt-2">
            Prochain badge dans{' '}
            {(() => {
              const next = badges.find(b => daysSmokeFree < b.day_threshold)
              if (!next) return 'tous débloqués !'
              const diff = next.day_threshold - daysSmokeFree
              return `${diff} jour${diff > 1 ? 's' : ''}`
            })()}
          </p>
        )}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {badges.map(badge => (
          <BadgeCard
            key={badge.id}
            badge={badge}
            unlocked={daysSmokeFree >= badge.day_threshold}
          />
        ))}
      </div>
    </div>
  )
}
