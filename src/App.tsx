import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { BottomNav } from './components/BottomNav'
import { InstallPrompt } from './components/InstallPrompt'
import { Toaster } from 'react-hot-toast'
import { IS_FULL } from './lib/appMode'

// Pages
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { LegalPage } from './pages/LegalPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { JournalPage } from './pages/JournalPage'
import { BoutiquesPage } from './pages/BoutiquesPage'
import { HomePage } from './pages/HomePage'
import { SosPage } from './pages/SosPage'
import { BadgesPage } from './pages/BadgesPage'
import { ContentPage } from './pages/ContentPage'
import { JourneyPage } from './pages/JourneyPage'
import { ProfilePage } from './pages/ProfilePage'
import { AdminPage } from './pages/AdminPage'
import { FagerstromPage } from './pages/FagerstromPage'
import { DiagnosticKitPage } from './pages/DiagnosticKitPage'

function Layout() {
  // ChatBot mis en pause pour la V1 — le moteur à règles actuel ne donne pas
  // une qualité de réponse suffisante. Réactivation prévue en V2 avec une
  // intégration IA (Claude API ou hybride règles + Claude).
  // Le code reste en place dans src/components/ChatBot.tsx pour V2.
  return (
    <>
      <Outlet />
      <BottomNav />
      <InstallPrompt />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
