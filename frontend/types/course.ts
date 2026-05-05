export type Category = {
  id: number
  parent_id: number | null
  code: string
  name: string
  slug: string
  order_no: number
}

export type CourseType = 'credit_bank' | 'certificate'
export type CourseMode = 'semester' | 'ondemand'

export type Course = {
  id: number
  course_type: CourseType
  category_id: number
  title: string
  slug: string
  description: string
  thumbnail: string | null
  credit_hours: number | null
  total_lessons: number
  price: number
  instructor_id: number | null
  mode: CourseMode
  category: Pick<Category, 'id' | 'code' | 'name' | 'slug'>
  instructor: { id: number; name: string } | null
}

export type CoursePaginated = {
  data: Course[]
  total: number
  per_page: number
  current_page: number
  last_page: number
  from: number | null
  to: number | null
}

export type CourseListParams = {
  type?: CourseType | ''
  category?: string
  q?: string
  page?: number
}
