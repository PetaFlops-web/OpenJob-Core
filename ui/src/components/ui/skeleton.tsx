import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
}

/**
 * Base skeleton placeholder with pulse animation.
 * Use className to control sizing (width, height, shape).
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-oj-bg/50', className)}
      aria-hidden="true"
    />
  )
}
