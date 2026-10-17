import { useState } from 'react'
import { Plus, X, ChevronDown, Trash2, Target, TrendingUp, Wallet, CheckCircle2, AlertTriangle } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useProfile } from '../store/ProfileContext'
import { calculateEmi, goalProgress, short, type TxLite } from '../lib/finance'
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

const newGoalForm = () => ({
  type: 'Custom' as GoalType,
  name: '',
  targetAmount: 0,
  targetDate: '',
  flexibility: 'Flexible' as Goal['flexibility'],
  purchaseMode: 'cash' as 'cash' | 'emi',
  downPayment: 0,
  tenureMonths: 12,
  annualRate: 0,
})

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
  const [gf, setGf] = useState(newGoalForm)
  if (!profile) return null

  let txs: TxLite[] = []
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
    if (gf.purchaseMode === 'emi') {
      if (gf.downPayment < 0 || gf.downPayment >= gf.targetAmount) return setErr('Down payment must be less than the purchase price.')
      if (gf.tenureMonths < 1 || gf.tenureMonths > 84) return setErr('Choose an EMI tenure between 1 and 84 months.')
      if (gf.annualRate < 0 || gf.annualRate > 50) return setErr('Enter an annual interest rate between 0% and 50%.')
    }
    setErr('')
    const goal: Goal = {
      id: crypto.randomUUID(),
      type: gf.type,
      name: gf.name.trim(),
      targetAmount: gf.targetAmount,
      targetDate: gf.targetDate,
      flexibility: gf.flexibility,
      ...(gf.purchaseMode === 'emi'
        ? { financing: { type: 'emi' as const, downPayment: gf.downPayment, tenureMonths: gf.tenureMonths, annualRate: gf.annualRate } }
        : {}),
    }
    saveProfile({ ...profile, goals: [...(profile.goals ?? []), goal] })
    setGf(newGoalForm())
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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">Your Financial Goals</h1>
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
        <div className="card space-y-4 p-4 sm:p-6">
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
            <label className="text-xs font-semibold text-slate-500">
              {gf.purchaseMode === 'emi' ? 'Purchase date' : 'Target date'}
              <input type="date" className={`${inputCls} mt-1`} value={gf.targetDate} onChange={(e) => setGf({ ...gf, targetDate: e.target.value })} />
            </label>
            <select className={inputCls} value={gf.type} onChange={(e) => setGf({ ...gf, type: e.target.value as GoalType })}>
              {GOAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {goalIcon[t]} {t}
                </option>
              ))}
            </select>
            <label className="text-xs font-semibold text-slate-500">
              Purchase approach
              <select className={`${inputCls} mt-1`} value={gf.purchaseMode} onChange={(e) => setGf({ ...gf, purchaseMode: e.target.value as 'cash' | 'emi' })}>
                <option value="cash">Save the full amount first</option>
                <option value="emi">Buy with an EMI plan</option>
              </select>
            </label>
          </div>
          {gf.purchaseMode === 'emi' && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
              <div className="flex items-start gap-3">
                <div className="text-xl">🧾</div>
                <div>
                  <div className="font-bold text-indigo-950">Plan the purchase in two parts</div>
                  <p className="mt-1 text-xs leading-5 text-indigo-800">
                    KAIROS will plan your goal around the upfront down payment, then show the monthly repayment separately so a large purchase does not look like a regular savings goal.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-semibold text-indigo-900">
                  Down payment
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-sm text-indigo-400">₹</span>
                    <input
                      className={`${inputCls} border-indigo-200 pl-7`}
                      inputMode="numeric"
                      placeholder="Amount due upfront"
                      value={gf.downPayment ? gf.downPayment.toLocaleString('en-IN') : ''}
                      onChange={(e) => setGf({ ...gf, downPayment: Number(e.target.value.replace(/\D/g, '')) })}
                    />
                  </div>
                </label>
                <label className="text-xs font-semibold text-indigo-900">
                  EMI tenure
                  <div className="relative mt-1">
                    <input
                      className={`${inputCls} border-indigo-200 pr-12`}
                      type="number"
                      min="1"
                      max="84"
                      value={gf.tenureMonths}
                      onChange={(e) => setGf({ ...gf, tenureMonths: Number(e.target.value) })}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-indigo-400">months</span>
                  </div>
                </label>
                <label className="text-xs font-semibold text-indigo-900">
                  Annual interest rate
                  <div className="relative mt-1">
                    <input
                      className={`${inputCls} border-indigo-200 pr-8`}
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={gf.annualRate}
                      onChange={(e) => setGf({ ...gf, annualRate: Number(e.target.value) })}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-indigo-400">%</span>
                  </div>
                </label>
              </div>
              {gf.targetAmount > 0 && gf.downPayment < gf.targetAmount && (
                <div className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-sm text-indigo-900">
                  Estimated repayment: <b>{short(calculateEmi(gf.targetAmount - gf.downPayment, gf.annualRate, gf.tenureMonths))}/month</b> for {gf.tenureMonths} months.
                </div>
              )}
            </div>
          )}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
               <button className="flex w-full items-center gap-3 p-3 text-left sm:gap-5 sm:p-4" onClick={() => setOpen(isOpen ? null : g.id)}>
                 <div
                   className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-3xl shadow-md sm:h-20 sm:w-20 sm:text-4xl ${goalGradient[g.type] ?? goalGradient.Custom}`}
                >
                  {goalIcon[g.type] ?? '✨'}
                </div>

                <div className="min-w-0 flex-1">
                   <div className="flex flex-wrap items-center gap-2">
                     <span className="text-lg font-bold text-ink-900">{g.name || g.type}</span>
                     {i === 0 && <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600">Primary goal</span>}
                    {g.emi && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">EMI purchase</span>}
                     <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.cls}`}>{status.label}</span>
                   </div>
                   <div className="mt-0.5 text-sm text-slate-500">
                    {g.emi ? `${short(g.targetAmount)} purchase • ${short(g.fundingTarget)} down payment` : `${short(g.targetAmount)} target`}{' '}
                    • {monthYear(new Date(g.targetDate))} • {Math.round((g.monthsLeft / 12) * 10) / 10} yrs left
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
                  {g.emi && (
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-950">
                      <div className="font-bold">EMI purchase plan</div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl bg-white/80 p-3">
                          <div className="text-xs text-indigo-600">Save by purchase date</div>
                          <div className="mt-0.5 font-bold">{short(g.emi.downPayment)}</div>
                        </div>
                        <div className="rounded-xl bg-white/80 p-3">
                          <div className="text-xs text-indigo-600">Monthly EMI</div>
                          <div className="mt-0.5 font-bold">{short(g.emi.monthly)}</div>
                          <div className="text-xs text-indigo-600">for {g.emi.tenureMonths} months</div>
                        </div>
                        <div className="rounded-xl bg-white/80 p-3">
                          <div className="text-xs text-indigo-600">Total repayment</div>
                          <div className="mt-0.5 font-bold">{short(g.emi.totalRepayment)}</div>
                          <div className="text-xs text-indigo-600">{g.emi.annualRate}% annual interest</div>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-indigo-800">
                        After the purchase date, this EMI will sit alongside your goal plan. You currently have{' '}
                        <b>{short(Math.max(0, d.left))}/month</b> left after your planned SIP and spending.
                        {g.emi.monthly > Math.max(0, d.left)
                          ? ' The repayment is higher than that buffer, so extend the goal, increase income, or lower the purchase price before committing.'
                          : ' That leaves room for the repayment without reducing your current SIP plan.'}
                      </p>
                    </div>
                  )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                     <div className="h-56 min-w-0 rounded-xl bg-white p-2 sm:p-3">
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
           <div className="min-w-0 flex-1 sm:min-w-[240px]">
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
