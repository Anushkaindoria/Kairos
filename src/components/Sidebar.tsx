import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, Target, TrendingUp,
  SlidersHorizontal, Bot, ShieldCheck,
} from 'lucide-react'

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
  return (
    <aside className="w-60 shrink-0 bg-[#0B1437] text-slate-300 p-5 flex flex-col gap-1">
      <div className="text-white text-2xl font-bold tracking-widest mb-8 px-3">KAIROS</div>
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
    </aside>
  )
}