import { type SelectHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold text-oj-text">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'min-h-[44px] w-full rounded-lg bg-oj-bg px-4 py-3 text-sm text-oj-text transition-all duration-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-oj-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'ring-2 ring-oj-error/70' : '',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-oj-error">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'

export { Select }
