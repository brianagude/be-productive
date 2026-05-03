'use client'

import { createContext, useContext } from 'react'
import { type User } from '@supabase/supabase-js'
import { useAuth } from '@/hooks/useAuth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  // Single source of truth for "use DB vs localStorage".
  // Currently: any signed-in user. Future: paid users only.
  useCloud: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signOut: async () => {},
  useCloud: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const useCloud = !!user // future: !!user && plan === 'paid'

  return (
    <AuthContext.Provider value={{ user, loading, signOut, useCloud }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
