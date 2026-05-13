import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import {
  getPushSupport,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  type PushSupportStatus,
} from '../lib/pushNotifications'

/**
 * Toggle d'activation des notifications push.
 * Affiche le bon message selon l'état navigateur :
 *  - unsupported          → caché
 *  - ios-needs-install    → invite à installer la PWA d'abord
 *  - permission-denied    → indique comment réactiver dans les réglages
 *  - permission-default   → bouton "Activer les notifications"
 *  - permission-granted   → bouton "Désactiver"
 */
export function NotificationToggle() {
  const { user } = useAuth()
  const [status, setStatus] = useState<PushSupportStatus>('permission-default')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setStatus(getPushSupport())
  }, [])

  const handleEnable = async () => {
    if (!user) return
    try {
      setLoading(true)
      const ok = await subscribeUserToPush(user.id)
      if (ok) {
        toast.success('Notifications activées.')
        setStatus('permission-granted')
      } else {
        toast.error('Activation impossible. Vérifiez les autorisations.')
        setStatus(getPushSupport())
      }
    } catch {
      toast.error('Erreur lors de l\'activation.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisable = async () => {
    try {
      setLoading(true)
      await unsubscribeUserFromPush()
      toast.success('Notifications désactivées.')
      setStatus('permission-default')
    } catch {
      toast.error('Erreur lors de la désactivation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: 'var(--color-bg-card, #ffffff)',
        border: '1px solid var(--color-line, rgba(40,40,45,0.08))',
      }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: status === 'permission-granted' ? '#cb8002' : 'rgba(184,72,42,0.1)',
          color: status === 'permission-granted' ? '#fff' : '#b8482a',
        }}
      >
        {status === 'permission-granted' ? <Bell size={18} /> : <BellOff size={18} />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-ink, #28282d)' }}>
          Notifications
        </p>

        {status === 'unsupported' && (
          <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-ink-3, #686868)' }}>
            Votre navigateur ne prend pas en charge les notifications push.
          </p>
        )}

        {status === 'ios-needs-install' && (
          <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-ink-3, #686868)' }}>
            Installez d'abord Pro'Vap sur votre écran d'accueil pour recevoir les notifications.
            <br />
            <span className="text-[11px]">Partage → « Sur l'écran d'accueil »</span>
          </p>
        )}

        {status === 'permission-denied' && (
          <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-ink-3, #686868)' }}>
            Vous avez refusé les notifications. Pour les réactiver, ouvrez les réglages de votre navigateur pour ce site.
          </p>
        )}

        {status === 'permission-default' && (
          <>
            <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-ink-3, #686868)' }}>
              Recevez vos messages quotidiens, rappels et félicitations directement sur votre téléphone.
            </p>
            <button
              onClick={handleEnable}
              disabled={loading}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#b8482a', color: '#ffffff' }}
            >
              {loading ? 'Activation…' : 'Activer les notifications'}
            </button>
          </>
        )}

        {status === 'permission-granted' && (
          <>
            <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-ink-3, #686868)' }}>
              Vous êtes abonné aux notifications Pro'Vap.
            </p>
            <button
              onClick={handleDisable}
              disabled={loading}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: 'transparent',
                color: 'var(--color-ink-2, #686868)',
                border: '1px solid var(--color-line-strong, rgba(40,40,45,0.18))',
              }}
            >
              {loading ? 'Désactivation…' : 'Désactiver'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
