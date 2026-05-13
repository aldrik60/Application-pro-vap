import React, { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Modal } from '../components/Modal'
import { PlusCircle, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { NicotineCheckIn } from '../types'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

/**
 * Page "Vape" — Descente nicotinique.
 *
 * Le client voit son taux actuel en hero, son plan de descente sur 6 mois,
 * un conseil personnalisé Pro'Vap, et son historique de check-ins.
 *
 * Le plan est calculé : 100 % → 75 % → 50 % → 25 % → palier final → 0
 * relatif au taux de départ (premier check-in ou 12 mg/ml par défaut).
 */

interface PlanStep {
  day: number
  nic: number
  label: string
  done: boolean
  current: boolean
}

function buildPlan(initialMg: number, currentMg: number, daysSinceStart: number): PlanStep[] {
  const steps: { day: number; ratio: number; label: string }[] = [
    { day: 0,   ratio: 1.00,  label: 'Démarrage' },
    { day: 14,  ratio: 0.75,  label: '−25 %' },
    { day: 30,  ratio: 0.50,  label: '−50 %' },
    { day: 60,  ratio: 0.25,  label: '−75 %' },
    { day: 120, ratio: 0.10,  label: 'Palier final' },
    { day: 180, ratio: 0.00,  label: 'Liberté' },
  ]
  return steps.map((s, i, arr) => {
    const nic = +(initialMg * s.ratio).toFixed(1)
    const done = daysSinceStart >= s.day
    const nextDay = arr[i + 1]?.day ?? Infinity
    const current = done && daysSinceStart < nextDay
    return { day: s.day, nic, label: s.label, done, current }
  })
}

export function JourneyPage() {
  const { user } = useAuth()
  const [checkins, setCheckins] = useState<NicotineCheckIn[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [mg, setMg] = useState('12')
  const [eliquid, setEliquid] = useState('')
  const [feeling, setFeeling] = useState<'difficile' | 'neutre' | 'bien' | 'excellent'>('bien')
  const [notes, setNotes] = useState('')

  const fetchCheckins = async () => {
    if (!user) return
    const { data } = await supabase
      .from('nicotine_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
    if (data) setCheckins(data)
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchCheckins() }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      const { error } = await supabase.from('nicotine_checkins').insert({
        user_id: user.id,
        nicotine_mg: parseFloat(mg),
        eliquid_name: eliquid || 'Non spécifié',
        feeling,
        notes,
      })
      if (error) throw error
      toast.success('Point d\'étape enregistré')
      setIsModalOpen(false)
      setNotes('')
      fetchCheckins()
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    }
  }

  const currentMg = checkins.length > 0 ? checkins[checkins.length - 1].nicotine_mg : 0
  const initialMg = checkins.length > 0 ? checkins[0].nicotine_mg : 12
  const firstCheckin = checkins[0]
  const daysSinceStart = firstCheckin
    ? Math.max(0, Math.floor((Date.now() - parseISO(firstCheckin.date).getTime()) / 86400000))
    : 0

  const plan = useMemo(() => buildPlan(initialMg, currentMg, daysSinceStart), [initialMg, currentMg, daysSinceStart])
  const nextStep = plan.find(s => !s.done)

  const chartData = checkins.map(c => ({
    dateStr: format(parseISO(c.date), 'dd/MM', { locale: fr }),
    mg: c.nicotine_mg,
  }))

  if (loading) {
    return (
      <div className="page flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-pv-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="page pb-32">
      {/* Header */}
      <header className="px-6 pt-6 flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">Votre vape</span>
          <h1 className="display text-ink mt-2" style={{ fontSize: 36 }}>
            Descente <span className="display-italic">nicotinique</span>
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          aria-label="Nouveau point d'étape"
          className="w-[38px] h-[38px] rounded-full border border-line-strong flex items-center justify-center text-pv-terracotta transition-colors hover:bg-bg-elev shrink-0 mt-1"
        >
          <PlusCircle size={18} strokeWidth={1.4} />
        </button>
      </header>

      {/* Hero taux actuel OU empty state */}
      {checkins.length > 0 ? (
        <section className="px-5 mt-5">
          <div className="card p-6 relative overflow-hidden">
            <div
              className="absolute font-display pointer-events-none"
              aria-hidden
              style={{
                right: -16,
                top: -20,
                opacity: 0.06,
                fontSize: 200,
                color: 'var(--color-pv-ochre)',
                lineHeight: 0.7,
                fontWeight: 500,
              }}
            >
              {String(Math.round(currentMg)).padStart(2, '0')}
            </div>
            <span className="eyebrow text-pv-terracotta">Taux actuel</span>
            <div className="flex items-baseline gap-1 mt-3">
              <span
                className="font-display tabular text-ink"
                style={{ fontSize: 80, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 0.9 }}
              >
                {currentMg}
              </span>
              <span className="display-italic text-ink-2 ml-1" style={{ fontSize: 22 }}>mg/ml</span>
            </div>
            <p className="text-xs text-ink-3 mt-3 leading-relaxed">
              Premier point d'étape le {format(parseISO(firstCheckin!.date), 'd MMMM', { locale: fr })}
              {nextStep && nextStep.day > daysSinceStart && (
                <> · prochaine descente prévue J+{nextStep.day - daysSinceStart}</>
              )}
            </p>
          </div>
        </section>
      ) : (
        <section className="px-5 mt-5">
          <div className="card p-7 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'rgba(184, 72, 42, 0.10)',
                border: '1px solid rgba(184, 72, 42, 0.30)',
                color: 'var(--color-pv-terracotta)',
              }}
            >
              <PlusCircle size={24} strokeWidth={1.3} />
            </div>
            <p
              className="display-italic text-ink"
              style={{ fontSize: 20, lineHeight: 1.35 }}
            >
              Aucun point d'étape<br />pour le moment.
            </p>
            <p className="text-xs text-ink-3 mt-3 leading-relaxed max-w-[260px]">
              Enregistrez votre taux de nicotine actuel. Vous pourrez ensuite suivre votre descente sur les mois à venir.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary mt-5 max-w-[280px]"
            >
              Enregistrer mon taux
            </button>
          </div>
        </section>
      )}

      {/* Plan sur 6 mois */}
      <section className="px-6 mt-6">
        <span className="eyebrow">Votre plan sur 6 mois</span>
      </section>
      <section className="px-5 mt-3">
        {plan.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3"
            style={{ borderBottom: i < plan.length - 1 ? '1px solid var(--color-line)' : 'none' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                border: '1px solid ' + (s.current ? 'var(--color-pv-ochre)' : s.done ? 'var(--color-line-strong)' : 'var(--color-line)'),
                background: s.current ? 'var(--color-bg-card)' : 'transparent',
                color: s.done ? 'var(--color-pv-ochre)' : 'var(--color-ink-4)',
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 15,
              }}
            >
              {s.done && !s.current ? <Check size={14} strokeWidth={1.6} /> : <span>{s.nic}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-ink" style={{ fontSize: 18 }}>
                {s.nic}{' '}
                <span className="display-italic text-ink-3 text-sm">mg/ml</span>{' '}
                <span className="text-ink-3 text-sm">· {s.label}</span>
              </p>
              <p className="text-[11px] text-ink-3 mt-0.5">Jour {s.day}</p>
            </div>
            {s.current && (
              <span
                className="text-pv-ochre font-semibold"
                style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase' }}
              >
                En cours
              </span>
            )}
          </div>
        ))}
      </section>

      {/* Conseil Pro'Vap */}
      <section className="px-5 mt-6">
        <div className="card-elev p-5">
          <span className="eyebrow text-pv-terracotta">Un conseil</span>
          <p
            className="display-italic text-ink mt-2"
            style={{ fontSize: 18, lineHeight: 1.4 }}
          >
            « Si vous tirez plus de 20 fois par heure, ne descendez pas encore. Passez en boutique, on ajuste. »
          </p>
        </div>
      </section>

      {/* Évolution graphique */}
      {checkins.length >= 2 && (
        <section className="px-5 mt-6">
          <span className="eyebrow">Évolution mesurée</span>
          <div className="card mt-3 p-4" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                <XAxis
                  dataKey="dateStr"
                  stroke="var(--color-ink-3)"
                  fontSize={10}
                  tickMargin={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--color-ink-3)"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'dataMax + 3']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 8,
                    color: 'var(--color-ink)',
                    fontSize: 12,
                  }}
                  itemStyle={{ color: 'var(--color-pv-ochre)' }}
                  labelStyle={{ color: 'var(--color-ink-3)', marginBottom: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="mg"
                  name="mg/ml"
                  stroke="var(--color-pv-terracotta)"
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--color-bg-card)', stroke: 'var(--color-pv-terracotta)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'var(--color-pv-ochre)', stroke: 'var(--color-bg-card)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Historique */}
      {checkins.length > 0 && (
        <section className="px-6 mt-7">
          <div className="flex justify-between items-baseline">
            <span className="eyebrow">Historique · {checkins.length} point{checkins.length > 1 ? 's' : ''} d'étape</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-pv-ochre text-[11px] hover:underline"
              style={{ letterSpacing: '0.06em' }}
            >
              + Ajouter
            </button>
          </div>
        </section>
      )}
      {checkins.length > 0 && (
        <section className="px-5 mt-3">
          <div className="card overflow-hidden">
            {[...checkins].reverse().slice(0, 20).map((c, i, arr) => (
              <div
                key={c.id}
                className="flex justify-between items-baseline px-5 py-3.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--color-line)' : 'none' }}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="font-display text-ink" style={{ fontSize: 17, fontWeight: 500 }}>
                    {c.nicotine_mg}
                    <span className="display-italic text-ink-3 text-sm"> mg/ml</span>
                  </p>
                  <p className="text-[11px] text-ink-3 mt-0.5 truncate">
                    {format(parseISO(c.date), 'd MMMM yyyy', { locale: fr })} · {c.eliquid_name}
                  </p>
                  {c.notes && (
                    <p className="text-[11px] display-italic text-ink-2 mt-1 line-clamp-2">"{c.notes}"</p>
                  )}
                </div>
                <span
                  className="text-[10px] capitalize shrink-0 px-2 py-1 rounded-full"
                  style={{
                    color:
                      c.feeling === 'difficile' ? 'var(--color-danger)' :
                      c.feeling === 'excellent' || c.feeling === 'bien' ? 'var(--color-success)' :
                      'var(--color-ink-3)',
                    background:
                      c.feeling === 'difficile' ? 'rgba(200,74,42,0.10)' :
                      c.feeling === 'excellent' || c.feeling === 'bien' ? 'rgba(122,138,94,0.12)' :
                      'transparent',
                    border: '1px solid currentColor',
                    letterSpacing: '0.06em',
                  }}
                >
                  {c.feeling}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA bas — si déjà des entrées, raccourci en bas pour ajouter */}
      {checkins.length > 0 && (
        <section className="px-5 mt-5">
          <button onClick={() => setIsModalOpen(true)} className="btn-ghost w-full">
            Nouveau point d'étape
          </button>
        </section>
      )}

      {/* Modal d'ajout */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau point d'étape">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow block mb-2">Taux (mg/ml)</label>
              <input type="number" step="0.1" className="input" value={mg} onChange={e => setMg(e.target.value)} required />
            </div>
            <div>
              <label className="eyebrow block mb-2">E-liquide</label>
              <input type="text" className="input" value={eliquid} onChange={e => setEliquid(e.target.value)} placeholder="Ex: FR/M" />
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-2">Comment vous sentez-vous ?</label>
            <div className="grid grid-cols-2 gap-2">
              {(['difficile', 'neutre', 'bien', 'excellent'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFeeling(f)}
                  className="py-3 px-2 text-xs font-medium rounded-md border capitalize transition-colors"
                  style={{
                    background: feeling === f ? 'var(--color-pv-terracotta)' : 'transparent',
                    color: feeling === f ? 'var(--color-pv-ivory)' : 'var(--color-ink-2)',
                    borderColor: feeling === f ? 'var(--color-pv-terracotta)' : 'var(--color-line)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="eyebrow block mb-2">Notes (optionnel)</label>
            <textarea
              className="input text-sm"
              placeholder="Une victoire ? Une difficulté ?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary mt-2">Valider mon étape</button>
        </form>
      </Modal>
    </div>
  )
}
