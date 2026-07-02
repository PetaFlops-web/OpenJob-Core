'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark as BookmarkIcon, X } from 'lucide-react'
import type { Job } from '@/types'
import { bookmarksApi } from '@/lib/api'
import { useToast } from '@/providers/toast-provider'
import { JobCard } from '@/components/cards/job-card'
import { JobCardSkeleton } from '@/components/ui/skeleton-cards'
import { EmptyState } from '@/components/ui/empty-state'

export default function BookmarksPage() {
  const router = useRouter()
  const toast = useToast()
  const [bookmarks, setBookmarks] = useState<(Job & { _bookmarkId?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await bookmarksApi.listByUser()
      const items = res.data.bookmarks
      setBookmarks(items.map(b => {
        if (b.job) return { ...b.job, _bookmarkId: b.bookmark_id }
        // Backend flattens job data into bookmark — build job from top-level fields
        const flat = b as unknown as Record<string, unknown>
        return {
          id: b.id ?? b.job_id ?? '',
          _bookmarkId: b.bookmark_id,
          title: flat.title ?? '',
          description: flat.description ?? '',
          requirements: flat.requirements ?? [],
          benefits: flat.benefits ?? [],
          job_type: flat.job_type ?? '',
          experience_level: flat.experience_level ?? '',
          location_type: flat.location_type ?? 'onsite',
          location_city: flat.location_city ?? '',
          salary_min: flat.salary_min ?? null,
          salary_max: flat.salary_max ?? null,
          is_salary_visible: flat.is_salary_visible ?? false,
          status: flat.status ?? 'open',
          company_id: flat.company_id ?? '',
          category_id: flat.category_id ?? '',
          created_at: flat.created_at ?? '',
          updated_at: flat.updated_at ?? '',
          company: flat.company as Job['company'],
          category: flat.category as Job['category'],
        } as Job & { _bookmarkId?: string }
      }))
    } catch {
      // silently ignore — empty state will show
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const handleRemoveBookmark = async (jobId: string) => {
    // Optimistic update
    const prev = [...bookmarks]
    setBookmarks((bms) => bms.filter((b) => b.id !== jobId))

    try {
      await bookmarksApi.removeByJob(jobId)
      toast.success('Bookmark berhasil dihapus.')
    } catch {
      // Roll back on failure
      setBookmarks(prev)
      toast.error('Gagal menghapus bookmark.')
    } finally {
      setRemovingId(null)
    }
  }

  const handleApply = (jobId: string) => {
    router.push(`/jobs/${jobId}`)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lowongan Disimpan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar lowongan yang Anda bookmark untuk dilamar nanti.
          </p>
        </div>
        <JobCardSkeleton count={6} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" />
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lowongan Disimpan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar lowongan yang Anda bookmark untuk dilamar nanti.
          </p>
        </div>
        <EmptyState
          icon={<BookmarkIcon className="h-8 w-8" />}
          title="Belum ada job yang di-bookmark"
          description="Simpan lowongan yang menarik agar mudah ditemukan kembali."
          actionLabel="Jelajahi Lowongan"
          onAction={() => router.push('/jobs')}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lowongan Disimpan</h1>
        <p className="mt-1 text-sm text-gray-500">
          {bookmarks.length} lowongan tersimpan
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bookmarks.map((job) => {
          return (
            <div key={job._bookmarkId ?? job.id} className="relative group/wrapper">
              <JobCard
                job={{ ...job, is_bookmarked: true }}
                onApply={() => handleApply(job.id)}
              />
              <button
                type="button"
                disabled={removingId === job.id}
                onClick={() => {
                  setRemovingId(job.id)
                  handleRemoveBookmark(job.id)
                }}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover/wrapper:opacity-100 sm:focus:opacity-100"
                aria-label="Hapus bookmark"
                title="Hapus bookmark"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
