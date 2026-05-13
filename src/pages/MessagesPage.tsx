import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bell, BellOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PushMessage {
  id: string
  title: string
  body: string
  url: string | null
  created_at: string
}

const LAST_READ_KEY = 'provap_messages_last_read'

export function MessagesPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<PushMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRead] = useState<number>(() => {
    const raw = localStorage.getItem(LAST_READ_KEY)
    return raw ? parseInt(raw, 10) : 0
  })

  useEffect(() => {
    supabase.from('push_messages')
      .select('id, title, body, url, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data as PushMessage[])
        setLoading(false)
      })
    // Marque tous les messages comme lus à l'ouverture de la page
    localStorage.setItem(LAST_READ_KEY, String(Date.now()))
  }, [])

  const formatDate = (iso: string) => {
    const d = parseISO(iso)
    if (isToday(d)) return `Aujourd'hui · ${format(d, 'HH:mm')}`
    if (isYesterday(d)) return `Hier · ${format(d, 'HH:mm')}`
    return format(d, "d MMMM · HH:mm", { locale: fr })
  }

  const isUnread = (created_at: string) => {
    return new Date(created_at).getTime() > lastRead
  }

  return (
    <div className="page pb-32">
      <header className="px-6 pt-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="p-2 -ml-2 text-ink-3 hover:text-ink"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <span className="eyebrow">Vos messages</span>
          <h1 className="display text-ink mt-1" style={{ fontSize: 32 }}>
            <span className="display-italic">Notifications</span>
          </h1>
        </div>
      </header>

      <section className="px-5 mt-6">
        {loading && (
          <div className="flex justify-center py-12">
            <div
              className="w-8 h-8 rounded-full border-2"
              style={{
                borderColor: 'rgba(184,72,42,0.18)',
                borderTopColor: 'var(--color-pv-terracotta, #b8482a)',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{
              background: 'var(--color-bg-card, #ffffff)',
              border: '1px solid var(--color-line, rgba(40,40,45,0.08))',
            }}
          >
            <div
              className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(184,72,42,0.08)', color: '#b8482a' }}
            >
              <BellOff size={24} strokeWidth={1.4} />
            </div>
            <p className="display-italic text-ink" style={{ fontSize: 22 }}>
              Aucun message pour l'instant.
            </p>
            <p className="text-[13px] text-ink-3 mt-2 leading-relaxed max-w-xs mx-auto">
              Activez les notifications depuis votre profil pour recevoir
              les messages de votre conseiller.
            </p>
            <button
              onClick={() => navigate('/profil')}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#b8482a', color: '#ffffff' }}
            >
              <Bell size={14} strokeWidth={1.8} /> Activer les notifications
            </button>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div className="flex flex-col gap-3">
            {messages.map(msg => {
              const hasLink = !!msg.url && msg.url.trim() !== '' && msg.url.trim() !== '/'
              return (
              <button
                key={msg.id}
                onClick={() => hasLink && navigate(msg.url!)}
                disabled={!hasLink}
                className="card p-4 text-left transition-all active:scale-[0.99] hover:border-pv-ochre/30 disabled:cursor-default"
                style={{
                  position: 'relative',
                  cursor: hasLink ? 'pointer' : 'default',
                }}
              >
                {isUnread(msg.created_at) && (
                  <span
                    className="absolute rounded-full"
                    style={{
                      top: 16,
                      right: 16,
                      width: 8,
                      height: 8,
                      background: 'var(--color-pv-terracotta, #b8482a)',
                    }}
                    aria-label="Non lu"
                  />
                )}
                <div className="eyebrow text-pv-ochre" style={{ fontSize: 10 }}>
                  {formatDate(msg.created_at)}
                </div>
                <h3
                  className="mt-2 font-semibold text-ink"
                  style={{ fontSize: 16, lineHeight: 1.25 }}
                >
                  {msg.title}
                </h3>
                <p
                  className="mt-1.5 text-[13px] leading-relaxed"
                  style={{ color: 'var(--color-ink-2, #686868)' }}
                >
                  {msg.body}
                </p>
                {hasLink && (
                  <span
                    className="inline-block mt-3 text-[12px] font-semibold"
                    style={{ color: 'var(--color-pv-terracotta, #b8482a)' }}
                  >
                    Ouvrir →
                  </span>
                )}
              </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
