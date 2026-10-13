import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Page from './components/Page'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import { useProfile } from './store/ProfileContext'

export default function App() {
  const { user, profile, login } = useProfile()

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onAuth={login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Page title="Wealth Velocity Cockpit" subtitle="Your financial snapshot." />} />
          <Route path="/transactions" element={<Page title="Transactions" subtitle="Spending intelligence." />} />
          <Route path="/goals" element={<Page title="Goals" subtitle="Milestone glidepath." />} />
          <Route path="/investments" element={<Page title="Investment Plan" subtitle="Recommended allocation." />} />
          <Route path="/simulator" element={<Page title="What-If Simulator" subtitle="See the impact of a purchase." />} />
          <Route path="/assistant" element={<Page title="AI Assistant" subtitle="Local AI co-pilot." />} />
          <Route path="/privacy" element={<Page title="Privacy & Security" subtitle="Your data stays on your device." />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}