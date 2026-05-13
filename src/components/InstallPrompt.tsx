import { useEffect, useState } from 'react'
import { X, Share, Plus, Download } from 'lucide-react'

const DISMISSED_KEY = 'provap_install_dismissed_v1'
const SHOW_DELAY_MS = 30000

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Mode = 'hidden' | 'ios' | 'android'

export function InstallPrompt() {
  const [mode, setMode] = useState<Mode>('hidden')
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Déjà installée (PWA standalone) → on ne montre rien
    const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    const cssStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (navStandalone || cssStandalone) return

    // Déjà refusé une fois
    if (localStorage.getItem(DISMISSED_KEY) === '1') return

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                  !(window as Window & { MSStream?: unknown }).MSStream

    let cancelled = false

    const handler = (e: Event) => {
      e.preventDefault()
      if (cancelled) return
      setDeferred(e as BeforeInstallPromptEvent)
      setMode('android')
    }
    window.addEventListener('beforeinstallprompt', handler as EventListener)

    const timer = setTimeout(() => {
      if (cancelled) return
      if (isIOS) setMode('ios')
    }, SHOW_DELAY_MS)

    return () => {
      cancelled = true
      window.removeEventListener('beforeinstallprompt', handler as EventListener)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    setMode('hidden')
    setDeferred(null)
  }

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setMode('hidden')
  }

  if (mode === 'hidden') return null

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed left-0 right-0 z-50 px-4 pointer-events-none"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
        animation: 'installPromptSlide 0.4s ease-out',
      }}
    >
      <div
        className="pointer-events-auto mx-auto max-w-md rounded-2xl p-4 shadow-lg"
        style={{
          background: 'var(--color-bg-card, #ffffff)',
          border: '1px solid rgba(40,40,45,0.08)',
          boxShadow: '0 12px 32px rgba(40,40,45,0.12), 0 2px 8px rgba(40,40,45,0.06)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--color-pv-ochre, #cb8002)', color: '#fff' }}
          >
            <Download size={18} strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-[15px] leading-tight"
              style={{ color: 'var(--color-pv-charcoal, #28282d)' }}
            >
              Installer <span className="display-italic">Pro'Vap</span>
            </p>
            <p
              className="text-[13px] mt-1 leading-snug"
              style={{ color: 'var(--color-pv-gray-d, #686868)' }}
            >
              {mode === 'ios' ? (
                <>
                  Appuyez sur{' '}
                  <span className="inline-flex items-center align-middle mx-0.5">
                    <Share size={13} strokeWidth={2} />
                  </span>{' '}
                  puis{' '}
                  <span className="font-medium">« Sur l'écran d'accueil »</span>{' '}
                  <span className="inline-flex items-center align-middle">
                    <Plus size={12} strokeWidth={2.5} />
                  </span>
                </>
              ) : (
                <>Ajoutez l'app à votre écran d'accueil pour un accès rapide, hors-ligne.</>
              )}
            </p>

            {mode === 'android' && (
              <button
                onClick={handleInstall}
                className="mt-3 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  background: 'var(--color-pv-terracotta, #b8482a)',
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
            style={{ color: 'var(--color-pv-gray-d, #686868)' }}
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
