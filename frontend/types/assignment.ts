export type AssignmentStatus = 'draft' | 'published' | 'closed'

export type Assignment = {
  id: number
  course_id: number
  title: string
  description: string | null
  due_at: string
  max_score: number
  status: AssignmentStatus
}

export type AssignmentSubmission = {
  id: number
  text: string | null
  submitted_at: string
  score: number | null
  feedback: string | null
  graded_at: string | null
}

export type AssignmentDetailResponse = {
  assignment: Assignment
  can_submit: boolean
  submission: AssignmentSubmission | null
}

export type AssignmentSubmitResponse = {
  id: number
  assignment_id: number
  submitted_at: string
  message: string
}

export type AssignmentListItem = {
  id: number
  title: string
  due_at: string
  max_score: number
  can_submit: boolean
  submission: {
    id: number
    submitted_at: string
    score: number | null
    graded_at: string | null
  } | null
}
