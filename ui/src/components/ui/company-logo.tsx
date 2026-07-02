'use client'

import { useRouter } from 'next/navigation'
import { Building2 } from 'lucide-react'
import { cn, resolveLogoUrl } from '@/lib/utils'

export interface CompanyLogoProps {
  logoUrl: string | null
  className?: string
  /** When provided, the logo becomes clickable and navigates to the company page. */
  companyId?: string
}

export function CompanyLogo({ logoUrl, className, companyId }: CompanyLogoProps) {
  const router = useRouter()
  const resolved = resolveLogoUrl(logoUrl)

  const handleClick = () => {
    if (companyId) {
      router.push(`/companies/${companyId}`)
    }
  }

  return (
    <div
      onClick={companyId ? handleClick : undefined}
      className={cn(
        'relative rounded-lg border border-oj-border bg-white overflow-hidden',
        companyId && 'cursor-pointer p-1 transition-colors hover:border-oj-primary',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-full w-full items-center justify-center',
          companyId && 'rounded bg-oj-primary/5',
        )}
      >
        <Building2 className="h-6 w-6 text-oj-primary" />
      </div>
      {resolved && (
        <img
          src={resolved}
          alt=""
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            companyId ? 'rounded p-1' : 'rounded-lg',
          )}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      )}
    </div>
  )
}
