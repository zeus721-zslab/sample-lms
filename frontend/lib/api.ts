import type { Category, Course, CoursePaginated, CourseListParams } from '@/types/course'
import type { AdminUser, AdminUserPaginated, AdminCategory, AdminCourse, AdminCoursePaginated, AdminLesson, AdminEnrollment } from '@/types/admin'
import type { Semester, Offering, OfferingPaginated, CbEnrollment, CbEnrollmentPaginated, AcademicRecord, AcademicRecordPaginated, CreditApplication, CreditApplicationPaginated, CreditAppStatus } from '@/types/credit-bank'
import type { Enrollment, EnrollmentDetail, Progress } from '@/types/enrollment'
import type { SemesterOfferingsResponse } from '@/types/semester'
import type { AdminExam, AdminExamPaginated, AdminQuestion, AdminAssignment, AdminAssignmentPaginated, GradingExamPaginated, GradingExamDetail, GradingAssignmentPaginated, GradingAssignmentSubmission } from '@/types/admin-assessment'
import type { AdminCertificate, AdminCertificatePaginated, AdminCertificateIssue, AdminCertificateIssuePaginated, AdminVerificationLogPaginated } from '@/types/admin-certificate'
import type { Notice, NoticePaginated, FaqGroup } from '@/types/notice'
import type { Order, AdminOrderPaginated } from '@/types/order'
import type { StatsSummary, EnrollmentTrend, RevenueTrend, TopCourse, SemesterStat, StatsPeriod } from '@/types/stats'
import type {
  ExamDetailResponse,
  ExamListItem,
  ExamStartResponse,
  ExamSubmitResponse,
} from '@/types/exam'
import type {
  AssignmentDetailResponse,
  AssignmentListItem,
  AssignmentSubmitResponse,
} from '@/types/assignment'
import type {
  CertificateIssue,
  CertificateIssueResponse,
  VerificationResult,
} from '@/types/certificate'

// 서버 컴포넌트: API_BASE_URL (내부 Docker 네트워크, 런타임 env)
// 클라이언트 컴포넌트: 상대경로 /api (브라우저는 동일 origin 사용)
const API_URL =
  (typeof window === 'undefined'
    ? process.env.API_BASE_URL
    : undefined) ?? '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** 401 세션 만료 처리 — 순환 의존성 없이 localStorage + window.location 직접 제어 */
function handleSessionExpired(): void {
  if (typeof window === 'undefined') return

  // Zustand persist key 'lms-auth' 삭제 → 스토어 상태 초기화
  try { localStorage.removeItem('lms-auth') } catch {}

  // 현재 경로 기반으로 적절한 로그인 페이지로 이동
  const isAdminPath = window.location.pathname.startsWith('/lms-manage')
  const returnUrl = encodeURIComponent(window.location.pathname)
  const loginBase = isAdminPath ? '/lms-manage/login' : '/login'
  window.location.href = `${loginBase}?reason=session_expired&return_url=${returnUrl}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init ?? {}
  const headersObj = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(initHeaders as Record<string, string> | undefined),
  }

  const res = await fetch(`${API_URL}${path}`, {
    headers: headersObj,
    ...restInit,
  })

  if (res.status === 401) {
    const hasAuth = 'Authorization' in headersObj
    // Authorization 헤더가 있는 요청(인증된 요청)의 401 → 세션 만료 처리
    if (hasAuth && typeof window !== 'undefined') {
      handleSessionExpired()
      // redirect 후 resolve되지 않도록 Promise를 영원히 pending 상태로 유지
      return new Promise(() => {})
    }
    // 로그인 실패(Authorization 없는 401)는 기존대로 ApiError throw
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, error.message ?? '오류가 발생했습니다.')
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new ApiError(res.status, error.message ?? '오류가 발생했습니다.')
  }

  if (res.status === 204) return null as T
  return res.json()
}

export type LmsUser = {
  id: number
  name: string
  email: string
  phone: string | null
  birth_date: string | null
  gender: 'male' | 'female' | 'other' | null
  status: 'active' | 'suspended' | 'withdrawn'
  roles: string[]
}

export const authApi = {
  register(data: {
    name: string
    email: string
    password: string
    password_confirmation: string
    phone?: string
    birth_date?: string
    gender?: string
  }) {
    return request<{ token: string; user: LmsUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  login(data: { email: string; password: string }) {
    return request<{ token: string; user: LmsUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  logout(token: string) {
    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  me(token: string) {
    return request<{ user: LmsUser }>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const categoryApi = {
  list() {
    return request<Category[]>('/categories')
  },
}

export const courseApi = {
  list(params?: CourseListParams) {
    const qs = new URLSearchParams()
    if (params?.type) qs.set('type', params.type)
    if (params?.category) qs.set('category', params.category)
    if (params?.q) qs.set('q', params.q)
    if (params?.page && params.page > 1) qs.set('page', String(params.page))
    const query = qs.toString()
    return request<CoursePaginated>(`/courses${query ? `?${query}` : ''}`)
  },

  detail(slug: string) {
    return request<Course>(`/courses/${slug}`)
  },

  suggest(q: string) {
    return request<string[]>(`/courses/suggest?q=${encodeURIComponent(q)}`)
  },
}

export const enrollmentApi = {
  create(token: string, data: { course_id: number; offering_id?: number }) {
    return request<Enrollment>('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  cancel(token: string, id: number) {
    return request<{ message: string }>(`/enrollments/${id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  myList(token: string) {
    return request<Enrollment[]>('/my/enrollments', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  myDetail(token: string, id: number) {
    return request<EnrollmentDetail>(`/my/enrollments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const semesterApi = {
  list() {
    return request<Semester[]>('/semesters')
  },

  current() {
    return request<Semester | null>('/semesters/current')
  },

  offerings(semesterId: number) {
    return request<SemesterOfferingsResponse>(`/semesters/${semesterId}/offerings`)
  },
}

export const examApi = {
  byCourse(token: string, courseId: number) {
    return request<ExamListItem[]>(`/courses/${courseId}/exams`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  detail(token: string, id: number) {
    return request<ExamDetailResponse>(`/exams/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  start(token: string, id: number) {
    return request<ExamStartResponse>(`/exams/${id}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  submit(token: string, id: number, answers: { question_id: number; answer: string[] }[]) {
    return request<ExamSubmitResponse>(`/exams/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const assignmentApi = {
  byCourse(token: string, courseId: number) {
    return request<AssignmentListItem[]>(`/courses/${courseId}/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  detail(token: string, id: number) {
    return request<AssignmentDetailResponse>(`/assignments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  submit(token: string, id: number, data: { text: string }) {
    return request<AssignmentSubmitResponse>(`/assignments/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const progressApi = {
  heartbeat(
    token: string,
    data: { enrollment_id: number; lesson_id: number; watched_seconds: number },
  ) {
    return request<Progress>('/progress/heartbeat', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const certificateApi = {
  myList(token: string) {
    return request<CertificateIssue[]>('/my/certificates', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  issue(token: string, enrollmentId: number) {
    return request<CertificateIssueResponse>(`/my/enrollments/${enrollmentId}/issue-certificate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  /** PDF 다운로드 — Blob URL 반환 (호출자가 <a> 클릭 트리거 처리) */
  async download(token: string, issueId: number, serialNo: string): Promise<void> {
    const res = await fetch(`${API_URL}/my/certificates/${issueId}/download`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
    })
    if (!res.ok) throw new ApiError(res.status, 'PDF 다운로드 실패')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificate-${serialNo}.pdf`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  },

  verify(token: string) {
    return request<VerificationResult>(`/certificates/verify/${token}`)
  },
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminUserApi = {
  list(token: string, params?: { q?: string; role?: string; status?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.role) qs.set('role', params.role)
    if (params?.status) qs.set('status', params.status)
    if (params?.page && params.page > 1) qs.set('page', String(params.page))
    const query = qs.toString()
    return request<AdminUserPaginated>(`/admin/users${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  show(token: string, id: number) {
    return request<AdminUser>(`/admin/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  update(token: string, id: number, data: { name?: string; phone?: string; status?: string; allow_concurrent_session?: boolean }) {
    return request<AdminUser>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  activate(token: string, id: number) {
    return request<{ message: string; status: string }>(`/admin/users/${id}/activate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  suspend(token: string, id: number) {
    return request<{ message: string; status: string }>(`/admin/users/${id}/suspend`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  syncRoles(token: string, id: number, roles: string[]) {
    return request<{ message: string; roles: AdminUser['roles'] }>(`/admin/users/${id}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roles }),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const adminSystemApi = {
  getSessionPolicy(token: string) {
    return request<import('@/types/admin').SessionPolicy>('/admin/system/session-policy', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  updateSessionPolicy(token: string, enforce: boolean) {
    return request<{ message: string; single_session_enforce: boolean }>('/admin/system/session-policy', {
      method: 'PATCH',
      body: JSON.stringify({ single_session_enforce: enforce }),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const adminCategoryApi = {
  list(token: string) {
    return request<AdminCategory[]>('/admin/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  create(token: string, data: { name: string; parent_id?: number | null; order_no?: number }) {
    return request<AdminCategory>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  update(token: string, id: number, data: { name?: string; parent_id?: number | null; order_no?: number }) {
    return request<AdminCategory>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  destroy(token: string, id: number) {
    return request<{ message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const adminCourseApi = {
  list(token: string, params?: { q?: string; status?: string; course_type?: string; category_id?: number; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.status) qs.set('status', params.status)
    if (params?.course_type) qs.set('course_type', params.course_type)
    if (params?.category_id) qs.set('category_id', String(params.category_id))
    if (params?.page && params.page > 1) qs.set('page', String(params.page))
    const query = qs.toString()
    return request<AdminCoursePaginated>(`/admin/courses${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  show(token: string, id: number) {
    return request<AdminCourse & { lessons: AdminLesson[] }>(`/admin/courses/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  create(token: string, data: Record<string, unknown>) {
    return request<AdminCourse>('/admin/courses', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  update(token: string, id: number, data: Record<string, unknown>) {
    return request<AdminCourse>(`/admin/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  approve(token: string, id: number) {
    return request<AdminCourse>(`/admin/courses/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  close(token: string, id: number) {
    return request<AdminCourse>(`/admin/courses/${id}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  lessons(token: string, courseId: number) {
    return request<AdminLesson[]>(`/admin/courses/${courseId}/lessons`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  createLesson(token: string, courseId: number, data: Record<string, unknown>) {
    return request<AdminLesson>(`/admin/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  updateLesson(token: string, lessonId: number, data: Record<string, unknown>) {
    return request<AdminLesson>(`/admin/lessons/${lessonId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },

  deleteLesson(token: string, lessonId: number) {
    return request<{ message: string; total_lessons: number }>(`/admin/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ── 학기 관리 ─────────────────────────────────────────
export const adminSemesterApi = {
  list(token: string) {
    return request<Semester[]>('/admin/semesters', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  create(token: string, data: Record<string, unknown>) {
    return request<Semester>('/admin/semesters', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  update(token: string, id: number, data: Record<string, unknown>) {
    return request<Semester>(`/admin/semesters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  changeStatus(token: string, id: number, status: string) {
    return request<Semester>(`/admin/semesters/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ── 분반 관리 ─────────────────────────────────────────
export const adminOfferingApi = {
  list(token: string, params?: { semester_id?: number; course_id?: number; status?: string; page?: number }) {
    const q = new URLSearchParams()
    if (params?.semester_id) q.set('semester_id', String(params.semester_id))
    if (params?.course_id) q.set('course_id', String(params.course_id))
    if (params?.status) q.set('status', params.status)
    if (params?.page) q.set('page', String(params.page))
    return request<OfferingPaginated>(`/admin/offerings?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  create(token: string, data: Record<string, unknown>) {
    return request<Offering>('/admin/offerings', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  update(token: string, id: number, data: Record<string, unknown>) {
    return request<Offering>(`/admin/offerings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  destroy(token: string, id: number) {
    return request<{ message: string }>(`/admin/offerings/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ── 수강신청 현황 ──────────────────────────────────────
export const adminEnrollmentApi = {
  list(token: string, params?: { semester_id?: number; offering_id?: number; status?: string; q?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.semester_id) qs.set('semester_id', String(params.semester_id))
    if (params?.offering_id) qs.set('offering_id', String(params.offering_id))
    if (params?.status) qs.set('status', params.status)
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    return request<CbEnrollmentPaginated>(`/admin/enrollments?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  updateStatus(token: string, id: number, status: string) {
    return request<CbEnrollment>(`/admin/enrollments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  withdraw(token: string, id: number) {
    return request<{ message: string }>(`/admin/enrollments/${id}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ── 출석·성적 ──────────────────────────────────────────
export const adminRecordApi = {
  list(token: string, params?: { semester_id?: number; offering_id?: number; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.semester_id) qs.set('semester_id', String(params.semester_id))
    if (params?.offering_id) qs.set('offering_id', String(params.offering_id))
    if (params?.page) qs.set('page', String(params.page))
    return request<AcademicRecordPaginated>(`/admin/records?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  updateScores(token: string, enrollmentId: number, data: Record<string, unknown>) {
    return request<AcademicRecord>(`/admin/records/${enrollmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ── 학점인정 신청 ──────────────────────────────────────
export const adminCreditAppApi = {
  list(token: string, params?: { status?: string; semester_id?: number; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.semester_id) qs.set('semester_id', String(params.semester_id))
    if (params?.page) qs.set('page', String(params.page))
    return request<CreditApplicationPaginated>(`/admin/credit-applications?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  changeStatus(token: string, id: number, data: { status: CreditAppStatus; note?: string; nile_submitted_at?: string; result_received_at?: string }) {
    return request<CreditApplication>(`/admin/credit-applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  exportUrl(token: string, semesterId?: number) {
    const qs = semesterId ? `?semester_id=${semesterId}` : ''
    return `/api/admin/credit-applications/export${qs}`
  },
}

// ── 관리자 시험 ──────────────────────────────────────
export const adminExamApi = {
  list(token: string, params?: { q?: string; course_id?: number; type?: string; status?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.course_id) qs.set('course_id', String(params.course_id))
    if (params?.type) qs.set('type', params.type)
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    return request<AdminExamPaginated>(`/admin/exams?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  create(token: string, data: Partial<AdminExam>) {
    return request<AdminExam>('/admin/exams', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  update(token: string, id: number, data: Partial<AdminExam>) {
    return request<AdminExam>(`/admin/exams/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  destroy(token: string, id: number) {
    return request<{ message: string }>(`/admin/exams/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  },
  questions(token: string, id: number) {
    return request<{ exam: AdminExam; questions: AdminQuestion[] }>(`/admin/exams/${id}/questions`, { headers: { Authorization: `Bearer ${token}` } })
  },
  addQuestion(token: string, examId: number, data: Partial<AdminQuestion>) {
    return request<AdminQuestion>(`/admin/exams/${examId}/questions`, { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  updateQuestion(token: string, id: number, data: Partial<AdminQuestion>) {
    return request<AdminQuestion>(`/admin/questions/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  deleteQuestion(token: string, id: number) {
    return request<{ message: string }>(`/admin/questions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 관리자 과제 ──────────────────────────────────────
export const adminAssignmentApi = {
  list(token: string, params?: { q?: string; course_id?: number; status?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.course_id) qs.set('course_id', String(params.course_id))
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    return request<AdminAssignmentPaginated>(`/admin/assignments?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  create(token: string, data: Partial<AdminAssignment>) {
    return request<AdminAssignment>('/admin/assignments', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  show(token: string, id: number) {
    return request<AdminAssignment>(`/admin/assignments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  update(token: string, id: number, data: Partial<AdminAssignment>) {
    return request<AdminAssignment>(`/admin/assignments/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  destroy(token: string, id: number) {
    return request<{ message: string }>(`/admin/assignments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 채점 ─────────────────────────────────────────────
export const adminGradingApi = {
  examList(token: string, params?: { exam_id?: number; course_id?: number; status?: string; q?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.exam_id) qs.set('exam_id', String(params.exam_id))
    if (params?.course_id) qs.set('course_id', String(params.course_id))
    if (params?.status) qs.set('status', params.status)
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    return request<GradingExamPaginated>(`/admin/grading/exams?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  examShow(token: string, submissionId: number) {
    return request<GradingExamDetail>(`/admin/grading/exams/${submissionId}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  examGrade(token: string, submissionId: number, data: { answers: Array<{ answer_id: number; score: number; feedback?: string }> }) {
    return request<GradingExamDetail>(`/admin/grading/exams/${submissionId}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  assignmentList(token: string, params?: { assignment_id?: number; course_id?: number; graded?: string; q?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.assignment_id) qs.set('assignment_id', String(params.assignment_id))
    if (params?.course_id) qs.set('course_id', String(params.course_id))
    if (params?.graded !== undefined) qs.set('graded', params.graded)
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    return request<GradingAssignmentPaginated>(`/admin/grading/assignments?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  assignmentShow(token: string, submissionId: number) {
    return request<GradingAssignmentSubmission>(`/admin/grading/assignments/${submissionId}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  assignmentGrade(token: string, submissionId: number, data: { score: number; feedback?: string }) {
    return request<GradingAssignmentSubmission>(`/admin/grading/assignments/${submissionId}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 관리자 자격증 마스터 ──────────────────────────────
export const adminCertMasterApi = {
  list(token: string, params?: { q?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    return request<AdminCertificatePaginated>(`/admin/certificates?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  show(token: string, id: number) {
    return request<AdminCertificate>(`/admin/certificates/${id}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  create(token: string, data: Partial<AdminCertificate>) {
    return request<AdminCertificate>('/admin/certificates', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  update(token: string, id: number, data: Partial<AdminCertificate>) {
    return request<AdminCertificate>(`/admin/certificates/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  destroy(token: string, id: number) {
    return request<{ message: string }>(`/admin/certificates/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  },
  syncCourses(token: string, id: number, courseIds: number[]) {
    return request<AdminCertificate>(`/admin/certificates/${id}/courses`, { method: 'POST', body: JSON.stringify({ course_ids: courseIds }), headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 관리자 발급 이력 ──────────────────────────────────
export const adminCertIssueApi = {
  list(token: string, params?: { certificate_id?: number; user_id?: number; status?: string; q?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.certificate_id) qs.set('certificate_id', String(params.certificate_id))
    if (params?.user_id) qs.set('user_id', String(params.user_id))
    if (params?.status) qs.set('status', params.status)
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    return request<AdminCertificateIssuePaginated>(`/admin/certificate-issues?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  revoke(token: string, id: number, reason: string) {
    return request<AdminCertificateIssue>(`/admin/certificate-issues/${id}/revoke`, { method: 'POST', body: JSON.stringify({ reason }), headers: { Authorization: `Bearer ${token}` } })
  },
  manual(token: string, data: { user_id: number; certificate_id: number; enrollment_id?: number }) {
    return request<AdminCertificateIssue>('/admin/certificate-issues/manual', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 진위확인 로그 ─────────────────────────────────────
export const adminCertVerificationApi = {
  list(token: string, params?: { certificate_id?: number; q?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.certificate_id) qs.set('certificate_id', String(params.certificate_id))
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    return request<AdminVerificationLogPaginated>(`/admin/certificate-verifications?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 공지사항 (공개) ──────────────────────────────────
export const noticeApi = {
  list(params?: { q?: string; category?: string; page?: number; per_page?: number }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.category) qs.set('category', params.category)
    if (params?.page) qs.set('page', String(params.page))
    if (params?.per_page) qs.set('per_page', String(params.per_page))
    return request<NoticePaginated>(`/notices?${qs}`)
  },
  show(id: number) {
    return request<Notice>(`/notices/${id}`)
  },
}

// ── FAQ (공개) ────────────────────────────────────────
export const faqApi = {
  list() {
    return request<FaqGroup[]>('/faqs')
  },
}

// ── 채팅 (학습자) ─────────────────────────────────────
export const chatApi = {
  token(authToken: string) {
    return request<{ token: string }>('/chat/token', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } })
  },
  createRoom(authToken: string) {
    return request<{ id: number; type: string; created_at: string }>('/chat/rooms', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } })
  },
  messages(authToken: string, roomId: number) {
    return request<Array<{ id: number; room_id: number; sender_id: string; sender_type: string; message: string; created_at: string }>>(`/chat/rooms/${roomId}/messages`, { headers: { Authorization: `Bearer ${authToken}` } })
  },
  unread(authToken: string) {
    return request<{ unread: number }>('/chat/unread', { headers: { Authorization: `Bearer ${authToken}` } })
  },
}

// ── 관리자 공지사항 ────────────────────────────────────
export const adminNoticeApi = {
  list(token: string, params?: { q?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    if (params?.page) qs.set('page', String(params.page))
    return request<NoticePaginated>(`/admin/notices?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  create(token: string, data: Partial<Notice>) {
    return request<Notice>('/admin/notices', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  update(token: string, id: number, data: Partial<Notice>) {
    return request<Notice>(`/admin/notices/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  delete(token: string, id: number) {
    return request<null>(`/admin/notices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 관리자 FAQ ─────────────────────────────────────────
export const adminFaqApi = {
  list(token: string, params?: { category?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.page) qs.set('page', String(params.page))
    return request<{ data: import('@/types/notice').FaqItem[]; total: number; last_page: number; current_page: number; per_page: number }>(`/admin/faqs?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
  create(token: string, data: Partial<import('@/types/notice').FaqItem>) {
    return request<import('@/types/notice').FaqItem>('/admin/faqs', { method: 'POST', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  update(token: string, id: number, data: Partial<import('@/types/notice').FaqItem>) {
    return request<import('@/types/notice').FaqItem>(`/admin/faqs/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: { Authorization: `Bearer ${token}` } })
  },
  delete(token: string, id: number) {
    return request<null>(`/admin/faqs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 관리자 문의 ────────────────────────────────────────
export type InquiryRoom = {
  id: number
  created_at: string
  last_message: string | null
  last_message_at: string | null
  last_sender_type: string | null
  unread_count: number
  user: { id: number; name: string; email: string } | null
}

export const adminInquiryApi = {
  token(token: string) {
    return request<{ token: string }>('/admin/inquiries/token', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  },
  list(token: string, params?: { q?: string }) {
    const qs = new URLSearchParams()
    if (params?.q) qs.set('q', params.q)
    return request<InquiryRoom[]>(`/admin/inquiries?${qs}`, { headers: { Authorization: `Bearer ${token}` } })
  },
}

// ── 결제·주문 (학습자) ────────────────────────────────
export type OrderCreateResult = {
  free: boolean
  order?: Order
  enrollment: { id: number; course_id: number; status: string }
}

export const orderApi = {
  create(token: string, body: { course_id: number; offering_id?: number }) {
    return request<OrderCreateResult>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  myList(token: string) {
    return request<Order[]>('/orders/my', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  cancel(token: string, id: number) {
    return request<{ message: string }>(`/orders/${id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

// ── 결제·주문 (관리자) ────────────────────────────────
export const adminOrderApi = {
  list(token: string, params?: { status?: string; user_id?: number; date_from?: string; date_to?: string; page?: number }) {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.user_id) qs.set('user_id', String(params.user_id))
    if (params?.date_from) qs.set('date_from', params.date_from)
    if (params?.date_to) qs.set('date_to', params.date_to)
    if (params?.page) qs.set('page', String(params.page))
    return request<AdminOrderPaginated>(`/admin/orders?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  refund(token: string, id: number) {
    return request<{ message: string }>(`/admin/orders/${id}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}

export const adminStatsApi = {
  summary(token: string) {
    return request<StatsSummary>('/admin/stats/summary', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  enrollments(token: string, period: StatsPeriod = 30) {
    return request<EnrollmentTrend[]>(`/admin/stats/enrollments?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  revenue(token: string, period: StatsPeriod = 30) {
    return request<RevenueTrend[]>(`/admin/stats/revenue?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  topCourses(token: string) {
    return request<TopCourse[]>('/admin/stats/courses/top', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  semesters(token: string) {
    return request<SemesterStat[]>('/admin/stats/semesters', {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
