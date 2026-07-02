import { useEffect, useState } from 'react'
import { Bell, BellOff, Lock, Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import {
  getPushSupport,
  subscribeUserToPush,
  unsubscribeUserFromPush,
  type PushSupportStatus,
} from '../lib/pushNotifications'

/**
 * Toggle d'activation des notifications push, avec aide contextuelle.
 */
export function NotificationToggle() {
  const { user } = useAuth()
  const [status, setStatus] = useState<PushSupportStatus>('permission-default')
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSoftPrompt, setShowSoftPrompt] = useState(false)

  useEffect(() => {
    setStatus(getPushSupport())
  }, [])

  const refresh = () => setStatus(getPushSupport())

  const isIOS = typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  const isAndroid = typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent)

  // 1er clic → ouvre la modale explicative (pas de demande système)
  const requestActivation = () => {
    setShowSoftPrompt(true)
  }

  // Confirmation dans la modale → déclenche la vraie demande système
  const handleEnable = async () => {
    if (!user) return
    setShowSoftPrompt(false)
    try {
      setLoading(true)
      const ok = await subscribeUserToPush(user.id)
      if (ok) {
        toast.success('Notifications activées.')
        setStatus('permission-granted')
      } else {
        toast.error("Permission refusée. Voir les instructions ci-dessous.")
        setStatus(getPushSupport())
        setShowHelp(true)
      }
    } catch {
      toast.error("Erreur lors de l'activation.")
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
      className="rounded-2xl p-4"
      style={{
        background: 'var(--color-bg-card, #ffffff)',
        border: '1px solid var(--color-line, rgba(40,40,45,0.08))',
      }}
    >
      <div className="flex items-start gap-3">
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
              Installez d'abord Pro'Vap sur votre écran d'accueil pour activer les notifications.
              <br />
              <span className="text-[12px]">Partage → « Sur l'écran d'accueil »</span>
            </p>
          )}

          {status === 'permission-denied' && (
            <>
              <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-ink-3, #686868)' }}>
                Vous avez refusé les notifications. Pour les réactiver, ajustez les réglages du navigateur pour ce site.
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <button
                  onClick={() => setShowHelp(s => !s)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    background: 'transparent',
                    color: 'var(--color-pv-terracotta, #b8482a)',
                    border: '1px solid var(--color-pv-terracotta, #b8482a)',
                  }}
                >
                  Comment réactiver ?
                  {showHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <button
                  onClick={() => { refresh(); handleEnable() }}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#b8482a', color: '#ffffff' }}
                >
                  {loading ? '…' : "J'ai réactivé, réessayer"}
                </button>
              </div>
            </>
          )}

          {status === 'permission-default' && (
            <>
              <p className="text-[12px] mt-1 leading-snug" style={{ color: 'var(--color-ink-3, #686868)' }}>
                Recevez vos messages quotidiens, rappels et félicitations directement sur votre téléphone.
              </p>
              <button
                onClick={requestActivation}
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

      {/* Aide contextuelle dépliable pour permission-denied */}
      {status === 'permission-denied' && showHelp && (
        <div
          className="mt-4 pt-4"
          style={{ borderTop: '1px solid var(--color-line, rgba(40,40,45,0.08))' }}
        >
          {isAndroid && (
            <div className="space-y-2.5">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--color-ink, #28282d)' }}>
                Sur Android (Chrome) :
              </p>
              <ol className="space-y-2 text-[12px]" style={{ color: 'var(--color-ink-2, #686868)' }}>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>1.</span>
                  <span>En haut de l'écran, à gauche de l'adresse, appuyez sur l'icône <Lock size={11} className="inline" strokeWidth={2.5} /> (cadenas) ou les 3 points <SettingsIcon size={11} className="inline" strokeWidth={2.5} />.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>2.</span>
                  <span>Appuyez sur <strong>Autorisations</strong> ou <strong>Paramètres du site</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>3.</span>
                  <span>Trouvez <strong>Notifications</strong> et choisissez <strong>Autoriser</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>4.</span>
                  <span>Revenez ici et cliquez sur <strong>« J'ai réactivé, réessayer »</strong>.</span>
                </li>
              </ol>
            </div>
          )}

          {isIOS && (
            <div className="space-y-2.5">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--color-ink, #28282d)' }}>
                Sur iPhone :
              </p>
              <ol className="space-y-2 text-[12px]" style={{ color: 'var(--color-ink-2, #686868)' }}>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>1.</span>
                  <span>Ouvrez l'app <strong>Réglages</strong> de votre iPhone.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>2.</span>
                  <span>Descendez et appuyez sur <strong>Notifications</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>3.</span>
                  <span>Trouvez <strong>Pro'Vap</strong> dans la liste et appuyez dessus.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>4.</span>
                  <span>Activez <strong>« Autoriser les notifications »</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>5.</span>
                  <span>Revenez dans l'app et cliquez sur <strong>« J'ai réactivé, réessayer »</strong>.</span>
                </li>
              </ol>
            </div>
          )}

          {!isAndroid && !isIOS && (
            <div className="space-y-2.5">
              <p className="text-[12px] font-semibold" style={{ color: 'var(--color-ink, #28282d)' }}>
                Sur ordinateur :
              </p>
              <ol className="space-y-2 text-[12px]" style={{ color: 'var(--color-ink-2, #686868)' }}>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>1.</span>
                  <span>Cliquez sur l'icône <Lock size={11} className="inline" strokeWidth={2.5} /> à gauche de l'adresse de la page.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>2.</span>
                  <span>Trouvez <strong>Notifications</strong> dans la liste et choisissez <strong>Autoriser</strong>.</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold" style={{ color: '#cb8002' }}>3.</span>
                  <span>Rechargez la page (Cmd+R ou Ctrl+R) puis cliquez sur <strong>« Réessayer »</strong>.</span>
                </li>
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Soft prompt avant la demande système (évite de "brûler" la permission native) */}
      {showSoftPrompt && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 100,
            background: 'rgba(31,31,36,0.5)',
            backdropFilter: 'blur(3px)',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            paddingLeft: 16,
            paddingRight: 16,
          }}
          onClick={() => setShowSoftPrompt(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{
              background: '#ffffff',
              boxShadow: '0 20px 50px rgba(31,31,36,0.25)',
              maxHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px)',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: '#cb8002', color: '#fff' }}
              >
                <Bell size={20} strokeWidth={1.8} />
              </div>
              <div>
                <p
                  className="font-semibold text-[15px] leading-tight"
                  style={{ color: '#1f1f24', fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
                >
                  Restons en contact.
                </p>
              </div>
            </div>

            <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#686868' }}>
              Pro'Vap vous enverra :
            </p>
            <ul className="space-y-1.5 text-[13px] mb-5" style={{ color: '#1f1f24' }}>
              <li className="flex gap-2"><span style={{ color: '#cb8002' }}>·</span> Votre message du jour</li>
              <li className="flex gap-2"><span style={{ color: '#cb8002' }}>·</span> Vos félicitations aux paliers atteints</li>
              <li className="flex gap-2"><span style={{ color: '#cb8002' }}>·</span> Les rappels et nouveautés de votre boutique</li>
            </ul>
            <p className="text-[12px] mb-5" style={{ color: '#686868' }}>
              Aucun spam. Vous pourrez désactiver à tout moment depuis votre profil.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSoftPrompt(false)}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: 'transparent',
                  color: '#686868',
                  border: '1px solid rgba(40,40,45,0.18)',
                }}
              >
                Pas maintenant
              </button>
              <button
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#b8482a', color: '#ffffff' }}
              >
                {loading ? '…' : 'Activer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
