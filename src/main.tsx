import { StrictMode, Component, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

type ErrorBoundaryProps = { children: ReactNode }
type ErrorBoundaryState = { hasError: boolean, error: Error | null }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      // Écran de secours : le détail technique reste dans la console, pas à l'écran.
      return (
        <div
          style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center',
            background: 'var(--color-bg, #faf7f2)', color: 'var(--color-text, #1a1a1a)',
            fontFamily: 'Outfit, system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Un instant…</h1>
          <p style={{ margin: 0, maxWidth: 320, lineHeight: 1.5 }}>
            L'application vient sans doute d'être mise à jour. Relancez-la pour retrouver votre suivi.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              minHeight: 48, padding: '0 24px', border: 'none', borderRadius: 4,
              background: '#a2371a', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Relancer l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Après une mise en ligne, un onglet resté ouvert peut demander un morceau de
// l'ancienne version, qui n'existe plus : on recharge une seule fois.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  try {
    if (sessionStorage.getItem('provap_reloaded')) return
    sessionStorage.setItem('provap_reloaded', '1')
  } catch { /* stockage indisponible : on recharge quand même */ }
  window.location.reload()
})
window.addEventListener('load', () => {
  // Chargement réussi : on autorise un nouveau rechargement automatique plus tard.
  setTimeout(() => { try { sessionStorage.removeItem('provap_reloaded') } catch { /* rien */ } }, 10000)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Enregistrement du service worker (PWA + offline cache).
// Désactivé en développement pour éviter les caches indésirables pendant le HMR Vite.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Échec silencieux : l'app fonctionne sans SW, pas un blocage.
    })
  })
}
