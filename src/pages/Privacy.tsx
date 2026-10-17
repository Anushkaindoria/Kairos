import { useEffect, useState } from 'react'
import { ShieldCheck, Cpu, ServerOff, KeyRound, Download, Trash2, Wifi, WifiOff, Lock } from 'lucide-react'
import { useProfile } from '../store/ProfileContext'

const LABELS: Record<string, string> = {
  kairos_user: 'Login details',
  kairos_transactions_v2: 'Your transactions',
  kairos_reminder: 'Reminder settings',
}
const labelOf = (key: string) =>
  key.startsWith('kairos_profile_') ? 'Your financial profile' : LABELS[key] ?? 'App data'

const readKeys = () =>
  Object.keys(localStorage)
    .filter((k) => k.startsWith('kairos_'))
    .map((k) => ({ key: k, label: labelOf(k), bytes: (localStorage.getItem(k) ?? '').length }))

const kb = (b: number) => (b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`)

export default function Privacy() {
  const { user } = useProfile()
  const [rows, setRows] = useState(readKeys)
  const [online, setOnline] = useState(navigator.onLine)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  const total = rows.reduce((a, r) => a + r.bytes, 0)

  const exportData = () => {
    const out: Record<string, unknown> = {}
    rows.forEach((r) => {
      try {
        out[r.key] = JSON.parse(localStorage.getItem(r.key) ?? 'null')
      } catch {
        out[r.key] = localStorage.getItem(r.key)
      }
    })
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'kairos-my-data.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const wipe = () => {
    readKeys().forEach((r) => localStorage.removeItem(r.key))
    window.location.assign('/')
  }

  const pillars = [
    { icon: Cpu, title: 'AI runs on your device', text: 'Calculations run in the browser and the assistant runs through your local Ollama process. No public AI API is called.' },
    { icon: ServerOff, title: 'No server, no upload', text: 'KAIROS has no backend. Your income, goals and transactions are never sent anywhere.' },
    { icon: KeyRound, title: 'You stay in control', text: 'Download everything or erase it all with one tap, below. No account is held on our side.' },
    { icon: ShieldCheck, title: 'Consent first', text: 'On-device analysis starts only after you accept the consent box during setup.' },
  ]

  return (
    <div className="w-full max-w-5xl space-y-6">
       <div>
         <h1 className="text-2xl font-extrabold text-ink-900 sm:text-3xl">Privacy & Security</h1>
        <p className="text-slate-500 mt-1">Your money data stays on your device. Here is exactly what is stored and how to control it.</p>
      </div>

       <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-600 p-5 text-white sm:p-8">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 text-accent-400 text-sm font-semibold">
              <Lock size={16} /> 100% on-device
            </div>
            <p className="text-2xl font-extrabold mt-2 leading-snug">
              Nothing you enter in KAIROS leaves this device.
            </p>
            <p className="text-slate-300 text-sm mt-2">Signed in as {user?.email}</p>
          </div>
           <div className={`flex max-w-full items-start gap-2 break-words rounded-2xl px-4 py-3 text-sm font-semibold ${online ? 'bg-white/10' : 'bg-emerald-400/20 text-emerald-200'}`}>
            {online ? <Wifi size={18} /> : <WifiOff size={18} />}
            {online ? 'Online. AI still runs locally; no public API is used.' : 'Offline. KAIROS keeps working.'}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {pillars.map((p) => (
          <div key={p.title} className="card flex gap-3 p-4 sm:gap-4 sm:p-5">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center">
              <p.icon size={20} />
            </div>
            <div>
              <div className="font-bold">{p.title}</div>
              <p className="text-sm text-slate-500 mt-1">{p.text}</p>
            </div>
          </div>
        ))}
      </div>

       <div className="card min-w-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">What is stored on this device</h2>
          <span className="text-xs font-semibold text-slate-500">{rows.length} items · {kb(total)}</span>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500 mt-4">Nothing is stored right now.</p>
        ) : (
          <ul className="divide-y divide-slate-100 mt-3">
            {rows.map((r) => (
               <li key={r.key} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="font-semibold">{r.label}</div>
                   <div className="break-all text-xs text-slate-400">{r.key.replace(/(kairos_profile_).+/, '$1…')}</div>
                </div>
                <span className="text-slate-500 shrink-0">{kb(r.bytes)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={() => setRows(readKeys())}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            Refresh
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white transition"
          >
            <Download size={16} /> Download my data
          </button>
          <button
            onClick={() => setConfirm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition"
          >
            <Trash2 size={16} /> Delete all my data
          </button>
        </div>
      </div>

       <div className="card min-w-0 p-4 sm:p-6">
        <h2 className="text-lg font-extrabold">Honest limits of this prototype</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
          <li>Data is saved in your browser's local storage, unencrypted. Anyone who can use this browser profile can read it.</li>
          <li>Login is local to this device in the prototype. There is no server-side account yet.</li>
          <li>Clearing browser data or switching browsers removes your saved plan unless you download it first.</li>
          <li>The AI Assistant sends the selected financial context only to the Ollama process you run locally; it does not call a public AI API.</li>
        </ul>
        <div className="mt-4 rounded-2xl bg-indigo-50 border border-indigo-200 p-4 text-sm text-indigo-900">
          <b>Prototype note:</b> the assistant uses a local Ollama model. Encrypt stored data with the browser's Web Crypto API using a passcode and add biometric lock on mobile in the full build.
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirm(false)}>
          <div role="dialog" aria-modal="true" className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Delete everything?</h3>
            <p className="text-sm text-slate-500 mt-1">
              This erases your profile, goals, transactions and settings from this device and signs you out. It cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                Keep my data
              </button>
              <button onClick={wipe} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition">
                Delete all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
