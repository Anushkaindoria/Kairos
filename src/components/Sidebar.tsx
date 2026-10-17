import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Target, TrendingUp,
  SlidersHorizontal, Bot, ShieldCheck, Pencil, LogOut, X,
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileButtonRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLElement>(null)
  const wasMobileOpen = useRef(false)

  useEffect(() => {
    if (!mobileOpen) {
      if (wasMobileOpen.current) mobileButtonRef.current?.focus()
      wasMobileOpen.current = false
      return
    }

    wasMobileOpen.current = true
    const menu = mobileMenuRef.current
    if (!menu) return
    const getFocusable = () => Array.from(menu.querySelectorAll<HTMLElement>('a, button'))
    getFocusable()[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const goTo = (to: string) => {
    setMobileOpen(false)
    navigate(to)
  }

  const navLinks = (mobile = false) => links.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      onClick={() => mobile && setMobileOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
          isActive ? 'bg-blue-600 text-white' : 'hover:bg-white/10'
        }`
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  ))

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between bg-[#0B1437] px-4 py-3 text-slate-300 lg:hidden">
        <Logo light size={30} tagline={false} />
        <button
          type="button"
          ref={mobileButtonRef}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-lg p-2 hover:bg-white/10"
        >
          {mobileOpen ? <X size={22} /> : <span aria-hidden="true" className="flex h-5 w-5 flex-col justify-center gap-1"><span className="h-0.5 w-5 bg-current" /><span className="h-0.5 w-5 bg-current" /><span className="h-0.5 w-5 bg-current" /></span>}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 top-[65px] z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <nav
            ref={mobileMenuRef}
            aria-label="Mobile navigation"
            aria-modal="true"
            role="dialog"
            className="max-h-[calc(100vh-65px)] overflow-y-auto bg-[#0B1437] p-4 text-slate-300 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-1">{navLinks(true)}</div>
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="px-3 pb-2">
                <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
                <div className="truncate text-xs text-slate-400">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={() => goTo('/edit-profile')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-white/10"
              >
                <Pencil size={18} /> Edit profile
              </button>
              <button
                type="button"
                onClick={() => { setMobileOpen(false); setConfirmOpen(true) }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
              >
                <LogOut size={18} /> Log out
              </button>
            </div>
          </nav>
        </div>
      )}

      <aside className="hidden w-60 shrink-0 flex-col gap-1 bg-[#0B1437] p-5 text-slate-300 lg:flex">
      <div className="mb-8 px-1">
        <Logo light size={40} tagline={false} />
      </div>

      {navLinks()}

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

      </aside>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold">Log out?</h3>
            <p className="mt-1 text-sm text-slate-500">
              Are you sure you want to log out? Your details stay saved for next time.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Go back
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false)
                  logout()
                  navigate('/')
                }}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
              >
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
