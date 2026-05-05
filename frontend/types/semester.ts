import type { Course } from './course'

export type SemesterStatus = 'planned' | 'enrolling' | 'active' | 'closed'
export type SemesterTerm = 'spring' | 'summer' | 'fall' | 'winter'
export type OfferingStatus = 'open' | 'full' | 'closed'

export type Semester = {
  id: number
  year: number
  term: SemesterTerm
  start_date: string
  end_date: string
  enroll_start_at: string | null
  enroll_end_at: string | null
  class_start_at: string | null
  class_end_at: string | null
  status: SemesterStatus
}

export type CourseOffering = {
  id: number
  course_id: number
  semester_id: number
  tutor: { id: number; name: string } | null
  max_students: number
  current_students: number
  remaining: number
  status: OfferingStatus
  course: Pick<Course, 'id' | 'title' | 'slug' | 'credit_hours' | 'thumbnail' | 'price'>
}

export type SemesterOfferingsResponse = {
  semester: Semester
  offerings: CourseOffering[]
}
