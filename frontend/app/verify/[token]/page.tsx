'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldX,
  GraduationCap,
  Loader2,
  Clock,
  ArrowLeft,
} from 'lucide-react'
import { certificateApi } from '@/lib/api'
import type { VerificationResult } from '@/types/certificate'

function maskName(name: string): string {
  if (name.length <= 1) return name
  if (name.length === 2) return name[0] + '*'
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

const STATUS_MAP = {
  active:  { label: '유효',   cls: 'text-green-700 dark:text-green-400',   bg: 'bg-green-100 dark:bg-green-900/30' },
  revoked: { label: '취소됨', cls: 'text-red-700 dark:text-red-400',       bg: 'bg-red-100 dark:bg-red-900/30' },
  expired: { label: '만료됨', cls: 'text-muted-foreground',                bg: 'bg-muted' },
}

export default function VerifyTokenPage() {
  const { token } = useParams<{ token: string }>()
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const verifiedAt = new Date().toLocaleString('ko-KR')

  useEffect(() => {
    if (!token) return
    certificateApi.verify(token)
      .then(setResult)
      .catch(() => setResult({ valid: false, reason: 'NOT_FOUND' }))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">자격증 진위확인 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* 공식 헤더 */}
      <header className="border-b border-border/60 bg-background">
        <div className="container mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm tracking-tight">zslab Academy</span>
          </Link>
          <span className="text-xs text-muted-foreground">자격증 진위확인 시스템</span>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-10 space-y-6">

        {/* 결과 헤더 카드 */}
        <div className={`rounded-2xl border-2 p-8 text-center ${
          result?.valid
            ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
            : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
        }`}>
          <div className="flex justify-center mb-4">
            {result?.valid
              ? <ShieldCheck className="h-16 w-16 text-green-500" />
              : <ShieldX className="h-16 w-16 text-red-400" />
            }
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${result?.valid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
            {result?.valid ? '유효한 자격증입니다' : '유효하지 않은 자격증입니다'}
          </h1>
          <p className={`text-sm ${result?.valid ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
            {result?.valid
              ? 'zslab Academy에서 발급한 정상적인 자격증으로 확인되었습니다.'
              : result?.reason === 'REVOKED'
                ? '취소 처리된 자격증입니다.'
                : result?.reason === 'EXPIRED'
                  ? '유효기간이 만료된 자격증입니다.'
                  : '해당 토큰으로 등록된 자격증을 찾을 수 없습니다.'
            }
          </p>
        </div>

        {/* 자격증 상세 정보 */}
        {result?.issue && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* 카드 헤더 */}
            <div className="border-b border-border/60 bg-muted/40 px-6 py-4">
              <h2 className="text-base font-semibold">자격증 정보</h2>
            </div>

            {/* 정보 테이블 */}
            <div className="divide-y divide-border/60">
              <InfoRow label="자격증명" value={result.issue.certificate_name} highlight />
              <InfoRow label="발급기관" value={result.issue.issuer} />
              <InfoRow
                label="수여자"
                value={
                  <span className="flex items-center gap-2">
                    {maskName(result.issue.recipient_name)}
                    <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">이름 마스킹 적용</span>
                  </span>
                }
              />
              <InfoRow label="일련번호" value={<span className="font-mono text-sm font-medium">{result.issue.serial_no}</span>} />
              <InfoRow label="발급일" value={formatDate(result.issue.issued_at)} />
              {result.issue.expires_at && (
                <InfoRow label="유효기간 만료일" value={formatDate(result.issue.expires_at)} />
              )}
              <InfoRow
                label="자격증 상태"
                value={
                  (() => {
                    const cfg = STATUS_MAP[result.issue.status] ?? STATUS_MAP.expired
                    return (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.cls}`}>
                        {result.issue.status === 'active'
                          ? <CheckCircle2 className="h-3.5 w-3.5" />
                          : result.issue.status === 'revoked'
                            ? <XCircle className="h-3.5 w-3.5" />
                            : <Clock className="h-3.5 w-3.5" />
                        }
                        {cfg.label}
                      </span>
                    )
                  })()
                }
              />
            </div>
          </div>
        )}

        {/* 진위확인 메타 정보 */}
        <div className="rounded-xl border border-border bg-card px-6 py-4 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">확인 이력</h3>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div>
              <p className="text-foreground font-medium mb-0.5">확인 일시</p>
              <p>{verifiedAt}</p>
            </div>
            <div>
              <p className="text-foreground font-medium mb-0.5">확인 코드</p>
              <p className="font-mono truncate">{token}</p>
            </div>
          </div>
        </div>

        {/* 안내 문구 */}
        <div className="rounded-xl border border-border/60 bg-muted/30 px-6 py-4 space-y-1.5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground text-sm">안내사항</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>본 페이지는 zslab Academy에서 발급한 자격증의 진위를 공식적으로 확인하는 시스템입니다.</li>
            <li>자격증의 QR 코드를 스캔하거나 고유 확인 코드로 진위를 조회할 수 있습니다.</li>
            <li>유효기간이 만료되었거나 취소된 자격증은 효력이 없습니다.</li>
            <li>문의: contact@zslab.kr</li>
          </ul>
        </div>

        {/* 하단 액션 */}
        <div className="flex items-center justify-between">
          <Link href="/verify" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            다른 자격증 확인
          </Link>
          <Link href="/" className="text-sm text-primary hover:underline">
            zslab Academy 홈
          </Link>
        </div>
      </main>

      {/* 공식 푸터 */}
      <footer className="border-t border-border/60 bg-background mt-10">
        <div className="container mx-auto max-w-7xl px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} zslab Academy. 자격증 진위확인 시스템
        </div>
      </footer>
    </div>
  )
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-center px-6 py-3.5 gap-4">
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm flex-1 ${highlight ? 'font-semibold text-foreground' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  )
}
