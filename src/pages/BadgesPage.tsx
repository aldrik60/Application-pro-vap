import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { differenceInDays } from 'date-fns'
import { Vap, vapStageFromDays, VAP_STAGES, VapStage } from '../components/Vap'
import { Modal } from '../components/Modal'
import { Check, Lock } from 'lucide-react'

/**
 * Étapes — timeline des stades de Vap.
 * Le visiteur voit son Vap actuel grand, puis la timeline des 6 stades en-dessous.
 * Sous chaque stade, la liste des badges qui s'y rattachent.
 */

function badgesForStage(stage: VapStage, badges: Badge[]): Badge[] {
  const current = VAP_STAGES[stage - 1]
  const next = VAP_STAGES.find(s => s.id > stage)
  const maxDay = next?.day ?? Infinity
  return badges.filter(b => b.day_threshold >= current.day && b.day_threshold < maxDay)
}

export function BadgesPage() {
  const { profile } = useAuth()
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  const daysSmokeFree = profile?.quit_date
    ? Math.max(0, differenceInDays(new Date(), new Date(profile.quit_date)))
    : 0

  const currentStage = vapStageFromDays(daysSmokeFree)

  useEffect(() => {
    supabase.from('badges')
      .select('*')
      .order('day_threshold', { ascending: true })
      .then(({ data }) => {
        if (data) setBadges(data as Badge[])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="page flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-pv-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const unlockedBadges = badges.filter(b => daysSmokeFree >= b.day_threshold)
  const nextBadge = badges.find(b => b.day_threshold > daysSmokeFree)

  return (
    <div className="page pb-32">
      {/* Header */}
      <header className="px-6 pt-6">
        <span className="eyebrow">Votre parcours</span>
        <h1 className="display text-ink mt-2" style={{ fontSize: 36 }}>
          Vos <span className="display-italic">étapes</span>
        </h1>
        <p className="text-sm text-ink-3 mt-2 leading-relaxed">
          Chaque palier fait grandir <span className="display-italic text-ink-2">Vap</span>, votre compagnon.
        </p>
      </header>

      {/* Vap actuel centré */}
      <section
        className="mt-5 py-6 flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(180deg, transparent, var(--color-bg-elev) 30%, var(--color-bg-elev) 70%, transparent)',
        }}
      >
        <Vap stage={currentStage} size={180} withScene />
        <p className="script text-flame-text mt-2" style={{ fontSize: 26 }}>
          {VAP_STAGES[currentStage - 1].title}
        </p>
        <p className="text-[12px] text-ink-3 mt-1" style={{ letterSpacing: '0.12em' }}>
          STADE {currentStage} SUR 6 · JOUR {daysSmokeFree}
        </p>
        <p className="text-xs text-ink-3 mt-3 max-w-[280px] leading-relaxed">
          {VAP_STAGES[currentStage - 1].sub}
        </p>
      </section>

      {/* Badges débloqués / prochain */}
      <section className="px-6 pt-6">
        <div className="flex justify-between items-center">
          <span className="eyebrow">Vos collections</span>
          <span className="font-display tabular text-gold-text" style={{ fontSize: 18, fontWeight: 500 }}>
            {unlockedBadges.length}<span className="display-italic text-ink-3 text-sm"> / {badges.length}</span>
          </span>
        </div>
        <div className="progress-track mt-3">
          <div className="progress-fill-gold" style={{ width: `${(unlockedBadges.length / Math.max(1, badges.length)) * 100}%` }} />
        </div>
        {nextBadge && (
          <p className="text-xs text-ink-3 mt-2">
            Prochain badge dans {nextBadge.day_threshold - daysSmokeFree} jour{nextBadge.day_threshold - daysSmokeFree > 1 ? 's' : ''} · <span className="display-italic text-ink-2">« {nextBadge.title} »</span>
          </p>
        )}
      </section>

      {/* Timeline des stades */}
      <section className="px-5 mt-6">
        {VAP_STAGES.map((s, i) => {
          const unlocked = i < currentStage
          const current = i === currentStage - 1
          const stageBadges = badgesForStage(s.id, badges)
          const stageUnlocked = stageBadges.filter(b => daysSmokeFree >= b.day_threshold).length
          return (
            <div
              key={s.id}
              className="py-5"
              style={{
                borderBottom: i < VAP_STAGES.length - 1 ? '1px solid var(--color-line)' : 'none',
                opacity: unlocked || current ? 1 : 0.45,
              }}
            >
              <div className="flex gap-4 items-center">
                <div
                  className="flex items-center justify-center overflow-hidden shrink-0"
                  style={{
                    width: 56, height: 56,
                    borderRadius: 8,
                    border: '1px solid ' + (current ? 'var(--color-gold-text)' : 'var(--color-line-strong)'),
                    background: unlocked ? 'var(--color-bg-card)' : 'transparent',
                  }}
                >
                  {unlocked || current ? (
                    <Vap stage={s.id} size={46} />
                  ) : (
                    <Lock size={16} className="text-ink-4" strokeWidth={1.3} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-display"
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      color: current ? 'var(--color-gold-text)' : 'var(--color-ink)',
                    }}
                  >
                    {s.title}
                  </p>
                  <p className="text-[12px] text-ink-3 mt-0.5">
                    Jour {s.day} · {s.sub}
                  </p>
                </div>
                {unlocked && (
                  <Check size={16} className="text-gold-text shrink-0" strokeWidth={1.6} />
                )}
              </div>

              {/* Badges du stade */}
              {stageBadges.length > 0 && (unlocked || current) && (
                <div className="mt-3 ml-[72px] flex flex-wrap gap-1.5">
                  {stageBadges.map(b => {
                    const isUnlocked = daysSmokeFree >= b.day_threshold
                    return (
                      <button
                        key={b.id}
                        title={b.description}
                        onClick={() => setSelectedBadge(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-full text-[11px] transition-transform active:scale-95"
                        style={{
                          letterSpacing: '0.06em',
                          background: isUnlocked ? 'rgba(162,55,26,0.10)' : 'transparent',
                          border: '1px solid ' + (isUnlocked ? 'rgba(162,55,26,0.40)' : 'var(--color-line)'),
                          color: isUnlocked ? 'var(--color-gold-text)' : 'var(--color-ink-3)',
                        }}
                      >
                        <span style={{ fontSize: 11 }} aria-hidden>{b.icon}</span>
                        <span>{b.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              {stageBadges.length > 0 && (unlocked || current) && (
                <p className="text-[11px] text-ink-3 mt-2 ml-[72px]" style={{ letterSpacing: '0.06em' }}>
                  {stageUnlocked} / {stageBadges.length} badge{stageBadges.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )
        })}
      </section>

      {/* Détail badge — accessible au tap (le title= ne sert qu'au survol desktop) */}
      <Modal isOpen={!!selectedBadge} onClose={() => setSelectedBadge(null)} title={selectedBadge?.title}>
        {selectedBadge && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <span style={{ fontSize: 48 }} aria-hidden>{selectedBadge.icon}</span>
            <p className="display-italic text-ink" style={{ fontSize: 19, lineHeight: 1.4 }}>
              {selectedBadge.description}
            </p>
            <div className="gold-rule w-24" />
            {daysSmokeFree >= selectedBadge.day_threshold ? (
              <p className="eyebrow text-gold-text">
                Débloqué · jour {selectedBadge.day_threshold}
              </p>
            ) : (
              <p className="eyebrow">
                Se débloque au jour {selectedBadge.day_threshold} · dans{' '}
                {selectedBadge.day_threshold - daysSmokeFree} jour{selectedBadge.day_threshold - daysSmokeFree > 1 ? 's' : ''}
              </p>
            )}
            <button onClick={() => setSelectedBadge(null)} className="btn-ghost mt-2">
              Fermer
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
