"use client"
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bookmark, BookmarkCheck, Building2, CheckCircle, MapPin, Search, Send, SlidersHorizontal, Wallet, Briefcase } from "lucide-react"
import { jobsApi, bookmarksApi, applicationsApi, documentsApi } from "@/lib/api"
import { formatCurrency, resolveLogoUrl, parseStringArray, timeAgo } from "@/lib/utils"
import { useToast } from "@/providers/toast-provider"
import type { Job } from "@/types"

const categories = ["Technology", "Design", "Marketing"]
const jobTypes = ["Full-time", "Contract", "Remote"]

function CompanyLogo({ job, large = false }: { job: Job; large?: boolean }) {
  const initials = job.company?.name
    ?.split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const logoSrc = resolveLogoUrl(job.company?.logo_url)

  return (
    <div className={large ? "relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-border-slate bg-bg-surface p-1 text-xl font-bold text-primary shadow-sm" : "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded border border-border-slate bg-surface-container-low text-sm font-bold text-primary"}>
      <>{initials || <Building2 className="h-5 w-5" />}</>
      {logoSrc && (
        <img
          src={logoSrc}
          alt={job.company?.name ?? "Logo"}
          className="absolute inset-0 h-full w-full object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      )}
    </div>
  )
}

function JobListCard({ job, active, onClick }: { job: Job; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={active ? "relative w-full cursor-pointer overflow-hidden rounded-lg border-2 border-primary bg-bg-surface p-4 text-left shadow-sm transition-all" : "group w-full cursor-pointer rounded-lg border border-border-slate bg-bg-surface p-4 text-left transition-all hover:border-outline-variant hover:shadow-sm"}
    >
      {active && <span className="absolute left-0 top-0 h-full w-1 bg-primary" />}
      <span className="absolute right-4 top-4 text-xs text-text-secondary">{timeAgo(job.created_at ?? "")}</span>
      <div className="flex gap-4 pr-20">
        <CompanyLogo job={job} />
        <div className="min-w-0 flex-1">
          <h2 className={active ? "mb-1 text-sm font-bold text-primary" : "mb-1 text-sm font-bold text-on-surface transition-colors group-hover:text-primary"}>
            {job.title}
          </h2>
          <p className="mb-2 text-xs text-text-secondary">{job.company?.name}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-text-secondary">
              <MapPin className="h-3.5 w-3.5" />
              {job.location_city}
            </span>
            <span className="rounded-full border border-border-slate bg-surface-container-low px-2 py-0.5 text-xs text-primary">
              {job.job_type}
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

function JobPreview({ job, isBookmarked, onToggleBookmark, onApply, applying, hasApplied }: {
  job: Job
  isBookmarked: boolean
  onToggleBookmark: () => void
  onApply: () => void
  applying: boolean
  hasApplied: boolean
}) {
  const salary = job.is_salary_visible && job.salary_min && job.salary_max
    ? `${formatCurrency(job.salary_min)} - ${formatCurrency(job.salary_max)}`
    : "Gaji kompetitif"

  return (
    <section className="sticky top-24 hidden h-fit overflow-hidden rounded-lg border border-border-slate bg-bg-surface shadow-sm md:col-span-7 md:block">
      <div className="relative h-32 bg-primary-container">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, #001e40 25%, transparent 25%, transparent 75%, #001e40 75%, #001e40), repeating-linear-gradient(45deg, #001e40 25%, #003366 25%, #003366 75%, #001e40 75%, #001e40)", backgroundPosition: "0 0, 10px 10px", backgroundSize: "20px 20px" }} />
      </div>

      <div className="relative p-8">
        <div className="-mt-16 mb-6 flex items-start justify-between">
          <CompanyLogo job={job} large />
          <div className="flex gap-3">
            <button onClick={onToggleBookmark} className="flex h-10 w-10 items-center justify-center rounded border border-border-slate bg-bg-surface text-on-surface-variant hover:bg-surface-container-low" type="button" aria-label="Simpan">
              {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-secondary" /> : <Bookmark className="h-5 w-5" />}
            </button>
            {hasApplied ? (
              <span className="flex items-center gap-2 rounded bg-secondary-container px-6 py-2 text-sm font-medium text-on-secondary-container">
                ✓ Lamaran Terkirim
              </span>
            ) : (
              <button onClick={onApply} disabled={applying} className="flex items-center gap-2 rounded bg-secondary px-6 py-2 text-sm font-medium text-on-secondary shadow-sm hover:opacity-90 disabled:opacity-50" type="button">
                <Send className="h-4 w-4" />
                {applying ? "Mengirim..." : "Lamar Sekarang"}
              </button>
            )}
          </div>
        </div>

        <h1 className="mb-2 text-4xl font-bold leading-tight text-primary">{job.title}</h1>
        <p className="mb-4 text-2xl font-normal text-text-secondary">{job.company?.name}</p>
        <div className="mb-8 flex flex-wrap gap-4 text-base text-on-surface-variant">
          <span className="flex items-center gap-1"><MapPin className="h-5 w-5" /> {job.location_city} ({job.location_type === "hybrid" ? "Hybrid" : job.location_type === "remote" ? "Remote" : "On-site"})</span>
          <span className="flex items-center gap-1"><Briefcase className="h-5 w-5" /> {job.job_type}</span>
          <span className="flex items-center gap-1"><Wallet className="h-5 w-5" /> {salary}</span>
        </div>

        <h3 className="mb-3 text-[20px] font-semibold text-primary">Tentang Peran Ini</h3>
        <p className="mb-6 leading-relaxed text-on-surface-variant">{job.description}</p>

        <h3 className="mb-3 text-[20px] font-semibold text-primary">Tanggung Jawab Utama</h3>
        <ul className="mb-6 space-y-2">
          {parseStringArray(job.requirements).slice(0, 4).map((item) => (
            <li key={item} className="flex items-start gap-2 text-on-surface-variant">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              {item}
            </li>
          ))}
        </ul>

        <h3 className="mb-3 text-[20px] font-semibold text-primary">Benefit</h3>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {parseStringArray(job.benefits).map((benefit) => (
            <div key={benefit} className="flex items-center gap-3 rounded border border-border-slate bg-surface-container-low p-3 text-on-surface-variant">
              <CheckCircle className="h-5 w-5 text-secondary" />
              {benefit}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
export default function JobsPage() {
  const router = useRouter()
  const toast = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [keyword, setKeyword] = useState("")
  const [location, setLocation] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [applyingId, setApplyingId] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    jobsApi.list({ limit: "10" }).then((res) => {
      if (cancelled) return
      const loaded = res.data.jobs ?? []
      setJobs(loaded)
      setSelectedJob(loaded[0] ?? null)
    })
    return () => { cancelled = true }
  }, [])

  const visibleJobs = jobs.filter((job) => {
    const q = keyword.trim().toLowerCase()
    const l = location.trim().toLowerCase()
    return (!q || job.title.toLowerCase().includes(q) || job.company?.name.toLowerCase().includes(q)) && (!l || (job.location_city ?? '').toLowerCase().includes(l))
  })

  useEffect(() => {
    if (visibleJobs.length > 0 && (!selectedJob || !visibleJobs.some((job) => job.id === selectedJob.id))) {
      setSelectedJob(visibleJobs[0])
    }
  }, [selectedJob, visibleJobs])

  const handleSelectJob = (job: Job) => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      router.push(`/jobs/${job.id}`)
      return
    }

    setSelectedJob(job)
  }

  // Load bookmarks and applications for current user
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return
    Promise.allSettled([
      bookmarksApi.listByUser(),
      applicationsApi.list(),
    ]).then(([bookmarksRes, appsRes]) => {
      if (bookmarksRes.status === 'fulfilled') {
        const bm = bookmarksRes.value.data.bookmarks || []
        setBookmarkedIds(new Set(bm.map((b: { id?: string; job_id?: string }) => (b.id ?? b.job_id) ?? '').filter(Boolean)))
      }
      if (appsRes.status === 'fulfilled') {
        const apps = appsRes.value.data.applications || []
        setAppliedIds(new Set(apps.map((a) => a.job_id)))
      }
    })
  }, [])

  const handleToggleBookmark = useCallback(async () => {
    if (!selectedJob) return
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push('/login'); return }
    try {
      if (bookmarkedIds.has(selectedJob.id)) {
        await bookmarksApi.removeByJob(selectedJob.id)
        setBookmarkedIds((prev) => { const next = new Set(prev); next.delete(selectedJob.id); return next })
        toast.success('Lowongan dihapus dari bookmark.')
      } else {
        await bookmarksApi.add(selectedJob.id)
        setBookmarkedIds((prev) => new Set(prev).add(selectedJob.id))
        toast.success('Lowongan disimpan ke bookmark.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui bookmark.')
    }
  }, [selectedJob, bookmarkedIds, router, toast])

  const handleApply = useCallback(async () => {
    if (!selectedJob) return
    const token = localStorage.getItem('accessToken')
    if (!token) { router.push(`/login?callbackUrl=/jobs`); return }
    setApplyingId(selectedJob.id)
    try {
      let documentId: string | undefined
      try {
        const docsRes = await documentsApi.list()
        const docs = docsRes.data.documents ?? []
        if (docs.length > 0) documentId = docs[0].id
      } catch {}
      await applicationsApi.create({ job_id: selectedJob.id, ...(documentId ? { document_id: documentId } : {}) })
      setAppliedIds((prev) => new Set(prev).add(selectedJob.id))
      toast.success('Lamaran berhasil dikirim.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengirim lamaran.')
    }
    finally { setApplyingId(null) }
  }, [selectedJob, router, toast])

  return (
    <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-4 px-4 py-6 md:grid-cols-12 md:px-6 md:py-8 lg:px-8 lg:py-12">
      <aside className="min-w-0 space-y-4 md:col-span-5">
        <div className="overflow-hidden rounded-lg border border-border-slate bg-bg-surface shadow-sm">
          <div className="flex flex-col sm:flex-row">
            <label className="flex flex-1 items-center border-b border-border-slate px-4 py-3 sm:border-b-0 sm:border-r">
              <Search className="mr-2 h-5 w-5 shrink-0 text-outline" />
              <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Cari posisi atau perusahaan" className="w-full min-w-0 border-none bg-transparent p-0 text-base text-on-surface placeholder:text-outline focus:ring-0" />
            </label>
            <label className="flex flex-1 items-center border-b border-border-slate px-4 py-3 sm:border-b-0 sm:border-r">
              <MapPin className="mr-2 h-5 w-5 shrink-0 text-outline" />
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lokasi" className="w-full min-w-0 border-none bg-transparent p-0 text-base text-on-surface placeholder:text-outline focus:ring-0" />
            </label>
            <button type="button" className="bg-primary px-6 py-3 text-sm font-medium text-on-primary hover:opacity-90">
              Cari
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border-slate bg-bg-surface px-4 py-3 text-sm font-semibold text-primary shadow-sm md:hidden"
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filter
        </button>

        <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className={`${filtersOpen ? "block" : "hidden"} h-fit rounded-lg border border-border-slate bg-bg-surface p-4 shadow-sm md:block`}>
            <div className="mb-4 flex items-center gap-2 border-b border-border-slate pb-2 text-sm font-bold text-primary">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </div>
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Kategori</h3>
              <div className="space-y-2">
                {categories.map((item) => (
                  <label key={item} className="flex cursor-pointer items-center gap-2 text-xs text-on-surface hover:text-primary">
                    <input type="checkbox" className="h-4 w-4 rounded border-border-slate text-primary focus:ring-primary" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Tipe Kerja</h3>
              <div className="space-y-2">
                {jobTypes.map((item) => (
                  <label key={item} className="flex cursor-pointer items-center gap-2 text-xs text-on-surface hover:text-primary">
                    <input type="checkbox" className="h-4 w-4 rounded border-border-slate text-primary focus:ring-primary" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Ekspektasi Gaji</h3>
              <input type="range" min="0" max="100" defaultValue="40" className="w-full accent-primary" />
              <div className="mt-1 flex justify-between text-xs text-text-secondary"><span>Min</span><span>Max</span></div>
            </div>
          </div>

          <div className="min-w-0 space-y-3">
            {visibleJobs.map((job) => (
              <JobListCard key={job.id} job={job} active={selectedJob?.id === job.id} onClick={() => handleSelectJob(job)} />
            ))}
          </div>
        </div>
      </aside>

      {selectedJob && <JobPreview job={selectedJob} isBookmarked={bookmarkedIds.has(selectedJob.id)} onToggleBookmark={handleToggleBookmark} onApply={handleApply} applying={applyingId === selectedJob.id} hasApplied={appliedIds.has(selectedJob.id)} />}
    </main>
  )
}
