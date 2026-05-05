// ── 관리자 시험 ──────────────────────────────────────
export type AdminExam = {
  id: number
  course_id: number
  course?: { id: number; title: string }
  type: 'quiz' | 'midterm' | 'final' | 'essay'
  title: string
  start_at: string | null
  end_at: string | null
  duration_min: number | null
  pass_score: number
  total_score: number
  shuffle: boolean
  status: 'draft' | 'published' | 'closed'
  questions_count: number
  submissions_count: number
  created_at: string
}

export type AdminExamPaginated = {
  data: AdminExam[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

export type AdminQuestion = {
  id: number
  exam_id: number
  order_no: number
  type: 'single' | 'multiple' | 'short' | 'essay'
  body: string
  choices: string[] | null
  correct_answer: string[] | null
  score: number
  created_at?: string
}

// ── 관리자 과제 ──────────────────────────────────────
export type AdminAssignment = {
  id: number
  course_id: number
  course?: { id: number; title: string }
  title: string
  description: string | null
  due_at: string | null
  max_score: number
  status: 'draft' | 'published' | 'closed'
  submissions_count: number
  created_at: string
}

export type AdminAssignmentPaginated = {
  data: AdminAssignment[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

// ── 채점 ─────────────────────────────────────────────
export type GradingExamSubmission = {
  id: number
  user: { id: number; name: string; email: string }
  exam: {
    id: number
    title: string
    type: string
    pass_score: number
    course_id: number
    course?: { id: number; title: string }
  }
  status: 'in_progress' | 'submitted' | 'graded'
  total_score: number | null
  pass_yn: boolean | null
  started_at: string
  submitted_at: string | null
}

export type GradingExamPaginated = {
  data: GradingExamSubmission[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

export type GradingExamDetail = {
  id: number
  user: { id: number; name: string; email: string }
  exam: {
    id: number
    title: string
    pass_score: number
    questions: AdminQuestion[]
  }
  status: string
  total_score: number | null
  pass_yn: boolean | null
  answers: Array<{
    id: number
    question_id: number
    answer: string[]
    score: number | null
    graded_at: string | null
    question: AdminQuestion
  }>
}

export type GradingAssignmentSubmission = {
  id: number
  user: { id: number; name: string; email: string }
  assignment: {
    id: number
    title: string
    max_score: number
    course_id: number
    course?: { id: number; title: string }
  }
  text: string | null
  file_path: string | null
  submitted_at: string
  score: number | null
  feedback: string | null
  graded_at: string | null
}

export type GradingAssignmentPaginated = {
  data: GradingAssignmentSubmission[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}
