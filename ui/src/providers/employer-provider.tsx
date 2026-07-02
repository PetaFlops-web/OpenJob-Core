'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { companiesApi } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import type { Company } from '@/types'

interface EmployerContextValue {
  company: Company | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const EmployerContext = createContext<EmployerContextValue | null>(null)

export function EmployerProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCompany = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setCompany(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await companiesApi.list()
      const matches = res.data.companies.filter(
        (company) => (company as Company & { user_id?: string }).user_id === user.id
      )
      setCompany(matches[0] ?? null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data perusahaan'
      setError(msg)
      setCompany(null)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  return (
    <EmployerContext.Provider value={{ company, isLoading, error, refetch: fetchCompany }}>
      {children}
    </EmployerContext.Provider>
  )
}

export function useEmployer() {
  const ctx = useContext(EmployerContext)
  if (!ctx) throw new Error('useEmployer must be used within EmployerProvider')
  return ctx
}
