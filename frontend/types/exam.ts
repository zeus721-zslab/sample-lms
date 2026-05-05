export type ExamType = 'midterm' | 'final' | 'quiz'
export type ExamStatus = 'draft' | 'published' | 'closed'
export type QuestionType = 'single' | 'multiple' | 'short' | 'essay'
export type SubmissionStatus = 'in_progress' | 'submitted' | 'graded'

export type Exam = {
  id: number
  course_id: number
  type: ExamType
  title: string
  duration_min: number
  pass_score: number
  total_score: number
  shuffle: boolean
  status: ExamStatus
  start_at: string | null
  end_at: string | null
}

export type ExamQuestion = {
  id: number
  order_no: number
  type: QuestionType
  body: string
  choices: string[] | null
  score: number
  correct_answer?: string[] | null  // 결과 조회 시에만 포함될 수 있음
}

export type ExamSubmission = {
  id: number
  status: SubmissionStatus
  total_score: number | null
  pass_yn: boolean | null
  started_at: string
  submitted_at: string | null
}

export type ExamAnswer = {
  question_id: number
  answer: string[]
  score: number | null
}

export type ExamDetailResponse = {
  exam: Exam
  can_start: boolean
  submission: ExamSubmission | null
}

export type ExamStartResponse = {
  submission_id: number
  started_at: string
  exam: Exam
  questions: ExamQuestion[]
}

export type ExamSubmitResponse = {
  submission_id: number
  status: SubmissionStatus
  total_score: number
  pass_score: number
  pass_yn: boolean
  submitted_at: string
}

export type ExamListItem = {
  id: number
  type: ExamType
  title: string
  duration_min: number
  pass_score: number
  total_score: number
  questions_count: number
  start_at: string | null
  end_at: string | null
  is_open: boolean
  submission: ExamSubmission | null
}
