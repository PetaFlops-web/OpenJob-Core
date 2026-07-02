'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, MapPin, Briefcase, Clock, ArrowUpRight } from 'lucide-react'
import type { Job } from '@/types'
import { Button } from '@/components/ui/button'
import { CompanyLogo } from '@/components/ui/company-logo'
import { cn, formatCurrency, timeAgo, jobTypeLabels, experienceLevelLabels, locationTypeLabels } from '@/lib/utils'

export interface JobCardProps {
  job: Job
  variant?: 'grid' | 'list' | 'compact'
  onBookmark?: () => void
  onApply?: () => void
}


function JobBadges({ job }: { job: Job }) {
  return (
    <>
      <span className="rounded-full bg-oj-primary/10 px-2.5 py-0.5 text-xs font-medium text-oj-primary">{jobTypeLabels[job.job_type] ?? job.job_type}</span>
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-oj-text-secondary">{experienceLevelLabels[job.experience_level] ?? job.experience_level}</span>
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-oj-text-secondary">{locationTypeLabels[job.location_type] ?? job.location_type}</span>
    </>
  )
}

function CompanyNameLink({ company }: { company: NonNullable<Job['company']> }) {
  const router = useRouter()

  if (company.id) {
    return (
      <span
        role="link"
        tabIndex={0}
        className="cursor-pointer truncate text-sm text-oj-text-secondary transition-colors hover:text-oj-primary"
        onClick={(e) => {
          e.stopPropagation()
          router.push(`/companies/${company.id}`)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            router.push(`/companies/${company.id}`)
          }
        }}
      >
        {company.name}
      </span>
    )
  }
  return <p className="truncate text-sm text-oj-text-secondary">{company.name}</p>
}

function GridCard({ job, onBookmark, onApply }: JobCardProps) {
  const salaryVisible = job.is_salary_visible && job.salary_min != null && job.salary_max != null

  return (
    <Link href={`/jobs/${job.id}`} className="group relative flex flex-col overflow-hidden rounded-xl border border-oj-border bg-white oj-shadow transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-start gap-4 p-5">
        <CompanyLogo companyId={job.company?.id} logoUrl={job.company?.logo_url ?? null} className="h-12 w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-snug text-oj-text transition-colors group-hover:text-oj-primary">{job.title}</h3>
              {job.company && <CompanyNameLink company={job.company} />}
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark?.() }}
              className="shrink-0 rounded-full p-1.5 text-oj-text-secondary transition-colors hover:bg-oj-primary/5 hover:text-oj-primary"
              aria-label="Bookmark job"
            >
              <Bookmark className={cn('h-4 w-4 transition-all', job.is_bookmarked && 'fill-oj-primary text-oj-primary')} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-oj-text-secondary">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-oj-text-secondary" />
              {locationTypeLabels[job.location_type] ?? job.location_type}
              {job.location_city && <span className="text-oj-text-secondary"> · {job.location_city}</span>}
            </span>
            {salaryVisible && (
              <span className="flex items-center gap-1.5 font-semibold text-oj-primary">
                <Briefcase className="h-3.5 w-3.5" />
                {formatCurrency(job.salary_min!)} – {formatCurrency(job.salary_max!)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-oj-border px-5 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <JobBadges job={job} />
        </div>
        <span className="flex items-center gap-1 text-xs text-oj-text-secondary">
          <Clock className="h-3.5 w-3.5" />
          {timeAgo(job.created_at ?? '')}
        </span>
      </div>

      {onApply && (
        <div className="px-5 pb-4">
          <Button variant="primary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApply() }} className="w-full font-medium">
            Lamar Sekarang
          </Button>
        </div>
      )}
    </Link>
  )
}

function ListCard({ job, onBookmark, onApply }: JobCardProps) {
  const salaryVisible = job.is_salary_visible && job.salary_min != null && job.salary_max != null

  return (
    <Link href={`/jobs/${job.id}`} className="group flex items-center gap-4 rounded-xl border border-oj-border bg-white oj-shadow p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 sm:p-5">
      <CompanyLogo companyId={job.company?.id} logoUrl={job.company?.logo_url ?? null} className="hidden h-14 w-14 shrink-0 sm:block" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold leading-snug text-oj-text transition-colors group-hover:text-oj-primary">{job.title}</h3>
            {job.company && <CompanyNameLink company={job.company} />}
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark?.() }}
            className="shrink-0 rounded-full p-1.5 text-oj-text-secondary transition-colors hover:bg-oj-primary/5 hover:text-oj-primary"
            aria-label="Bookmark job"
          >
            <Bookmark className={cn('h-4 w-4 transition-all', job.is_bookmarked && 'fill-oj-primary text-oj-primary')} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-oj-text-secondary">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-oj-text-secondary" />
            {locationTypeLabels[job.location_type] ?? job.location_type}
            {job.location_city && <span className="text-oj-text-secondary"> · {job.location_city}</span>}
          </span>
          {salaryVisible && (
            <span className="flex items-center gap-1.5 font-semibold text-oj-primary">
              <Briefcase className="h-3.5 w-3.5" />
              {formatCurrency(job.salary_min!)} – {formatCurrency(job.salary_max!)}
            </span>
          )}
          <span className="flex items-center gap-1 text-oj-text-secondary">
            <Clock className="h-3.5 w-3.5" />
            {timeAgo(job.created_at ?? '')}
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <div className="flex flex-wrap items-center gap-1.5">
          <JobBadges job={job} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-oj-text-secondary transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-oj-primary" />
      </div>

      {onApply && (
        <div className="shrink-0 sm:hidden">
          <Button variant="primary" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onApply() }}>
            Lamar
          </Button>
        </div>
      )}
    </Link>
  )
}

function CompactCard({ job, onBookmark }: JobCardProps) {
  return (
    <Link href={`/jobs/${job.id}`} className="group flex items-center gap-3 rounded-lg border border-oj-border bg-white px-4 py-3 transition-all hover:shadow-sm">
      <CompanyLogo companyId={job.company?.id} logoUrl={job.company?.logo_url ?? null} className="h-10 w-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-oj-text group-hover:text-oj-primary">{job.title}</h3>
        <p className="truncate text-xs text-oj-text-secondary">{job.company?.name} · {job.location_city}</p>
      </div>
      {onBookmark && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark() }}
          className="shrink-0 p-1 text-oj-text-secondary transition-colors hover:text-oj-primary"
          aria-label="Bookmark job"
        >
          <Bookmark className={cn('h-4 w-4', job.is_bookmarked && 'fill-oj-primary text-oj-primary')} />
        </button>
      )}
    </Link>
  )
}

export function JobCard({ variant = 'grid', ...rest }: JobCardProps) {
  if (variant === 'list') return <ListCard {...rest} />
  if (variant === 'compact') return <CompactCard {...rest} />
  return <GridCard {...rest} />
}
