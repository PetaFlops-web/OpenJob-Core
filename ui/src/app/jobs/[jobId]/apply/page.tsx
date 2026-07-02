import { redirect } from 'next/navigation'

export default async function ApplyRedirectPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  redirect(`/jobs/${jobId}`)
}
