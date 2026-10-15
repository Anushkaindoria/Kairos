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