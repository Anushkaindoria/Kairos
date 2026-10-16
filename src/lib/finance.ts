import type { Profile, Goal } from '../types'

const sum = (n: number[]) => n.reduce((a, b) => a + b, 0)

export const short = (n: number) => {
  const a = Math.abs(n)
  const s = a >= 1e7 ? `₹${+(a / 1e7).toFixed(2)} Cr` : a >= 1e5 ? `₹${+(a / 1e5).toFixed(2)} L` : a >= 1e3 ? `₹${+(a / 1e3).toFixed(1)}K` : `₹${Math.round(a)}`
  return n < 0 ? `-${s}` : s
}

export const monthsUntil = (d: string) =>
  Math.max(1, Math.round((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)))

const yearlyReturn = (risk: Profile['risk']) => (risk === 'Conservative' ? 0.08 : risk === 'Aggressive' ? 0.13 : 0.11)

export function requiredSip(g: Goal, risk: Profile['risk']): number {
  if (!g.targetAmount || !g.targetDate) return 0
  const n = monthsUntil(g.targetDate)
  const r = yearlyReturn(risk) / 12
  return Math.round((g.targetAmount * r) / (Math.pow(1 + r, n) - 1))
}

export type VelocityStatus = 'Accelerating' | 'On Pace' | 'Lagging' | 'No goals'

export function getMetrics(p: Profile) {
  const income = p.income + (p.spouseIncome ?? 0) + (p.otherIncome ?? 0)
  const fixed = p.rentEmi + p.otherBills
  const spending = sum(Object.values(p.expenses ?? {})) + sum((p.customExpenses ?? []).map((i) => i.amount))
  const sip = p.monthlySip
  const budget = Math.max(0, income - fixed - sip)
  const left = budget - spending

  const goals = (p.goals ?? []).map((g) => ({ ...g, need: requiredSip(g, p.risk) }))
  const requiredTotal = sum(goals.map((g) => g.need))
  const ratio = requiredTotal > 0 ? sip / requiredTotal : 0
  const status: VelocityStatus =
    requiredTotal === 0 ? 'No goals' : ratio >= 1.1 ? 'Accelerating' : ratio >= 0.9 ? 'On Pace' : 'Lagging'

  const assetsTotal = sum(Object.values(p.assets ?? {})) + sum((p.customAssets ?? []).map((i) => i.amount))
  const netWorth = p.investments + assetsTotal - p.loans

  return { income, fixed, spending, sip, budget, left, goals, requiredTotal, ratio, status, assetsTotal, netWorth }
}
export function goalProgress(p: Profile, txs: TxLite[] = []) {
  const m = getMetrics(p)
    const actual = actualSpend30(txs)
  const extra = txs.length ? Math.max(0, actual - m.spending) : 0
  const effSip = Math.max(0, m.sip - extra)
  const r = yearlyReturn(p.risk) / 12
  const totalNeed = m.requiredTotal
  const items = m.goals.map((g) => {
    const monthsLeft = monthsUntil(g.targetDate)
    // is goal ko milne wala SIP share (required ke ratio mein)
    const share = totalNeed > 0 ? (effSip * g.need) / totalNeed : 0
    // current SIP se target tak kitne months lagenge
    let monthsToFinish = Infinity
    if (share > 0 && g.targetAmount > 0) {
      const x = (g.targetAmount * r) / share + 1
      monthsToFinish = Math.ceil(Math.log(x) / Math.log(1 + r))
    }
    const projected = share > 0 ? share * ((Math.pow(1 + r, monthsLeft) - 1) / r) : 0
    const pct = g.targetAmount > 0 ? Math.min(100, Math.round((projected / g.targetAmount) * 100)) : 0
    const gap = Math.max(0, g.need - share)
    return { ...g, monthsLeft, share, monthsToFinish, projected, pct, gap, onTrack: share >= g.need * 0.95 }
  })
  return { ...m, items, actual, extra, effSip }
}
export type TxLite = { category: string; amount: number; type: 'expense' | 'income'; date: string }

export function actualSpend30(txs: TxLite[]) {
  const c = new Date()
  c.setDate(c.getDate() - 30)
  const cutoff = c.toISOString().slice(0, 10)
  return txs
    .filter((t) => t.date >= cutoff && t.type === 'expense' && t.category !== 'Investing' && t.category !== 'Rent & bills')
    .reduce((a, t) => a + t.amount, 0)
}