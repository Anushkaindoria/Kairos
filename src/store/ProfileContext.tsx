import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Profile } from '../types'

interface User {
  name: string
  email: string
}

interface ProfileCtx {
  user: User | null
  profile: Profile | null
  login: (name: string, email: string) => void
  saveProfile: (p: Profile) => void
  logout: () => void
  resetProfile: () => void
}

const Ctx = createContext<ProfileCtx | null>(null)
const PROFILE_KEY = 'kairos_profile'
const USER_KEY = 'kairos_user'

function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => load<User>(USER_KEY))
  const [profile, setProfile] = useState<Profile | null>(() => load<Profile>(PROFILE_KEY))

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  }, [user])

  useEffect(() => {
    if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    else localStorage.removeItem(PROFILE_KEY)
  }, [profile])

  return (
    <Ctx.Provider
      value={{
        user,
        profile,
        login: (name, email) => setUser({ name, email }),
        saveProfile: setProfile,
        resetProfile: () => setProfile(null),
        logout: () => setUser(null),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useProfile() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useProfile must be used inside ProfileProvider')
  return c
}