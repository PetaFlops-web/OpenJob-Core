'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, profileApi, usersApi } from '@/lib/api'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<User | null>
  completeMfaLogin: (accessToken: string, refreshToken: string) => Promise<User | null>
  register: (data: { name: string; email: string; password: string; role: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getCookie(name: string) {
  if (typeof document === 'undefined') return null

  const prefix = `${name}=`
  const cookie = document.cookie.split('; ').find((part) => part.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

function decodeJwtPayload(token: string): { id?: string; role?: string } | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken') || getCookie('accessToken')
      : null
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return null
    }

    localStorage.setItem('accessToken', token)

    try {
      const res = await profileApi.get()
      setUser(res.data)
      return res.data
    } catch (err) {
      const message = err instanceof Error ? err.message : ''
      const payload = decodeJwtPayload(token)

      if (payload?.id && (message.includes('not found') || message.includes('tidak ditemukan') || message.includes('HTTP 404') || message.includes('404'))) {
        try {
          const fallback = await usersApi.getById(payload.id)
          setUser(fallback.data)
          return fallback.data
        } catch {
          // User doesn't exist anymore — clear stale tokens
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          document.cookie = 'accessToken=; path=/; max-age=0'
          document.cookie = 'userRole=; path=/; max-age=0'
          setUser(null)
          return null
        }
      }

      if (message.includes('401') || message.includes('Unauthorized') || message.includes('Token tidak valid')) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        document.cookie = 'accessToken=; path=/; max-age=0'
        document.cookie = 'userRole=; path=/; max-age=0'
        setUser(null)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)

    if (res.data.mfa_required && res.data.mfa_token) {
      sessionStorage.setItem('mfa_token', res.data.mfa_token)
      router.push('/login/mfa')
      return null
    }

    if (res.data.accessToken && res.data.refreshToken) {
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      document.cookie = `accessToken=${res.data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    }

    const authenticatedUser = await refreshUser()
    const role = authenticatedUser?.role === 'recruiter' ? 'employer' : 'seeker'
    document.cookie = `userRole=${role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    router.push(`/dashboard/${role}`)
    return authenticatedUser
  }

  const completeMfaLogin = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    sessionStorage.removeItem('mfa_token')

    const authenticatedUser = await refreshUser()
    const role = authenticatedUser?.role === 'recruiter' ? 'employer' : 'seeker'
    document.cookie = `userRole=${role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    router.push(`/dashboard/${role}`)
    return authenticatedUser
  }

  const register = async (data: { name: string; email: string; password: string; role: string }) => {
    await authApi.register(data)
    router.push('/login')
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || getCookie('refreshToken')
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => null)
      }
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      document.cookie = 'accessToken=; path=/; max-age=0'
      document.cookie = 'userRole=; path=/; max-age=0'
      document.cookie = 'refreshToken=; path=/; max-age=0'
      setUser(null)
      router.push('/')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        completeMfaLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
