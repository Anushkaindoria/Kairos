import { useState } from 'react'
import { Plus, X, ChevronDown, Trash2, Target, TrendingUp, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useProfile } from '../store/ProfileContext'
import { goalProgress, short } from '../lib/finance'
import { TX_KEY } from '../lib/reminder'
import type { Goal, GoalType } from '../types'

const GOAL_TYPES: GoalType[] = ['Home Purchase', 'Retirement', 'Wealth Growth', 'Short-Term Liquidity', 'Child Education', 'Custom']

const goalIcon: Record<string, string> = {
  'Home Purchase': '🏠',
  Retirement: '🌴',
  'Wealth Growth': '🚀',
  'Short-Term Liquidity': '💧',
  'Child Education': '🎓',
  Custom: '✨',
}

const goalGradient: Record<string, string> = {
  'Home Purchase': 'from-indigo-500 to-blue-400',
  Retirement: 'from-amber-400 to-orange-400',
  'Wealth Growth': 'from-fuchsia-500 to-pink-400',
  'Short-Term Liquidity': 'from-cyan-400 to-sky-500',
  'Child Education': 'from-emerald-400 to-teal-400',
  Custom: 'from-violet-500 to-indigo-400',
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

const fmtMonths = (m: number) => {
  if (!isFinite(m) || m > 1200) return 'Not reachable'
  const y = Math.floor(m / 12)
  const mo = m % 12
  if (y && mo) return `${y}y ${mo}m`
  if (y) return `${y}y`
  return `${mo}m`
}

const monthYear = (d: Date) => d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

const addMonths = (n: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return d
}

function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-ink-900">{pct}%</div>
    </div>
  )
}

export default function Goals() {
  const { profile, saveProfile } = useProfile()
  const [open, setOpen] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [err, setErr] = useState('')
  const [gf, setGf] = useState({
    type: 'Custom' as GoalType,
    name: '',
    targetAmount: 0,
    targetDate: '',
    flexibility: 'Flexible' as Goal['flexibility'],
  })
  if (!profile) return null

  let txs: any[] = []
  try {
    txs = JSON.parse(localStorage.getItem(TX_KEY) || '[]')
  } catch {
    /* ignore */
  }
  const d = goalProgress(profile, txs)

  const yr = profile.risk === 'Conservative' ? 0.08 : profile.risk === 'Aggressive' ? 0.13 : 0.11
  const r = yr / 12

  const glide = (months: number, share: number, need: number) => {
    const step = months > 60 ? 12 : months > 24 ? 6 : 3
    const pts: { label: string; mine: number; need: number }[] = []
    const fv = (s: number, t: number) => (s * (Math.pow(1 + r, t) - 1)) / r
    for (let t = 0; t <= months; t += step) {
      pts.push({ label: monthYear(addMonths(t)), mine: Math.round(fv(share, t)), need: Math.round(fv(need, t)) })
    }
    if ((months % step) !== 0) pts.push({ label: monthYear(addMonths(months)), mine: Math.round(fv(share, months)), need: Math.round(fv(need, months)) })
    return pts
  }

  const saveGoal = () => {
    if (!gf.name.trim()) return setErr('Give your goal a name.')
    if (gf.targetAmount <= 0) return setErr('Enter a target amount.')
    if (!gf.targetDate) return setErr('Pick a target date.')
    if (new Date(gf.targetDate).getTime() <= Date.now()) return setErr('Target date must be in the future.')
    setErr('')
    saveProfile({ ...profile, goals: [...(profile.goals ?? []), { id: crypto.randomUUID(), ...gf, name: gf.name.trim() }] })
    setGf({ ...gf, name: '', targetAmount: 0, targetDate: '' })
    setAdding(false)
  }

  const removeGoal = (id: string) => {
    saveProfile({ ...profile, goals: (profile.goals ?? []).filter((g) => g.id !== id) })
    setOpen(null)
  }

  const onTrackCount = d.items.filter((g) => g.onTrack).length
  const totalTarget = d.items.reduce((a, g) => a + g.targetAmount, 0)
  const totalProjected = d.items.reduce((a, g) => a + g.projected, 0)
  const worst = [...d.items].sort((a, b) => b.gap - a.gap)[0]

  const tiles = [
    { label: 'Total target', value: short(totalTarget), icon: Target, tone: 'text-brand-600 bg-brand-500/10' },
    { label: 'Projected by deadlines', value: short(totalProjected), icon: TrendingUp, tone: 'text-cyan-600 bg-cyan-500/10' },
    { label: 'Effective monthly SIP', value: short(d.effSip), icon: Wallet, tone: 'text-amber-600 bg-amber-500/10' },
    { label: 'Goals on track', value: `${onTrackCount} / ${d.items.length}`, icon: CheckCircle2, tone: 'text-emerald-600 bg-emerald-500/10' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900">Your Financial Goals</h1>
          <p className="mt-1 text-slate-500">Turn your dreams into a clear, achievable plan.</p>
        </div>
        <button
          onClick={() => {
            setAdding(!adding)
            setErr('')
          }}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-500"
        >
          {adding ? <X size={16} /> : <Plus size={16} />} {adding ? 'Close' : 'Add Goal'}
        </button>
      </div>

      {/* Add goal form */}
      {adding && (
        <div className="card space-y-4 p-6">
          <div className="text-sm font-bold text-ink-900">New goal</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="Goal name (e.g. Europe Trip)" value={gf.name} onChange={(e) => setGf({ ...gf, name: e.target.value })} />
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-slate-400">₹</span>
              <input
                className={`${inputCls} pl-7`}
                inputMode="numeric"
                placeholder="Target amount"
                value={gf.targetAmount ? gf.targetAmount.toLocaleString('en-IN') : ''}
                onChange={(e) => setGf({ ...gf, targetAmount: Number(e.target.value.replace(/\D/g, '')) })}
              />
            </div>
            <input type="date" className={inputCls} value={gf.targetDate} onChange={(e) => setGf({ ...gf, targetDate: e.target.value })} />
            <select className={inputCls} value={gf.type} onChange={(e) => setGf({ ...gf, type: e.target.value as GoalType })}>
              {GOAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {goalIcon[t]} {t}
                </option>
              ))}
            </select>
          </div>
          {err && <p className="text-sm text-red-500">{err}</p>}
          <div className="flex gap-3">
            <button onClick={saveGoal} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-500">
              Save goal
            </button>
            <button onClick={() => setAdding(false)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary tiles */}
      {d.items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className="card p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${t.tone}`}>
                <t.icon size={18} />
              </div>
              <div className="mt-3 text-xl font-extrabold text-ink-900">{t.value}</div>
              <div className="text-xs text-slate-500">{t.label}</div>
            </div>
          ))}
        </div>
      )}

      {d.extra > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p>
            Your spending in the last 30 days is {short(d.extra)} above your plan, so {short(d.extra)} is being cut from your monthly SIP. Your goals are
            taking longer because of it.
          </p>
        </div>
      )}

      {d.items.length === 0 && (
        <div className="card p-10 text-center text-slate-500">
          <div className="text-4xl">🎯</div>
          <p className="mt-2 font-semibold text-slate-700">No goals yet</p>
          <p className="mt-1 text-sm">Tap Add Goal to create your first milestone.</p>
        </div>
      )}

      {/* Goal cards */}
      <div className="space-y-4">
        {d.items.map((g, i) => {
          const ratio = g.need > 0 ? g.share / g.need : 1
          const status = g.onTrack
            ? { label: 'On track', cls: 'bg-emerald-100 text-emerald-700', color: '#10b981' }
            : ratio >= 0.6
              ? { label: 'Slightly behind', cls: 'bg-amber-100 text-amber-700', color: '#f59e0b' }
              : { label: 'Needs attention', cls: 'bg-rose-100 text-rose-700', color: '#f43f5e' }
          const isOpen = open === g.id
          const delay = g.monthsToFinish - g.monthsLeft
          const finishDate = isFinite(g.monthsToFinish) && g.monthsToFinish <= 1200 ? monthYear(addMonths(g.monthsToFinish)) : null
          return (
            <div key={g.id} className="card overflow-hidden">
              <button className="flex w-full items-center gap-4 p-4 text-left sm:gap-5" onClick={() => setOpen(isOpen ? null : g.id)}>
                <div
                  className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-4xl shadow-md ${goalGradient[g.type] ?? goalGradient.Custom}`}
                >
                  {goalIcon[g.type] ?? '✨'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-ink-900">{g.name || g.type}</span>
                    {i === 0 && <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600">Primary goal</span>}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {short(g.targetAmount)} target • {monthYear(new Date(g.targetDate))} • {Math.round((g.monthsLeft / 12) * 10) / 10} yrs left
                  </div>
                  <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full" style={{ width: `${g.pct}%`, background: status.color }} />
                  </div>
                  {!g.onTrack && <div className="mt-1.5 text-xs font-medium text-amber-600">Needs {short(g.gap)}/month more to stay on plan</div>}
                </div>

                <div className="hidden items-center gap-5 border-l border-slate-200 pl-5 sm:flex">
                  <Ring pct={g.pct} color={status.color} />
                  <div>
                    <div className="text-xl font-extrabold text-ink-900">{short(g.projected)}</div>
                    <div className="text-xs text-slate-500">Projected by deadline</div>
                  </div>
                </div>
                <ChevronDown size={20} className={`shrink-0 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="space-y-5 border-t border-slate-100 bg-slate-50/60 p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { l: 'Required SIP', v: `${short(g.need)}/mo` },
                      { l: 'Your SIP for this goal', v: `${short(g.share)}/mo` },
                      { l: 'Time to reach target', v: fmtMonths(g.monthsToFinish) },
                      { l: 'Planned deadline', v: fmtMonths(g.monthsLeft) },
                    ].map((x) => (
                      <div key={x.l} className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">{x.l}</div>
                        <div className="mt-0.5 font-bold text-ink-900">{x.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl bg-white p-4 text-sm text-slate-600">
                    {g.onTrack ? (
                      <>You are on track to reach this goal by {monthYear(new Date(g.targetDate))}.</>
                    ) : finishDate ? (
                      <>
                        At your current pace you will reach this goal around <b>{finishDate}</b>, which is <b>{fmtMonths(Math.max(0, delay))}</b> later than planned.
                      </>
                    ) : (
                      <>At your current SIP this goal cannot be reached. Increase your SIP or extend the deadline.</>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-bold text-ink-900">Glidepath</div>
                    <div className="h-56 rounded-xl bg-white p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={glide(g.monthsLeft, g.share, g.need)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={30} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => short(v)} width={60} />
                          <Tooltip formatter={(v) => short(Number(v))} />
                          <Line type="monotone" dataKey="need" name="Required path" stroke="#94a3b8" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                          <Line type="monotone" dataKey="mine" name="Your path" stroke={status.color} dot={false} strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-4 rounded" style={{ background: status.color }} /> Your path
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-0.5 w-4 border-t-2 border-dashed border-slate-400" /> Required path
                      </span>
                    </div>
                  </div>

                  <button onClick={() => removeGoal(g.id)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-500">
                    <Trash2 size={14} /> Remove goal
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Feasibility */}
      {worst && (
        <div className="card flex flex-wrap items-center gap-4 border border-brand-500/20 bg-gradient-to-r from-brand-500/10 to-accent-400/10 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow">🎯</div>
          <div className="min-w-[240px] flex-1">
            <div className="font-bold text-brand-600">Goal Feasibility Analysis</div>
            <p className="mt-1 text-sm text-slate-600">
              Based on your current SIP of {short(d.effSip)}/month
              {d.extra > 0 ? ` (reduced by ${short(d.extra)} due to overspending)` : ''},{' '}
              {worst.onTrack
                ? 'all your goals are on track. Keep it up.'
                : `"${worst.name || worst.type}" needs about ${short(worst.gap)}/month more, or its timeline extended by ${fmtMonths(Math.max(0, worst.monthsToFinish - worst.monthsLeft))}.`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
