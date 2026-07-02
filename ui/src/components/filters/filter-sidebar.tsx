"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X, MapPin, Building, DollarSign, Monitor, ChevronDown, ChevronUp } from "lucide-react"
import { categoriesApi } from "@/lib/api"
import type { Category } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type FilterValues = {
  search: string
  category: string
  location: string
  jobTypes: string[]
  experienceLevels: string[]
  salaryMin: string
  salaryMax: string
  locationType: "remote" | "on-site" | "hybrid" | "all"
}

export interface FilterSidebarProps {
  values: FilterValues
  onChange: (values: Partial<FilterValues>) => void
  onApply: () => void
  onClear: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
  activeFilterCount: number
}

const JOB_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
]

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: "entry", label: "Entry Level" },
  { value: "mid", label: "Mid Level" },
  { value: "senior", label: "Senior Level" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Manager" },
]

const LOCATION_TYPE_OPTIONS: { value: "remote" | "on-site" | "hybrid" | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "remote", label: "Remote" },
  { value: "on-site", label: "On-site" },
  { value: "hybrid", label: "Hybrid" },
]

function CheckboxGroup({
  options,
  selected,
  onChange,
  label,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
  label: string
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700">{label}</legend>
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={(e) => {
              const next = e.target.checked
                ? [...selected, opt.value]
                : selected.filter((v) => v !== opt.value)
              onChange(next)
            }}
            className="h-4 w-4 rounded-md border-oj-border text-oj-primary focus:ring-oj-primary"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
            {opt.label}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-oj-border pb-4 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold text-oj-text hover:text-oj-primary transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  )
}

export function FilterSidebar({
  values,
  onChange,
  onApply,
  onClear,
  isMobileOpen = false,
  onMobileClose,
  activeFilterCount,
}: FilterSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  useEffect(() => {
    categoriesApi
      .list()
      .then((res) => setCategories(res.data?.categories ?? []))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoading(false))
  }, [])

  const categoryOptions = [
    { value: "", label: "Semua Kategori" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header (mobile only) */}
      <div className="flex items-center justify-between lg:hidden px-4 py-3 border-b border-oj-border">
        <h2 className="text-lg font-semibold text-gray-900">Filter</h2>
        {onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="rounded-full rounded-lg border border-oj-border bg-white p-1.5 text-gray-400 active:scale-[0.98]"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Cari jabatan, perusahaan..."
            value={values.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            <Building className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Kategori
          </label>
          {categoriesLoading ? (
            <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <select
              value={values.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className="w-full rounded-lg border border-oj-border bg-white px-3 py-2 text-sm text-oj-text focus:ring-oj-primary focus:outline-none"
            >
              {categoryOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            <MapPin className="inline h-4 w-4 mr-1.5 -mt-0.5" />
            Lokasi
          </label>
          <Input
            placeholder="Kota atau wilayah"
            value={values.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>

        {/* Job Type */}
        <CollapsibleSection title="Tipe Pekerjaan" defaultOpen>
          <CheckboxGroup
            options={JOB_TYPE_OPTIONS}
            selected={values.jobTypes}
            onChange={(jobTypes) => onChange({ jobTypes })}
            label=""
          />
        </CollapsibleSection>

        {/* Experience Level */}
        <CollapsibleSection title="Level Pengalaman" defaultOpen>
          <CheckboxGroup
            options={EXPERIENCE_LEVEL_OPTIONS}
            selected={values.experienceLevels}
            onChange={(experienceLevels) => onChange({ experienceLevels })}
            label=""
          />
        </CollapsibleSection>

        {/* Salary Range */}
        <CollapsibleSection title="Rentang Gaji" defaultOpen>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <Input
                type="number"
                placeholder="Min"
                value={values.salaryMin}
                onChange={(e) => onChange({ salaryMin: e.target.value })}
                className="pl-7 text-sm"
              />
            </div>
            <span className="text-gray-400 text-sm">–</span>
            <div className="relative flex-1">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
              <Input
                type="number"
                placeholder="Max"
                value={values.salaryMax}
                onChange={(e) => onChange({ salaryMax: e.target.value })}
                className="pl-7 text-sm"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Location Type */}
        <CollapsibleSection title="Lokasi Kerja" defaultOpen>
          <div className="flex rounded-lg border border-oj-border bg-white overflow-hidden divide-x divide-oj-border">
            {LOCATION_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ locationType: opt.value })}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium transition-colors",
                  values.locationType === opt.value
                    ? "bg-oj-primary text-white"
                    : "text-oj-text/60 hover:bg-oj-bg"
                )}
              >
                {opt.value === "all" ? (
                  <Monitor className="h-4 w-4 mx-auto" />
                ) : (
                  <span className="text-xs">{opt.label}</span>
                )}
              </button>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-2">
        <Button onClick={onApply} className="w-full" size="md">
          <Filter className="h-4 w-4 mr-2" />
          Terapkan Filter
        </Button>
        <Button onClick={onClear} variant="outline" className="w-full" size="md" disabled={activeFilterCount === 0}>
          Hapus Filter
          {activeFilterCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-semibold text-gray-700">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-72 xl:w-80 shrink-0">
        <div className="sticky top-4 rounded-xl border border-oj-border bg-white shadow-lg">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 animate-fade-in bg-black/40 lg:hidden"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-full animate-slide-in-left rounded-xl border border-oj-border bg-white shadow-lg lg:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}
