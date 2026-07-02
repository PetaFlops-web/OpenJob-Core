import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-oj-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'min-h-[44px] w-full rounded-lg bg-oj-bg px-4 py-3 text-sm text-oj-text transition-all duration-200 placeholder:text-oj-text-secondary/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-oj-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'ring-2 ring-oj-error/70' : '',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-oj-error">{error}</p>}
        {helper && !error && <p className="mt-1 text-xs text-oj-text-secondary">{helper}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
