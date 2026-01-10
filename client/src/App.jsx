import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import ActivityFeedPage from './pages/ActivityFeedPage'
import RoadmapPage from './pages/RoadmapPage'
import SkillsPage from './pages/SkillsPage'
import { useEffect } from 'react'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-breathe">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-400 to-sage-400 opacity-60" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function OnboardingGuard({ children }) {
  const { user } = useAuthStore()

  if (user && !user.onboardingComplete) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={
          <ProtectedRoute>
            <OnboardingGuard>
              <Layout />
            </OnboardingGuard>
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />          <Route path="skills" element={<SkillsPage />} />          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="activity" element={<ActivityFeedPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
