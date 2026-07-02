'use client'

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

export function FieldLabel({ children, required = false }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-2 block text-sm font-semibold leading-5 text-on-surface">
      {children} {required && <span className="text-error">*</span>}
    </label>
  )
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm leading-5 text-on-surface transition-all placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
    />
  )
}

export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full cursor-pointer appearance-none rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm leading-5 text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
    </div>
  )
}

export function Chip({ children, variant = 'default', onRemove }: { children: React.ReactNode; variant?: 'default' | 'primary'; onRemove: () => void }) {
  return (
    <span className={variant === 'primary'
      ? 'inline-flex items-center gap-1 rounded-full bg-primary-fixed px-3 py-1 text-[13px] leading-[18px] text-on-primary-fixed'
      : 'inline-flex items-center gap-1 rounded-full bg-surface-variant px-3 py-1 text-[13px] leading-[18px] text-on-surface'
    }>
      {children}
      <button onClick={onRemove} className="transition-colors hover:text-error" type="button" aria-label="Remove">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}

export function TagsInput({
  label,
  placeholder,
  items,
  setItems,
  variant = 'default',
}: {
  label: string
  placeholder: string
  items: string[]
  setItems: (items: string[]) => void
  variant?: 'default' | 'primary'
}) {
  const [value, setValue] = useState('')

  const addValue = () => {
    const next = value.trim()
    if (!next || items.includes(next)) return
    setItems([...items, next])
    setValue('')
  }

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-wrap gap-2 rounded-lg border border-border-subtle bg-surface p-2 transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {items.map((item) => (
          <Chip key={item} variant={variant} onRemove={() => setItems(items.filter((i) => i !== item))}>{item}</Chip>
        ))}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addValue()
            }
          }}
          onBlur={addValue}
          className="min-w-[150px] flex-1 bg-transparent px-2 py-1 text-sm leading-5 text-on-surface outline-none placeholder:text-outline"
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
