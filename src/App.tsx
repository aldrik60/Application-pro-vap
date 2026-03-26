import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { BottomNav } from './components/BottomNav'
import { ChatBot } from './components/ChatBot'
import { Toaster } from 'react-hot-toast'

// Pages
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
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
  return (
    <>
      <Outlet />
      <BottomNav />
      <ChatBot />
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

          {/* Protected Routes with Navigation + ChatBot */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/badges" element={<BadgesPage />} />
            <Route path="/contenu" element={<ContentPage />} />
            <Route path="/parcours" element={<JourneyPage />} />
            <Route path="/profil" element={<ProfilePage />} />

            {/* Admin Route */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
          </Route>

          {/* Fullscreen routes (no BottomNav, no ChatBot) */}
          <Route path="/sos" element={<ProtectedRoute><SosPage /></ProtectedRoute>} />
          <Route path="/fagerstrom" element={<ProtectedRoute><FagerstromPage /></ProtectedRoute>} />
          <Route path="/diagnostic-kit" element={<ProtectedRoute><DiagnosticKitPage /></ProtectedRoute>} />
        </Routes>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1E1E22',
              color: '#F1F1F1',
              border: '1px solid #2E2E32',
              borderRadius: '10px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
