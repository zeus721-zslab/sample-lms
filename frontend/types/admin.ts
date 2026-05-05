export interface AdminUser {
  id: number
  name: string
  email: string
  phone: string | null
  status: 'active' | 'suspended' | 'withdrawn'
  allow_concurrent_session: boolean
  roles: Array<{ id: number; code: string; name: string }>
  enrollments_count: number
  enrollments?: AdminEnrollment[]
  created_at: string
  updated_at: string
}

export interface SessionPolicy {
  single_session_enforce: boolean
  exceptions: AdminUser[]
}

export interface AdminUserPaginated {
  data: AdminUser[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface AdminCategory {
  id: number
  name: string
  slug: string
  code: string
  parent_id: number | null
  order_no: number
  courses_count: number
  children: AdminCategory[]
}

export interface AdminCourse {
  id: number
  title: string
  slug: string
  course_type: 'certificate' | 'credit_bank'
  status: 'draft' | 'published' | 'closed'
  mode: 'semester' | 'ondemand'
  price: number
  credit_hours: number
  total_lessons: number
  enrollments_count: number
  category: { id: number; name: string } | null
  instructor: { id: number; name: string } | null
  created_at: string
}

export interface AdminCoursePaginated {
  data: AdminCourse[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface AdminEnrollment {
  id: number
  status: 'pending' | 'studying' | 'completed' | 'withdrawn'
  progress_pct: number
  course: { id: number; title: string; course_type: string; status: string } | null
  created_at: string
}

export interface AdminLesson {
  id: number
  chapter: number
  order_no: number
  title: string
  video_url: string | null
  duration_sec: number
  created_at: string
}
