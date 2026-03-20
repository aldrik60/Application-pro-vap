import React, { useEffect, useState } from 'react'
import { BadgeCard } from '../components/BadgeCard'
import { supabase } from '../lib/supabase'
import { Badge } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { differenceInDays } from 'date-fns'

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
        if (data) setBadges(data as Badge[])
        setLoading(false)
      })
  }, [])

  const unlockedCount = badges.filter(b => daysSmokeFree >= b.day_threshold).length
  const progressPercent = badges.length > 0 ? (unlockedCount / badges.length) * 100 : 0

  if (loading) {
    return <div className="page p-4 flex justify-center items-center"><div className="w-8 h-8 border-2 border-[#B8482A] border-t-transparent rounded-full animate-spin"></div></div>
  }

  return (
    <div className="page p-4 pb-24">
      <header className="mb-8 mt-2 text-center">
        <h1 className="text-3xl font-display text-[#B8482A] tracking-wider mb-2">MES BADGES</h1>
        <p className="text-[#686868] text-sm">Collectionnez vos victoires</p>
      </header>

      {/* Overview Progress */}
      <div className="card p-4 mb-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[#F1F1F1] font-medium">Progression globale</span>
          <span className="text-xl font-bold font-display tracking-widest text-[#CB8002]">
            {unlockedCount} / {badges.length}
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill-gold" style={{ width: `${progressPercent}%` }} />
        </div>
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
