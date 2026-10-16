import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Target, TrendingUp,
  SlidersHorizontal, Bot, ShieldCheck, Pencil, LogOut,
} from 'lucide-react'
import Logo from './Logo'
import { useProfile } from '../store/ProfileContext'

const links = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/investments', label: 'Investments', icon: TrendingUp },
  { to: '/simulator', label: 'Simulator', icon: SlidersHorizontal },
  { to: '/assistant', label: 'AI Assistant', icon: Bot },
  { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
]

export default function Sidebar() {
  const { user, logout } = useProfile()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <aside className="w-60 shrink-0 bg-[#0B1437] text-slate-300 p-5 flex flex-col gap-1">
      <div className="mb-8 px-1">
        <Logo light size={40} tagline={false} />
      </div>

      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              isActive ? 'bg-blue-600 text-white' : 'hover:bg-white/10'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}

      <div className="mt-auto pt-6 border-t border-white/10 space-y-1">
        <div className="px-3 pb-2">
          <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
          <div className="text-xs text-slate-400 truncate">{user?.email}</div>
        </div>
        <button
          onClick={() => navigate('/edit-profile')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-white/10 transition"
        >
          <Pencil size={18} /> Edit profile
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-300 hover:bg-red-500/10 transition"
        >
          <LogOut size={18} /> Log out
        </button>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Log out?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Are you sure you want to log out? Your details stay saved for next time.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Go back
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false)
                  logout()
                  navigate('/')
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}