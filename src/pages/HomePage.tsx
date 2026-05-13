import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, Share2, ChevronRight, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '../types'
import { Vap, vapStageFromDays, VAP_STAGES } from '../components/Vap'
import { ProVapLogo } from '../components/ProVapLogo'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { differenceInHours } from 'date-fns'
import { IS_FULL } from '../lib/appMode'
import { useUnreadMessages } from '../hooks/useUnreadMessages'

// Jalons d'amélioration de santé après l'arrêt du tabac.
// Sources : Santé publique France, Tabac Info Service, OMS, HAS.
const HEALTH_MILESTONES = [
  { day: 0, hours: 0.33, label: '20 minutes', description: 'Le rythme cardiaque se normalise' },
  { day: 0, hours: 8,    label: '8 heures',   description: 'Le monoxyde de carbone baisse dans le sang' },
  { day: 1, hours: 0,    label: 'J+1',        description: 'Le souffle paraît plus léger' },
  { day: 3, hours: 0,    label: 'J+3',        description: 'Le goût et l\'odorat reviennent' },
  { day: 7, hours: 0,    label: 'J+7',        description: 'Une semaine. La phase aiguë est passée.' },
  { day: 14, hours: 0,   label: 'J+14',       description: 'La circulation sanguine s\'améliore' },
  { day: 21, hours: 0,   label: 'J+21',       description: 'La nouvelle habitude s\'installe' },
  { day: 30, hours: 0,   label: 'J+30',       description: 'Les poumons amorcent leur récupération' },
  { day: 45, hours: 0,   label: 'J+45',       description: 'L\'énergie quotidienne s\'améliore' },
  { day: 60, hours: 0,   label: 'J+60',       description: 'La capacité respiratoire progresse' },
  { day: 75, hours: 0,   label: 'J+75',       description: 'Le système immunitaire récupère' },
  { day: 90, hours: 0,   label: 'J+90',       description: 'Le sevrage physique est largement derrière' },
  { day: 120, hours: 0,  label: 'J+120',      description: 'Le risque cardiovasculaire recule' },
  { day: 180, hours: 0,  label: 'J+180',      description: 'Les poumons continuent de se régénérer' },
  { day: 270, hours: 0,  label: 'J+270',      description: 'Moins d\'infections respiratoires' },
  { day: 365, hours: 0,  label: '1 an',       description: 'Le risque coronarien recule (source : OMS)' },
  { day: 545, hours: 0,  label: '18 mois',    description: 'Le risque de plusieurs cancers diminue' },
  { day: 730, hours: 0,  label: '2 ans',      description: 'La fonction pulmonaire s\'est nettement améliorée' },
  { day: 1095, hours: 0, label: '3 ans',      description: 'Trois ans sans tabac' },
  { day: 1825, hours: 0, label: '5 ans',      description: 'Risque cardiovasculaire proche d\'un non-fumeur' },
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

function nextStageDay(stage: 1 | 2 | 3 | 4 | 5 | 6): number {
  const next = VAP_STAGES.find(s => s.id > stage)
  return next?.day ?? 365
}

function stageProgress(stage: 1 | 2 | 3 | 4 | 5 | 6, days: number): number {
  const current = VAP_STAGES[stage - 1]
  const next = VAP_STAGES.find(s => s.id > stage)
  if (!next) return 100
  const span = next.day - current.day
  const progressed = days - current.day
  if (span <= 0) return 100
  return Math.max(0, Math.min(100, (progressed / span) * 100))
}

export function HomePage() {
  const { user, profile } = useAuth()
  const unreadCount = useUnreadMessages(user?.id)
  const navigate = useNavigate()
  const [dailyMessage, setDailyMessage] = useState("Aujourd'hui compte. Demain aussi.")
  const [, setBadges] = useState<Badge[]>([])

  const quitDate = profile?.quit_date ? new Date(profile.quit_date) : null
  const now = new Date()
  const totalHours = quitDate ? Math.max(0, differenceInHours(now, quitDate)) : 0
  const daysSmokeFree = Math.floor(totalHours / 24)
  const hoursSmokeFree = totalHours % 24

  const cigsAvoided = daysSmokeFree * (profile?.cigarettes_per_day || 0)
  const moneySaved = daysSmokeFree * ((profile?.pack_price || 0) / 20) * (profile?.cigarettes_per_day || 0)
  const kitPrice = profile?.kit_price || 0
  const netSavings = moneySaved - kitPrice
  const lifeGainedMin = cigsAvoided * 11
  const lifeGainedHours = Math.floor(lifeGainedMin / 60)

  const rewardCost = profile?.reward_amount || 0
  const rewardProgress = rewardCost > 0 ? Math.min(100, (Math.max(0, netSavings) / rewardCost) * 100) : 0

  const nextMilestone = getNextMilestone(totalHours)
  const vapStage = vapStageFromDays(daysSmokeFree)
  const vapNextDay = nextStageDay(vapStage)
  const vapProgress = stageProgress(vapStage, daysSmokeFree)

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

  useEffect(() => {
    supabase.from('badges')
      .select('*')
      .order('day_threshold', { ascending: true })
      .then(({ data }) => {
        if (data) setBadges(data as Badge[])
      })
  }, [])

  const handleShare = async () => {
    const cigsRound = Math.round(cigsAvoided)
    const moneyRound = Math.round(moneySaved)
    const text = daysSmokeFree >= 1
      ? `${daysSmokeFree} jour${daysSmokeFree > 1 ? 's' : ''} sans tabac. ${cigsRound} cigarettes évitées, ${moneyRound}€ économisés. Mon parcours avec Pro'Vap Sevrage.`
      : `J'ai commencé mon sevrage tabagique avec Pro'Vap Sevrage.`
    const shareData = { title: "Pro'Vap Sevrage", text, url: window.location.origin }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${shareData.url}`)
        toast.success('Message copié dans le presse-papier')
      }
    } catch {
      /* annulation utilisateur */
    }
  }

  // ─── No quit date : onboarding state ─────────────────────────────────────
  if (!profile?.quit_date) {
    return (
      <div className="page p-6 flex flex-col items-center justify-center text-center min-h-screen">
        <Vap stage={1} size={180} withScene />
        <p className="eyebrow text-pv-ochre mt-2">Bienvenue</p>
        <h2 className="display text-3xl text-ink mt-3 mb-4">
          {profile?.name ? `Bonjour, ${profile.name}` : 'Bonjour'}
        </h2>
        <p className="text-ink-2 mb-8 leading-relaxed max-w-xs text-sm">
          Pour commencer votre parcours, indiquez votre date d'arrêt depuis votre profil.
        </p>
        <button className="btn-primary max-w-xs" onClick={() => navigate('/profil')}>
          Configurer mon profil
        </button>
      </div>
    )
  }

  return (
    <div className="page pb-32">
      {/* Header logo + actions */}
      <header className="flex items-center justify-between px-6 pt-6">
        <ProVapLogo height={22} />
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="w-[38px] h-[38px] rounded-full border border-line-strong flex items-center justify-center text-ink transition-colors hover:border-pv-terracotta"
            aria-label="Partager mon parcours"
          >
            <Share2 size={16} strokeWidth={1.4} />
          </button>
          <button
            onClick={() => navigate('/messages')}
            className="relative w-[38px] h-[38px] rounded-full border border-line-strong flex items-center justify-center text-ink transition-colors hover:border-pv-terracotta"
            aria-label={unreadCount > 0 ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? 's' : ''})` : 'Notifications'}
          >
            <Bell size={16} strokeWidth={1.4} />
            {unreadCount > 0 && (
              <span
                className="absolute flex items-center justify-center text-[10px] font-bold"
                style={{
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  paddingLeft: 4,
                  paddingRight: 4,
                  borderRadius: 9,
                  background: 'var(--color-pv-terracotta, #b8482a)',
                  color: '#ffffff',
                  border: '2px solid var(--color-bg, #f6f1e8)',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero compteur + Vap */}
      <section className="relative px-6 pt-4">
        <div
          className="absolute pointer-events-none"
          style={{ right: -8, top: 8, opacity: 0.82, zIndex: 0 }}
          aria-hidden
        >
          <Vap stage={vapStage} size={140} withScene />
        </div>
        <div className="relative pt-10" style={{ zIndex: 1 }}>
          <p className="eyebrow">Vous tenez bon depuis</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span
              className="font-display tabular text-ink"
              style={{
                fontSize: 96,
                fontWeight: 500,
                letterSpacing: '-0.04em',
                lineHeight: 0.85,
                textShadow: '0 2px 24px var(--color-bg)',
              }}
            >
              {daysSmokeFree}
            </span>
          </div>
          <div className="display-italic mt-1 text-2xl text-ink-2">
            {daysSmokeFree <= 1 ? 'jour' : 'jours'} sans tabac
          </div>
          {hoursSmokeFree > 0 && (
            <div className="eyebrow text-pv-ochre mt-2">+ {hoursSmokeFree} heures</div>
          )}
        </div>

        {/* Progress vers prochain stade Vap */}
        <Link to="/badges" className="mt-5 flex items-center gap-3 group">
          <div className="flex-1 progress-track">
            <div className="progress-fill" style={{ width: `${vapProgress}%` }} />
          </div>
          <div className="text-[11px] text-pv-ochre whitespace-nowrap" style={{ letterSpacing: '0.05em' }}>
            Prochain palier · J+{vapNextDay}
          </div>
          <ChevronRight size={14} className="text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </section>

      {/* Message du jour */}
      <section className="px-5 mt-7">
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="eyebrow text-pv-terracotta">Message du jour</span>
            <div className="w-7 h-px bg-pv-ochre opacity-70" />
          </div>
          <p
            className="display-italic text-ink leading-snug"
            style={{ fontSize: 22, lineHeight: 1.32 }}
          >
            « {dailyMessage} »
          </p>
          <div className="mt-3 text-[11px] text-ink-3" style={{ letterSpacing: '0.06em' }}>
            L'équipe Pro'Vap · jour {daysSmokeFree}
          </div>
        </div>
      </section>

      {/* Stats en duo */}
      <section className="grid grid-cols-2 gap-2.5 px-5 mt-4">
        <StatTile eyebrow="Cigarettes évitées" value={String(cigsAvoided)} unit="cig." />
        <StatTile eyebrow="Économies" value={moneySaved.toFixed(0)} unit="€" accent />
      </section>

      {/* Vie regagnée */}
      <section className="px-5 mt-3">
        <div className="card p-5">
          <div className="flex justify-between items-baseline">
            <span className="eyebrow">Vie regagnée</span>
            <span className="font-display text-pv-ochre" style={{ fontSize: 24 }}>
              {lifeGainedHours}
              <span className="display-italic text-sm text-ink-2 ml-0.5">h</span>
            </span>
          </div>
          <p className="mt-3 text-xs text-ink-3 leading-relaxed">
            Votre goût, votre odorat et votre souffle progressent chaque jour.
          </p>
        </div>
      </section>

      {/* Prochain jalon santé */}
      {nextMilestone && (
        <section className="px-5 mt-3">
          <div className="card p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="eyebrow text-pv-terracotta">Prochain jalon santé</span>
              <div className="w-7 h-px bg-pv-ochre opacity-70" />
            </div>
            <p className="font-display text-ink leading-snug" style={{ fontSize: 18, fontWeight: 500 }}>
              {nextMilestone.description}
            </p>
            <p className="text-[11px] text-pv-ochre mt-2" style={{ letterSpacing: '0.06em' }}>
              Dans {nextMilestone.daysLeft > 0
                ? `${nextMilestone.daysLeft} jour${nextMilestone.daysLeft > 1 ? 's' : ''}${nextMilestone.hrsLeft > 0 ? ` et ${nextMilestone.hrsLeft}h` : ''}`
                : `${nextMilestone.hrsLeft} heure${nextMilestone.hrsLeft > 1 ? 's' : ''}`}
            </p>
          </div>
        </section>
      )}

      {/* Kit amortissement — full mode only */}
      {IS_FULL && kitPrice > 0 && (
        <section className="px-5 mt-3">
          <div className="card p-5">
            <span className="eyebrow">Kit Pro'Vap — Amortissement</span>
            {netSavings < 0 ? (
              <>
                <div className="flex justify-between items-baseline mt-3">
                  <span className="text-sm text-ink">
                    Kit amorti dans{' '}
                    <span className="font-display text-pv-terracotta" style={{ fontSize: 17 }}>
                      {Math.ceil(Math.abs(netSavings) / ((profile.pack_price || 10) / 20 * (profile.cigarettes_per_day || 10)))} jours
                    </span>
                  </span>
                  <span className="text-xs text-danger font-semibold">{netSavings.toFixed(0)}€</span>
                </div>
                <div className="progress-track mt-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (moneySaved / kitPrice) * 100)}%`, backgroundColor: 'var(--color-danger)' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-baseline mt-3">
                  <span className="text-sm text-success font-medium">Kit amorti</span>
                  <span className="font-display text-success" style={{ fontSize: 20 }}>
                    + {netSavings.toFixed(0)}€
                  </span>
                </div>
                <div className="progress-track mt-3">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: '100%', backgroundColor: 'var(--color-success)' }} />
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Objectif plaisir */}
      {profile.reward_name && profile.reward_amount && (
        <section className="px-5 mt-3">
          <div className="card p-5">
            <div className="flex justify-between items-end mb-3">
              <div>
                <span className="eyebrow block">Objectif plaisir</span>
                <span className="block font-display text-ink mt-1" style={{ fontSize: 18, fontWeight: 500 }}>
                  {profile.reward_name}
                </span>
              </div>
              <div className="text-right">
                <span className="font-display text-pv-ochre" style={{ fontSize: 20 }}>
                  {Math.max(0, Math.floor(netSavings))}
                </span>
                <span className="display-italic text-ink-3 text-sm"> / {profile.reward_amount}€</span>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill-gold" style={{ width: `${rewardProgress}%` }} />
            </div>
            {rewardProgress < 100 && profile.cigarettes_per_day > 0 && (
              <p className="text-[11px] text-ink-3 mt-2" style={{ letterSpacing: '0.05em' }}>
                Dans {Math.ceil((profile.reward_amount - Math.max(0, netSavings)) / ((profile.pack_price || 10) / 20 * profile.cigarettes_per_day))} jours, c'est à vous.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Bouton SOS */}
      <section className="px-5 mt-5">
        <Link to="/sos">
          <button className="btn-primary w-full" style={{ minHeight: 60 }}>
            <AlertTriangle size={18} strokeWidth={1.6} />
            <span>SOS — j'ai une envie</span>
          </button>
        </Link>
      </section>

      {/* Guides & conseils — accès aux ressources */}
      <section className="px-5 mt-3">
        <Link to="/contenu" className="block">
          <div className="card p-5 transition-transform active:scale-[0.98] hover:border-pv-terracotta/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(184,72,42,0.12)', color: 'var(--color-pv-terracotta)' }}
                >
                  <BookOpen size={17} strokeWidth={1.4} />
                </span>
                <div className="min-w-0">
                  <span className="eyebrow block">Ressources</span>
                  <p
                    className="font-display text-ink mt-1 leading-tight"
                    style={{ fontSize: 19, fontWeight: 500, letterSpacing: '-0.01em' }}
                  >
                    Guides &amp; <span className="display-italic">conseils.</span>
                  </p>
                  <p className="text-[11px] text-ink-3 mt-1 leading-relaxed">
                    Articles, FAQ, vidéos pour vous accompagner.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-ink-3 shrink-0" strokeWidth={1.4} />
            </div>
          </div>
        </Link>
      </section>

      {/* Disclaimer médical */}
      <p className="text-[10px] text-ink-3 text-center leading-relaxed px-5 pt-5">
        Informations indicatives, ne remplacent pas l'avis d'un professionnel de santé.
        <br />
        <span className="text-pv-ochre font-medium">Tabac Info Service 3989</span> · gratuit, lun-sam 8h-20h.
      </p>
    </div>
  )
}

function StatTile({ eyebrow, value, unit, accent }: { eyebrow: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="card p-4">
      <span className="eyebrow" style={{ fontSize: 9 }}>{eyebrow}</span>
      <div className="flex items-baseline gap-1 mt-2">
        <span
          className="font-display tabular"
          style={{
            fontSize: 32,
            color: accent ? 'var(--color-pv-ochre)' : 'var(--color-ink)',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        <span className="display-italic text-ink-3 text-sm">{unit}</span>
      </div>
    </div>
  )
}
