export type CertificateStatus = 'active' | 'revoked' | 'expired'

export type CertificateIssue = {
  id: number
  serial_no: string
  certificate_code: string
  certificate_name: string
  issuer: string
  issued_at: string
  expires_at: string | null
  status: CertificateStatus
  verify_token: string
}

export type CertificateIssueResponse = {
  id: number
  serial_no: string
  verify_token: string
  issued_at: string
  expires_at: string | null
  status: CertificateStatus
}

export type VerificationIssue = {
  serial_no: string
  certificate_name: string
  issuer: string
  recipient_name: string
  issued_at: string
  expires_at: string | null
  status: CertificateStatus
}

export type VerificationResult =
  | { valid: true; issue: VerificationIssue }
  | { valid: false; reason: string; issue?: VerificationIssue }
