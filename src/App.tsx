import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Page from './components/Page'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import { useProfile } from './store/ProfileContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Goals from './pages/Goals'
import Simulator from './pages/Simulator'

export default function App() {
  const { user, profile, login } = useProfile()
  const location = useLocation()

    if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onAuth={login} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }
    if (profile && location.pathname === '/edit-profile') {
    return (
      <Routes>
        <Route path="/edit-profile" element={<Onboarding />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/investments" element={<Page title="Investment Plan" subtitle="Recommended allocation." />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/assistant" element={<Page title="AI Assistant" subtitle="Local AI co-pilot." />} />
          <Route path="/privacy" element={<Page title="Privacy & Security" subtitle="Your data stays on your device." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}