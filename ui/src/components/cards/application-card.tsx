import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Application } from '@/types'
import { Badge } from '@/components/ui/badge'
import { CompanyLogo } from '@/components/ui/company-logo'
import { buttonVariants, cn, formatDate, applicationStatusConfig } from '@/lib/utils'

export interface ApplicationCardProps {
  application: Application
  className?: string
  onDetailClick?: (application: Application) => void
}


export function ApplicationCard({ application, className, onDetailClick }: ApplicationCardProps) {
  const router = useRouter()
  const statusInfo = applicationStatusConfig[application.status] ?? { label: application.status, color: 'default' }
  const job = application.job

  return (
    <div className={cn(
      'flex w-full flex-col items-start gap-4 rounded-xl border border-oj-border bg-white p-4 oj-shadow transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] sm:flex-row sm:items-center',
      className
    )}>
      <CompanyLogo logoUrl={job?.company?.logo_url ?? null} className="h-11 w-11 shrink-0" />

      <div className="min-w-0 flex-1">
        <Link href={`/jobs/${job?.id ?? application.job_id}`} className="block">
          <h3 className="truncate text-sm font-medium text-oj-text hover:text-oj-primary">
            {job?.title ?? 'Lowongan'}
          </h3>
        </Link>
        <p className="truncate text-sm text-oj-text-secondary">{job?.company?.name ?? 'Perusahaan'}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant={statusInfo.color as 'warning' | 'primary' | 'purple' | 'success' | 'danger' | 'default'}>
            {statusInfo.label}
          </Badge>
          <span className="text-xs text-oj-text-secondary">Dilamar {formatDate(application.created_at)}</span>
        </div>
      </div>

      {onDetailClick ? (
        <button
          type="button"
          onClick={() => onDetailClick(application)}
          className={cn('w-full shrink-0 sm:w-auto', buttonVariants.ghost, 'text-sm')}
        >
          Lihat Detail
        </button>
      ) : (
        <button
          type="button"
          onClick={() => router.push('/dashboard/seeker/applications')}
          className={cn('w-full shrink-0 sm:w-auto', buttonVariants.ghost, 'text-sm')}
        >
          Lihat Detail
        </button>
      )}
    </div>
  )
}
