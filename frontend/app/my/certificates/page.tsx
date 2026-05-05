'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Award,
  Download,
  Link2,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/auth'
import { certificateApi, enrollmentApi, ApiError } from '@/lib/api'
import type { CertificateIssue } from '@/types/certificate'
import type { Enrollment } from '@/types/enrollment'

function calcDday(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return '만료됨'
  const days = Math.ceil(diff / 86_400_000)
  return days <= 30 ? `D-${days}` : ''
}

function maskName(name: string): string {
  if (name.length <= 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

const STATUS_CONFIG = {
  active:  { label: '유효',   icon: CheckCircle2,    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  revoked: { label: '취소됨', icon: XCircle,         cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  expired: { label: '만료됨', icon: Clock,           cls: 'bg-muted text-muted-foreground' },
}

export default function MyCertificatesPage() {
  const router = useRouter()
  const { token, user, isLoaded } = useAuthStore()

  const [certificates, setCertificates] = useState<CertificateIssue[]>([])
  const [issuableEnrollments, setIssuableEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [issuing, setIssuing] = useState<number | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)

  const load = useCallback(async (tkn: string) => {
    try {
      const [certs, enrollments] = await Promise.all([
        certificateApi.myList(tkn),
        enrollmentApi.myList(tkn),
      ])
      setCertificates(certs)
      // completed 상태이고 자격증 코스인데 아직 미발급인 enrollment 필터
      const issuedEnrollmentIds = new Set<number>() // 이미 발급된 enrollment는 API가 반환하지 않으므로 코스 기준으로 판단
      const issuedCertCodes = new Set(certs.map((c) => c.certificate_code))
      const issuable = enrollments.filter(
        (e) =>
          e.status === 'completed' &&
          e.course.course_type === 'certificate',
      )
      setIssuableEnrollments(issuable)
    } catch {
      toast.error('자격증 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return
    if (!token) { router.replace('/login'); return }
    load(token)
  }, [isLoaded, token, load, router])

  const handleIssue = async (enrollmentId: number) => {
    if (!token) return
    setIssuing(enrollmentId)
    try {
      await certificateApi.issue(token, enrollmentId)
      toast.success('자격증이 발급되었습니다!')
      await load(token)
    } catch (e) {
      if (e instanceof ApiError) {
        const msg = e.message.includes('EXAM_NOT_PASSED')
          ? '시험에 합격해야 자격증을 발급받을 수 있습니다.'
          : e.message
        toast.error(msg)
      } else {
        toast.error('발급 중 오류가 발생했습니다.')
      }
    } finally {
      setIssuing(null)
    }
  }

  const handleDownload = async (cert: CertificateIssue) => {
    if (!token) return
    setDownloading(cert.id)
    try {
      await certificateApi.download(token, cert.id, cert.serial_no)
    } catch {
      toast.error('PDF 다운로드에 실패했습니다.')
    } finally {
      setDownloading(null)
    }
  }

  const handleCopyVerifyLink = async (token_: string) => {
    const url = `${window.location.origin}/verify/${token_}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('진위확인 링크가 복사되었습니다.')
    } catch {
      toast.error('클립보드 복사에 실패했습니다.')
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          내 자격증
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          수료 과정에서 취득한 자격증을 확인하고 다운로드하세요.
        </p>
      </div>

      {/* 발급 가능한 수료 코스 */}
      {issuableEnrollments.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            발급 가능한 자격증
          </h2>
          <div className="space-y-3">
            {issuableEnrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 px-5 py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{enrollment.course.title}</p>
                    <p className="text-xs text-muted-foreground">수강 완료 · 자격증 발급 대기</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleIssue(enrollment.id)}
                  disabled={issuing === enrollment.id}
                  className="shrink-0"
                >
                  {issuing === enrollment.id
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />발급 중</>
                    : <><Award className="h-3.5 w-3.5 mr-1.5" />자격증 발급</>
                  }
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 발급된 자격증 목록 */}
      <section>
        <h2 className="text-base font-semibold mb-3">취득 자격증</h2>

        {certificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-border">
            <Award className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">아직 취득한 자격증이 없습니다.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              자격증 과정을 수료하고 시험에 합격하면 자격증이 발급됩니다.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link href="/courses?type=certificate">자격증 과정 보기 <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {certificates.map((cert) => {
              const cfg = STATUS_CONFIG[cert.status] ?? STATUS_CONFIG.active
              const StatusIcon = cfg.icon
              const dday = calcDday(cert.expires_at)
              const isExpiringSoon = dday && dday !== '만료됨'

              return (
                <div
                  key={cert.id}
                  className="relative rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* 상단 컬러 바 */}
                  <div className={`h-1 w-full ${cert.status === 'active' ? 'bg-primary' : cert.status === 'revoked' ? 'bg-destructive' : 'bg-muted'}`} />

                  <div className="p-5 space-y-4">
                    {/* 자격증명 + 상태 */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">{cert.issuer}</p>
                        <h3 className="text-sm font-semibold leading-snug">{cert.certificate_name}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* 메타 정보 */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>일련번호</span>
                        <span className="font-mono font-medium text-foreground">{cert.serial_no}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>발급일</span>
                        <span className="font-medium text-foreground">
                          {new Date(cert.issued_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {cert.expires_at && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>유효기간</span>
                          <span className={`font-medium ${isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
                            {new Date(cert.expires_at).toLocaleDateString('ko-KR')}
                            {isExpiringSoon && <span className="ml-1.5 text-[10px] font-semibold">{dday}</span>}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 만료 경고 */}
                    {isExpiringSoon && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        유효기간이 {dday.replace('D-', '')}일 후 만료됩니다.
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    {cert.status === 'active' && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                          onClick={() => handleDownload(cert)}
                          disabled={downloading === cert.id}
                        >
                          {downloading === cert.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Download className="h-3.5 w-3.5" />
                          }
                          PDF 다운로드
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                          onClick={() => handleCopyVerifyLink(cert.verify_token)}
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          진위확인 링크
                        </Button>
                      </div>
                    )}

                    {/* 진위확인 페이지 링크 */}
                    <Link
                      href={`/verify/${cert.verify_token}`}
                      className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      진위확인 페이지 보기 <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
