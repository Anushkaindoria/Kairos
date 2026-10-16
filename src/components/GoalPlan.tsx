import { Link } from 'react-router-dom'
import type { Goal, Profile, Risk } from '../types'
import { getMetrics, short, monthsUntil } from '../lib/finance'
import { ASSET_META, RETURNS, cagr, type AssetKey } from '../data/marketHistory'

type Mix = Record<AssetKey, number>
const ASSETS: AssetKey[] = ['equity', 'debt', 'gold']
const GROWTH: Record<AssetKey, number> = {
  equity: cagr(RETURNS.equity),
  debt: cagr(RETURNS.debt),
  gold: cagr(RETURNS.gold),
}
const WHERE: Record<AssetKey, string> = {
  equity: 'Nifty 50 index fund',
  debt: 'FD / PPF / debt fund',
  gold: 'Gold ETF',
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

// Expected yearly return for a mix, capped at 12% to stay prudent
const expected = (mix: Mix) =>
  Math.min(12, ASSETS.reduce((s, a) => s + (mix[a] / 100) * GROWTH[a], 0))

const monthlyRate = (annualPct: number) => Math.pow(1 + annualPct / 100, 1 / 12) - 1
const sipFor = (target: number, n: number, r: number) =>
  r > 0 ? Math.round((target * r) / (Math.pow(1 + r, n) - 1)) : Math.round(target / n)
const fvOf = (sip: number, n: number, r: number) =>
  r > 0 ? sip * ((Math.pow(1 + r, n) - 1) / r) : sip * n
const monthsToReach = (target: number, sip: number, r: number) =>
  sip <= 0 ? Infinity : r > 0 ? Math.ceil(Math.log(1 + (target * r) / sip) / Math.log(1 + r)) : Math.ceil(target / sip)

const fmtMonths = (m: number) =>
  !isFinite(m) ? 'never' : m >= 12 ? `${Math.floor(m / 12)} yr ${m % 12} mo` : `${m} mo`

export default function GoalPlan({ profile }: { profile: Profile }) {
  const m = getMetrics(profile)
  const goals = profile.goals ?? []

  const header = (
    <div className="flex items-center gap-3">
      <span className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center">4</span>
      <h2 className="text-lg font-extrabold">Strategy for your goals</h2>
    </div>
  )

  if (goals.length === 0) {
    return (
      <div className="card p-6">
        {header}
        <p className="text-sm text-slate-500 mt-3">
          Add a goal and we will build a separate investing strategy for each one.{' '}
          <Link to="/goals" className="text-brand-600 font-semibold">Go to Goals</Link>
        </p>
      </div>
    )
  }

  // Priority: Strict first, then earliest date
  const order = [...goals].sort((a, b) =>
    a.flexibility === b.flexibility
      ? a.targetDate.localeCompare(b.targetDate)
      : a.flexibility === 'Strict' ? -1 : 1,
  )

  let pool = m.sip
  const rows = order.map((g) => {
    const n = monthsUntil(g.targetDate)
    const mix = mixFor(g, profile.risk)
    const ret = expected(mix)
    const r = monthlyRate(ret)
    const need = sipFor(g.targetAmount, n, r)
    const give = Math.min(need, pool)
    pool -= give
    const fv = fvOf(give, n, r)
    const shortfall = Math.max(0, g.targetAmount - fv)
    const status = give >= need * 0.98 ? 'Funded' : give > 0 ? 'Partly funded' : 'Not funded'
    const lateBy = status === 'Funded' ? 0 : monthsToReach(g.targetAmount, give, r) - n
    const name = g.type === 'Custom' && g.name ? g.name : g.type
    return { g, n, mix, ret, need, give, shortfall, status, lateBy, name }
  })

  const needTotal = rows.reduce((a, x) => a + x.need, 0)
  const gap = Math.max(0, needTotal - m.sip)
  const surplus = Math.max(0, m.sip - needTotal)
  const affordable = Math.max(0, m.left)
  const lifeTarget = profile.income * 12 * 10

  const actions: { icon: string; text: string }[] = []
  if (profile.emergencyMonths < 6)
    actions.push({ icon: '🛟', text: `Build your emergency fund to 6 months first (you have ${profile.emergencyMonths}). Keep it in a savings account or liquid fund, not in equity.` })
  if (gap > 0)
    actions.push({
      icon: '⬆️',
      text: affordable >= gap
        ? `Raise your SIP by ${short(gap)} a month. You have ${short(affordable)} of free cash, so this is affordable.`
        : `You need ${short(gap)} more a month but only ${short(affordable)} is free. Trim spending or move Flexible goal dates.`,
    })
  if (surplus > 0)
    actions.push({ icon: '🚀', text: `Your SIP is ${short(surplus)} above what goals need. Put the extra into your longest goal.` })
  actions.push({ icon: '📈', text: 'Step up your SIP by 10% every year as your income grows. This is the easiest way to finish goals early.' })
  if (rows.some((x) => x.n <= 12))
    actions.push({ icon: '💧', text: 'Money needed within 1 year stays in safe money only. A market fall right before you need it can cost you the goal.' })
  if (rows.some((x) => x.g.type === 'Retirement' && x.n > 120))
    actions.push({ icon: '🌴', text: 'Retirement is far away, so equity-heavy is fine. We will move you toward safe money as the date gets closer.' })
  if (profile.healthCover === 0 || (lifeTarget > 0 && profile.lifeCover < lifeTarget))
    actions.push({ icon: '🛡️', text: 'Get health and life cover before raising risk. One emergency without cover can wipe out years of SIPs.' })

  return (
    <div className="card p-6 space-y-6">
      {header}

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="text-xs text-slate-500">SIP your goals need</div>
          <div className="text-xl font-extrabold mt-1">{short(needTotal)}</div>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <div className="text-xs text-slate-500">Your SIP now</div>
          <div className="text-xl font-extrabold mt-1">{short(m.sip)}</div>
        </div>
        <div className={`rounded-2xl border p-4 ${gap > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="text-xs text-slate-500">{gap > 0 ? 'Monthly gap' : 'Monthly surplus'}</div>
          <div className="text-xl font-extrabold mt-1">{short(gap > 0 ? gap : surplus)}</div>
        </div>
      </div>

      <div>
        <div className="font-bold text-sm">Action plan</div>
        <ul className="mt-3 space-y-2">
          {actions.map((a, i) => (
            <li key={i} className="flex gap-3 text-sm bg-slate-50 rounded-xl p-3">
              <span>{a.icon}</span>
              <span className="text-slate-700">{a.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="font-bold text-sm">Goal by goal (most urgent first)</div>
        <div className="grid lg:grid-cols-2 gap-4 mt-3">
          {rows.map((x) => (
            <div key={x.g.id} className="rounded-2xl border border-slate-200 bg-white/70 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold">{ICON[x.g.type]} {x.name}</div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    x.status === 'Funded' ? 'bg-emerald-100 text-emerald-700'
                      : x.status === 'Partly funded' ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {x.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {short(x.g.targetAmount)} in {fmtMonths(x.n)} · {x.g.flexibility === 'Strict' ? '🔒 Strict' : '🌊 Flexible'}
              </div>

              <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-200 mt-4">
                {ASSETS.map((a) => (
                  <div key={a} style={{ width: `${x.mix[a]}%`, background: ASSET_META[a].color }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600 mt-2">
                {ASSETS.filter((a) => x.mix[a] > 0).map((a) => (
                  <span key={a}>
                    <b>{x.mix[a]}%</b> {WHERE[a]} ({short((x.give * x.mix[a]) / 100)}/mo)
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div><div className="text-xs text-slate-400">Needs</div><b>{short(x.need)}/mo</b></div>
                <div><div className="text-xs text-slate-400">Getting</div><b>{short(x.give)}/mo</b></div>
              </div>
              <div className="text-xs text-slate-400 mt-2">Expected growth {x.ret.toFixed(1)}% a year for this mix</div>

              {x.status !== 'Funded' && (
                <p className="text-xs bg-amber-50 text-amber-800 rounded-lg px-3 py-2 mt-3">
                  Short by about {short(x.shortfall)} on the date.{' '}
                  {x.g.flexibility === 'Strict'
                    ? `Add ${short(x.need - x.give)}/mo to hit the date.`
                    : isFinite(x.lateBy)
                      ? `Or move the date by ${fmtMonths(x.lateBy)}.`
                      : 'Give this goal some SIP to start.'}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Mixes come from time left, your risk style and goal flexibility. Returns use 20-year history, capped at 12%. Existing investments are not counted yet. Example products only, not advice.
      </p>
    </div>
  )
}