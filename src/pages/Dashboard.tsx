import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useProfile } from '../store/ProfileContext'
import { getMetrics, short, monthsUntil } from '../lib/finance'

const goalIcon: Record<string, string> = {
  'Home Purchase': '🏠',
  Retirement: '🌴',
  'Wealth Growth': '🚀',
  'Short-Term Liquidity': '💧',
  'Child Education': '🎓',
  Custom: '✨',
}

const colors = {
  Accelerating: '#34d399',
  'On Pace': '#22d3ee',
  Lagging: '#fbbf24',
  'No goals': '#94a3b8',
} as const

const palette = ['#4f46e5', '#22d3ee', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#64748b', '#ef4444']

const expenseLabel: Record<string, string> = {
  food: 'Food',
  shopping: 'Shopping',
  subscriptions: 'Subscriptions',
  transport: 'Transport',
  entertainment: 'Entertainment',
  health: 'Health',
  otherExpenses: 'Other',
}



function daysToSalary(creditDay: number) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const credit = (y: number, m: number) => new Date(y, m, Math.min(creditDay, new Date(y, m + 1, 0).getDate()))
  let next = credit(now.getFullYear(), now.getMonth())
  if (next <= today) next = credit(now.getFullYear(), now.getMonth() + 1)
  return Math.max(1, Math.round((next.getTime() - today.getTime()) / 86400000))
}



function SafeToSpend({ left, creditDay }: { left: number; creditDay: number }) {
  const [mode, setMode] = useState<'total' | 'daily'>('daily')
  const days = daysToSalary(creditDay)
  const safe = Math.max(0, left)
  const value = mode === 'daily' ? safe / days : safe
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div className="font-bold">Safe to spend</div>
        <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
          {(['daily', 'total'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setMode(k)}
              className={`px-3 py-1 rounded-full transition ${mode === k ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
            >
              {k === 'daily' ? 'Per day' : 'Until salary'}
            </button>
          ))}
        </div>
      </div>
      <div className="text-4xl font-extrabold mt-4 text-brand-600">{short(value)}</div>
      <p className="text-sm text-slate-500 mt-1">
        {mode === 'daily' ? `You can spend this every day for the next ${days} days.` : `Total you can spend before your next salary in ${days} days.`}
      </p>
      {left < 0 && <p className="text-xs text-red-500 mt-3">Your planned spending is {short(-left)} above your budget. Trim some expenses.</p>}
    </div>
  )
}

export default function Dashboard() {
  const { profile } = useProfile()
  if (!profile) return null
  const m = getMetrics(profile)
  const color = colors[m.status]
  const fill = m.requiredTotal ? Math.min(100, (m.ratio / 1.5) * 100) : 0
  const gap = m.requiredTotal - m.sip

  const message =
    m.status === 'No goals'
      ? 'Add a goal to see how fast you are moving.'
      : m.status === 'Lagging'
        ? `Your SIP is ${short(gap)} a month short of what your goals need.`
        : m.status === 'On Pace'
          ? 'Your SIP matches what your goals need. Keep going.'
          : `You are investing ${short(-gap)} a month more than needed. Goals will arrive early.`

  const tiles = [
    { label: 'Net worth', value: short(m.netWorth), note: 'Investments + assets - loans' },
    { label: 'Monthly income', value: short(m.income), note: 'All sources' },
    { label: 'Monthly SIP', value: short(m.sip), note: `${short(m.requiredTotal)} needed for goals` },
    { label: 'Spending budget', value: short(m.budget), note: 'After bills and SIP' },
  ]

  // spending breakdown
  const spendData = [
    { name: 'Rent & bills', value: m.fixed },
    ...Object.entries(profile.expenses ?? {}).map(([k, v]) => ({ name: expenseLabel[k] ?? k, value: v as number })),
    ...(profile.customExpenses ?? []).map((i) => ({ name: i.name || 'Custom', value: i.amount })),
  ].filter((d) => d.value > 0)
  const spendTotal = spendData.reduce((a, b) => a + b.value, 0)

  // allocation
  const mix = profile.mix ?? { equity: 0, debt: 0, gold: 0, cash: 0 }
  const alloc = [
    { name: 'Equity', pct: mix.equity, cls: 'bg-indigo-500' },
    { name: 'Debt', pct: mix.debt, cls: 'bg-cyan-400' },
    { name: 'Gold', pct: mix.gold, cls: 'bg-amber-400' },
    { name: 'Cash', pct: mix.cash, cls: 'bg-slate-400' },
  ]

  // insights
  const lifeTarget = profile.income * 12 * 10
  const insights: { icon: string; text: string }[] = []
  if (m.status === 'Lagging') insights.push({ icon: '⚠️', text: `Raise your SIP by ${short(gap)} a month to get back on pace.` })
  if (m.left < 0) insights.push({ icon: '💸', text: `Spending is ${short(-m.left)} above your budget. Review shopping and subscriptions.` })
  if (profile.emergencyMonths < 6) insights.push({ icon: '🛟', text: `Your emergency fund covers ${profile.emergencyMonths} months. Aim for 6.` })
  if (lifeTarget > 0 && profile.lifeCover < lifeTarget) insights.push({ icon: '🛡️', text: `Life cover is below 10x your yearly income (${short(lifeTarget)}).` })
  if (profile.healthCover === 0) insights.push({ icon: '🏥', text: 'You have no health insurance. One hospital stay could dent your goals.' })
  if (insights.length === 0) insights.push({ icon: '✅', text: 'Everything looks healthy. Keep your SIP going.' })

  

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ink-900">Hi, {profile.name.split(' ')[0]} 👋</h1>
        <p className="text-slate-500 mt-1">Here is how fast your wealth is moving today.</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-600 text-white p-8 grid md:grid-cols-[320px_1fr] gap-8 items-center">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative">
          <div className="text-sm text-slate-300 text-center">Wealth Velocity</div>
          <div className="relative w-72 mx-auto mt-2">
            <svg viewBox="0 0 200 110" className="w-full">
              <path d="M 10 100 A 90 90 0 0 1 190 100" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="14" strokeLinecap="round" pathLength={100} />
              <path
                d="M 10 100 A 90 90 0 0 1 190 100"
                fill="none"
                stroke={color}
                strokeWidth="14"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${fill} 100`}
                style={{ transition: 'all 600ms ease' }}
              />
            </svg>
            <div className="absolute inset-x-0 bottom-0 text-center text-3xl font-extrabold" style={{ color }}>
              {m.status}
            </div>
          </div>
        </div>

        <div className="relative">
          <p className="text-lg font-semibold">{message}</p>
          <div className="grid grid-cols-2 gap-3 mt-5 max-w-md">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs text-slate-300">Your SIP now</div>
              <div className="text-2xl font-extrabold mt-1">{short(m.sip)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs text-slate-300">SIP needed</div>
              <div className="text-2xl font-extrabold mt-1">{short(m.requiredTotal)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className="card p-5">
            <div className="text-xs font-semibold text-slate-500">{t.label}</div>
            <div className="text-2xl font-extrabold mt-1">{t.value}</div>
            <div className="text-xs text-slate-400 mt-1">{t.note}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SafeToSpend left={m.left} creditDay={profile.salaryCreditDate} />

        <div className="card p-6">
          <div className="font-bold">Where your money goes</div>
          {spendData.length === 0 ? (
            <p className="text-sm text-slate-500 mt-4">Add your spending in Edit profile to see the breakdown.</p>
          ) : (
            <div className="grid grid-cols-[150px_1fr] gap-4 items-center mt-2">
              <div className="h-[150px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={spendData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">
                      {spendData.map((_, i) => (
                        <Cell key={i} fill={palette[i % palette.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => short(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400">Per month</span>
                  <span className="text-sm font-extrabold">{short(spendTotal)}</span>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm">
                {spendData.slice(0, 6).map((d, i) => (
                  <li key={d.name + i} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: palette[i % palette.length] }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{short(d.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-extrabold text-ink-900 mb-3">Your goals</h2>
        {m.goals.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            <div className="text-4xl">🌱</div>
            <p className="mt-2 text-sm">No goals yet. Tap Edit profile in the sidebar to add one.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {m.goals.map((g) => {
              const share = m.requiredTotal ? (m.sip * g.need) / m.requiredTotal : 0
              const pct = g.need ? Math.min(100, Math.round((share / g.need) * 100)) : 0
              const months = g.targetDate ? monthsUntil(g.targetDate) : 0
              return (
                <div key={g.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold">
                      {goalIcon[g.type]} {g.type === 'Custom' && g.name ? g.name : g.type}
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {g.flexibility === 'Strict' ? '🔒 Strict' : '🌊 Flexible'}
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold mt-3">{short(g.targetAmount)}</div>
                  <div className="text-xs text-slate-500">
                    in {months >= 12 ? `${Math.floor(months / 12)} yr ${months % 12} mo` : `${months} mo`}
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 mt-4 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-400 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs mt-2 text-slate-500">
                    <span>SIP share: {short(share)}</span>
                    <span>Needs: {short(g.need)}/mo</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="font-bold">Your investments</div>
          {profile.investments > 0 ? (
            <>
              <div className="text-3xl font-extrabold mt-2">{short(profile.investments)}</div>
              <div className="h-3 rounded-full overflow-hidden flex bg-slate-200 mt-4">
                {alloc.map((a) => (
                  <div key={a.name} className={`${a.cls} transition-all`} style={{ width: `${a.pct}%` }} />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                {alloc.map((a) => (
                  <div key={a.name} className="flex items-center gap-2 text-slate-600">
                    <span className={`w-2.5 h-2.5 rounded-full ${a.cls}`} />
                    {a.name} <b className="ml-auto">{a.pct}%</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500 mt-4">No investments added yet. Update them in Edit profile.</p>
          )}
        </div>

        <div className="card p-6">
          <div className="font-bold">Things to look at</div>
          <ul className="mt-3 space-y-2.5">
            {insights.slice(0, 4).map((i, idx) => (
              <li key={idx} className="flex gap-3 text-sm bg-slate-50 rounded-xl p-3">
                <span>{i.icon}</span>
                <span className="text-slate-700">{i.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      
    </div>
  )
}