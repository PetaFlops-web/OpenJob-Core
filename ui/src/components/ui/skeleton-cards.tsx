import { Skeleton } from './skeleton'
import { cn } from '@/lib/utils'

export interface SkeletonCardsProps {
  count?: number
  className?: string
}

/**
 * Skeleton that mimics the job card layout: logo, title, company, badges.
 */
export function JobCardSkeleton({ count = 3, className }: SkeletonCardsProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-oj-border bg-white flex animate-[pulse_1.5s_ease-in-out_infinite] items-start gap-4 p-5"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          {/* Logo */}
          <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1 space-y-3">
            {/* Title */}
            <Skeleton className="h-5 w-3/4" />

            {/* Company */}
            <Skeleton className="h-4 w-1/2" />

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for company card listing.
 */
export function CompanyCardSkeleton({ count = 3, className }: SkeletonCardsProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-oj-border bg-white flex animate-[pulse_1.5s_ease-in-out_infinite] items-center gap-4 p-5"
          style={{ animationDelay: `${i * 150}ms` }}
        >
          {/* Logo */}
          <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1 space-y-2">
            {/* Company name */}
            <Skeleton className="h-5 w-2/5" />

            {/* Industry / location */}
            <Skeleton className="h-4 w-3/5" />

            {/* Job count pill */}
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for application list items.
 */
export function ApplicationCardSkeleton({ count = 3, className }: SkeletonCardsProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-oj-border bg-white flex animate-pulse items-center gap-4 p-4"
        >
          {/* Company logo */}
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />

          <div className="min-w-0 flex-1 space-y-2">
            {/* Job title */}
            <Skeleton className="h-5 w-1/2" />

            {/* Company name */}
            <Skeleton className="h-4 w-1/3" />
          </div>

          {/* Status badge */}
          <Skeleton className="h-6 w-24 shrink-0 rounded-full" />

          {/* Date */}
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </div>
  )
}
