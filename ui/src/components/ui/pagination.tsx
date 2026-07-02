import { cn } from '@/lib/utils'
import { Select } from './select'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  onItemsPerPageChange?: (value: number) => void
  itemsPerPageOptions?: number[]
  className?: string
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]

/**
 * Generate page buttons with ellipsis for large page counts.
 * Always shows first, last, current, and neighbors.
 */
function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []

  // Always show first page
  pages.push(1)

  if (current > 3) {
    pages.push('...')
  }

  // Show neighbors around current
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('...')
  }

  // Always show last page
  pages.push(total)

  return pages
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  itemsPerPageOptions = ITEMS_PER_PAGE_OPTIONS,
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return onItemsPerPageChange ? (
      <div className={cn('flex items-center justify-between py-3', className)}>
        <div className="text-sm text-gray-500">Items per page:</div>
        <Select
          value={String(itemsPerPage)}
          onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
          options={itemsPerPageOptions.map((n) => ({ value: String(n), label: String(n) }))}
          className="w-auto"
        />
      </div>
    ) : null
  }

  const pageNumbers = generatePageNumbers(currentPage, totalPages)

  return (
    <div className={cn('flex flex-col items-center gap-3 py-3 sm:flex-row sm:justify-between', className)}>
      {/* Left: items per page */}
      {onItemsPerPageChange && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Items per page:</span>
          <Select
            value={String(itemsPerPage)}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            options={itemsPerPageOptions.map((n) => ({ value: String(n), label: String(n) }))}
            className="w-auto"
          />
        </div>
      )}

      {/* Right: page buttons */}
      <nav className="flex items-center gap-1" aria-label="Pagination">
        {/* Prev */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-40',
            'rounded-lg border border-oj-border bg-white text-oj-text hover:shadow-md'
          )}
          aria-label="Previous page"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="inline-flex h-8 w-8 items-center justify-center text-sm text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all',
                page === currentPage
                  ? 'bg-oj-primary text-oj-text font-semibold shadow-sm'
                  : 'text-oj-text hover:rounded-lg hover:border hover:border-oj-border hover:bg-white'
              )}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all disabled:pointer-events-none disabled:opacity-40',
            'rounded-lg border border-oj-border bg-white text-oj-text hover:shadow-md'
          )}
          aria-label="Next page"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  )
}
