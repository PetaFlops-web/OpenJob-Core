'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { CompanyCard } from '@/components/cards/company-card'
import { CompanyCardSkeleton, EmptyState, Pagination } from '@/components/ui'
import { companiesApi } from '@/lib/api'
import type { Company, PaginationMeta } from '@/types'

const INDUSTRY_OPTIONS = [
  'Teknologi Informasi',
  'Keuangan & Perbankan',
  'Kesehatan',
  'Pendidikan',
  'Manufaktur',
  'E-Commerce',
  'Konsultan',
  'Media & Hiburan',
  'Properti',
  'Telekomunikasi',
  'Transportasi & Logistik',
  'Pertanian',
  'Energi',
  'Retail',
  'Pemerintahan',
]

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [industry, setIndustry] = useState('')
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset to page 1 when search or industry changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, industry])

  const fetchCompanies = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(itemsPerPage),
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (industry) params.industry = industry

      const res = await companiesApi.list(params)
      if (res.data) {
        setCompanies(res.data.companies)
        const pag = res.data.pagination
        setMeta(pag ? { page: pag.page, limit: pag.limit, total: pag.total, total_pages: pag.totalPages ?? pag.total_pages ?? Math.ceil(pag.total / pag.limit) } : null)
      }
    } catch {
      setCompanies([])
      setMeta(null)
    } finally {
      setLoading(false)
    }
  }, [page, itemsPerPage, debouncedSearch, industry])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 md:py-8 lg:px-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <nav className="mb-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-blue-600">Beranda</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">Perusahaan</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Daftar Perusahaan</h1>
        <p className="mt-2 text-sm text-gray-500 md:text-base">Temukan perusahaan yang sedang membuka lowongan kerja</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex w-full flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari perusahaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Industry filter */}
        <div className="relative w-full sm:w-56">
          <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-8 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Semua Industri</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Results count */}
      {!loading && meta && (
        <p className="mb-4 text-sm text-gray-500">
          Menampilkan <span className="font-medium text-gray-700">{companies.length}</span> dari{' '}
          <span className="font-medium text-gray-700">{meta.total}</span> perusahaan
        </p>
      )}

      {/* Content */}
      {loading ? (
        <CompanyCardSkeleton count={6} />
      ) : companies.length === 0 ? (
        <EmptyState
          title="Belum ada perusahaan terdaftar"
          description={
            search || industry
              ? 'Coba ubah filter atau kata kunci pencarian Anda'
              : 'Perusahaan akan muncul setelah terdaftar di platform ini'
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={page}
                totalPages={meta.total_pages}
                onPageChange={setPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
