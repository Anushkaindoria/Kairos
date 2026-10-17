import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Gauge, Target, Zap, HandCoins } from 'lucide-react'
import Logo from '../components/Logo'

const TARGET = 2000000
const MONTHS = 60
const R = 0.01
const needSip = Math.round((TARGET * R) / (Math.pow(1 + R, MONTHS) - 1))
const inr = (n: number) => n.toLocaleString('en-IN')

function VelocityDemo() {
  const [sip, setSip] = useState(15000)
  const ratio = sip / needSip
  const status =
    ratio < 0.9
      ? { label: 'Lagging', color: '#fbbf24' }
      : ratio < 1.1
        ? { label: 'On Pace', color: '#22d3ee' }
        : { label: 'Accelerating', color: '#34d399' }
  const months = Math.ceil(Math.log(1 + (TARGET * R) / sip) / Math.log(1 + R))
  const diff = MONTHS - months
  const when = `${Math.floor(months / 12)} yr ${months % 12} mo`
  const verdict = diff > 0 ? `${diff} months early` : diff < 0 ? `${-diff} months late` : 'right on time'
  const fill = Math.min(100, (ratio / 1.5) * 100)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-600 text-white p-5 sm:p-7 shadow-2xl shadow-brand-500/30">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl" />
      <div className="relative">
        <div className="text-sm text-slate-300">Goal: Home down payment, ₹20 L in 5 years</div>

        <div className="relative w-full max-w-64 mx-auto mt-4">
          <svg viewBox="0 0 200 110" className="w-full">
            <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="14" strokeLinecap="round" pathLength={100} />
            <path
              d="M 10 100 A 90 90 0 0 1 190 100"
              fill="none"
              stroke={status.color}
              strokeWidth="14"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${fill} 100`}
              style={{ transition: 'all 400ms ease' }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <div className="text-2xl font-extrabold" style={{ color: status.color }}>
              {status.label}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <span className="text-sm text-slate-300">Your monthly SIP</span>
          <span className="text-2xl font-extrabold">₹{inr(sip)}</span>
        </div>
        <input
          type="range"
          min={5000}
          max={40000}
          step={500}
          value={sip}
          onChange={(e) => setSip(Number(e.target.value))}
          aria-label="Monthly SIP"
          className="w-full mt-2 accent-cyan-400"
        />
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>₹5K</span>
          <span>₹40K</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl bg-white/10 p-3.5">
            <div className="text-[11px] text-slate-300">You reach the goal in</div>
            <div className="font-extrabold mt-0.5">{when}</div>
            <div className="text-xs mt-0.5" style={{ color: status.color }}>
              {verdict}
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-3.5">
            <div className="text-[11px] text-slate-300">SIP needed to stay on pace</div>
            <div className="font-extrabold mt-0.5">₹{inr(needSip)}</div>
            <div className="text-xs text-slate-300 mt-0.5">at 12% a year</div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-4">Demo with sample numbers. Drag the slider.</p>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-20 backdrop-blur-md bg-white/60 border-b border-white/50">
        <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <Logo size={40} tagline={false} />
          <div className="flex items-center gap-2">
            <Link to="/login?mode=login" className="px-2 sm:px-4 py-2 text-sm font-semibold text-slate-700 hover:text-brand-600">
              Log in
            </Link>
            <Link
              to="/login?mode=signup"
              className="px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-14 sm:pb-20 grid lg:grid-cols-[1.05fr_1fr] gap-8 sm:gap-12 items-center">
        <div>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] text-ink-900 break-words">
            Know if your money is keeping up with your dreams.
          </h1>
          <p className="text-lg text-slate-600 mt-6 max-w-lg">
            KAIROS tracks every goal, tells you how fast you are really moving, and warns you before one bad purchase or one bad day in the market costs you.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link
              to="/login?mode=signup"
              className="px-8 py-3.5 rounded-xl font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition"
            >
              Build my cockpit
            </Link>
            <Link to="/login?mode=login" className="font-semibold text-slate-700 hover:text-brand-600">
              I already have an account
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-8 text-sm text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            Your data never leaves your phone. Setup takes about 2 minutes.
          </div>
        </div>
        <VelocityDemo />
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
        <h2 className="text-3xl sm:text-3xl font-extrabold text-ink-900 max-w-xl">Four things your bank app never tells you.</h2>
        <div className="grid md:grid-cols-6 gap-5 mt-8">
          <div className="card p-5 sm:p-7 md:col-span-4">
            <Gauge className="text-brand-600" size={28} />
            <h3 className="text-xl font-bold mt-3">Wealth Velocity Cockpit</h3>
            <p className="text-slate-500 mt-1 max-w-md">One glance shows whether you are ahead, on track or falling behind, plus what is safe to spend today.</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Lagging</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-700">On Pace</span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Accelerating</span>
            </div>
          </div>

          <div className="card p-5 sm:p-7 md:col-span-2 bg-brand-600/5">
            <Zap className="text-brand-600" size={28} />
            <h3 className="text-xl font-bold mt-3">What-If Simulator</h3>
            <p className="text-slate-500 mt-1">Planning to buy a ₹60,000 phone? See your home goal slip by days, before you pay.</p>
          </div>

          <div className="card p-5 sm:p-7 md:col-span-2">
            <HandCoins className="text-brand-600" size={28} />
            <h3 className="text-xl font-bold mt-3">Panic circuit-breaker</h3>
            <p className="text-slate-500 mt-1">Market falling and your finger is on Sell? We pause, show the facts and ask you to think twice.</p>
          </div>

          <div className="card p-5 sm:p-7 md:col-span-4">
            <Target className="text-brand-600" size={28} />
            <h3 className="text-xl font-bold mt-3">Milestone Glidepath</h3>
            <p className="text-slate-500 mt-1 max-w-md">Home, retirement, child education or your own dream. Move the time or the SIP and watch the plan update live.</p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 sm:pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-600 text-white p-6 sm:p-14 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-extrabold">Your money data stays with you.</h2>
            <p className="text-slate-300 mt-3 max-w-md">Every calculation and every AI suggestion runs on your own device. No public AI APIs, no uploads.</p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="rounded-2xl bg-white/10 px-4 py-3">AI runs on your device, even without internet</li>
            <li className="rounded-2xl bg-white/10 px-4 py-3">Nothing is sent to any server</li>
            <li className="rounded-2xl bg-white/10 px-4 py-3">Built around a study of 48 Indian investors</li>
          </ul>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-900">Ready to see your own cockpit?</h2>
        <Link
          to="/login?mode=signup"
          className="inline-block mt-7 px-9 py-4 rounded-xl font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition"
        >
          Sign up free
        </Link>
      </section>

      <footer className="text-center text-xs text-slate-400 pb-8">KAIROS · Globathon 2026</footer>
    </div>
  )
}
