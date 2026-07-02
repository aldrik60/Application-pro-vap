import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { MoodEntry, MoodLevel } from '../types'
import { ChevronLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

const MOODS: { level: MoodLevel; emoji: string; label: string; color: string }[] = [
  { level: 'tres_difficile', emoji: '😞', label: 'Très difficile', color: 'var(--color-danger)' },
  { level: 'difficile',      emoji: '😕', label: 'Difficile',      color: '#D97706' },
  { level: 'neutre',         emoji: '😐', label: 'Neutre',         color: 'var(--color-text-muted)' },
  { level: 'bien',           emoji: '🙂', label: 'Bien',           color: 'var(--color-secondary)' },
  { level: 'excellent',      emoji: '😄', label: 'Excellent',      color: 'var(--color-success)' },
]

function moodOf(level: MoodLevel) {
  return MOODS.find(m => m.level === level)!
}

export function JournalPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [todayMood, setTodayMood] = useState<MoodLevel | null>(null)
  const [todayNote, setTodayNote] = useState('')
  const [todayRelapsed, setTodayRelapsed] = useState(false)
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [todayEntryId, setTodayEntryId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', format(subDays(new Date(), 30), 'yyyy-MM-dd'))
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (data) {
          setEntries(data as MoodEntry[])
          const todayEntry = (data as MoodEntry[]).find(e => e.date === today)
          if (todayEntry) {
            setTodayMood(todayEntry.mood)
            setTodayNote(todayEntry.note ?? '')
            setTodayRelapsed(todayEntry.relapsed)
            setTodayEntryId(todayEntry.id)
          }
        }
      })
  }, [user, today])

  const handleSave = async () => {
    if (!user || !todayMood) {
      toast.error("Sélectionnez d'abord votre humeur.")
      return
    }
    try {
      setLoading(true)
      const payload = {
        user_id: user.id,
        date: today,
        mood: todayMood,
        note: todayNote.trim() || null,
        relapsed: todayRelapsed,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase
        .from('mood_entries')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .single()
      if (error) throw error
      if (data) {
        setTodayEntryId((data as MoodEntry).id)
        setEntries(prev => {
          const others = prev.filter(e => e.date !== today)
          return [data as MoodEntry, ...others].sort((a, b) => b.date.localeCompare(a.date))
        })
      }
      toast.success('Humeur enregistrée.')
    } catch {
      toast.error("Erreur lors de l'enregistrement.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page p-4 pb-24 space-y-6 bg-bg">
      <header className="flex items-center gap-3 mt-2">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="p-2 -ml-2 text-ink-3 hover:text-ink"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="font-display text-3xl text-flame-text tracking-wider leading-none">JOURNAL</h1>
          <p className="text-ink-3 text-xs">Votre humeur, jour après jour</p>
        </div>
      </header>

      {/* Today's entry */}
      <section className="card p-5 space-y-5">
        <div>
          <p className="text-[11px] text-ink-3 font-bold uppercase tracking-wider mb-1">
            {todayEntryId ? 'Modifier' : 'Aujourd\'hui'}
          </p>
          <p className="text-ink font-semibold">{format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}</p>
        </div>

        <div>
          <label className="block text-sm text-ink mb-3 font-medium">
            Comment vous sentez-vous aujourd'hui ?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {MOODS.map(m => (
              <button
                key={m.level}
                onClick={() => setTodayMood(m.level)}
                className={`flex flex-col items-center gap-1 p-3 rounded-[14px] border transition-all active:scale-95 ${
                  todayMood === m.level
                    ? 'border-pv-terracotta bg-pv-terracotta/10'
                    : 'border-line bg-bg-elev hover:border-pv-terracotta/40'
                }`}
                aria-label={m.label}
                aria-pressed={todayMood === m.level}
              >
                <span className="text-3xl" aria-hidden>{m.emoji}</span>
                <span className="text-[10px] text-ink-3 font-semibold uppercase tracking-wider leading-tight">
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-ink mb-2 font-medium">Note du jour (optionnel)</label>
          <textarea
            className="input h-24 text-sm"
            placeholder="Ce qui s'est passé, ce que vous ressentez…"
            value={todayNote}
            onChange={e => setTodayNote(e.target.value)}
            maxLength={500}
          />
          <p className="text-[11px] text-ink-3 text-right mt-1">{todayNote.length}/500</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={todayRelapsed}
            onChange={e => setTodayRelapsed(e.target.checked)}
            className="mt-1 w-4 h-4 accent-[var(--color-primary)]"
          />
          <div>
            <span className="text-sm text-ink font-medium">J'ai craqué aujourd'hui</span>
            <p className="text-xs text-ink-3 mt-0.5 leading-relaxed">
              Sans culpabilité. Reconnaître un écart aide à comprendre les déclencheurs et à rebondir.
            </p>
          </div>
        </label>

        <button
          onClick={handleSave}
          disabled={loading || !todayMood}
          className="btn-primary disabled:opacity-50"
        >
          {loading ? 'Enregistrement…' : todayEntryId ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </section>

      {/* Historique (entrée du jour incluse) */}
      {entries.length > 0 && (
        <section>
          <div className="flex justify-between items-baseline mb-3">
            <h2 className="text-lg font-semibold text-ink">Historique</h2>
            <span className="text-xs text-ink-3">
              {entries.length} entrée{entries.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-2">
            {entries.map(e => {
              const m = moodOf(e.mood)
              const isToday = e.date === today
              return (
                <div
                  key={e.id}
                  className="card p-3 flex items-start gap-3"
                  style={{
                    borderColor: isToday ? 'var(--color-primary)' : undefined,
                    background: isToday ? 'rgba(184,72,42,0.04)' : undefined,
                  }}
                >
                  <span className="text-3xl shrink-0 mt-0.5" aria-hidden>{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-ink">
                        {isToday ? 'Aujourd\'hui' : format(parseISO(e.date), 'd MMMM', { locale: fr })}
                      </span>
                      {isToday && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-pv-terracotta/10 text-flame-text border border-pv-terracotta/30 font-semibold uppercase tracking-wider">
                          Enregistré
                        </span>
                      )}
                      {e.relapsed && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-danger/10 text-danger border border-danger/30 font-semibold uppercase">
                          Craquage
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-3 capitalize" style={{ letterSpacing: '0.04em' }}>
                      {m.label}
                    </p>
                    {e.note && (
                      <p className="text-xs text-ink-3 italic line-clamp-2 mt-1">"{e.note}"</p>
                    )}
                  </div>
                  <Check size={14} className="text-ink-3 shrink-0 mt-1" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty state si aucune entrée du tout */}
      {entries.length === 0 && (
        <p className="text-xs text-ink-3 text-center italic mt-2">
          Votre premier enregistrement apparaîtra ici juste après.
        </p>
      )}
    </div>
  )
}
