'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/auth-provider'
import { useToast } from '@/providers/toast-provider'
import { securityApi } from '@/lib/api'
import { ArrowLeft, Check, Copy, Shield, AlertCircle } from 'lucide-react'

export default function SetupMFAPage() {
  const { refreshUser } = useAuth()
  const router = useRouter()
  const toast = useToast()

  const [step, setStep] = useState<'setup' | 'done'>('setup')
  const [secret, setSecret] = useState('')
  const [otpauthUrl, setOtpauthUrl] = useState('')
  const [token, setToken] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    securityApi.mfa.setup().then((res) => {
      setSecret(res.data.secret)
      setOtpauthUrl(res.data.otpauth_url)
    }).catch(() => {
      setError('Gagal memuat setup MFA. Silakan coba lagi.')
    })
  }, [toast])

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      toast.success('Kode rahasia disalin.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
    }
  }

  const handleVerify = async () => {
    if (token.length !== 6) {
      setError('Masukkan 6 digit kode')
      toast.error('Masukkan 6 digit kode')
      return
    }
    setError('')
    setLoading(true)
    try {
      const verifyRes = await securityApi.mfa.verify(token)
      // Backend returns new tokens after MFA enable — store them
      if (verifyRes.data.accessToken) {
        localStorage.setItem('accessToken', verifyRes.data.accessToken)
      }
      if (verifyRes.data.refreshToken) {
        localStorage.setItem('refreshToken', verifyRes.data.refreshToken)
      }
      const codesRes = await securityApi.mfa.backupCodes()
      setBackupCodes(codesRes.data.backup_codes)
      setStep('done')
      refreshUser()
      toast.success('MFA berhasil diaktifkan.')
    } catch {
      setError('Kode tidak valid. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const qrUrl = otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
    : ''

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 md:px-6 md:py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Kembali ke Pengaturan
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Setup Two-Factor Authentication</h1>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {step === 'setup' && (
        <>
          {qrUrl ? (
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-6">
              <p className="mb-4 text-center text-sm text-gray-600">
                Pindai QR code ini menggunakan aplikasi authenticator Anda (seperti Google Authenticator atau Authy).
              </p>
              <img
                src={qrUrl}
                alt="QR Code MFA"
                className="mb-4 h-48 w-48 rounded-lg border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-2 text-sm text-gray-600">Atau masukkan kode rahasia ini secara manual:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 break-all rounded bg-gray-100 px-3 py-2 font-mono text-sm text-gray-900">{secret}</code>
              <Button size="sm" variant="outline" onClick={handleCopySecret}>
                {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {copied ? 'Disalin' : 'Salin'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm text-gray-600">Masukkan kode 6-digit dari aplikasi:</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center font-mono text-lg tracking-[0.5em]"
                autoComplete="one-time-code"
                inputMode="numeric"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
              <Button onClick={handleVerify} loading={loading} className="w-full sm:w-auto">
                <Shield className="mr-1 h-4 w-4" /> Verifikasi & Aktifkan
              </Button>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push('/dashboard/seeker/settings')}
              className="text-sm text-gray-400 transition-colors hover:text-gray-600"
            >
              Lewati untuk saat ini
            </button>
          </div>
        </>
      )}

      {step === 'done' && (
        <>
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-green-900">MFA Berhasil Diaktifkan!</h2>
            <p className="text-sm text-green-700">
              Akun Anda sekarang lebih aman dengan two-factor authentication.
            </p>
          </div>

          {backupCodes.length > 0 && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="mb-2 text-sm font-semibold text-yellow-900">🔑 Kode Cadangan</p>
              <p className="mb-3 text-xs text-yellow-700">
                Simpan kode ini di tempat aman. Gunakan jika kehilangan akses ke authenticator. Setiap kode hanya bisa dipakai sekali.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, i) => (
                  <code key={i} className="rounded bg-yellow-100 px-3 py-2 text-center font-mono text-sm text-yellow-900">{code}</code>
                ))}
              </div>
              <div className="mt-3 text-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(backupCodes.join('\n'))
                      setCopied(true)
                      toast.success('Kode cadangan disalin.')
                      setTimeout(() => setCopied(false), 2000)
                    } catch {
                    }
                  }}
                >
                  {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                  {copied ? 'Disalin' : 'Salin Semua Kode'}
                </Button>
              </div>
            </div>
          )}

          <div className="text-center">
            <Button onClick={() => router.push('/dashboard/seeker/settings')} className="w-full sm:w-auto">
              Kembali ke Pengaturan
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
