// ── 학기 (기존 types/semester.ts의 Semester 확장) ────────
export interface Semester {
  id: number
  year: number
  term: 'spring' | 'summer' | 'fall' | 'winter'
  start_date: string
  end_date: string
  enroll_start_at: string | null
  enroll_end_at: string | null
  class_start_at: string | null
  class_end_at: string | null
  status: 'planned' | 'enrolling' | 'active' | 'closed'
  offerings_count?: number
  created_at?: string
  updated_at?: string
}

// ── 분반 ──────────────────────────────────────────────
export interface Offering {
  id: number
  course_id: number
  semester_id: number
  tutor_id: number | null
  max_students: number
  current_students: number
  status: 'open' | 'full' | 'closed'
  course: { id: number; title: string; course_type: string; credit_hours: number } | null
  semester: { id: number; year: number; term: string; status: string } | null
  tutor: { id: number; name: string } | null
  enrollments_count?: number
  created_at: string
  updated_at: string
}

export interface OfferingPaginated {
  data: Offering[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

// ── 수강신청 ───────────────────────────────────────────
export interface CbEnrollment {
  id: number
  user_id: number
  course_id: number
  offering_id: number | null
  status: 'pending' | 'paid' | 'studying' | 'completed' | 'failed' | 'withdrawn'
  enrolled_at: string
  completed_at: string | null
  user: { id: number; name: string; email: string } | null
  course: { id: number; title: string; course_type: string } | null
  offering: {
    id: number
    semester: { id: number; year: number; term: string } | null
  } | null
}

export interface CbEnrollmentPaginated {
  data: CbEnrollment[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

// ── 성적 ──────────────────────────────────────────────
export interface AcademicRecord {
  id: number
  enrollment_id: number
  attendance_score: number
  assignment_score: number
  midterm_score: number | null
  final_score: number | null
  total_score: number | null
  final_grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F' | null
  credit_earned: number
  pass_yn: boolean | null
  enrollment: {
    user: { id: number; name: string; email: string } | null
    course: { id: number; title: string; credit_hours: number } | null
    offering: {
      semester: { id: number; year: number; term: string } | null
    } | null
  } | null
  created_at: string
  updated_at: string
}

export interface AcademicRecordPaginated {
  data: AcademicRecord[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

// ── 학점인정 신청 ──────────────────────────────────────
export type CreditAppStatus = 'requested' | 'processing' | 'submitted_to_nile' | 'approved' | 'rejected'

export interface CreditApplication {
  id: number
  user_id: number
  semester_id: number
  applied_at: string
  status: CreditAppStatus
  note: string | null
  nile_submitted_at: string | null
  result_received_at: string | null
  user: { id: number; name: string; email: string } | null
  semester: { id: number; year: number; term: string } | null
  created_at: string
  updated_at: string
}

export interface CreditApplicationPaginated {
  data: CreditApplication[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}
