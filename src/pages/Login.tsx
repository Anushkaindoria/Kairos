import { useState } from 'react'
import { useSearchParams} from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'

export default function Login({ onAuth }: { onAuth: (name: string, email: string) => void }) {
 const [params] = useSearchParams()
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'signup' && !name.trim()) return setError('Enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (mode === 'signup' && password !== confirm) return setError('Passwords do not match.')
    setError('')
    onAuth(name.trim() || email.split('@')[0], email)
    
  }

  const field =
    'w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

  return (
     <div className="min-h-screen flex">
       <div className="hidden lg:flex flex-1 bg-gradient-to-br from-ink-900 via-ink-800 to-brand-600 text-white p-10 xl:p-14 flex-col justify-between">
        <Logo light size={56} />
        <div>
          <h1 className="text-4xl font-extrabold leading-tight">
            Your money,<br />on autopilot.
          </h1>
          <p className="mt-4 text-slate-300 max-w-md">
            Autonomous capital velocity steering. All AI runs on your device. Your data never leaves it.
          </p>
        </div>
        <div className="text-xs text-slate-400">100% offline AI · Zero data egress</div>
      </div>

       <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
         <form onSubmit={submit} className="card w-full max-w-md p-5 sm:p-8 space-y-4">
          <h2 className="text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="text-sm text-slate-500">
            {mode === 'login' ? 'Log in to continue.' : 'Takes less than a minute.'}
          </p>

          {mode === 'signup' && (
            <div className="relative">
              <User size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input className={field} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input className={field} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              className={field}
              type={show ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3.5 text-slate-400">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {mode === 'signup' && (
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                className={field}
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-3 rounded-xl transition">
            {mode === 'login' ? 'Log in' : 'Sign up'}
          </button>

          <p className="text-sm text-center text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-brand-600 font-semibold"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
