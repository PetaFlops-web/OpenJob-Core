import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JobDetailClient } from './job-detail-client'
import { jobsApi } from '@/lib/api'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobId: string }>
}): Promise<Metadata> {
  const { jobId } = await params
  const job = await jobsApi.getById(jobId).then((r) => r.data).catch(() => null)

  if (!job) {
    return { title: 'Lowongan Tidak Ditemukan — Open-Job' }
  }

  const companyName = job.company?.name ?? 'Perusahaan Tidak Diketahui'
  return {
    title: `${job.title} di ${companyName} — Open-Job`,
    description: job.description.replace(/<[^>]*>/g, '').slice(0, 160),
  }
}

export async function generateStaticParams() {
  const res = await jobsApi.list().catch(() => ({ data: { jobs: [] } }))
  return res.data.jobs.map((job) => ({ jobId: job.id }))
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  const job = await jobsApi.getById(jobId).then((r) => r.data).catch(() => null)

  if (!job) {
    notFound()
  }

  return <JobDetailClient initialJob={job} />
}
