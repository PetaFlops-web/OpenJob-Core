import { usersApi, jobsApi } from '@/lib/api'

export interface ResolvedNames {
  userNames: Record<string, string>
  jobTitles: Record<string, string>
}

/**
 * Resolve user IDs to names and job IDs to titles.
 * Used by dashboard and interviews pages to avoid duplication.
 */
export async function resolveNames(
  userIds: string[],
  jobIds: string[]
): Promise<ResolvedNames> {
  const [userResults, jobResults] = await Promise.all([
    Promise.allSettled(
      userIds.map((id) =>
        usersApi.getById(id).then((r) => [id, r.data.name] as const)
      )
    ),
    Promise.allSettled(
      jobIds.map((id) =>
        jobsApi.getById(id).then((r) => [id, r.data.title] as const)
      )
    ),
  ])

  const userNames: Record<string, string> = {}
  for (const r of userResults) {
    if (r.status === 'fulfilled') userNames[r.value[0]] = r.value[1]
  }

  const jobTitles: Record<string, string> = {}
  for (const r of jobResults) {
    if (r.status === 'fulfilled') jobTitles[r.value[0]] = r.value[1]
  }

  return { userNames, jobTitles }
}
