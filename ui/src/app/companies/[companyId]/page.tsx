"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Building2, CheckCircle, Globe, Mail, MapPin, Phone, Users } from "lucide-react"
import { JobCard } from "@/components/cards"
import { EmptyState } from "@/components/ui"
import { companiesApi, jobsApi } from "@/lib/api"
import { resolveLogoUrl, parseStringArray } from "@/lib/utils"
import type { Company, Job } from "@/types"

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-container ${className ?? ""}`} />
}

function CompanyDetailSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <div className="h-32 w-full bg-surface-container md:h-64" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8">
        <div className="absolute -top-8 left-4 h-16 w-16 rounded-lg border border-border-slate bg-bg-surface p-2 shadow-sm md:-top-16 md:left-6 md:h-32 md:w-32">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="space-y-4 pt-10 pb-6 md:pt-20 md:pb-8">
          <Skeleton className="h-8 w-48 md:w-64" />
          <Skeleton className="h-5 w-full max-w-sm md:w-96" />
        </div>
      </div>
    </div>
  )
}

export default function CompanyDetailPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params)
  const [company, setCompany] = useState<Company | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"tentang" | "lowongan">("tentang")

  useEffect(() => {
    let cancelled = false
    Promise.all([companiesApi.getById(companyId), jobsApi.getByCompany(companyId)])
      .then(([cRes, jRes]) => {
        if (cancelled) return
        setCompany(cRes.data)
        setJobs(jRes.data?.jobs ?? [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [companyId])

  if (loading) return <CompanyDetailSkeleton />
  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <div className="mb-4 inline-flex rounded-full bg-surface-container p-4">
            <Building2 className="h-10 w-10 text-on-surface-variant" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Perusahaan Tidak Ditemukan</h2>
          <p className="mt-2 text-text-secondary">Perusahaan yang Anda cari tidak tersedia.</p>
          <Link href="/companies" className="mt-6 inline-flex rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-container">
            Kembali ke Daftar Perusahaan
          </Link>
        </div>
      </div>
    )
  }

  const initials = company.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  const activeJobs = jobs.filter((j) => j.status === "active" || j.status === "open")
  const allBenefits = [...new Set(jobs.flatMap((j) => parseStringArray(j.benefits)))]
  const allRequirements = [...new Set(jobs.flatMap((j) => parseStringArray(j.requirements)))]

  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <div className="border-b border-border-slate bg-bg-surface">
        <div className="relative h-32 w-full overflow-hidden bg-surface-container-high md:h-64">
          {resolveLogoUrl(company.logo_url) ? (
            <img src={resolveLogoUrl(company.logo_url)!} alt={company.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-5xl font-bold text-primary/20 md:text-8xl">{initials}</span>
            </div>
          )}
        </div>

        <div className="relative mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8">
          <div className="absolute -top-8 left-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border-slate bg-bg-surface p-2 shadow-sm md:-top-16 md:left-6 md:h-32 md:w-32 lg:left-8">
            <span className="text-xl font-bold text-primary md:text-4xl">{initials}</span>
            {resolveLogoUrl(company.logo_url) && (
              <img
                src={resolveLogoUrl(company.logo_url)!}
                alt={`Logo ${company.name}`}
                className="absolute inset-0 h-full w-full object-contain p-2"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>

          <div className="flex flex-col gap-4 pt-10 pb-6 md:flex-row md:flex-wrap md:items-end md:justify-between md:pt-20 md:pb-8">
            <div>
              <h1 className="mb-2 text-2xl font-bold leading-[1.2] text-text-primary md:text-4xl">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-on-surface-variant md:gap-4">
                <span className="flex items-center gap-1">
                  <MapPin className="h-[18px] w-[18px]" />
                  {company.location}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-[18px] w-[18px]" />
                  {company.industry}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-[18px] w-[18px]" />
                  {company.company_size} Karyawan
                </span>
              </div>
            </div>
            <button className="inline-flex h-fit w-full items-center justify-center rounded bg-primary px-6 py-3 text-sm font-bold text-on-primary shadow-sm transition-colors hover:opacity-90 sm:w-auto">
              Ikuti Perusahaan
            </button>
          </div>

          <div className="flex gap-8 overflow-x-auto border-b border-border-slate [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setActiveTab("tentang")}
              className={`shrink-0 pb-3 text-base transition-colors ${activeTab === "tentang" ? "border-b-2 border-primary font-bold text-primary" : "text-on-surface-variant hover:text-primary"}`}
            >
              Tentang
            </button>
            <button
              onClick={() => setActiveTab("lowongan")}
              className={`shrink-0 pb-3 text-base transition-colors ${activeTab === "lowongan" ? "border-b-2 border-primary font-bold text-primary" : "text-on-surface-variant hover:text-primary"}`}
            >
              Lowongan
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-[1200px] px-4 md:mt-12 md:px-6 lg:px-8">
        {activeTab === "tentang" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="space-y-6 lg:col-span-2 lg:space-y-8">
              <section className="rounded-lg border border-border-slate bg-bg-surface p-5 md:p-8">
                <h2 className="mb-4 text-2xl font-semibold leading-[1.3] text-text-primary">Tentang Perusahaan</h2>
                <div className="space-y-4 leading-relaxed text-on-surface-variant">
                  <p>{company.description}</p>
                  <p>
                    Didirikan pada tahun {company.founded_year}, {company.name} telah berkembang menjadi pemain utama di industri {company.industry}. Kami percaya bahwa teknologi dan talenta terbaik dibangun di atas fondasi kolaborasi yang kuat, keragaman pemikiran, dan komitmen tanpa kompromi terhadap keunggulan.
                  </p>
                </div>
              </section>

              <section className="rounded-lg border border-border-slate bg-bg-surface p-5 md:p-8">
                <h2 className="mb-6 text-2xl font-semibold leading-[1.3] text-text-primary">Budaya Kerja & Manfaat</h2>
                {allBenefits.length > 0 ? (
                  <div className="space-y-4">
                    {allBenefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3 rounded-lg bg-surface-container-low p-4">
                        <CheckCircle className="h-5 w-5 shrink-0 text-secondary" />
                        <span className="text-sm text-on-surface-variant">{benefit}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">Belum ada informasi manfaat.</p>
                )}
              </section>

              <section className="rounded-lg border border-border-slate bg-bg-surface p-5 md:p-8">
                <h2 className="mb-6 text-2xl font-semibold leading-[1.3] text-text-primary">Skills</h2>
                {allRequirements.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allRequirements.map((req) => (
                      <span key={req} className="rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        {req}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">Belum ada informasi skills.</p>
                )}
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-lg border border-border-slate bg-bg-surface p-5 md:p-6">
                <h3 className="mb-4 text-[18px] font-semibold leading-[1.3] text-text-primary">Informasi Kontak</h3>
                <div className="space-y-4">
                  {company.phone && (
                    <div className="flex items-start gap-3 text-on-surface-variant">
                      <Phone className="mt-0.5 h-5 w-5 shrink-0" />
                      <a href={`tel:${company.phone}`} className="text-sm font-medium text-primary hover:underline">
                        {company.phone}
                      </a>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-start gap-3 text-on-surface-variant">
                      <Mail className="mt-0.5 h-5 w-5 shrink-0" />
                      <a href={`mailto:${company.email}`} className="text-sm font-medium text-primary hover:underline">
                        {company.email}
                      </a>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-start gap-3 text-on-surface-variant">
                      <Globe className="mt-0.5 h-5 w-5 shrink-0" />
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-start gap-3 text-on-surface-variant">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="text-sm font-medium">
                        <p className="font-bold text-text-primary">Kantor Pusat</p>
                        <p>{company.address}</p>
                      </div>
                    </div>
                  )}
                  {!company.phone && !company.email && !company.website && !company.address && (
                    <p className="text-sm text-on-surface-variant">Belum ada informasi kontak.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div>
            {activeJobs.length === 0 ? (
              <EmptyState title="Belum ada lowongan" description={`${company.name} belum membuka lowongan saat ini. Periksa kembali nanti.`} />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-16" />
    </div>
  )
}
