import type {
  Job,
  Company,
  Application,
  Interview,
  Notification,
  Bookmark,
  Category,
  User,
  NotificationPreferences,
  ATSAnalysis,
  PaginationMeta,
} from '@/types'
import { api } from './api-client'

// ==================== Health ====================
export const healthApi = {
  get: () =>
    api.get<{ status: string; timestamp: string; uptime: number; services: Record<string, string> }>('/health'),
}

// ==================== Users ====================
export const usersApi = {
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<{ id: string }>('/users', data),
  getById: (id: string) =>
    api.get<User>(`/users/${id}`),
  getSkills: (id: string) =>
    api.get<{ skills: { id: string; name: string; created_at?: string }[] }>(`/users/${id}/skills`),
}

// ==================== Auth ====================
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken?: string; refreshToken?: string; mfa_required?: boolean; mfa_token?: string }>('/authentications', { email, password }),
  firebaseLogin: (idToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/firebase/login', { idToken }),
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<{ id: string }>('/users', data),
  refresh: (refreshToken: string) =>
    api.put<{ accessToken: string }>('/authentications', { refreshToken }),
  logout: (refreshToken: string) =>
    api.delete<unknown>('/authentications', { refreshToken }),
  me: () =>
    api.get<User>('/profile'),
}

// ==================== Profile ====================
export const profileApi = {
  get: () =>
    api.get<User>('/profile'),
  update: (data: { name?: string; phone?: string; location?: string; bio?: string }) =>
    api.put<User>('/profile', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.request<User>('/profile/avatar', { method: 'POST', body: formData })
  },
  getApplications: () =>
    api.get<{ applications: Application[] }>('/profile/applications'),
  getBookmarks: () =>
    api.get<{ bookmarks: (Bookmark & { job?: Job })[] }>('/profile/bookmarks'),
  getInterviews: () =>
    api.get<{ interviews: Interview[] }>('/profile/interviews'),
  getInterviewById: (interviewId: string) =>
    api.get<{ interview: Interview }>(`/profile/interviews/${interviewId}`),
}

// ==================== Categories ====================
export const categoriesApi = {
  list: () =>
    api.get<{ categories: Category[] }>('/categories'),
  getById: (id: string) =>
    api.get<Category>(`/categories/${id}`),
  create: (data: { name: string }) =>
    api.post<{ id: string }>('/categories', data),
  update: (id: string, data: { name: string }) =>
    api.put<unknown>(`/categories/${id}`, data),
  remove: (id: string) =>
    api.delete<unknown>(`/categories/${id}`),
}

// ==================== Companies ====================
export const companiesApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ companies: Company[]; pagination?: PaginationMeta }>('/companies', params),
  getById: (id: string) =>
    api.get<Company>(`/companies/${id}`),
  create: (data: { name: string; location: string; description?: string; email?: string; website?: string; industry?: string; company_size?: string }) =>
    api.post<{ id: string }>('/companies', data),
  update: (id: string, data: Partial<Company>) =>
    api.put<unknown>(`/companies/${id}`, data),
  remove: (id: string) =>
    api.delete<unknown>(`/companies/${id}`),
  uploadLogo: (companyId: string, file: File) => {
    const formData = new FormData()
    formData.append('logo', file)
    return api.request<{ logo_url?: string; data?: { logo_url?: string } }>(`/companies/${companyId}/logo`, { method: 'POST', body: formData })
  },
  // Company availability (items 39-40 in Postman)
  getAvailability: (companyId: string) =>
    api.get<{ id: string; company_id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean; created_at: string }[]>(`/companies/${companyId}/availability`, { company_id: companyId }),
  addAvailability: (data: { company_id: string; day_of_week: number; start_time: string; end_time: string }) =>
    api.post<{ id: string }>('/companies/availability', data),
  deleteAvailability: (id: string) =>
    api.delete<unknown>(`/companies/availability/${id}`),
}

// ==================== Jobs ====================
export const jobsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ jobs: Job[]; pagination?: PaginationMeta }>('/jobs', params),
  getById: (jobId: string) =>
    api.get<Job & { company?: { id: string; name: string; location: string; description: string | null }; category?: { id: string; name: string } }>(`/jobs/${jobId}`),
  create: (data: {
    title: string; description: string; job_type: string; experience_level: string;
    company_id: string; category_id: string; status: string;
    salary_min?: number; salary_max?: number; is_salary_visible?: boolean;
    location_type?: string; location_city?: string;
    requirements?: string[]; benefits?: string[];
  }) =>
    api.post<{ id: string }>('/jobs', data),
  update: (jobId: string, data: Partial<Job>) =>
    api.put<unknown>(`/jobs/${jobId}`, data),
  remove: (jobId: string) =>
    api.delete<unknown>(`/jobs/${jobId}`),
  getByCompany: (companyId: string) =>
    api.get<{ jobs: Job[] }>(`/jobs/company/${companyId}`),
  getByCategory: (categoryId: string) =>
    api.get<{ jobs: Job[] }>(`/jobs/category/${categoryId}`),
  search: (data: { search: string; page?: number; limit?: number; job_type?: string; experience_level?: string; location_type?: string }) =>
    api.post<{ jobs: Job[]; pagination: PaginationMeta }>('/jobs/search', data),
}

// ==================== Applications ====================
export const applicationsApi = {
  list: () =>
    api.get<{ applications: Application[] }>('/applications'),
  create: (data: { job_id: string; document_id?: string }) =>
    api.post<{ id: string; user_id: string; job_id: string; status: string; document_id?: string | null; ats_score?: number | null }>('/applications', data),
  getById: (id: string) =>
    api.get<Application>(`/applications/${id}`),
  getByUser: (userId: string) =>
    api.get<{ applications: (Application & { job?: { id: string; title: string; company?: { id: string; name: string; location: string } } })[] }>(`/applications/user/${userId}`),
  getByJob: (jobId: string) =>
    api.get<{ applications: Application[] }>(`/applications/job/${jobId}`),
  update: (id: string, data: { status: string }) =>
    api.patch<unknown>(`/applications/${id}`, data),
  remove: (id: string) =>
    api.delete<unknown>(`/applications/${id}`),
  /** Download CV document for an application. Returns raw Response (PDF stream). */
  getDocument: (applicationId: string): Promise<Response> => {
    const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    return fetch(`${API_URL}/applications/${applicationId}/document`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
}

// ==================== Bookmarks ====================
export const bookmarksApi = {
  add: (jobId: string) =>
    api.post<{ id: string }>(`/jobs/${jobId}/bookmark`, {}),
  remove: (jobId: string, bookmarkId: string) =>
    api.delete<unknown>(`/jobs/${jobId}/bookmark/${bookmarkId}`),
  removeByJob: (jobId: string) =>
    api.delete<unknown>(`/jobs/${jobId}/bookmark`, {}),
  get: (jobId: string, bookmarkId: string) =>
    api.get<{ id: string; job_id: string; user_id: string }>(`/jobs/${jobId}/bookmark/${bookmarkId}`),
  count: () =>
    api.get<{ count: number }>('/bookmarks'),
  listByUser: () =>
    api.get<{ bookmarks: (Bookmark & { job?: Job })[] }>('/profile/bookmarks'),
}

// ==================== Interviews ====================
export const interviewsApi = {
  create: (data: {
    application_id: string; company_id: string; user_id: string; job_id: string;
    scheduled_at: string; interview_type?: string; duration_minutes?: number;
    location?: string; meeting_link?: string; meeting_platform?: string;
    timezone?: string; notes?: string;
  }) =>
    api.post<{ id: string }>('/interviews', data),
  list: (params?: Record<string, string>) =>
    api.get<{ interviews: Interview[] }>('/interviews', params),
  listByCompany: (companyId: string) =>
    api.get<{ interviews: Interview[] }>('/interviews', { company_id: companyId }),
  listByUser: () =>
    api.get<{ interviews: Interview[] }>('/interviews/user'),
  getById: (id: string) =>
    api.get<Interview>(`/interviews/${id}`),
  update: (id: string, data: Partial<Interview>) =>
    api.put<unknown>(`/interviews/${id}`, data),
  remove: (id: string) =>
    api.delete<unknown>(`/interviews/${id}`),
  complete: (id: string) =>
    api.put<unknown>(`/interviews/${id}/complete`, {}),
  noShow: (id: string) =>
    api.put<unknown>(`/interviews/${id}/no-show`, {}),
  // Interview availability (items 75-76 in Postman)
  addAvailability: (data: { company_id: string; day_of_week: number; start_time: string; end_time: string }) =>
    api.post<{ id: string }>('/interviews/availability', data),
  getAvailability: (companyId: string) =>
    api.get<{ id: string; company_id: string; day_of_week: number; start_time: string; end_time: string; is_active: boolean; created_at: string }[]>(`/interviews/availability`, { company_id: companyId }),
  deleteAvailability: (id: string) =>
    api.delete<unknown>(`/interviews/availability/${id}`),
}

// ==================== Notifications ====================
export const notificationsApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ notifications: Notification[]; pagination?: PaginationMeta }>('/notifications', params),
  unreadCount: () =>
    api.get<{ unread_count: number }>('/notifications/unread-count'),
  markRead: (id: string) =>
    api.put<unknown>(`/notifications/${id}/read`, {}),
  markAllRead: () =>
    api.put<unknown>('/notifications/read-all', {}),
  remove: (id: string) =>
    api.delete<unknown>(`/notifications/${id}`),
  preferences: {
    get: () =>
      api.get<NotificationPreferences>('/notifications/preferences'),
    update: (data: Partial<NotificationPreferences>) =>
      api.put<NotificationPreferences>('/notifications/preferences', data),
  },
}

// ==================== ATS ====================
export const atsApi = {
  analyze: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.request<{ ats_score: number; cv_chars: number; skills_chars: number; job_summary_chars: number }>('/api/v1/ats/analyze', { method: 'POST', body: formData })
  },
  scan: (data: { documentId: string; skills?: string; jobSummary?: string }) =>
    api.post<{ analysisId: string; ats_score: number; cv_chars: number; skills_chars: number; job_summary_chars: number }>('/ats/scan', data),
  analyses: () =>
    api.get<{ analyses: ATSAnalysis[] }>('/ats/analyses'),
}

// ==================== Documents ====================
export const documentsApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('document', file)
    return api.request<{ documentId: string; filename: string; originalName: string; size: number }>('/documents', { method: 'POST', body: formData })
  },
  list: () =>
    api.get<{ documents: { id: string }[] }>('/documents'),
  remove: (id: string) =>
    api.delete<unknown>(`/documents/${id}`),
}

// ==================== Security (MFA & Sessions) ====================
export const securityApi = {
  mfa: {
    setup: () =>
      api.post<{ secret: string; otpauth_url: string }>('/auth/mfa/setup'),
    verify: (token: string, mfaToken?: string) =>
      api.post<{ accessToken?: string; refreshToken?: string }>('/auth/mfa/verify', mfaToken ? { token, mfa_token: mfaToken } : { token }),
    backupCodes: () =>
      api.post<{ backup_codes: string[] }>('/auth/mfa/backup-codes', {}),
    disable: () =>
      api.delete<unknown>('/auth/mfa/disable'),
  },
  sessions: {
    list: () =>
      api.get<{ sessions: { id: string; user_agent: string; ip: string; created_at: string; is_current: boolean }[] }>('/auth/sessions'),
    revoke: (id: string) =>
      api.delete<unknown>(`/auth/sessions/${id}`),
    revokeOthers: () =>
      api.delete<unknown>('/auth/sessions/others'),
  },
}
// ==================== Developer API Keys ====================
export const developerApi = {
  create: (data: { company_id: string; name: string; permissions?: string[]; rate_limit?: number; expires_at?: string }) =>
    api.post<{ id: string; key: string; prefix: string; name: string }>('/developer/keys', data),
  list: (companyId: string) =>
    api.get<{ id: string; company_id: string; name: string; key_prefix: string; permissions: string[]; rate_limit: number; last_used_at: string | null; expires_at: string | null; is_active: boolean; created_at: string }[]>('/developer/keys', { company_id: companyId }),
  rotate: (id: string, data: { company_id: string }) =>
    api.put<{ id: string; key: string; prefix: string; name: string }>(`/developer/keys/${id}/rotate`, data),
  revoke: (id: string, data: { company_id: string }) =>
    api.delete<unknown>(`/developer/keys/${id}`, data),
}

// ==================== Skills ====================
export const skillsApi = {
  list: () =>
    api.get<{ skills: { id: string; name: string; created_at: string }[] }>('/skills'),
  add: (name: string) =>
    api.post<{ id: string; name: string; created_at: string }>('/skills', { name }),
  bulkAdd: (skills: string[]) =>
    api.post<{ added: { id: string; name: string }[]; skipped: string[] }>('/skills/bulk', { skills }),
  remove: (skillId: string) =>
    api.delete<unknown>(`/skills/${skillId}`),
  removeAll: () =>
    api.delete<unknown>('/skills'),
}
