"use client"

import Link from "next/link"
import { ArrowRight, MapPin, Search, Briefcase, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { jobsApi, companiesApi } from "@/lib/api"
import { resolveLogoUrl, formatDate } from "@/lib/utils"
import type { Job, Company } from "@/types"

const locationTypeLabels: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  "on-site": "On-site",
}

const jobTypeLabels: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
}

function JobCard({ job, company }: { job: Job; company?: Company }) {
  const logoUrl = resolveLogoUrl(company?.logo_url)
  const location = [job.location_city, locationTypeLabels[job.location_type]].filter(Boolean).join(" · ")

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex h-full cursor-pointer flex-col rounded-xl border border-border-slate bg-bg-surface p-6 transition-shadow hover:shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-slate bg-surface-container">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Briefcase className="h-6 w-6 text-outline" />
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
          <Clock className="h-3 w-3" />
          {formatDate(job.created_at)}
        </span>
      </div>
      <h3 className="mb-1 text-2xl font-semibold leading-[1.3] text-primary transition-colors group-hover:text-primary-container">
        {job.title}
      </h3>
      <p className="mb-4 text-base leading-6 text-text-secondary">
        {company?.name ?? "Perusahaan"}
      </p>
      <div className="mt-auto flex flex-col gap-3">
        {location && (
          <div className="flex items-center gap-1 text-xs leading-[1.4] text-text-secondary">
            <MapPin className="h-4 w-4" />
            {location}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md bg-primary-fixed px-2.5 py-1 text-xs leading-[1.4] text-on-primary-fixed">
            {jobTypeLabels[job.job_type] ?? job.job_type}
          </span>
          <span className="inline-flex items-center rounded-md border border-border-slate px-2.5 py-1 text-xs leading-[1.4] text-text-secondary">
            {locationTypeLabels[job.location_type] ?? job.location_type}
          </span>
        </div>
      </div>
    </Link>
  )
}

function JobCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border-slate bg-bg-surface p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-12 w-12 animate-pulse rounded-lg bg-surface-container" />
        <div className="h-4 w-20 animate-pulse rounded bg-surface-container" />
      </div>
      <div className="mb-2 h-7 w-3/4 animate-pulse rounded bg-surface-container" />
      <div className="mb-4 h-5 w-1/2 animate-pulse rounded bg-surface-container" />
      <div className="mt-auto flex gap-2">
        <div className="h-7 w-20 animate-pulse rounded-md bg-surface-container" />
        <div className="h-7 w-16 animate-pulse rounded-md bg-surface-container" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [companiesMap, setCompaniesMap] = useState<Record<string, Company>>({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchLocation, setSearchLocation] = useState("")

  useEffect(() => {
    let cancelled = false

    async function fetchJobs() {
      try {
        const res = await jobsApi.list({ limit: "6", sort: "created_at", order: "desc" })
        if (cancelled) return
        const jobsData = res.data.jobs.filter(j => j.status === "open" || j.status === "active")
        setJobs(jobsData)

        // Fetch company data for each unique company_id
        const companyIds = [...new Set(jobsData.map(j => j.company_id).filter(Boolean))]
        const results = await Promise.all(
          companyIds.map(id => companiesApi.getById(id).catch(() => null))
        )
        if (cancelled) return
        const map: Record<string, Company> = {}
        results.forEach((r, idx) => {
          if (r?.data) map[companyIds[idx]] = r.data as Company
        })
        setCompaniesMap(map)
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchJobs()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="flex-grow bg-bg-page">
      {/* Hero */}
      <section className="w-full bg-bg-surface px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-36">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center text-center">
          <h1 className="mb-6 max-w-3xl text-4xl font-bold leading-[1.2] tracking-[-0.02em] text-primary sm:text-5xl lg:text-7xl">
            Temukan pekerjaan impianmu
          </h1>
          <p className="mb-10 max-w-2xl text-base leading-6 text-text-secondary">
            Jelajahi ribuan lowongan pekerjaan dari perusahaan terkemuka. Karir masa depanmu menanti di sini.
          </p>

          <div className="flex w-full max-w-4xl flex-col items-center gap-2 rounded-xl border border-border-slate bg-bg-surface p-2 shadow-sm md:flex-row">
            <div className="flex h-12 w-full flex-1 items-center px-4 md:w-auto">
              <Search className="mr-3 h-5 w-5 text-outline" />
              <input
                type="text"
                placeholder="Kata kunci pekerjaan, jabatan, atau perusahaan..."
                className="w-full border-none bg-transparent p-0 text-base text-text-primary placeholder:text-outline focus:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="hidden h-8 w-px bg-border-slate md:block" />
            <div className="my-1 h-px w-full bg-border-slate md:hidden" />
            <div className="flex h-12 w-full flex-1 items-center px-4 md:w-auto">
              <MapPin className="mr-3 h-5 w-5 text-outline" />
              <input
                type="text"
                placeholder="Lokasi (kota atau provinsi)"
                className="w-full border-none bg-transparent p-0 text-base text-text-primary placeholder:text-outline focus:ring-0"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
              />
            </div>
            <Link
              href={`/jobs${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}${searchLocation ? `&location=${encodeURIComponent(searchLocation)}` : ""}`}
              className="flex h-12 w-full shrink-0 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-container md:w-auto"
            >
              Cari
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="w-full px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold leading-[1.3] text-primary">Lowongan Terbaru</h2>
              <p className="mt-2 text-base leading-6 text-text-secondary">Pekerjaan baru yang mungkin cocok untukmu.</p>
            </div>
            <Link href="/jobs" className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-container">
              Lihat semua
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  company={companiesMap[job.company_id]}
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-text-secondary">
                Belum ada lowongan tersedia.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mb-12 w-full px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-2xl bg-primary shadow-sm">
          <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-container opacity-50 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center justify-between gap-8 p-12 text-on-primary md:flex-row md:p-16">
            <div className="max-w-xl">
              <h2 className="mb-4 text-4xl font-bold leading-[1.2] text-white">Punya lowongan? Pasang sekarang</h2>
              <p className="text-base leading-6 text-primary-fixed-dim">
                Bergabunglah dengan ribuan perusahaan lainnya yang menggunakan OpenJob untuk menemukan talenta terbaik. Proses rekrutmen lebih cepat dan efisien.
              </p>
            </div>
            <div className="w-full shrink-0 md:w-auto">
              <Link
                href="/register"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 text-sm font-medium text-on-secondary shadow-sm transition-colors hover:bg-secondary-container hover:text-on-secondary-fixed active:scale-95 md:w-auto"
              >
                Daftar sebagai Recruiter
                <ArrowRight className="h-[18px] w-[18px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
