export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  location?: string | null
  bio?: string | null
  role: 'jobseeker' | 'recruiter' | 'seeker' | 'employer' | 'admin'
  avatar: string | null
  mfa_enabled: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface Job {
  id: string
  title: string
  description: string
  requirements: string[]
  benefits: string[]
  job_type: string
  experience_level: string
  location_type: 'remote' | 'on-site' | 'onsite' | 'hybrid'
  location_city: string | null
  salary_min: number | null
  salary_max: number | null
  is_salary_visible: boolean | null
  status: 'active' | 'open' | 'closed' | 'draft'
  company_id: string
  category_id: string
  created_at?: string
  updated_at?: string
  company?: {
    id: string
    name: string
    logo_url: string | null
    location: string
    industry: string
    description?: string
    website?: string | null
  }
  category?: {
    id: string
    name: string
  }
  is_bookmarked?: boolean
}

export interface Company {
  id: string
  name: string
  description: string
  logo_url: string | null
  location: string
  website: string | null
  industry: string
  company_size: string
  address: string | null
  phone: string | null
  email: string | null
  founded_year: number | null
  is_verified: boolean
  user_id?: string
  created_at: string
  job_count?: number
}

export interface Application {
  id: string
  user_id: string
  job_id: string
  status: 'pending' | 'under_review' | 'interview' | 'accepted' | 'rejected'
  created_at?: string
  applied_at?: string
  updated_at: string
  ats_score?: number | null
  atsScore?: number | null
  match_score?: number | null
  matchScore?: number | null
  score?: number | null
  document_id?: string | null
  documentId?: string | null
  document?: { id?: string; filename?: string; originalName?: string; url?: string | null } | null
  resume_url?: string | null
  cv_url?: string | null
  skills?: string[] | null
  education?: string | null
  experience?: string | number | null
  job?: Job
  user?: User
}

export interface Interview {
  id: string
  application_id: string
  company_id: string
  user_id: string
  job_id: string
  scheduled_at: string
  duration_minutes: number
  timezone: string
  interview_type: 'video' | 'phone' | 'in-person'
  location: string | null
  meeting_link: string | null
  meeting_platform: string | null
  notes: string | null
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  created_at: string
  job?: Job
  company?: Company
  applicant?: User
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'application' | 'interview' | 'system' | 'message'
  is_read: boolean
  created_at: string
  action_url: string | null
}

export interface Category {
  id: string
  name: string
  icon?: string
  job_count?: number
}

export interface Bookmark {
  id: string
  bookmark_id?: string
  user_id: string
  job_id: string
  created_at: string
  job?: Job
}

export interface ATSAnalysis {
  id: string
  user_id: string
  document_id: string
  skills: string[]
  match_score: number
  suggestions: string[]
  created_at: string
}

export interface NotificationPreferences {
  email_application: boolean
  email_interview: boolean
  push_application: boolean
  push_interview: boolean
  websocket_enabled: boolean
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages?: number
  total_pages: number
}

export interface ApiResponse<T> {
  status: string
  message: string
  data: T
  meta?: PaginationMeta
}
