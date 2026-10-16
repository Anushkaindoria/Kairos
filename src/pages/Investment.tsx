import { useMemo, useState } from 'react'
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import { useProfile } from '../store/ProfileContext'
import { short } from '../lib/finance'
import {
  ASSET_META, AVG_INFLATION, FY_LABELS, RETURNS, stats, type AssetKey,
} from '../data/marketHistory'
import GoalPlan from '../components/GoalPlan'
import Transactions from './pages/Transactions'
import Investment from './pages/Investment'
import Goals from './pages/Goals'

type RiskKey = 'conservative' | 'moderate' | 'aggressive'

const ASSETS: AssetKey[] = ['equity', 'debt', 'gold']

const RISKS: Record<RiskKey, { emoji: string; title: string; desc: string; mix: Record<AssetKey, number> }> = {
  conservative: {
    emoji: '🐢',
    title: 'Play it safe',
    desc: 'Slower growth, fewer scary drops. Good if you cannot afford to lose money.',
    mix: { equity: 20, debt: 60, gold: 20 },
  },
  moderate: {
    emoji: '🚶',
    title: 'Balanced',
    desc: 'A mix of safe and growing money. Good for most people.',
    mix: { equity: 50, debt: 35, gold: 15 },
  },
  aggressive: {
    emoji: '🐆',
    title: 'Grow faster',
    desc: 'Higher growth, but your money will go up and down a lot on the way.',
    mix: { equity: 70, debt: 15, gold: 15 },
  },
}

const BUCKETS: Record<AssetKey, { emoji: string; name: string; what: string; where: string; feel: string }> = {
  equity: {
    emoji: '📈',
    name: 'Growth money',
    what: 'You own tiny pieces of India\'s biggest companies.',
    where: 'Start a monthly SIP in a "Nifty 50 index fund".',
    feel: 'Grows the most over time, but can fall sharply in a bad year.',
  },
  debt: {
    emoji: '🏦',
    name: 'Safe money',
    what: 'You lend money to the bank or government and earn fixed interest.',
    where: 'Use PPF, a bank Fixed Deposit or a debt mutual fund.',
    feel: 'Slow and steady. Rarely loses money.',
  },
  gold: {
    emoji: '🪙',
    name: 'Protection money',
    what: 'Gold usually holds its value when other things fall.',
    where: 'Buy a "Gold ETF" or digital gold every month.',
    feel: 'Ups and downs, but protects you in bad times.',
  },
}

function project(monthly: number, lump: number, years: number, annualPct: number) {
  const mRate = Math.pow(1 + annualPct / 100, 1 / 12) - 1
  let balance = lump
  const out: number[] = [balance]
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) balance = (balance + monthly) * (1 + mRate)
    out.push(balance)
  }
  return out
}

const inputCls =
  'w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export default function Investment() {
  const { profile } = useProfile()
  const [monthly, setMonthly] = useState(profile?.monthlySip || 5000)
  const [lump, setLump] = useState(0)
  const [years, setYears] = useState(10)
  const [risk, setRisk] = useState<RiskKey>(
    (profile?.risk ?? 'Moderate').toLowerCase() as RiskKey,
  )

  const assetStats = useMemo(
    () => ({
      equity: stats(RETURNS.equity),
      gold: stats(RETURNS.gold),
      debt: stats(RETURNS.debt),
    }),
    [],
  )

  const mix = RISKS[risk].mix
  const expectedPct = ASSETS.reduce((s, a) => s + (mix[a] / 100) * assetStats[a].cagr, 0)

  const projection = useMemo(() => {
    const low = project(monthly, lump, years, Math.max(expectedPct - 3, 0))
    const mid = project(monthly, lump, years, expectedPct)
    const high = project(monthly, lump, years, expectedPct + 3)
    return mid.map((v, y) => ({
      year: y,
      'Money you put in': lump + monthly * 12 * y,
      'If markets do badly': Math.round(low[y]),
      'Most likely': Math.round(v),
      'If markets do well': Math.round(high[y]),
    }))
  }, [monthly, lump, years, expectedPct])

  const last = projection[projection.length - 1]
  const invested = last['Money you put in']
  const likely = last['Most likely']
  const todaysMoney = likely / Math.pow(1 + AVG_INFLATION / 100, years)
  const multiple = invested > 0 ? likely / invested : 0

  const history = useMemo(() => {
    const rows = [{ fy: 'Start', equity: 1, gold: 1, debt: 1 }]
    let e = 1, g = 1, d = 1
    FY_LABELS.forEach((fy, i) => {
      e *= 1 + RETURNS.equity[i] / 100
      g *= 1 + RETURNS.gold[i] / 100
      d *= 1 + RETURNS.debt[i] / 100
      rows.push({ fy, equity: +e.toFixed(2), gold: +g.toFixed(2), debt: +d.toFixed(2) })
    })
    return rows
  }, [])
  const historyEnd = history[history.length - 1]

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-ink-900">Your Investment Plan</h1>
        <p className="text-slate-500 mt-1">
          A simple answer to three questions: how much to invest each month, where to put it, and what it could become.
        </p>
      </div>

      {/* STEP 1 */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">1</span>
          <h2 className="text-lg font-extrabold">Tell us your plan</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1.5">How much can you invest every month?</div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
              <input
                inputMode="numeric"
                className={`${inputCls} pl-7`}
                value={monthly ? monthly.toLocaleString('en-IN') : ''}
                placeholder="0"
                onChange={(e) => setMonthly(Number(e.target.value.replace(/\D/g, '')))}
              />
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[1000, 2000, 5000, 10000, 25000].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setMonthly(q)}
                  className={`px-2.5 py-1 rounded-full text-xs transition ${
                    monthly === q ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-brand-500 hover:text-white'
                  }`}
                >
                  {short(q)}
                </button>
              ))}
            </div>
            {!!profile?.monthlySip && (
              <p className="text-xs text-slate-400 mt-2">We started with the SIP from your profile. Change it to try other amounts.</p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-600">For how many years?</span>
              <span className="text-lg font-bold text-brand-600">{years} {years === 1 ? 'year' : 'years'}</span>
            </div>
            <input
              type="range" min={1} max={30} value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-indigo-600 mt-2"
            />
            <p className="text-xs text-slate-400 mt-1">Longer is better. Time is the biggest helper for your money.</p>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-600 mb-2">How do you feel when your money goes up and down?</div>
          <div className="grid sm:grid-cols-3 gap-3">
            {(Object.keys(RISKS) as RiskKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setRisk(k)}
                className={`text-left p-4 rounded-2xl border transition ${
                  risk === k ? 'border-brand-600 bg-brand-500/10' : 'border-slate-200 bg-white/70 hover:border-brand-500'
                }`}
              >
                <div className="font-bold">{RISKS[k].emoji} {RISKS[k].title}</div>
                <div className="text-xs text-slate-500 mt-1">{RISKS[k].desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-sm">
          <div className="text-xs font-semibold text-slate-600 mb-1.5">Do you already have a lump sum to start with? (optional)</div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
            <input
              inputMode="numeric"
              className={`${inputCls} pl-7`}
              placeholder="0"
              value={lump ? lump.toLocaleString('en-IN') : ''}
              onChange={(e) => setLump(Number(e.target.value.replace(/\D/g, '')))}
            />
          </div>
        </div>
      </div>

      {/* BIG ANSWER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-600 text-white p-8">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative">
          <p className="text-slate-300 text-sm">The short answer</p>
          <p className="text-xl sm:text-2xl font-extrabold mt-2 leading-snug">
            If you invest {short(monthly)} every month for {years} {years === 1 ? 'year' : 'years'}, you will put in{' '}
            <span className="text-accent-400">{short(invested)}</span>. It could grow to about{' '}
            <span className="text-accent-400">{short(likely)}</span>.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs text-slate-300">You put in</div>
              <div className="text-2xl font-extrabold mt-1">{short(invested)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs text-slate-300">Extra money earned</div>
              <div className="text-2xl font-extrabold mt-1">{short(Math.max(0, likely - invested))}</div>
              {multiple > 0 && <div className="text-xs text-slate-300 mt-0.5">{multiple.toFixed(1)}x what you put in</div>}
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-xs text-slate-300">Worth in today's prices</div>
              <div className="text-2xl font-extrabold mt-1">{short(todaysMoney)}</div>
              <div className="text-xs text-slate-300 mt-0.5">Prices rise, so future rupees buy less</div>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 2 */}
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">2</span>
          <h2 className="text-lg font-extrabold">What to do with your {short(monthly)} each month</h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">Do not put everything in one place. Split it like this:</p>

        <div className="h-3 rounded-full overflow-hidden flex mt-4 bg-slate-200">
          {ASSETS.map((a) => (
            <div key={a} style={{ width: `${mix[a]}%`, background: ASSET_META[a].color }} />
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-5">
          {ASSETS.map((a) => (
            <div key={a} className="rounded-2xl border border-slate-200 bg-white/70 p-5">
              <div className="flex items-center justify-between">
                <div className="font-bold">{BUCKETS[a].emoji} {BUCKETS[a].name}</div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: ASSET_META[a].color }}>
                  {mix[a]}%
                </span>
              </div>
              <div className="text-2xl font-extrabold mt-3">{short((monthly * mix[a]) / 100)}<span className="text-sm font-medium text-slate-400"> /month</span></div>
              <p className="text-sm text-slate-600 mt-3"><b>What it is:</b> {BUCKETS[a].what}</p>
              <p className="text-sm text-slate-600 mt-2"><b>Where:</b> {BUCKETS[a].where}</p>
              <p className="text-xs text-slate-500 mt-2">{BUCKETS[a].feel}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">
          These are examples of the kind of product to look for, not a recommendation of any one company.
        </p>
      </div>

      {/* STEP 3 */}
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">3</span>
          <h2 className="text-lg font-extrabold">What could happen to your money</h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">Nobody can predict the future. Here are three possible outcomes after {years} {years === 1 ? 'year' : 'years'}:</p>

        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <div className="text-xs font-semibold text-amber-700">😟 If markets do badly</div>
            <div className="text-xl font-extrabold mt-1">{short(last['If markets do badly'])}</div>
          </div>
          <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4">
            <div className="text-xs font-semibold text-indigo-700">🙂 Most likely</div>
            <div className="text-xl font-extrabold mt-1">{short(likely)}</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <div className="text-xs font-semibold text-emerald-700">😄 If markets do well</div>
            <div className="text-xl font-extrabold mt-1">{short(last['If markets do well'])}</div>
          </div>
        </div>

        <div className="h-72 mt-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projection}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Years from now', position: 'insideBottom', offset: -2 }} />
              <YAxis tickFormatter={(v) => short(Number(v))} width={70} />
              <Tooltip formatter={(v) => short(Number(v))} labelFormatter={(l) => `After ${l} years`} />
              <Legend />
              <Line dataKey="Money you put in" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
              <Line dataKey="If markets do badly" stroke="#f59e0b" dot={false} />
              <Line dataKey="Most likely" stroke="#4f46e5" strokeWidth={3} dot={false} />
              <Line dataKey="If markets do well" stroke="#10b981" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          We expect about {expectedPct.toFixed(1)}% growth a year for this mix, based on the last 20 years. The bad and good cases are 3% below and above that.
        </p>
      </div>
      {profile && <GoalPlan profile={profile} />}
      {/* HISTORY */}
      <details className="card p-6">
        <summary className="cursor-pointer font-extrabold">📚 See the proof: what the last 20 years looked like</summary>
        <p className="text-sm text-slate-500 mt-3">
          If you had put ₹1 lakh in each of these in 2006, this is what you would have by March 2026:
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          {ASSETS.map((a) => (
            <div key={a} className="rounded-2xl border border-slate-200 p-4">
              <div className="text-xs font-semibold" style={{ color: ASSET_META[a].color }}>{ASSET_META[a].label}</div>
              <div className="text-xl font-extrabold mt-1">{short(historyEnd[a] * 100000)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Worst year: {assetStats[a].worst}% ({assetStats[a].worstFY})
              </div>
              <div className="text-xs text-slate-500">
                Average growth: {assetStats[a].cagr.toFixed(1)}% a year
              </div>
            </div>
          ))}
        </div>
        <div className="h-64 mt-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fy" />
              <YAxis tickFormatter={(v) => `${v}L`} width={50} />
              <Tooltip formatter={(v) => `₹${v} lakh`} />
              <Legend />
              {ASSETS.map((a) => (
                <Line key={a} dataKey={a} name={ASSET_META[a].label} stroke={ASSET_META[a].color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-slate-400 mt-2">Approximate figures for illustration. Gold's latest year is an estimate.</p>
      </details>

      {/* GLOSSARY */}
      <details className="card p-6">
        <summary className="cursor-pointer font-extrabold">💬 Words made simple</summary>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="font-bold">SIP</dt><dd className="text-slate-600">Putting a fixed amount into an investment every month, like a recurring deposit but for investing.</dd></div>
          <div><dt className="font-bold">Index fund</dt><dd className="text-slate-600">One fund that buys all the top companies for you, so you do not have to pick any.</dd></div>
          <div><dt className="font-bold">Inflation</dt><dd className="text-slate-600">Prices rising over time. ₹100 today buys less in 10 years.</dd></div>
          <div><dt className="font-bold">Today's prices</dt><dd className="text-slate-600">What your future money would be worth if prices had not risen. It is the honest number.</dd></div>
          <div><dt className="font-bold">Gold ETF</dt><dd className="text-slate-600">A way to buy gold digitally through the stock market, without storing it.</dd></div>
        </dl>
      </details>

      <p className="text-xs text-slate-400 pb-6">
        Past performance does not guarantee future returns. Figures are approximate and for learning only. This is not financial advice.
      </p>
    </div>
  )
}