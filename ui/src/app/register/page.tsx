"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, User, Mail, Lock, Briefcase } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<"jobseeker" | "recruiter">("jobseeker")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = useCallback(
    (field: string, value: string): string | undefined => {
      switch (field) {
        case "name":
          if (!value.trim()) return "Nama wajib diisi"
          if (value.trim().length < 2) return "Nama minimal 2 karakter"
          return undefined
        case "email":
          if (!value.trim()) return "Email wajib diisi"
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Format email tidak valid"
          return undefined
        case "password":
          if (!value) return "Password wajib diisi"
          if (value.length < 8) return "Password minimal 8 karakter"
          return undefined
        case "confirmPassword":
          if (!value) return "Konfirmasi password wajib diisi"
          if (value !== password) return "Password tidak cocok"
          return undefined
        default:
          return undefined
      }
    },
    [password]
  )

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const error = validateField(field, value)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleChange = (field: string, value: string) => {
    switch (field) {
      case "name":
        setName(value)
        break
      case "email":
        setEmail(value)
        break
      case "password":
        setPassword(value)
        if (confirmPassword && touched.confirmPassword) {
          const confirmError = validateField("confirmPassword", confirmPassword)
          setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
        }
        break
      case "confirmPassword":
        setConfirmPassword(value)
        break
    }
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const isFormValid =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8 &&
    password === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string | undefined> = {
      name: validateField("name", name),
      email: validateField("email", email),
      password: validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword),
    }
    setErrors(newErrors)
    setTouched({ name: true, email: true, password: true, confirmPassword: true })

    if (Object.values(newErrors).some(Boolean)) return

    setIsSubmitting(true)
    try {
      await register({ name: name.trim(), email, password, role })
      router.push("/login")
    } catch {
      setErrors((prev) => ({
        ...prev,
        email: "Email sudah terdaftar atau terjadi kesalahan",
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClasses = (field: string) =>
    `w-full rounded-lg border bg-white py-3 pl-10 pr-3 text-sm transition-colors placeholder:text-oj-text-secondary focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${
      errors[field] && touched[field]
        ? "border-oj-error focus:border-oj-error focus:ring-oj-error"
        : "border-oj-border focus:ring-oj-primary-container/20 focus:border-oj-primary-container"
    }`

  return (
    <div className="flex min-h-screen bg-oj-bg flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 relative bg-oj-primary-container overflow-hidden flex-col justify-center items-start p-12 lg:p-24">
        <div className="absolute inset-0 bg-gradient-to-t from-oj-primary-container to-oj-primary-container/80 z-0" />
        <div className="relative z-10 max-w-lg">
          <Briefcase className="text-6xl mb-6 text-oj-primary-fixed-dim" />
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-oj-on-primary mb-4">
            Mulai Karir Impian Anda
          </h1>
          <p className="text-base text-oj-primary-fixed-dim opacity-90 leading-relaxed">
            Daftar sekarang untuk mengakses ribuan lowongan kerja dari perusahaan terkemuka. Bangun profil profesional Anda dan temukan peluang yang tepat.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8 md:p-8 lg:p-12 bg-oj-surface">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center gap-2 mb-8 text-oj-primary">
            <Briefcase className="h-8 w-8" />
            <span className="text-2xl font-bold">OpenJob</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-oj-text mb-2 lg:text-3xl">Buat Akun Baru</h1>
            <p className="text-base text-oj-text-secondary">
              Lengkapi data di bawah ini untuk memulai.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Nama Lengkap */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-oj-text mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-oj-text-secondary">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name", name)}
                  className={inputClasses("name")}
                  placeholder="Masukkan nama lengkap"
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </div>
              {errors.name && touched.name && (
                <p className="mt-1 text-xs text-oj-error">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-oj-text mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-oj-text-secondary">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email", email)}
                  className={inputClasses("email")}
                  placeholder="contoh@email.com"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-xs text-oj-error">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-oj-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-oj-text-secondary">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password", password)}
                  className={`w-full rounded-lg border bg-white py-3 pl-10 pr-10 text-sm transition-colors placeholder:text-oj-text-secondary focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.password && touched.password
                      ? "border-oj-error focus:border-oj-error focus:ring-oj-error"
                      : "border-oj-border focus:ring-oj-primary-container/20 focus:border-oj-primary-container"
                  }`}
                  placeholder="Buat password Anda"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-oj-text-secondary hover:text-oj-text"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && touched.password && (
                <p className="mt-1 text-xs text-oj-error">{errors.password}</p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-oj-text mb-1.5">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-oj-text-secondary">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onBlur={() => handleBlur("confirmPassword", confirmPassword)}
                  className={`w-full rounded-lg border bg-white py-3 pl-10 pr-10 text-sm transition-colors placeholder:text-oj-text-secondary focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.confirmPassword && touched.confirmPassword
                      ? "border-oj-error focus:border-oj-error focus:ring-oj-error"
                      : "border-oj-border focus:ring-oj-primary-container/20 focus:border-oj-primary-container"
                  }`}
                  placeholder="Ulangi password"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-oj-text-secondary hover:text-oj-text"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <p className="mt-1 text-xs text-oj-error">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-oj-text mb-1.5">
                Daftar sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("jobseeker")}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    role === "jobseeker"
                      ? "border-oj-primary-container bg-oj-primary-container/10 text-oj-primary-container"
                      : "border-oj-border bg-white text-oj-text hover:bg-oj-surface-container-low"
                  }`}
                >
                  <span className="block font-semibold">Pencari Kerja</span>
                  <span className="text-xs text-oj-text-secondary">Cari dan lamar pekerjaan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("recruiter")}
                  className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    role === "recruiter"
                      ? "border-oj-primary-container bg-oj-primary-container/10 text-oj-primary-container"
                      : "border-oj-border bg-white text-oj-text hover:bg-oj-surface-container-low"
                  }`}
                >
                  <span className="block font-semibold">Recruiter</span>
                  <span className="text-xs text-oj-text-secondary">Posting dan kelola lowongan</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`w-full mt-6 py-3 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-oj-primary-container ${
                isSubmitting
                  ? "cursor-not-allowed bg-oj-primary-container/60 text-oj-on-primary"
                  : "bg-oj-primary-container text-oj-on-primary hover:opacity-90"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mendaftar...
                </>
              ) : (
                "Daftar"
              )}
            </button>
          </form>

          {/* Footer Text */}
          <p className="mt-8 text-center text-base text-oj-text-secondary">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-medium text-oj-primary-container hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
