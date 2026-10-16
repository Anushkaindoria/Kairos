import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Search, Bell, BellOff } from 'lucide-react'
import { useProfile } from '../store/ProfileContext'
import { getMetrics, short } from '../lib/finance'
import { TX_KEY, loadReminder, updateReminder, markNoted, todayIso, isoOf } from '../lib/reminder'

type Tx = { id: string; name: string; category: string; amount: number; type: 'expense' | 'income'; date: string }

const CATS = ['Food', 'Shopping', 'Subscriptions', 'Transport', 'Entertainment', 'Health', 'Rent & bills', 'Investing', 'Other']
const ICON: Record<string, string> = {
  Food: '🍔',
  Shopping: '🛍️',
  Subscriptions: '📺',
  Transport: '🚌',
  Entertainment: '🎬',
  Health: '💊',
  'Rent & bills': '🏠',
  Investing: '📈',
  Other: '📌',
  Income: '💰',
}

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return isoOf(d)
}
const inr = (n: number) => n.toLocaleString('en-IN')

const inputCls =
  'w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export default function Transactions() {
  const { profile } = useProfile()
  const [txs, setTxs] = useState<Tx[]>(() => {
    try {
      const raw = localStorage.getItem(TX_KEY)
      if (raw) return JSON.parse(raw) as Tx[]
    } catch {
      /* ignore */
    }
    return []
  })
  const [reminder, setReminder] = useState(loadReminder)
  const [tab, setTab] = useState<'all' | 'expense' | 'income'>('all')
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [f, setF] = useState({ name: '', amount: 0, category: 'Food', custom: '', type: 'expense' as Tx['type'], date: todayIso() }) 
  useEffect(() => {
    localStorage.setItem(TX_KEY, JSON.stringify(txs))
  }, [txs])

  const perm = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  const notedToday = reminder.lastNoted === todayIso()

  const toggleReminder = async () => {
    if (!reminder.enabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    setReminder(updateReminder({ enabled: !reminder.enabled, lastFired: '' }))
  }

  const testReminder = () => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('KAIROS reminder', { body: "Note down today's transactions." })
    }
  }

  const stats = useMemo(() => {
    const cutoff = daysAgo(30)
    const recent = txs.filter((t) => t.date >= cutoff)
    const income = recent.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0)
    const invested = recent.filter((t) => t.category === 'Investing').reduce((a, t) => a + t.amount, 0)
    const spendTx = recent.filter((t) => t.type === 'expense' && t.category !== 'Investing')
    const spent = spendTx.reduce((a, t) => a + t.amount, 0)
    const discretionary = spendTx.filter((t) => t.category !== 'Rent & bills').reduce((a, t) => a + t.amount, 0)
    const byCat: Record<string, number> = {}
    spendTx.forEach((t) => (byCat[t.category] = (byCat[t.category] ?? 0) + t.amount))
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
    return { income, invested, spent, discretionary, top }
  }, [txs])

  const filtered = useMemo(
    () =>
      txs
        .filter((t) => (tab === 'all' ? true : t.type === tab))
        .filter((t) => (cat === 'All' ? true : t.category === cat))
        .filter((t) => t.name.toLowerCase().includes(q.trim().toLowerCase()))
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
    [txs, tab, cat, q],
  )

  const groups = useMemo(() => {
    const map = new Map<string, Tx[]>()
    filtered.forEach((t) => map.set(t.date, [...(map.get(t.date) ?? []), t]))
    return [...map.entries()]
  }, [filtered])

  const dateLabel = (d: string) => {
    if (d === daysAgo(0)) return 'Today'
    if (d === daysAgo(1)) return 'Yesterday'
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const submit = () => {
    if (!f.name.trim()) return setError('Enter a name, like Swiggy or Salary.')
    if (f.amount <= 0) return setError('Enter an amount greater than 0.')
    if (!f.date) return setError('Pick a date.')
    setError('')
    const category = f.type === 'income' ? 'Income' : f.category === 'Other' && f.custom.trim() ? f.custom.trim() : f.category;
        setTxs((prev) => [{ id: crypto.randomUUID(), name: f.name.trim(), category, amount: f.amount, type: f.type, date: f.date }, ...prev])
    setReminder(markNoted())
    setF({ name: '', amount: 0, category: f.category, custom: '', type: f.type, date: f.date })
    setSaved(`Saved "${f.name.trim()}". Add the next one below.`)
  }
  const extraCats = Array.from(new Set(txs.map((t) => t.category))).filter((c) => !CATS.includes(c) && c !== 'Income')
  if (!profile) return null
  const m = getMetrics(profile)
  const planned = m.spending
  const usedPct = planned ? Math.min(100, Math.round((stats.discretionary / planned) * 100)) : 0
  const over = planned > 0 && stats.discretionary > planned

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-ink-900">Transactions</h1>
          <p className="text-slate-500 mt-1">Note what you spend and earn each day. You can add past days too.</p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition"
        >
          <Plus size={16} /> Add transaction
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
        <div className="card p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500">Today</div>
            <div className="font-bold mt-0.5">{notedToday ? '✅ You have noted today' : '📝 Not noted yet'}</div>
            {!notedToday && <p className="text-xs text-slate-500 mt-1">Add today's transactions, or tell us there were none.</p>}
          </div>
          {!notedToday && (
            <button
              onClick={() => setReminder(markNoted())}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Nothing today
            </button>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm">
              {reminder.enabled ? <Bell size={16} className="text-brand-600" /> : <BellOff size={16} className="text-slate-400" />}
              Daily reminder
            </div>
            <button
              onClick={toggleReminder}
              role="switch"
              aria-checked={reminder.enabled}
              className={`w-11 h-6 rounded-full p-0.5 transition ${reminder.enabled ? 'bg-brand-600' : 'bg-slate-300'}`}
            >
              <span className={`block w-5 h-5 rounded-full bg-white transition-transform ${reminder.enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          {reminder.enabled ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-500">Remind me at</label>
              <input
                type="time"
                value={reminder.time}
                onChange={(e) => setReminder(updateReminder({ time: e.target.value, lastFired: '' }))}
                className={`${inputCls} !w-32`}
              />
              {perm === 'granted' && (
                <button onClick={testReminder} className="text-xs font-semibold text-brand-600">
                  Send test
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">Turn on to get a daily nudge to note your transactions.</p>
          )}
          {reminder.enabled && (
            <p className="text-[11px] text-slate-400 mt-2">
              {perm === 'denied'
                ? 'Browser notifications are blocked. You will see an in-app reminder instead.'
                : 'Works while KAIROS is open in your browser or installed as an app.'}
            </p>
          )}
        </div>
      </div>

      {open && (
        <div className="card p-6 space-y-4">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setF({ ...f, type: k })}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  f.type === k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white/70 border-slate-200 text-slate-600'
                }`}
              >
                {k === 'expense' ? 'Money out' : 'Money in'}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <input className={inputCls} placeholder="Name (e.g. Swiggy)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
              <input
                inputMode="numeric"
                placeholder="Amount"
                className={`${inputCls} pl-7`}
                value={f.amount ? inr(f.amount) : ''}
                onChange={(e) => setF({ ...f, amount: Number(e.target.value.replace(/\D/g, '')) })}
              />
            </div>
            {f.type === 'expense' ? (
              <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
                {CATS.map((c) => (
                  <option key={c} value={c}>
                    {ICON[c]} {c}
                  </option>
                ))}
              </select>
            ) : (
              <div className={`${inputCls} text-slate-400`}>💰 Income</div>
            )}
            <input type="date" max={todayIso()} className={inputCls} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          </div>
            {f.type === 'expense' && f.category === 'Other' && (
            <input
              className={`${inputCls} max-w-sm`}
              placeholder="Write your own category (e.g. Education)"
              value={f.custom}
              onChange={(e) => setF({ ...f, custom: e.target.value })}
            />
          )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {saved && !f.name && <p className="text-sm text-emerald-600">✅ {saved}</p>}
                    <div className="flex flex-wrap gap-3">
            <button onClick={submit} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition">
              Save
            </button>
            <button
              onClick={() => {
                setOpen(false)
                setError('')
                setSaved('')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                saved ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'text-slate-500'
              }`}
            >
              {saved ? '✓ Done' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs font-semibold text-slate-500">Money in</div>
          <div className="text-2xl font-extrabold mt-1 text-emerald-600">{short(stats.income)}</div>
          <div className="text-xs text-slate-400 mt-1">Last 30 days</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-semibold text-slate-500">Spent</div>
          <div className="text-2xl font-extrabold mt-1">{short(stats.spent)}</div>
          <div className="text-xs text-slate-400 mt-1">Bills and spending</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-semibold text-slate-500">Invested</div>
          <div className="text-2xl font-extrabold mt-1 text-brand-600">{short(stats.invested)}</div>
          <div className="text-xs text-slate-400 mt-1">SIPs and investing</div>
        </div>
        <div className="card p-5">
          <div className="text-xs font-semibold text-slate-500">Biggest category</div>
          <div className="text-2xl font-extrabold mt-1">{stats.top ? `${ICON[stats.top[0]] ?? ''} ${stats.top[0]}` : '-'}</div>
          <div className="text-xs text-slate-400 mt-1">{stats.top ? short(stats.top[1]) : 'No spending yet'}</div>
        </div>
      </div>

      {planned > 0 && (
        <div className="card p-6">
          <div className="flex justify-between text-sm">
            <span className="font-bold">Spending vs your plan</span>
            <span className={over ? 'text-red-500 font-semibold' : 'text-slate-500'}>
              {short(stats.discretionary)} of {short(planned)}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 mt-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : 'bg-gradient-to-r from-brand-600 to-accent-400'}`} style={{ width: `${usedPct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {over
              ? `You are ${short(stats.discretionary - planned)} above the monthly spending you planned.`
              : `${short(planned - stats.discretionary)} left from your planned monthly spending.`}
          </p>
        </div>
      )}

      <div className="card p-6">
        {txs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl">🧾</div>
            <p className="mt-2 font-semibold text-slate-700">No transactions yet</p>
            <p className="text-sm mt-1">Tap Add transaction to note your first one. You can pick any past date.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-full bg-slate-100 p-1 text-xs font-semibold">
                {(['all', 'expense', 'income'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={`px-3.5 py-1.5 rounded-full transition ${tab === k ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
                  >
                    {k === 'all' ? 'All' : k === 'expense' ? 'Money out' : 'Money in'}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input className={`${inputCls} pl-9`} placeholder="Search transactions" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {['All', ...CATS, ...extraCats, 'Income'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    cat === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white/70 border-slate-200 text-slate-600 hover:border-brand-500'
                  }`}
                >
                  {ICON[c] ? `${ICON[c]} ` : ''}
                  {c}
                </button>
              ))}
            </div>

            {groups.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">No transactions match these filters.</div>
            ) : (
              <div className="mt-5 space-y-5">
                {groups.map(([date, list]) => (
                  <div key={date}>
                    <div className="text-xs font-semibold text-slate-400 mb-1">{dateLabel(date)}</div>
                    <ul className="divide-y divide-slate-100">
                      {list.map((t) => (
                        <li key={t.id} className="flex items-center gap-3 py-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg">{ICON[t.category] ?? '📌'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{t.name}</div>
                            <div className="text-xs text-slate-400">{t.category}</div>
                          </div>
                          <div className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {t.type === 'income' ? '+' : '-'}₹{inr(t.amount)}
                          </div>
                          <button
                            onClick={() => setTxs((prev) => prev.filter((x) => x.id !== t.id))}
                            className="text-slate-300 hover:text-red-500"
                            aria-label="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}