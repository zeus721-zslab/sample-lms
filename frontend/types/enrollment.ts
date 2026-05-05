import type { Course } from './course'
import type { Semester, OfferingStatus } from './semester'

export type EnrollmentStatus = 'pending' | 'studying' | 'completed' | 'withdrawn'

export type Lesson = {
  id: number
  course_id: number
  chapter: number
  order_no: number
  title: string
  video_url: string | null
  duration_sec: number
}

export type Progress = {
  id: number
  enrollment_id: number
  lesson_id: number
  watched_seconds: number
  progress_pct: number
  completed_at: string | null
  updated_at: string
}

export type EnrollmentOffering = {
  id: number
  course_id: number
  semester_id: number
  max_students: number
  current_students: number
  status: OfferingStatus
  semester: Semester
}

export type Enrollment = {
  id: number
  user_id: number
  course_id: number
  offering_id: number | null
  status: EnrollmentStatus
  enrolled_at: string
  completed_at: string | null
  course: Pick<Course, 'id' | 'title' | 'slug' | 'course_type' | 'thumbnail' | 'price' | 'total_lessons'>
  offering?: EnrollmentOffering | null
}

export type EnrollmentDetail = Enrollment & {
  course: Pick<Course, 'id' | 'title' | 'slug' | 'course_type' | 'thumbnail' | 'price' | 'total_lessons'> & {
    lessons: Lesson[]
  }
  progresses: Progress[]
}
