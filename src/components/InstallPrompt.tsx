import { useEffect, useState } from 'react'
import { X, Share, Plus, Download, MoreVertical } from 'lucide-react'

const DISMISSED_KEY = 'provap_install_dismissed_v2'
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours
const SHOW_DELAY_MS = 3000
const ANDROID_PROMPT_FALLBACK_MS = 8000

function isDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY)
  if (!raw) return false
  const ts = parseInt(raw, 10)
  if (Number.isNaN(ts)) return false
  return (Date.now() - ts) < DISMISS_TTL_MS
}

function markDismissed() {
  localStorage.setItem(DISMISSED_KEY, String(Date.now()))
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Mode = 'hidden' | 'ios' | 'android-native' | 'android-manual'

export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>('hidden')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Déjà installée (PWA standalone) → on ne montre rien
    const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    const cssStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (navStandalone || cssStandalone) return

    // Déjà refusé récemment (TTL 7 jours puis re-prompt)
    if (isDismissedRecently()) return

    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) &&
                  !(window as Window & { MSStream?: unknown }).MSStream
    const isAndroid = /Android/.test(ua)

    let cancelled = false

    // Android : on écoute l'événement natif Chrome
    const handler = (e: Event) => {
      e.preventDefault()
      if (cancelled) return
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('android-native')
    }
    if (isAndroid) {
      window.addEventListener('beforeinstallprompt', handler as EventListener)
    }

    // iOS : on affiche les instructions Safari après un court délai
    const iosTimer = isIOS ? setTimeout(() => {
      if (!cancelled) setMode('ios')
    }, SHOW_DELAY_MS) : null

    // Android sans beforeinstallprompt (heuristique d'engagement Chrome
    // qui n'a pas encore déclenché l'event) → fallback instructions manuelles
    const androidFallbackTimer = isAndroid ? setTimeout(() => {
      if (cancelled) return
      // Si on n'a toujours pas reçu l'event natif, on affiche les instructions
      setMode(prev => prev === 'hidden' ? 'android-manual' : prev)
    }, ANDROID_PROMPT_FALLBACK_MS) : null

    return () => {
      cancelled = true
      if (isAndroid) window.removeEventListener('beforeinstallprompt', handler as EventListener)
      if (iosTimer) clearTimeout(iosTimer)
      if (androidFallbackTimer) clearTimeout(androidFallbackTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') {
      markDismissed()
    }
    setMode('hidden')
    setDeferred(null)
  }

  const dismiss = () => {
    markDismissed()
    setMode('hidden')
  }

  if (mode === 'hidden') return null

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed left-0 right-0 z-50 px-4 pointer-events-none"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        animation: 'installPromptSlide 0.4s ease-out',
      }}
    >
      <div
        className="pointer-events-auto mx-auto max-w-md rounded-2xl p-4 shadow-lg"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(40,40,45,0.08)',
          boxShadow: '0 12px 32px rgba(40,40,45,0.14), 0 2px 8px rgba(40,40,45,0.06)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#cb8002', color: '#fff' }}
          >
            <Download size={18} strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-[15px] leading-tight"
              style={{ color: '#28282d' }}
            >
              Installer <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}>Pro'Vap</span>
            </p>

            {mode === 'ios' && (
              <p className="text-[13px] mt-1 leading-snug" style={{ color: '#686868' }}>
                Dans Safari, appuyez sur{' '}
                <span className="inline-flex items-center align-middle mx-0.5" style={{ color: '#1f1f24' }}>
                  <Share size={13} strokeWidth={2} />
                </span>{' '}
                puis{' '}
                <span className="font-medium" style={{ color: '#1f1f24' }}>« Sur l'écran d'accueil »</span>{' '}
                <span className="inline-flex items-center align-middle">
                  <Plus size={12} strokeWidth={2.5} />
                </span>
              </p>
            )}

            {mode === 'android-native' && (
              <p className="text-[13px] mt-1 leading-snug" style={{ color: '#686868' }}>
                Ajoutez l'app à votre écran d'accueil pour un accès rapide, hors-ligne.
              </p>
            )}

            {mode === 'android-manual' && (
              <p className="text-[13px] mt-1 leading-snug" style={{ color: '#686868' }}>
                Dans Chrome, appuyez sur{' '}
                <span className="inline-flex items-center align-middle mx-0.5" style={{ color: '#1f1f24' }}>
                  <MoreVertical size={13} strokeWidth={2} />
                </span>{' '}
                puis{' '}
                <span className="font-medium" style={{ color: '#1f1f24' }}>« Installer l'application »</span>{' '}
                ou{' '}
                <span className="font-medium" style={{ color: '#1f1f24' }}>« Ajouter à l'écran d'accueil »</span>.
              </p>
            )}

            {mode === 'android-native' && (
              <button
                onClick={handleInstall}
                className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: '#a2371a',
                  color: '#ffffff',
                }}
              >
                Installer
              </button>
            )}
          </div>

          <button
            onClick={dismiss}
            aria-label="Fermer"
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ color: '#686868' }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes installPromptSlide {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
