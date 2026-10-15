export const TX_KEY = 'kairos_transactions_v2'
const REM_KEY = 'kairos_reminder'

export type Reminder = {
  enabled: boolean
  time: string // "HH:MM" in 24h
  lastFired: string // date (YYYY-MM-DD) the reminder last showed
  lastNoted: string // date (YYYY-MM-DD) the user last noted transactions
}

const DEFAULT: Reminder = { enabled: false, time: '21:00', lastFired: '', lastNoted: '' }

const pad = (n: number) => String(n).padStart(2, '0')
export const isoOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayIso = () => isoOf(new Date())

export function loadReminder(): Reminder {
  try {
    const raw = localStorage.getItem(REM_KEY)
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT }
  } catch {
    return { ...DEFAULT }
  }
}

export function updateReminder(patch: Partial<Reminder>): Reminder {
  const next = { ...loadReminder(), ...patch }
  localStorage.setItem(REM_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('kairos-reminder'))
  return next
}

export const markNoted = () => updateReminder({ lastNoted: todayIso() })