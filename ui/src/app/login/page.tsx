'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Briefcase, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/providers/auth-provider'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('andi@demo.com')
  const [password, setPassword] = useState('password123')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await login(email, password)
    } catch {
      setSubmitError('Email atau password salah')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full flex-col md:flex-row">
      <div className="relative hidden items-center justify-center overflow-hidden bg-primary md:flex md:w-1/2">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDlonLyMuY_PpqEMFDFNlA_KrF6ymKObB38EykHO__DHfauNfAZkRGfOXCof8U0iqP7rZevXHnOMJYErlJXpLuny7XssYWzpLrDt-hk5VfPkum0l4ZvZt4b7bA9eoH7eYKGgq5oFu1xKwiRLVOWy7qiiqSsfRV5Lzzv6yFBYP-hQcUO9U9OcSGY3knvIWX-vwXKxNw1fvUn4BnBGYX4yN81BtLYwHV_NUSKEvuRLdbXPqfWVx0niRoHyhM-TF63sd0qxVTvrDQyzLQ')",
          }}
        />
        <div className="relative z-10 max-w-lg p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-bg-surface shadow-sm">
            <Briefcase className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-on-primary">
            Temukan Karier Impian Anda.
          </h1>
          <p className="text-base leading-6 text-primary-fixed-dim">
            Platform rekrutmen terpercaya yang menghubungkan talenta terbaik dengan perusahaan terkemuka.
          </p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-bg-page px-4 py-8 md:p-8 lg:p-12 md:w-1/2">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 text-center md:text-left">
            <h2 className="mb-2 text-xl font-semibold leading-tight text-text-primary lg:text-2xl">
              Selamat Datang Kembali
            </h2>
            <p className="text-base text-text-secondary">Silakan masuk ke akun Anda.</p>
          </div>

          {submitError && (
            <div className="mb-6 flex items-start rounded-lg border border-error-red/20 bg-error-container p-3 text-on-error-container">
              <AlertCircle className="mr-2 h-5 w-5 shrink-0 text-error-red" />
              <span className="text-sm font-medium">{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-primary">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  required
                  className="w-full rounded-lg border border-border-slate bg-bg-surface py-2.5 pl-10 pr-3 text-base text-text-primary placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  Password
                </label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-border-slate bg-bg-surface py-2.5 pl-10 pr-10 text-base text-text-primary placeholder:text-outline-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline transition-colors hover:text-text-primary"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-medium text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Memproses...' : 'Masuk'}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-base text-text-secondary">
            Belum punya akun?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
