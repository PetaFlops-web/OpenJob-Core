import { applicationsApi, atsApi, usersApi } from '@/lib/api'
import type { Application, User } from '@/types'

export interface EnrichedUser {
  name: string
  email: string
  phone?: string | null
  location?: string | null
  bio?: string | null
}

export interface ApplicantDetail extends Application {
  enrichedUser: EnrichedUser
  userSkills: string[]
}

type AtsContainer = {
  ats_score?: unknown
  atsScore?: unknown
  match_score?: unknown
  matchScore?: unknown
  score?: unknown
}

type ApplicationRecord = Application & {
  ats?: AtsContainer | null
  analysis?: AtsContainer | null
  cv_analysis?: AtsContainer | null
  cvAnalysis?: AtsContainer | null
  applicant?: User | null
  document?: Application['document']
}

function toFiniteNumber(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function getAtsScore(app: Application) {
  const record = app as ApplicationRecord
  return toFiniteNumber(
    app.ats_score ??
      app.atsScore ??
      app.match_score ??
      app.matchScore ??
      app.score ??
      record.ats?.ats_score ??
      record.ats?.atsScore ??
      record.ats?.match_score ??
      record.ats?.matchScore ??
      record.ats?.score ??
      record.analysis?.ats_score ??
      record.analysis?.score ??
      record.cv_analysis?.ats_score ??
      record.cv_analysis?.score ??
      record.cvAnalysis?.atsScore ??
      record.cvAnalysis?.score
  )
}

export function normalizeApplication(app: Application): Application {
  const score = getAtsScore(app)
  return score == null ? app : { ...app, ats_score: score }
}

export function getUserFromApplication(app: Application): EnrichedUser {
  const record = app as ApplicationRecord
  const user = app.user ?? record.applicant

  if (!user) return { name: app.user_id, email: '' }

  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    location: user.location,
    bio: user.bio,
  }
}

async function fetchApplicationDetail(app: Application) {
  try {
    const res = await applicationsApi.getById(app.id)
    return normalizeApplication({ ...app, ...res.data })
  } catch {
    return normalizeApplication(app)
  }
}

async function fetchApplicantUser(app: Application) {
  try {
    const res = await usersApi.getById(app.user_id)
    // Always prefer fresh data from /users/:id (has bio, phone, location, etc.)
    const fresh = res.data
    if (app.user) {
      // Merge: keep any extra fields from app.user, but overwrite with fresh data
      return { ...app.user, ...fresh }
    }
    return fresh
  } catch {
    return app.user ?? null
  }
}
async function fetchUserSkills(userId: string): Promise<string[]> {
  try {
    const res = await usersApi.getSkills(userId)
    return (res.data.skills ?? []).map((s) => s.name)
  } catch {
    return []
  }
}

async function fetchAtsAnalysisForDocument(documentId: string | null | undefined) {
  if (!documentId) return null
  try {
    const res = await atsApi.analyses()
    const found = (res.data.analyses ?? []).find((a) => a.document_id === documentId)
    return found ?? null
  } catch {
    return null
  }
}

export async function hydrateApplicantDetail(app: Application): Promise<ApplicantDetail> {
  let mergedApp = normalizeApplication(app)

  // Fetch detailed application if missing ATS score or document
  const hasScore = getAtsScore(mergedApp) != null
  const documentId = mergedApp.document?.id ?? mergedApp.document_id ?? mergedApp.documentId
  if (!hasScore || !documentId) {
    const detailed = await fetchApplicationDetail(mergedApp)
    mergedApp = { ...mergedApp, ...detailed }
  }

  // Always fetch full user data from /users/:id (has bio, phone, location, etc.)
  const user = await fetchApplicantUser(mergedApp)
  if (user) mergedApp.user = user

  // Fetch user skills via recruiter-only endpoint
  const finalDocId = mergedApp.document?.id ?? mergedApp.document_id ?? mergedApp.documentId
  const [skills, analysis] = await Promise.all([
    fetchUserSkills(mergedApp.user_id),
    getAtsScore(mergedApp) == null ? fetchAtsAnalysisForDocument(finalDocId) : Promise.resolve(null),
  ])

  if (analysis) {
    if (analysis.match_score != null) mergedApp.ats_score = Number(analysis.match_score)
  }

  return {
    ...mergedApp,
    enrichedUser: getUserFromApplication(mergedApp),
    userSkills: skills,
  }
}
