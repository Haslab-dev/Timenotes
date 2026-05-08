import React, { createContext } from 'react'
import { useAuth } from '../hooks/use-auth'
import type { User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: user, isLoading, error } = useAuth()

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    error: error?.message || null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
