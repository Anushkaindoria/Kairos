import { Link } from 'react-router-dom'
import type { Goal, Profile, Risk } from '../types'
import { getMetrics, short, monthsUntil, requiredSip, goalEmi, goalFundingTarget } from '../lib/finance'
import { ASSET_META, RETURNS, cagr, type AssetKey } from '../data/marketHistory'


type Mix = Record<AssetKey, number>
const ASSETS: AssetKey[] = ['equity', 'debt', 'gold']
const GROWTH: Record<AssetKey, number> = {
  equity: cagr(RETURNS.equity),
  debt: cagr(RETURNS.debt),
  gold: cagr(RETURNS.gold),
}
const BUCKET: Record<AssetKey, { emoji: string; name: string; where: string }> = {
  equity: { emoji: '📈', name: 'Growth money', where: 'Start a SIP in a Nifty 50 index fund' },
  debt: { emoji: '🏦', name: 'Safe money', where: 'Put it in a PPF, FD or debt mutual fund' },
  gold: { emoji: '🪙', name: 'Protection money', where: 'Buy a Gold ETF or digital gold' },
}
const ICON: Record<string, string> = {
  'Home Purchase': '🏠', Retirement: '🌴', 'Wealth Growth': '🚀',
  'Short-Term Liquidity': '💧', 'Child Education': '🎓', Custom: '✨',
}

function mixFor(g: Goal, risk: Risk): Mix {
  const y = monthsUntil(g.targetDate) / 12
  if (y <= 1 || g.type === 'Short-Term Liquidity') return { equity: 0, debt: 100, gold: 0 }
  let eq = y <= 3 ? 10 : y <= 5 ? 30 : y <= 10 ? 55 : 75
  if (risk === 'Conservative') eq -= 15
  if (risk === 'Aggressive') eq += 10
  if (g.flexibility === 'Strict' && y < 7) eq -= 10
  eq = Math.max(0, Math.min(80, eq))
  const gold = eq === 0 ? 0 : y <= 3 ? 10 : 15
  return { equity: eq, debt: 100 - eq - gold, gold }
}

const expected = (mix: Mix) =>
  Math.min(12, ASSETS.reduce((s, a) => s + (mix[a] / 100) * GROWTH[a], 0))
const fvOf = (sip: number, n: number, r: number) =>
  r > 0 ? sip * ((Math.pow(1 + r, n) - 1) / r) : sip * n
const monthsToReach = (target: number, sip: number, r: number) =>
  sip <= 0 ? Infinity : r > 0 ? Math.ceil(Math.log(1 + (target * r) / sip) / Math.log(1 + r)) : Math.ceil(target / sip)
const fmtMonths = (m: number) =>
  !isFinite(m) ? 'never' : m >= 12 ? `${Math.floor(m / 12)} yr ${m % 12} mo` : `${m} mo`

export default function GoalPlan({ profile }: { profile: Profile }) {
  const m = getMetrics(profile)
  const goals = profile.goals ?? []

  if (goals.length === 0) {
    return (
       <div className="card p-6 text-center sm:p-8">
        <div className="text-4xl">🌱</div>
        <p className="font-bold mt-2">Add a goal and we will tell you exactly how much to invest.</p>
        <Link to="/goals" className="inline-block mt-3 text-brand-600 font-semibold text-sm">Go to Goals</Link>
      </div>
    )
  }

  const order = [...goals].sort((a, b) =>
    a.flexibility === b.flexibility
      ? a.targetDate.localeCompare(b.targetDate)
      : a.flexibility === 'Strict' ? -1 : 1,
  )

  // 1) what each goal needs
    const yr = profile.risk === 'Conservative' ? 0.08 : profile.risk === 'Aggressive' ? 0.13 : 0.11
  const base = order.map((g) => {
    const n = monthsUntil(g.targetDate)
    const mix = mixFor(g, profile.risk)
    const ret = expected(mix)
    const r = yr / 12
    return { g, n, mix, ret, r, need: requiredSip(g, profile.risk), fundingTarget: goalFundingTarget(g), emi: goalEmi(g) }
  })
  const needTotal = base.reduce((a, x) => a + x.need, 0)

  // 2) what the person can really afford each month
  const maxAfford = Math.max(0, m.left + m.sip)
  const wanted = Math.ceil(needTotal / 500) * 500
  const canDoAll = wanted <= maxAfford
  const recommended = canDoAll ? wanted : Math.floor(maxAfford / 500) * 500

  // 3) share it out: Strict first, then earliest date
  const gives = base.map((x, index) => {
    const used = base.slice(0, index).reduce((total, prior) => total + Math.min(prior.need, Math.max(0, recommended - total)), 0)
    return Math.min(x.need, Math.max(0, recommended - used))
  })
  const rows = base.map((x, index) => {
    const give = gives[index]
    const shortfall = Math.max(0, x.fundingTarget - fvOf(give, x.n, x.r))
    const status = give >= x.need * 0.98 ? 'On track' : give > 0 ? 'Needs more' : 'Not funded'
    const lateBy = status === 'On track' ? 0 : monthsToReach(x.fundingTarget, give, x.r) - x.n
    const name = x.g.type === 'Custom' && x.g.name ? x.g.name : x.g.type
    return { ...x, give, shortfall, status, lateBy, name }
  })
  // leftover (when rounding up) goes to the longest goal's growth
  const spread = recommended
  const bucket: Record<AssetKey, number> = { equity: 0, debt: 0, gold: 0 }
  const used = rows.reduce((a, x) => a + x.give, 0)
  rows.forEach((x) => ASSETS.forEach((a) => (bucket[a] += (x.give * x.mix[a]) / 100)))
  const extra = Math.max(0, spread - used)
  bucket.equity += extra

  const shortBy = Math.max(0, needTotal - recommended)
  const behind = rows.filter((x) => x.status !== 'On track')
  const delta = recommended - m.sip

  const lifeTarget = profile.income * 12 * 10
  const todo: string[] = []
  if (profile.emergencyMonths < 6)
    todo.push(`First, build an emergency fund of 6 months of expenses (you have ${profile.emergencyMonths}). Keep it in a savings account.`)
  todo.push(
    delta > 0
      ? `Set your monthly SIP to ${short(recommended)} (up by ${short(delta)}). Do it on the day your salary comes in.`
      : delta < 0
        ? `You are investing ${short(-delta)} more than needed. Keep ${short(recommended)} for goals and use the rest as you like.`
        : `Keep your monthly SIP at ${short(recommended)}. You are right on target.`,
  )
  todo.push('Turn on auto-debit (SIP mandate) so the money moves by itself. Then you never have to decide again.')
  todo.push('Raise your SIP by 10% every year when your income rises. This finishes goals earlier.')
  if (profile.healthCover === 0 || (lifeTarget > 0 && profile.lifeCover < lifeTarget))
    todo.push('Get health and life cover. One emergency without it can wipe out years of SIPs.')

  return (
    <div className="space-y-6">
      {/* HERO ANSWER */}
       <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-600 p-5 text-white sm:p-8">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative">
          <p className="text-slate-300 text-sm">To reach all {goals.length} of your goals, invest</p>
           <div className="mt-2 text-4xl font-extrabold text-accent-400 sm:text-6xl">
            {short(recommended)}<span className="text-xl text-slate-300 font-semibold"> every month</span>
          </div>
          <p className={`mt-4 text-sm font-semibold inline-block rounded-full px-3 py-1 ${canDoAll ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'}`}>
            {canDoAll
              ? `✅ You can afford this. You have ${short(maxAfford)} a month available.`
              : `⚠️ Your goals need ${short(wanted)}, but you can only afford ${short(maxAfford)}.`}
          </p>
          {!canDoAll && (
            <p className="text-sm text-slate-200 mt-3 max-w-xl">
              Easiest fix: trim {short(shortBy)} of spending, or move the date of a Flexible goal. Details are below.
            </p>
          )}
        </div>
      </div>

      {/* WHERE TO PUT IT */}
       <div className="card min-w-0 p-4 sm:p-6">
        <h2 className="text-lg font-extrabold">Put your {short(recommended)} here</h2>
        <p className="text-sm text-slate-500 mt-1">Split the SIP exactly like this. No other choices needed.</p>
        <div className="h-3 rounded-full overflow-hidden flex mt-4 bg-slate-200">
          {ASSETS.map((a) => (
            <div key={a} style={{ width: `${recommended ? (bucket[a] / recommended) * 100 : 0}%`, background: ASSET_META[a].color }} />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-5">
          {ASSETS.filter((a) => bucket[a] > 0).map((a) => (
            <div key={a} className="rounded-2xl border border-slate-200 bg-white/70 p-5">
              <div className="font-bold">{BUCKET[a].emoji} {BUCKET[a].name}</div>
              <div className="text-2xl font-extrabold mt-2">
                {short(Math.round(bucket[a] / 100) * 100)}<span className="text-sm font-medium text-slate-400"> /month</span>
              </div>
              <p className="text-sm text-slate-600 mt-2">{BUCKET[a].where}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TO DO */}
       <div className="card min-w-0 p-4 sm:p-6">
        <h2 className="text-lg font-extrabold">What to do now</h2>
        <ol className="mt-4 space-y-2.5">
          {todo.map((t, i) => (
            <li key={i} className="flex gap-3 text-sm bg-slate-50 rounded-xl p-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <span className="text-slate-700">{t}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* GOAL BY GOAL */}
       <details className="card min-w-0 p-4 sm:p-6" open={behind.length > 0}>
        <summary className="cursor-pointer font-extrabold">
          🎯 Goal by goal {behind.length > 0 ? `(${behind.length} need attention)` : '(all on track)'}
        </summary>
        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          {rows.map((x) => (
            <div key={x.g.id} className="rounded-2xl border border-slate-200 bg-white/70 p-5">
               <div className="flex items-start justify-between gap-2">
                 <div className="min-w-0 break-words font-bold">{ICON[x.g.type]} {x.name}</div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  x.status === 'On track' ? 'bg-emerald-100 text-emerald-700'
                    : x.status === 'Needs more' ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-600'}`}>
                  {x.status}
                </span>
              </div>
               <div className="text-xs text-slate-500 mt-1">
                 {x.emi ? `${short(x.fundingTarget)} down payment for ${short(x.g.targetAmount)} purchase` : short(x.fundingTarget)} in {fmtMonths(x.n)} · {x.g.flexibility === 'Strict' ? '🔒 Strict' : '🌊 Flexible'}
               </div>
               {x.emi && (
                 <div className="mt-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                   EMI: <b>{short(x.emi.monthly)}/mo</b> for {x.emi.tenureMonths} months · {x.emi.annualRate}% annual interest
                 </div>
               )}
              <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-200 mt-3">
                {ASSETS.map((a) => (
                  <div key={a} style={{ width: `${x.mix[a]}%`, background: ASSET_META[a].color }} />
                ))}
              </div>
              <div className="text-xs text-slate-600 mt-2">
                {ASSETS.filter((a) => x.mix[a] > 0).map((a) => `${x.mix[a]}% ${BUCKET[a].name.split(' ')[0].toLowerCase()}`).join(' · ')}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div><div className="text-xs text-slate-400">Needs</div><b>{short(x.need)}/mo</b></div>
                <div><div className="text-xs text-slate-400">Getting</div><b>{short(x.give)}/mo</b></div>
              </div>
              {x.status !== 'On track' && (
                <p className="text-xs bg-amber-50 text-amber-800 rounded-lg px-3 py-2 mt-3">
                  Short by about {short(x.shortfall)}.{' '}
                  {x.g.flexibility === 'Strict'
                    ? `Add ${short(x.need - x.give)}/mo to hit the date.`
                    : isFinite(x.lateBy)
                      ? `Or move the date by ${fmtMonths(x.lateBy)}.`
                      : 'This goal gets nothing yet. Free up some money first.'}
                </p>
              )}
            </div>
          ))}
        </div>
      </details>

      <p className="text-xs text-slate-400">
        Based on your goals, risk style and 20-year history (returns capped at 12%). Existing investments are not counted yet. Example products only, not financial advice.
      </p>
    </div>
  )
}
