'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck, Briefcase, Building2, CheckCircle, ChevronRight, MapPin, Send, Wallet } from 'lucide-react'
import type { Job } from '@/types'
import { applicationsApi, bookmarksApi, documentsApi } from '@/lib/api'
import { formatCurrency, resolveLogoUrl, parseStringArray, timeAgo } from '@/lib/utils'
import { useToast } from '@/providers/toast-provider'

interface Props {
  initialJob: Job
}

export function JobDetailClient({ initialJob }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [hasApplied, setHasApplied] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(initialJob.is_bookmarked ?? false)
  const [shareCopied, setShareCopied] = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    applicationsApi.list().then((res) => {
      if (res.data.applications.some((app) => app.job_id === initialJob.id)) setHasApplied(true)
    }).catch(() => {})
    bookmarksApi.listByUser().then((res) => {
      const bookmarks = res.data.bookmarks || []
      if (bookmarks.some((b: { id?: string; job_id?: string }) => (b.id ?? b.job_id) === initialJob.id)) setIsBookmarked(true)
    }).catch(() => {})
  }, [initialJob.id])

  const handleBookmark = useCallback(async () => {
    try {
      if (isBookmarked) {
        await bookmarksApi.removeByJob(initialJob.id)
        toast.success('Lowongan dihapus dari bookmark.')
      } else {
        await bookmarksApi.add(initialJob.id)
        toast.success('Lowongan disimpan ke bookmark.')
      }
      setIsBookmarked(!isBookmarked)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui bookmark.')
    }
  }, [initialJob.id, isBookmarked, toast])

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
      toast.success('Tautan lowongan disalin.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyalin tautan.')
    }
  }, [toast])

  const handleApply = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.push(`/login?callbackUrl=/jobs/${initialJob.id}`)
      return
    }
    setApplying(true)
    try {
      // Auto-attach user's first document (CV) if available
      let documentId: string | undefined
      try {
        const docsRes = await documentsApi.list()
        const docs = docsRes.data.documents ?? []
        if (docs.length > 0) documentId = docs[0].id
      } catch {}
      await applicationsApi.create({ job_id: initialJob.id, ...(documentId ? { document_id: documentId } : {}) })
      setHasApplied(true)
      toast.success('Lamaran berhasil dikirim.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim lamaran.')
    } finally {
      setApplying(false)
    }
  }, [initialJob.id, router, toast])

  const company = initialJob.company
  const initials = company?.name?.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
  const salary = initialJob.is_salary_visible && initialJob.salary_min != null && initialJob.salary_max != null
    ? `${formatCurrency(initialJob.salary_min)} - ${formatCurrency(initialJob.salary_max)}`
    : 'Gaji kompetitif'

  return (
    <div className="flex min-h-screen flex-col bg-bg-page pb-20 text-on-surface md:pb-0">
      <nav className="border-b border-border-slate bg-bg-surface px-4 md:px-6">
        <ol className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-2 gap-y-1 py-3 text-xs text-text-secondary md:gap-x-3">
          <li className="min-w-0"><Link href="/" className="hover:text-primary">Beranda</Link></li>
          <li><ChevronRight className="h-3 w-3" /></li>
          <li className="min-w-0"><Link href="/jobs" className="hover:text-primary">Cari Kerja</Link></li>
          <li><ChevronRight className="h-3 w-3" /></li>
          <li className="min-w-0 max-w-full truncate font-medium text-primary sm:max-w-[420px] md:max-w-[560px]">{initialJob.title}</li>
        </ol>
      </nav>

      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-4 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-3 lg:gap-8 lg:px-8 lg:py-12">
        <div className="min-w-0 lg:col-span-2">
          <div className="rounded-lg border border-border-slate bg-bg-surface p-4 md:p-6 lg:p-8">
            <h1 className="mb-4 text-2xl font-bold leading-tight text-text-primary md:text-3xl lg:text-4xl">{initialJob.title}</h1>
            <div className="mb-8 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant">
                <Briefcase className="h-3.5 w-3.5" /> {initialJob.job_type}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1 text-xs text-on-surface-variant">
                <MapPin className="h-3.5 w-3.5" /> {initialJob.location_city}
              </span>
              {initialJob.location_type !== 'on-site' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container px-3 py-1 text-xs font-medium text-on-secondary-container">
                  {initialJob.location_type === 'remote' ? '🏠 Remote' : '🔄 Hybrid'}
                </span>
              )}
            </div>

            <h2 className="mb-4 text-xl font-semibold text-text-primary md:text-2xl">Tentang Peran Ini</h2>
            <p className="mb-6 break-words leading-relaxed text-text-secondary">{initialJob.description}</p>

            <h2 className="mb-4 text-xl font-semibold text-text-primary md:text-2xl">Tanggung Jawab Utama</h2>
            <ul className="mb-6 space-y-2">
              {parseStringArray(initialJob.requirements).map((item) => (
                <li key={item} className="flex min-w-0 items-start gap-2 text-text-secondary">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="mb-4 text-xl font-semibold text-text-primary md:text-2xl">Benefit</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {parseStringArray(initialJob.benefits).map((benefit) => (
                <div key={benefit} className="flex min-w-0 items-center gap-3 rounded border border-border-slate bg-surface-container-low p-3 text-text-secondary">
                  <CheckCircle className="h-5 w-5 shrink-0 text-secondary" />
                  <span className="min-w-0 break-words">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:h-fit lg:col-span-1">
          <div className="rounded-lg border border-border-slate bg-bg-surface p-4 md:p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-slate bg-surface-container text-lg font-bold text-primary">
                <>{initials || <Building2 className="h-8 w-8" />}</>
                {resolveLogoUrl(company?.logo_url) && (
                  <img
                    src={resolveLogoUrl(company?.logo_url)!}
                    alt={company?.name ?? 'Logo'}
                    className="absolute inset-0 h-full w-full object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-text-primary">{company?.name}</h3>
                <Link href={`/companies/${company?.id}`} className="mt-1 inline-block text-sm text-primary hover:underline">
                  Lihat profil
                </Link>
              </div>
            </div>

            <div className="mb-6 space-y-4">
              <div className="flex items-start gap-3 text-text-secondary">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">Lokasi</p>
                  <p className="break-words text-sm">{initialJob.location_city} ({initialJob.location_type})</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-text-secondary">
                <Briefcase className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-text-primary">Tipe</p>
                  <p className="text-sm">{initialJob.job_type}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-text-secondary">
                <Wallet className="mt-0.5 h-5 w-5 text-primary" />
                <div className="min-w-0">
                  <p className="font-medium text-text-primary">Gaji</p>
                  <p className="break-words text-sm">{salary}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-text-secondary">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-text-primary">Dipublikasikan</p>
                  <p className="text-sm">{initialJob.created_at ? timeAgo(initialJob.created_at) : '-'}</p>
                </div>
              </div>
            </div>

            <div className="hidden flex-col gap-3 md:flex">
              {hasApplied ? (
                <div className="w-full rounded-lg bg-secondary-container py-3 text-center text-sm font-bold text-on-secondary-container">
                  ✓ Lamaran Terkirim
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-bold text-on-secondary hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {applying ? 'Mengirim...' : 'Lamar Sekarang'}
                </button>
              )}
              <button
                type="button"
                onClick={handleBookmark}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-slate py-3 text-sm font-medium text-text-primary hover:bg-surface-container-low"
              >
                {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-secondary" /> : <Bookmark className="h-4 w-4" />}
                {isBookmarked ? 'Tersimpan' : 'Simpan Lowongan'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-slate py-3 text-sm font-medium text-text-primary hover:bg-surface-container-low"
              >
                {shareCopied ? 'Tautan Disalin!' : 'Bagikan'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border-slate bg-bg-surface p-4 md:p-6">
            <h3 className="mb-4 text-lg font-semibold text-text-primary">Benefit</h3>
            <ul className="space-y-3 text-text-secondary">
              {parseStringArray(initialJob.benefits).map((benefit) => (
                <li key={benefit} className="flex min-w-0 items-center gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0 text-secondary" />
                  <span className="min-w-0 break-words">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-slate bg-bg-surface p-4 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] md:hidden">
        {hasApplied ? (
          <div className="w-full rounded-lg bg-secondary-container py-3 text-center text-sm font-bold text-on-secondary-container">
            ✓ Lamaran Terkirim
          </div>
        ) : (
          <button
            type="button"
            onClick={handleApply}
            disabled={applying}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary py-3 text-sm font-bold text-on-secondary hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {applying ? 'Mengirim...' : 'Lamar Sekarang'}
          </button>
        )}
      </div>
    </div>
  )
}
