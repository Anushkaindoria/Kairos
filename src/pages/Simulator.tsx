import { useState } from 'react'
import { ShoppingBag, Lightbulb, ArrowRight, RotateCcw } from 'lucide-react'
import { useProfile } from '../store/ProfileContext'
import { goalFundingTarget, goalProgress, simulate, short } from '../lib/finance'
import type { SimMode, TxLite } from '../lib/finance'
import { TX_KEY, todayIso } from '../lib/reminder'

const TABS: { id: SimMode; label: string; hint: string; max: number; step: number }[] = [
  { id: 'one', label: 'One-time Purchase', hint: 'e.g. New Laptop', max: 500000, step: 1000 },
  { id: 'recurring', label: 'Recurring Expense', hint: 'e.g. Gym (per month)', max: 50000, step: 100 },
  { id: 'sip', label: 'Increase SIP', hint: 'Extra investment (per month)', max: 50000, step: 100 },
]

const PICKS: Record<SimMode, { name: string; amount: number }[]> = {
  one: [
    { name: 'New Laptop', amount: 80000 },
    { name: 'Smartphone', amount: 60000 },
    { name: 'Vacation', amount: 150000 },
  ],
  recurring: [
    { name: 'Gym', amount: 2000 },
    { name: 'Streaming', amount: 800 },
    { name: 'Food delivery', amount: 4000 },
  ],
  sip: [
    { name: 'Extra SIP', amount: 2000 },
    { name: 'Extra SIP', amount: 5000 },
    { name: 'Extra SIP', amount: 10000 },
  ],
}

const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

const monthYear = (n: number) => {
  if (!isFinite(n) || n > 1200) return 'Never'
  const d = new Date()
  d.setMonth(d.getMonth() + n)
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

const monthsText = (m: number) => {
  const a = Math.abs(m)
  return a >= 12 ? `${Math.round((a / 12) * 10) / 10} yrs` : `${a} month${a === 1 ? '' : 's'}`
}

export default function Simulator() {
  const { profile, saveProfile } = useProfile()
  const [mode, setMode] = useState<SimMode>('one')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState(0)
  const [applied, setApplied] = useState('')
  if (!profile) return null

  let txs: TxLite[] = []
  try {
    txs = JSON.parse(localStorage.getItem(TX_KEY) || '[]')
  } catch {
    /* ignore */
  }

  const tab = TABS.find((t) => t.id === mode)!
  const base = goalProgress(profile, txs)
  const hasGoals = base.items.length > 0
  const active = amount > 0 && hasGoals
  const sim = simulate(profile, txs, mode, amount)

  const yr = profile.risk === 'Conservative' ? 0.08 : profile.risk === 'Aggressive' ? 0.13 : 0.11
  const r = yr / 12
  const fv = (s: number, t: number) => (s * (Math.pow(1 + r, t) - 1)) / r
  const monthsTo = (T: number, s: number, L: number) => {
    const a = s / r
    if (s <= 0 || a <= L) return Infinity
    return Math.ceil(Math.log((T + a) / (a - L)) / Math.log(1 + r))
  }

  const sipChange = mode === 'sip' ? amount : mode === 'recurring' ? -amount : 0
  const totalNeed = base.items.reduce((a, g) => a + g.need, 0)

  const rows = base.items.map((g) => {
    const weight = totalNeed > 0 ? g.need / totalNeed : 1 / base.items.length
    const loss = mode === 'one' ? amount * weight : 0
    const sAfter = Math.max(0, g.share + sipChange * weight)
    const before = g.projected
    const after = fv(sAfter, g.monthsLeft) - loss * Math.pow(1 + r, g.monthsLeft)
    const target = goalFundingTarget(g)
    const pctBefore = target > 0 ? Math.min(100, Math.round((before / target) * 100)) : 100
    const pctAfter = target > 0 ? Math.max(0, Math.min(100, Math.round((after / target) * 100))) : 100
    const mBefore = g.monthsToFinish
    const mAfter = monthsTo(target, sAfter, loss)
    return { id: g.id, name: g.name || g.type, delta: after - before, pctBefore, pctAfter, mBefore, mAfter }
  })

  const totalDelta = rows.reduce((a, x) => a + x.delta, 0)
  const affected = rows.filter((x) => (mode === 'sip' ? x.delta > 0 : x.delta < 0)).length
  const good = mode === 'sip' ? totalDelta >= 0 : totalDelta >= 0
  const sign = (n: number) => (n >= 0 ? '+' : '-')

  const reset = () => {
    setName('')
    setAmount(0)
    setApplied('')
  }

  const apply = () => {
    if (!active) return
    const label = name.trim() || (mode === 'one' ? 'Purchase' : mode === 'recurring' ? 'Recurring expense' : 'Extra SIP')
    if (mode === 'one') {
      localStorage.setItem(TX_KEY, JSON.stringify([{ id: crypto.randomUUID(), name: label, category: 'Shopping', amount, type: 'expense', date: todayIso() }, ...txs]))
    } else if (mode === 'recurring') {
      saveProfile({ ...profile, customExpenses: [...(profile.customExpenses ?? []), { id: crypto.randomUUID(), name: label, amount }] })
    } else {
      saveProfile({ ...profile, monthlySip: profile.monthlySip + amount })
    }
    setApplied(`Applied "${label}". Open the Goals page to see your new plan.`)
    setAmount(0)
    setName('')
  }

  const tileCls = (ok: boolean) => (!active ? 'bg-slate-50 text-slate-400' : ok ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')

  return (
    <div className="w-full">
       <div className="mb-5">
         <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">What-If Spending Simulator</h1>
        <p className="mt-1 text-slate-500">See how a purchase today affects your goals tomorrow.</p>
      </div>

       <div className="card min-w-0 space-y-6 p-4 sm:p-8">
        {/* Tabs */}
         <div className="flex overflow-x-auto rounded-2xl bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setMode(t.id)
                setAmount(0)
                setName('')
                setApplied('')
              }}
               className={`min-w-[8.5rem] flex-1 whitespace-nowrap rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:min-w-0 sm:text-sm ${
                mode === t.id ? 'bg-brand-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!hasGoals && <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Add a goal on the Goals page first, then simulate here.</p>}
                {active && base.extra > 0 && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Your spending in the last 30 days is {short(base.extra)} above your plan, so your monthly SIP is reduced to {short(base.effSip)}. These results are based on that reduced SIP.
          </p>
        )}
        {/* 1. Details */}
        <div>
          <div className="mb-3 text-sm font-bold text-ink-900">1. Enter details</div>
          <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <ShoppingBag size={20} />
              </div>
              <input className={inputCls} placeholder={tab.hint} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3 text-sm text-slate-400">₹</span>
              <input
                className={`${inputCls} pl-8 font-semibold`}
                inputMode="numeric"
                placeholder="Amount"
                value={amount ? amount.toLocaleString('en-IN') : ''}
                onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')))}
              />
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {PICKS[mode].map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setName(p.name)
                  setAmount(p.amount)
                  setApplied('')
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-brand-500 hover:text-brand-600"
              >
                {p.name} · {short(p.amount)}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Impact */}
        <div>
          <div className="mb-3 text-sm font-bold text-ink-900">2. Impact analysis</div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-2xl p-5 ${tileCls(good)}`}>
              <div className="text-3xl font-extrabold">{active ? `${sign(totalDelta)}${short(Math.abs(totalDelta))}` : '--'}</div>
              <div className="mt-1 text-xs opacity-80">Goal savings at deadlines</div>
            </div>
            <div className={`rounded-2xl p-5 ${tileCls(sim.impact7y >= 0)}`}>
              <div className="text-3xl font-extrabold">{active ? `${sign(sim.impact7y)}${short(Math.abs(sim.impact7y))}` : '--'}</div>
              <div className="mt-1 text-xs opacity-80">Portfolio value in 7 years</div>
            </div>
            <div className={`rounded-2xl p-5 ${tileCls(affected === 0 || mode === 'sip')}`}>
              <div className="text-3xl font-extrabold">{active ? `${affected} of ${rows.length}` : '--'}</div>
              <div className="mt-1 text-xs opacity-80">{mode === 'sip' ? 'Goals helped' : 'Goals affected'}</div>
            </div>
          </div>

          {active && (
            <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-100">
              {rows.map((x) => {
                const up = x.delta >= 0
                const bothFinite = isFinite(x.mBefore) && isFinite(x.mAfter) && x.mBefore <= 1200
                const diff = x.mAfter - x.mBefore
                return (
                   <div key={x.id} className="flex items-start justify-between gap-3 px-3 py-3.5 sm:items-center sm:px-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-ink-900">{x.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Funded {x.pctBefore}% → {x.pctAfter}%
                        {bothFinite && diff !== 0 ? ` · reached ${monthYear(x.mBefore)} → ${monthYear(x.mAfter)}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={`text-sm font-bold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {sign(x.delta)}
                        {short(Math.abs(x.delta))}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {bothFinite && diff !== 0 ? `${diff > 0 ? '+' : '-'}${monthsText(diff)}` : 'at deadline'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recommendation */}
        <div className="flex items-start gap-3 rounded-2xl bg-brand-500/5 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm">
            <Lightbulb size={20} />
          </div>
          <div className="text-sm text-slate-600">
            <div className="font-bold text-brand-600">Smart recommendation</div>
            {!active ? (
              <p className="mt-1">Enter an amount to see how it changes your goals.</p>
            ) : mode === 'one' ? (
              <>
                <p className="mt-1">If this purchase is important, consider:</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  <li>Paying in 12 monthly parts of {short(sim.emi12)} to spread the impact.</li>
                  <li>Or raising your monthly SIP by {short(sim.offsetSip)} to stay on track.</li>
                </ul>
              </>
            ) : mode === 'recurring' ? (
              <p className="mt-1">
                This takes {short(amount)} out of your monthly SIP and costs about {short(Math.abs(sim.impact7y))} in portfolio value over 7 years. Consider cutting an equal amount elsewhere.
              </p>
            ) : (
              <p className="mt-1">Adding {short(amount)} to your SIP could add about {short(sim.impact7y)} to your portfolio in 7 years.</p>
            )}
          </div>
        </div>

        {applied && <p className="text-sm font-medium text-emerald-600">✅ {applied}</p>}

         <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
           <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto">
            <RotateCcw size={15} /> Reset
          </button>
          <button
            onClick={apply}
            disabled={!active}
             className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-500 disabled:opacity-40 sm:w-auto"
          >
            Apply and see new plan <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
