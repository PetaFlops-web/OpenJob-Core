import Link from 'next/link'
import { MapPin, Briefcase } from 'lucide-react'
import type { Company } from '@/types'
import { Button } from '@/components/ui/button'
import { CompanyLogo } from '@/components/ui/company-logo'
import { cn } from '@/lib/utils'

export interface CompanyCardProps {
  company: Company
  className?: string
}


export function CompanyCard({ company, className }: CompanyCardProps) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className={cn(
        'rounded-xl border border-oj-border bg-white oj-shadow group flex flex-col overflow-hidden p-5 transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <CompanyLogo logoUrl={company.logo_url} className="h-14 w-14 shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-medium leading-snug text-oj-text transition-colors group-hover:text-oj-primary">
              {company.name}
            </h3>
            {company.is_verified && (
              <span className="shrink-0 rounded-full border border-oj-border bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-oj-text shadow-sm">
                Verified
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-oj-text-secondary">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {company.location}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {company.industry}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-oj-border pt-4">
        <span className="text-sm text-oj-text-secondary">
          <span className="font-semibold text-oj-text">{company.job_count ?? 0}</span> lowongan
        </span>
        <Button variant="outline" size="sm" className="font-medium">
          Lihat Lowongan
        </Button>
      </div>
    </Link>
  )
}
