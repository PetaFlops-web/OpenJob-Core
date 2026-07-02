'use client'

import { useState, useEffect, useRef, type FormEvent } from 'react'
import { companiesApi } from '@/lib/api'
import { useEmployer } from '@/providers/employer-provider'
import { useToast } from '@/providers/toast-provider'
import { Button } from '@/components/ui/button'
import { Building2, Globe, Mail, MapPin, Phone } from 'lucide-react'
import { resolveLogoUrl } from '@/lib/utils'
import { useI18n } from '@/hooks/use-i18n'
import type { Company } from '@/types'

const INDUSTRY_OPTIONS = ['Teknologi Informasi / IT', 'Keuangan & Perbankan', 'Kesehatan', 'E-Commerce / Ritel', 'Manufaktur']
const SIZE_OPTIONS = ['1 - 50 Karyawan', '51 - 200 Karyawan', '201 - 500 Karyawan', '501 - 1000 Karyawan', '1000+ Karyawan']


type LogoUploadResponse = {
  logo_url?: string | null
  data?: { logo_url?: string | null }
}
const EMPTY_FORM = { name: '', description: '', email: '', phone: '', website: '', location: '', address: '', industry: 'Teknologi Informasi / IT', company_size: '201 - 500 Karyawan', founded_year: 2020 }



export default function CompanyProfilePage() {
  const { company: employerCompany, isLoading: contextLoading, refetch } = useEmployer()
  const toast = useToast()
  const { t } = useI18n()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    let cancelled = false

    const syncCompany = async () => {
      if (contextLoading) {
        setLoading(true)
        return
      }
      if (!employerCompany) {
        setCompany(null)
        setForm(EMPTY_FORM)
        setLogoUrl(null)
        setLoading(false)
        return
      }

      let source = employerCompany
      try {
        const detail = await companiesApi.getById(employerCompany.id)
        source = { ...employerCompany, ...detail.data }
      } catch {
        source = employerCompany
      }

      if (cancelled) return
      setCompany(source)
      setForm({
        name: source.name,
        description: source.description ?? '',
        email: source.email ?? '',
        phone: source.phone ?? '',
        website: source.website ?? '',
        location: source.location ?? '',
        address: source.address ?? '',
        industry: source.industry ?? 'Teknologi Informasi / IT',
        company_size: source.company_size ?? '201 - 500 Karyawan',
        founded_year: source.founded_year ?? 2020,
      })
      setShowCreateForm(false)
      setLogoUrl((prev) => resolveLogoUrl(source.logo_url) ?? prev)
      setLoading(false)
    }

    syncCompany()
    return () => { cancelled = true }
  }, [employerCompany, contextLoading])

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (company) return
    setIsCreating(true)
    setMessage(null)
    try {
      await companiesApi.create({
        name: form.name,
        location: form.location,
        description: form.description || undefined,
        email: form.email || undefined,
        website: form.website || undefined,
        industry: form.industry || undefined,
        company_size: form.company_size || undefined,
      })
      setMessage({ type: 'success', text: t('employer.company.createSuccess') })
      toast.success(t('employer.company.createSuccess').split('.')[0] + '.')
      await refetch()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('employer.company.createError') })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!company) return
    setIsUpdating(true)
    setMessage(null)
    try {
      await companiesApi.update(company.id, {
        name: form.name,
        location: form.location,
        description: form.description || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        website: form.website || undefined,
        address: form.address || undefined,
        industry: form.industry || undefined,
        company_size: form.company_size || undefined,
        founded_year: form.founded_year || undefined,
      })
      setMessage({ type: 'success', text: t('employer.company.saveSuccess') })
      toast.success(t('employer.company.saveSuccess'))
      await refetch()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('employer.company.saveError') })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSubmit = company ? handleUpdate : handleCreate

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !company) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: t('employer.company.logoTypeError') })
      e.target.value = ''
      toast.error(t('employer.company.logoTypeError'))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: t('employer.company.logoSizeError') })
      e.target.value = ''
      toast.error(t('employer.company.logoSizeError'))
      return
    }
    setUploadingLogo(true)
    setMessage(null)
    const localPreviewUrl = URL.createObjectURL(file)
    setLogoUrl(localPreviewUrl)
    try {
      const res = await companiesApi.uploadLogo(company.id, file)
      // Extract logo_url from upload response: { data: { logo_url: "..." } } or { logo_url: "..." }
      const uploadData = res.data as LogoUploadResponse
      const uploadedLogo = uploadData.logo_url ?? uploadData.data?.logo_url ?? null

      if (uploadedLogo) {
        URL.revokeObjectURL(localPreviewUrl)
        setLogoUrl(resolveLogoUrl(uploadedLogo))
        setMessage({ type: 'success', text: t('employer.company.logoUploadSuccess') })
        toast.success(t('employer.company.logoUploadSuccess'))
      } else {
        // Fallback: refetch company detail
        try {
          const detail = await companiesApi.getById(company.id)
          const refetchedLogo = detail.data.logo_url ?? null
          URL.revokeObjectURL(localPreviewUrl)
          if (refetchedLogo) {
            setLogoUrl(resolveLogoUrl(refetchedLogo))
            setMessage({ type: 'success', text: t('employer.company.logoUploadSuccess') })
            toast.success(t('employer.company.logoUploadSuccess'))
          } else {
            setLogoUrl(null)
            setMessage({ type: 'error', text: t('employer.company.logoUrlMissing') })
            toast.error(t('employer.company.logoUrlMissing'))
          }
        } catch {
          URL.revokeObjectURL(localPreviewUrl)
          setLogoUrl(null)
          setMessage({ type: 'error', text: t('employer.company.logoReloadFail') })
        }
      }
      // Refresh employer context so other pages see the new logo
      refetch()
    } catch (err) {
      setLogoUrl(resolveLogoUrl(company.logo_url) ?? null)
      setMessage({ type: 'error', text: err instanceof Error ? err.message : t('employer.company.logoUploadError') })
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }
  const initials = form.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CP'

  if (loading || contextLoading) {
    return (
      <div className="mx-auto max-w-7xl rounded-xl border border-border-subtle bg-surface p-6 text-sm text-on-surface-variant">
        {t('employer.company.loading')}
      </div>
    )
  }

  if (!company && !showCreateForm) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-border-subtle bg-surface p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-recruiter text-primary">
          <Building2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold leading-8 text-on-surface">{t('employer.company.createTitle')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-on-surface-variant">
          {t('employer.company.createDesc')}
        </p>
        <Button
          type="button"
          className="mt-6"
          onClick={() => {
            setForm(EMPTY_FORM)
            setMessage(null)
            setShowCreateForm(true)
          }}
        >
          {t('employer.company.start')}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl grid-cols-12 gap-8">
      {message && (
        <div
          className={`col-span-12 rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="col-span-12 space-y-6 lg:col-span-8">
        {/* Informasi Dasar */}
        <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
          <h3 className="mb-6 border-b border-border-subtle pb-2 text-base font-semibold leading-6 text-primary">
            {t('employer.company.basicInfo')}
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="company_name">
                {t('employer.company.companyName')} *
              </label>
              <input
                id="company_name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="description">
                {t('employer.company.companyDesc')}
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Kontak & Lokasi */}
        <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
          <h3 className="mb-6 border-b border-border-subtle pb-2 text-base font-semibold leading-6 text-primary">
            {t('employer.company.contactLocation')}
          </h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="email">
                {t('employer.company.companyEmail')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="phone">
                {t('employer.company.phone')}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="website">
                {t('employer.company.website')}
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                <input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="location">
                {t('employer.company.primaryLocation')} *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                <input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="address">
                {t('employer.company.fullAddress')}
              </label>
              <textarea
                id="address"
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full resize-y rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="col-span-12 space-y-6 lg:col-span-4">
        {/* Logo */}
        <div className="flex flex-col items-center rounded-xl border border-border-subtle bg-surface p-6 text-center shadow-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleLogoUpload}
            disabled={uploadingLogo || !company}
          />
          <div
            className="group relative mb-4 flex h-32 w-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-border-subtle bg-surface-container-recruiter transition-colors hover:border-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-primary">
              {initials}
            </div>
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo perusahaan"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none'
                  setMessage({ type: 'error', text: t('employer.company.logoLoadFail') })
                }}
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              {uploadingLogo ? (
                <span className="text-sm font-medium">{t('employer.company.uploading')}</span>
              ) : (
                <>
                  <Building2 className="mb-1 h-6 w-6" />
                  <span className="text-[11px] font-bold">{logoUrl ? t('employer.company.changeLogo') : t('employer.company.uploadLogo')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detail Organisasi */}
        <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
          <h3 className="mb-6 border-b border-border-subtle pb-2 text-base font-semibold leading-6 text-primary">
            {t('employer.company.orgDetails')}
          </h3>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="industry">
                {t('employer.company.industry')}
              </label>
              <div className="relative">
                <select
                  id="industry"
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {INDUSTRY_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  ▾
                </span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="size">
                {t('employer.company.companySize')}
              </label>
              <div className="relative">
                <select
                  id="size"
                  value={form.company_size}
                  onChange={(e) => setForm({ ...form, company_size: e.target.value })}
                  className="w-full cursor-pointer appearance-none rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {SIZE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  ▾
                </span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant" htmlFor="founded">
                {t('employer.company.foundedYear')}
              </label>
              <input
                id="founded"
                type="number"
                min={1900}
                max={2026}
                value={form.founded_year}
                onChange={(e) => setForm({ ...form, founded_year: Number(e.target.value) })}
                className="w-full rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Action button */}
        {!company ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
            <Button type="submit" className="w-full" loading={isCreating} disabled={!form.name || !form.location}>
              {t('employer.company.createCompany')}
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-on-surface-variant">
              {t('employer.company.requiredFields')}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-sm">
            <Button type="submit" className="w-full" loading={isUpdating}>
              {t('employer.company.saveChanges')}
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-on-surface-variant">
              {t('employer.company.saving')}
            </p>
          </div>
        )}
      </div>
    </form>
  )
}
