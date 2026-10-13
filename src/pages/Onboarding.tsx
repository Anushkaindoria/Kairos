import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus, Trash2, ShieldCheck, Sparkles } from 'lucide-react'
import { useProfile } from '../store/ProfileContext'
import type { Profile, Goal, GoalType, GoalFlexibility, Risk } from '../types'

const steps = [
  { emoji: '👋', title: "Let's get to know you", sub: 'Takes about 2 minutes. No paperwork.', cheer: "Let's go!", tip: 'Your age helps us pick the right investing horizon for you.' },
  { emoji: '💸', title: 'Your monthly flow', sub: 'What comes in and what goes out. Rough numbers are fine.', cheer: 'Great start!', tip: 'A healthy rule: keep fixed costs under 50% of your income.' },
  { emoji: '📈', title: 'Your money today', sub: 'Just type the amounts. We calculate the rest.', cheer: 'Halfway there!', tip: 'Spreading money across assets lowers the damage from any one crash.' },
  { emoji: '🎯', title: 'Your dreams', sub: 'Pick a popular goal or write your own.', cheer: 'Almost done!', tip: 'Goals under 2 years should avoid risky equity. We will handle that.' },
  { emoji: '🛡️', title: 'Your safety net', sub: 'Last one. Then we build your cockpit.', cheer: 'Final stretch!', tip: 'Aim for 6+ months of expenses saved and life cover of 10x your yearly income.' },
]

const goalMeta: Record<GoalType, string> = {
  'Home Purchase': '🏠',
  Retirement: '🌴',
  'Wealth Growth': '🚀',
  'Short-Term Liquidity': '💧',
  'Child Education': '🎓',
  Custom: '✨',
}
const goalTypes = Object.keys(goalMeta) as GoalType[]
const customIdeas = ['Car', 'Wedding', 'Travel', 'Business', 'Gadget', 'Medical fund']

const inr = (n: number) => n.toLocaleString('en-IN')
const short = (n: number) =>
  n >= 1e7 ? `₹${+(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${+(n / 1e5).toFixed(2)} L` : n >= 1e3 ? `₹${+(n / 1e3).toFixed(1)}K` : `₹${n}`
const inMonths = (m: number) => {
  const d = new Date()
  d.setMonth(d.getMonth() + m)
  return d.toISOString().slice(0, 10)
}
const monthsUntil = (d: string) => Math.max(1, Math.round((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)))

const inputCls =
  'w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600 mb-1.5">{label}</div>
      {children}
    </div>
  )
}

function Chips<T extends string>({
  value, options, onChange, icons,
}: { value: T; options: readonly T[]; onChange: (v: T) => void; icons?: Partial<Record<T, string>> }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`px-3.5 py-2 rounded-full text-sm font-medium border transition ${
            value === o
              ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/30'
              : 'bg-white/70 border-slate-200 text-slate-600 hover:border-brand-500'
          }`}
        >
          {icons?.[o] && <span className="mr-1">{icons[o]}</span>}
          {o}
        </button>
      ))}
    </div>
  )
}

function Money({
  label, value, onChange, quick,
}: { label: string; value: number; onChange: (v: number) => void; quick?: number[] }) {
  return (
    <Field label={label}>
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
        <input
          inputMode="numeric"
          placeholder="0"
          className={`${inputCls} pl-7 pr-20`}
          value={value ? inr(value) : ''}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')))}
        />
        {value > 0 && <span className="absolute right-3 top-2.5 text-xs text-brand-600 font-semibold">{short(value)}</span>}
      </div>
      {quick && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onChange(q)}
              className="px-2.5 py-1 rounded-full text-xs bg-slate-100 hover:bg-brand-500 hover:text-white text-slate-600 transition"
            >
              {q === 0 ? 'None' : short(q)}
            </button>
          ))}
        </div>
      )}
    </Field>
  )
}

function Slider({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        <span className="text-lg font-bold text-brand-600">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
    </div>
  )
}

function Bar({ label, pct, note, warn }: { label: string; pct: number; note: string; warn?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{note}</span>
      </div>
      <div className="h-2 rounded-full bg-white/15 mt-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${warn ? 'bg-amber-400' : 'bg-accent-400'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Ring({ score }: { score: number }) {
  const r = 46
  const c = 2 * Math.PI * r
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
        <circle
          cx="60" cy="60" r={r} stroke="#22d3ee" strokeWidth="10" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold">{score}</span>
        <span className="text-[10px] text-slate-300 tracking-widest">OUT OF 100</span>
      </div>
    </div>
  )
}

const newGoal = (type: GoalType): Goal => ({ id: crypto.randomUUID(), type, name: '', targetAmount: 0, targetDate: '', flexibility: 'Flexible' })

export default function Onboarding() {
  const { user, saveProfile } = useProfile()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [assets, setAssets] = useState({ equity: 0, debt: 0, gold: 0, cash: 0 })
  const [emVal, setEmVal] = useState(0)
  const [emUnit, setEmUnit] = useState<'Months' | 'Years'>('Months')
  const [p, setP] = useState<Profile>({
    name: user?.name ?? '',
    email: user?.email ?? '',
    age: 0,
    city: '',
    occupation: 'Salaried',
    income: 0,
    salaryCreditDate: 1,
    incomeStability: 'Fixed',
    otherIncomeType: 'None',
    otherIncome: 0,
    rentEmi: 0,
    otherBills: 0,
    loans: 0,
    risk: 'Moderate',
    investments: 0,
    monthlySip: 0,
    mix: { equity: 0, debt: 0, gold: 0, cash: 0 },
    goals: [newGoal('Home Purchase')],
    emergencyMonths: 0,
    lifeCover: 0,
    healthCover: 0,
    dependents: 0,
    consent: false,
  })

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((prev) => ({ ...prev, [k]: v }))
  const setAsset = (k: keyof typeof assets, v: number) => setAssets((a) => ({ ...a, [k]: v }))
  const updateGoal = (id: string, patch: Partial<Goal>) => set('goals', p.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  const addGoal = () => set('goals', [...p.goals, newGoal('Wealth Growth')])
  const removeGoal = (id: string) => set('goals', p.goals.filter((g) => g.id !== id))

  const totalInvested = assets.equity + assets.debt + assets.gold + assets.cash
  const pct = (v: number) => (totalInvested ? Math.round((v / totalInvested) * 100) : 0)
  const emergencyMonths = emUnit === 'Years' ? emVal * 12 : emVal

  const totalIncome = p.income + p.otherIncome
  const fixed = p.rentEmi + p.otherBills
  const free = Math.max(0, totalIncome - fixed)
  const safeSip = Math.round((free * 0.3) / 500) * 500
  const fixedPct = totalIncome ? Math.min(100, Math.round((fixed / totalIncome) * 100)) : 0
  const emergencyPct = Math.min(100, Math.round((emergencyMonths / 6) * 100))
  const lifeTarget = p.income * 12 * 10
  const lifePct = lifeTarget ? Math.min(100, Math.round((p.lifeCover / lifeTarget) * 100)) : 0
  const goalsTotal = p.goals.reduce((s, g) => s + g.targetAmount, 0)

  const score = totalIncome
    ? Math.round(
        25 * Math.max(0, Math.min(1, 1 - Math.max(0, fixedPct - 30) / 50)) +
          25 * Math.min(1, emergencyMonths / 6) +
          25 * (lifePct / 100) +
          25 * (safeSip > 0 ? Math.min(1, p.monthlySip / safeSip) : 0),
      )
    : 0
  const scoreLabel = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : score >= 25 ? 'Fair' : 'Just starting'

  const validate = (): string => {
    if (step === 0) {
      if (p.age < 18 || p.age > 80) return 'Enter a valid age between 18 and 80.'
      if (!p.city.trim()) return 'Tell us your city so we can personalise things.'
    }
    if (step === 1 && p.income <= 0) return 'Enter your monthly income. A rough number is fine.'
    if (step === 3) {
      if (p.goals.some((g) => g.type === 'Custom' && !(g.name ?? '').trim())) return 'Give your custom goal a name.'
      if (p.goals.some((g) => g.targetAmount <= 0)) return 'Pick a target amount for each goal.'
      if (p.goals.some((g) => !g.targetDate)) return 'Pick a target date for each goal.'
    }
    if (step === 4 && !p.consent) return 'Please tick the consent box to continue.'
    return ''
  }

  const buildFinal = (): Profile => {
    const eq = pct(assets.equity)
    const debt = pct(assets.debt)
    const gold = pct(assets.gold)
    const cash = totalInvested ? Math.max(0, 100 - eq - debt - gold) : 0
    return { ...p, investments: totalInvested, mix: { equity: eq, debt, gold, cash }, emergencyMonths }
  }

  const next = () => {
    const msg = validate()
    if (msg) return setError(msg)
    setError('')
    if (step < steps.length - 1) setStep(step + 1)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-10 text-center">
          <div className="text-6xl animate-bounce">🎉</div>
          <h2 className="text-2xl font-extrabold mt-4">You're all set, {p.name.split(' ')[0]}!</h2>
          <p className="text-slate-500 mt-2 text-sm">
            We found <b>{short(free)}</b> of free cash a month and a comfortable SIP of about <b>{short(safeSip)}</b>. Your Velocity Cockpit is ready.
          </p>
          <button
            onClick={() => {
              saveProfile(buildFinal())
              navigate('/')
            }}
            className="mt-8 w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition"
          >
            Enter KAIROS
          </button>
        </div>
      </div>
    )
  }

  const s = steps[step]

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-6xl w-full">
        <div className="card p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="text-lg font-extrabold tracking-widest text-brand-600">KAIROS</div>
            <div className="text-xs font-semibold text-slate-500">
              Step {step + 1} of {steps.length} · {s.cheer}
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-200 mt-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-600 to-accent-400 transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>

          <h2 className="text-2xl font-extrabold mt-6">
            <span className="mr-2">{s.emoji}</span>
            {s.title}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{s.sub}</p>

          <div className="mt-6 space-y-5">
            {step === 0 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Your age">
                    <input
                      inputMode="numeric"
                      placeholder="e.g. 26"
                      className={inputCls}
                      value={p.age || ''}
                      onChange={(e) => set('age', Number(e.target.value.replace(/\D/g, '').slice(0, 2)))}
                    />
                  </Field>
                  <Field label="Your city">
                    <input className={inputCls} placeholder="e.g. Jaipur" value={p.city} onChange={(e) => set('city', e.target.value)} />
                  </Field>
                </div>
                <Field label="What describes you best?">
                  <Chips
                    value={p.occupation}
                    options={['Salaried', 'Self-employed', 'Student'] as Profile['occupation'][]}
                    onChange={(v) => set('occupation', v)}
                    icons={{ Salaried: '💼', 'Self-employed': '🛠️', Student: '🎒' }}
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Money label="Total monthly income (include family members' income)" value={p.income} onChange={(v) => set('income', v)} quick={[30000, 50000, 80000, 120000, 200000]} />
                <Slider label="Salary credit date (day of month)" value={p.salaryCreditDate} min={1} max={31} onChange={(v) => set('salaryCreditDate', v)} />
                <Field label="How steady is your income?">
                  <Chips value={p.incomeStability} options={['Fixed', 'Variable', 'Irregular'] as Profile['incomeStability'][]} onChange={(v) => set('incomeStability', v)} />
                </Field>
                <Field label="Any side income?">
                  <Chips
                    value={p.otherIncomeType}
                    options={['None', 'Freelance', 'Rent', 'Dividends', 'Side business']}
                    onChange={(v) => {
                      set('otherIncomeType', v)
                      if (v === 'None') set('otherIncome', 0)
                    }}
                  />
                </Field>
                {p.otherIncomeType !== 'None' && <Money label="Side income per month" value={p.otherIncome} onChange={(v) => set('otherIncome', v)} />}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Money label="Rent / Home EMI per month" value={p.rentEmi} onChange={(v) => set('rentEmi', v)} />
                  <Money label="Other fixed bills per month" value={p.otherBills} onChange={(v) => set('otherBills', v)} />
                </div>
                <Money label="Total loans outstanding (0 if none)" value={p.loans} onChange={(v) => set('loans', v)} />
              </>
            )}

            {step === 2 && (
              <>
                <Field label="How do you feel about market ups and downs?">
                  <Chips
                    value={p.risk}
                    options={['Conservative', 'Moderate', 'Aggressive'] as Risk[]}
                    onChange={(v) => set('risk', v)}
                    icons={{ Conservative: '🐢', Moderate: '🚶', Aggressive: '🐆' }}
                  />
                </Field>
                <div className="text-sm font-bold pt-1">Where is your money today? (leave blank if none)</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Money label="📈 Stocks & equity mutual funds" value={assets.equity} onChange={(v) => setAsset('equity', v)} quick={[100000, 500000, 1000000]} />
                  <Money label="🏦 FDs, debt funds & bonds" value={assets.debt} onChange={(v) => setAsset('debt', v)} quick={[100000, 500000, 1000000]} />
                  <Money label="🪙 Gold" value={assets.gold} onChange={(v) => setAsset('gold', v)} quick={[50000, 200000]} />
                  <Money label="💵 Cash & savings account" value={assets.cash} onChange={(v) => setAsset('cash', v)} quick={[25000, 100000]} />
                </div>
                {totalInvested > 0 && (
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Total: {short(totalInvested)}</span>
                      <span className="text-slate-500 text-xs">
                        Equity {pct(assets.equity)}% · Debt {pct(assets.debt)}% · Gold {pct(assets.gold)}% · Cash {pct(assets.cash)}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden flex bg-slate-200 mt-2">
                      <div className="bg-indigo-500 transition-all" style={{ width: `${pct(assets.equity)}%` }} />
                      <div className="bg-cyan-400 transition-all" style={{ width: `${pct(assets.debt)}%` }} />
                      <div className="bg-amber-400 transition-all" style={{ width: `${pct(assets.gold)}%` }} />
                      <div className="bg-slate-400 transition-all" style={{ width: `${pct(assets.cash)}%` }} />
                    </div>
                  </div>
                )}
                <Money label="Current monthly SIP (0 if none)" value={p.monthlySip} onChange={(v) => set('monthlySip', v)} quick={[2000, 5000, 10000]} />
              </>
            )}

            {step === 3 && (
              <>
                {p.goals.map((g, i) => {
                  const months = g.targetDate ? monthsUntil(g.targetDate) : 0
                  const need = g.targetAmount > 0 && months > 0 ? Math.round(g.targetAmount / months) : 0
                  return (
                    <div key={g.id} className="border border-slate-200 rounded-2xl p-4 bg-white/60 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold">
                          {goalMeta[g.type]} Goal {i + 1}
                          {g.type === 'Custom' && g.name ? `: ${g.name}` : ''}
                        </span>
                        {p.goals.length > 1 && (
                          <button type="button" onClick={() => removeGoal(g.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <Chips value={g.type} options={goalTypes} onChange={(v) => updateGoal(g.id, { type: v })} icons={goalMeta} />

                      {g.type === 'Custom' && (
                        <Field label="Name your goal">
                          <input className={inputCls} placeholder="e.g. Buy a car" value={g.name ?? ''} onChange={(e) => updateGoal(g.id, { name: e.target.value })} />
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            {customIdeas.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => updateGoal(g.id, { name: c })}
                                className="px-2.5 py-1 rounded-full text-xs bg-slate-100 hover:bg-brand-500 hover:text-white text-slate-600 transition"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </Field>
                      )}

                      <Money
                        label="How much will you need?"
                        value={g.targetAmount}
                        onChange={(v) => updateGoal(g.id, { targetAmount: v })}
                        quick={[500000, 1000000, 2500000, 5000000, 10000000]}
                      />
                      <Field label="By when?">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(
                            [
                              ['6 mo', 6],
                              ['1 yr', 12],
                              ['3 yrs', 36],
                              ['5 yrs', 60],
                              ['10 yrs', 120],
                            ] as [string, number][]
                          ).map(([lbl, m]) => (
                            <button
                              key={lbl}
                              type="button"
                              onClick={() => updateGoal(g.id, { targetDate: inMonths(m) })}
                              className={`px-2.5 py-1 rounded-full text-xs transition ${
                                g.targetDate === inMonths(m) ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-brand-500 hover:text-white'
                              }`}
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                        <input type="date" className={inputCls} value={g.targetDate} onChange={(e) => updateGoal(g.id, { targetDate: e.target.value })} />
                      </Field>

                      {need > 0 && (
                        <p className="text-xs bg-indigo-50 text-indigo-700 rounded-lg px-3 py-2">
                          💡 Roughly <b>{short(need)}/month</b> needed over {months} months (before returns).
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {(['Strict', 'Flexible'] as GoalFlexibility[]).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => updateGoal(g.id, { flexibility: f })}
                            className={`text-left p-3 rounded-xl border text-sm transition ${
                              g.flexibility === f ? 'border-brand-600 bg-brand-500/10' : 'border-slate-200 bg-white/70'
                            }`}
                          >
                            <div className="font-bold">{f === 'Strict' ? '🔒 Strict' : '🌊 Flexible'}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{f === 'Strict' ? 'Date is fixed. Raise my SIP.' : 'Move the date if needed.'}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                <button type="button" onClick={addGoal} className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                  <Plus size={16} /> Add another dream
                </button>
              </>
            )}

            {step === 4 && (
              <>
                <Field label="How long could you live on your savings if income stopped?">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      inputMode="numeric"
                      placeholder="0"
                      className={`${inputCls} !w-24 text-center font-bold`}
                      value={emVal || ''}
                      onChange={(e) => setEmVal(Math.min(emUnit === 'Years' ? 10 : 120, Number(e.target.value.replace(/\D/g, ''))))}
                    />
                    <Chips value={emUnit} options={['Months', 'Years'] as ('Months' | 'Years')[]} onChange={setEmUnit} />
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {(
                      [
                        ['None', 0, 'Months'],
                        ['3 months', 3, 'Months'],
                        ['6 months', 6, 'Months'],
                        ['1 year', 1, 'Years'],
                        ['2 years', 2, 'Years'],
                      ] as [string, number, 'Months' | 'Years'][]
                    ).map(([lbl, v, u]) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => {
                          setEmVal(v)
                          setEmUnit(u)
                        }}
                        className="px-2.5 py-1 rounded-full text-xs bg-slate-100 hover:bg-brand-500 hover:text-white text-slate-600 transition"
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  {emergencyMonths > 0 && <p className="text-xs text-slate-500 mt-2">= {emergencyMonths} months of expenses covered</p>}
                </Field>
                <Field label="People who depend on your income">
                  <div className="flex items-center gap-4">
                    <button type="button" onClick={() => set('dependents', Math.max(0, p.dependents - 1))} className="w-9 h-9 rounded-full bg-slate-100 text-lg">
                      −
                    </button>
                    <span className="text-xl font-bold w-6 text-center">{p.dependents}</span>
                    <button type="button" onClick={() => set('dependents', p.dependents + 1)} className="w-9 h-9 rounded-full bg-slate-100 text-lg">
                      +
                    </button>
                  </div>
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Money label="Life insurance cover" value={p.lifeCover} onChange={(v) => set('lifeCover', v)} quick={[0, 5000000, 10000000]} />
                  <Money label="Health insurance cover" value={p.healthCover} onChange={(v) => set('healthCover', v)} quick={[0, 500000, 1000000]} />
                </div>
                <label className="flex gap-3 items-start text-sm text-slate-600 bg-emerald-50 border border-emerald-200 rounded-xl p-4 cursor-pointer">
                  <input type="checkbox" className="mt-1 accent-emerald-600" checked={p.consent} onChange={(e) => set('consent', e.target.checked)} />
                  <span>
                    <b className="text-emerald-700">🔐 Your data stays on your device.</b> I consent to on-device analysis. Nothing is sent to any server.
                  </span>
                </label>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-500 mt-5">{error}</p>}

          <div className="flex justify-between items-center mt-8">
            <button
              type="button"
              onClick={() => {
                setError('')
                setStep(step - 1)
              }}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 disabled:opacity-0"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition"
            >
              {step === steps.length - 1 ? 'Finish' : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        </div>

        <aside className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-600 text-white p-7 flex flex-col gap-6 lg:min-h-[640px]">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-brand-500/30 blur-3xl" />

          <div className="relative flex items-center justify-between">
            <div className="text-xs uppercase tracking-widest text-slate-300">Live snapshot</div>
            <Sparkles size={16} className="text-accent-400" />
          </div>

          <div className="relative flex flex-col items-center text-center">
            <Ring score={score} />
            <div className="mt-2 text-sm font-bold">Financial health: {scoreLabel}</div>
            <div className="text-xs text-slate-300">Updates as you fill the form</div>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-3.5">
              <div className="text-[11px] text-slate-300">Free cash / month</div>
              <div className="text-xl font-extrabold mt-0.5">{short(free)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-3.5">
              <div className="text-[11px] text-slate-300">Comfortable SIP</div>
              <div className="text-xl font-extrabold text-accent-400 mt-0.5">{short(safeSip)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-3.5">
              <div className="text-[11px] text-slate-300">Invested today</div>
              <div className="text-xl font-extrabold mt-0.5">{short(totalInvested)}</div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur p-3.5">
              <div className="text-[11px] text-slate-300">Goals total</div>
              <div className="text-xl font-extrabold mt-0.5">{short(goalsTotal)}</div>
            </div>
          </div>

          <div className="relative space-y-4">
            <Bar label="Fixed costs" pct={fixedPct} note={`${fixedPct}% of income`} warn={fixedPct > 50} />
            <Bar label="Emergency buffer" pct={emergencyPct} note={`${emergencyMonths}/6 months`} warn={emergencyPct < 50} />
            <Bar label="Life cover" pct={lifePct} note={`${lifePct}% of target`} warn={lifePct < 50} />
          </div>

          {p.monthlySip > safeSip && safeSip > 0 && (
            <p className="relative text-xs bg-amber-400/20 text-amber-200 rounded-xl p-3">Your SIP is above the comfortable level. We'll help you balance it.</p>
          )}

          <div className="relative mt-auto space-y-3">
            <div className="rounded-2xl bg-white/10 backdrop-blur p-4 text-xs text-slate-200 leading-relaxed">💡 {s.tip}</div>
            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <ShieldCheck size={14} /> Calculated on your device. Nothing leaves it.
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}