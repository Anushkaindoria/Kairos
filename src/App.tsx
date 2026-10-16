import { Navigate, Route, Routes } from 'react-router-dom'
import { ProfileProvider, useProfile } from './store/ProfileContext'
import Sidebar from './components/Sidebar'
import Page from './components/Page'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Investment from './pages/Investment'
import Goals from './pages/Goals'
import Simulator from './pages/Simulator'

function Shell() {
  const { user, profile, login } = useProfile()

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login onAuth={login} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // Logged in, first-time onboarding
  if (!profile) return <Onboarding />

  // Logged in with profile
  return (
    <Routes>
      <Route path="/edit-profile" element={<Onboarding />} />
      <Route
        path="*"
        element={
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/investments" element={<Investment />} />
                <Route path="/simulator" element={<Simulator />} />
                <Route path="/assistant" element={<Page title="AI Assistant" subtitle="Coming soon." />} />
                <Route path="/privacy" element={<Page title="Privacy & Security" subtitle="Coming soon." />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <ProfileProvider>
      <Shell />
    </ProfileProvider>
  )
}