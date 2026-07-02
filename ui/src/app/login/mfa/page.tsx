'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertCircle } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'
import { securityApi } from '@/lib/api'

export default function MfaLoginPage() {
  const router = useRouter()
  const { completeMfaLogin } = useAuth()
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mfaToken, setMfaToken] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('mfa_token')
    if (!stored) {
      router.replace('/login')
      return
    }
    setMfaToken(stored)
  }, [router])

  const handleVerify = async () => {
    if (token.length !== 6) {
      setError('Masukkan 6 digit kode')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await securityApi.mfa.verify(token, mfaToken)
      if (res.data.accessToken && res.data.refreshToken) {
        await completeMfaLogin(res.data.accessToken, res.data.refreshToken)
      } else {
        setError('Verifikasi gagal. Coba lagi.')
      }
    } catch {
      setError('Kode tidak valid atau sudah kadaluarsa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-bg-page px-4">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Verifikasi Dua Faktor</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Masukkan kode 6-digit dari aplikasi authenticator Anda.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/30 p-3 text-sm text-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full rounded-lg border border-border-subtle bg-surface px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-on-surface transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoComplete="one-time-code"
            inputMode="numeric"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          <button
            onClick={handleVerify}
            disabled={loading || token.length !== 6}
            className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-on-primary shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Memverifikasi...' : 'Verifikasi'}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              sessionStorage.removeItem('mfa_token')
              router.push('/login')
            }}
            className="text-sm text-text-secondary transition-colors hover:text-primary"
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    </div>
  )
}
