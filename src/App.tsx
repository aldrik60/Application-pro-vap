import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { BottomNav } from './components/BottomNav'
import { InstallPrompt } from './components/InstallPrompt'
import { Toaster } from 'react-hot-toast'
import { IS_FULL } from './lib/appMode'

// Pages chargées à la demande (code-splitting Vite : chaque page = chunk séparé)
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })))
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const JournalPage = lazy(() => import('./pages/JournalPage').then(m => ({ default: m.JournalPage })))
const BoutiquesPage = lazy(() => import('./pages/BoutiquesPage').then(m => ({ default: m.BoutiquesPage })))
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const SosPage = lazy(() => import('./pages/SosPage').then(m => ({ default: m.SosPage })))
const BadgesPage = lazy(() => import('./pages/BadgesPage').then(m => ({ default: m.BadgesPage })))
const ContentPage = lazy(() => import('./pages/ContentPage').then(m => ({ default: m.ContentPage })))
const JourneyPage = lazy(() => import('./pages/JourneyPage').then(m => ({ default: m.JourneyPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))
const FagerstromPage = lazy(() => import('./pages/FagerstromPage').then(m => ({ default: m.FagerstromPage })))
const DiagnosticKitPage = lazy(() => import('./pages/DiagnosticKitPage').then(m => ({ default: m.DiagnosticKitPage })))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div
        className="w-10 h-10 rounded-full border-2"
        style={{
          borderColor: 'rgba(184, 72, 42, 0.18)',
          borderTopColor: 'var(--color-pv-terracotta, #b8482a)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Layout() {
  // ChatBot mis en pause pour la V1 — le moteur à règles actuel ne donne pas
  // une qualité de réponse suffisante. Réactivation prévue en V2 avec une
  // intégration IA (Claude API ou hybride règles + Claude).
  // Le code reste en place dans src/components/ChatBot.tsx pour V2.
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/mentions-legales" element={<LegalPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

            {/* Protected Routes with Navigation + ChatBot */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<HomePage />} />
              <Route path="/badges" element={<BadgesPage />} />
              <Route path="/contenu" element={<ContentPage />} />
              <Route path="/parcours" element={<JourneyPage />} />
              <Route path="/profil" element={<ProfilePage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/boutiques" element={<BoutiquesPage />} />

              {/* Admin Route */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
            </Route>

            {/* Fullscreen routes (no BottomNav, no ChatBot) */}
            <Route path="/sos" element={<ProtectedRoute><SosPage /></ProtectedRoute>} />
            <Route path="/fagerstrom" element={<ProtectedRoute><FagerstromPage /></ProtectedRoute>} />
            {IS_FULL && (
              <Route path="/diagnostic-kit" element={<ProtectedRoute><DiagnosticKitPage /></ProtectedRoute>} />
            )}
          </Routes>
        </Suspense>
        <InstallPrompt />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
