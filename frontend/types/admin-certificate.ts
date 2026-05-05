// ── 자격증 마스터 ─────────────────────────────────────
export type AdminCertificate = {
  id: number
  code: string
  name: string
  issuer: string | null
  template_path: string | null
  required_pass_yn: boolean
  courses_count: number
  issues_count: number
  courses?: Array<{ id: number; title: string; slug: string }>
  created_at?: string
}

export type AdminCertificatePaginated = {
  data: AdminCertificate[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

// ── 발급 이력 ─────────────────────────────────────────
export type AdminCertificateIssue = {
  id: number
  user: { id: number; name: string; email: string }
  certificate: { id: number; name: string; code: string }
  enrollment_id: number | null
  serial_no: string
  verify_token: string
  issued_at: string
  expires_at: string | null
  status: 'active' | 'revoked'
  revoked_at: string | null
  revoked_reason: string | null
  // 진위확인 로그에서 추가
  latest_verified_at?: string | null
  latest_verifier_ip?: string | null
  verifications_count?: number
}

export type AdminCertificateIssuePaginated = {
  data: AdminCertificateIssue[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}

// 진위확인 로그는 AdminCertificateIssue에 verifications_count 포함
export type AdminVerificationLog = AdminCertificateIssue & {
  verifications_count: number
  latest_verified_at: string | null
  latest_verifier_ip: string | null
}

export type AdminVerificationLogPaginated = {
  data: AdminVerificationLog[]
  total: number
  current_page: number
  last_page: number
  per_page: number
}
