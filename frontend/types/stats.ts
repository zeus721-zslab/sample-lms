export type StatsSummary = {
  total_users: number
  today_users: number
  total_enrollments: number
  completion_rate: number
  total_revenue: number
  total_certificates: number
}

export type EnrollmentTrend = {
  date: string
  count: number
}

export type RevenueTrend = {
  date: string
  total: number
}

export type TopCourse = {
  id: number
  title: string
  course_type: string
  status: string
  category_name: string | null
  enrollment_count: number
}

export type SemesterStat = {
  id: number
  year: number
  term: string
  status: string
  enroll_start_at: string | null
  enroll_end_at: string | null
  offering_count: number
  enrollment_count: number
  completed_count: number
}

export type StatsPeriod = 7 | 30 | 90
