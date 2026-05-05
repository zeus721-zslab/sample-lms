import Link from 'next/link'
import { CalendarDays, ChevronRight, Clock } from 'lucide-react'
import { semesterApi } from '@/lib/api'
import type { Semester, SemesterStatus, SemesterTerm } from '@/types/semester'
import { SemesterDday } from './SemesterDday'

export const dynamic = 'force-dynamic'

const TERM_LABEL: Record<SemesterTerm, string> = {
  spring: '봄학기',
  summer: '하계학기',
  fall: '가을학기',
  winter: '동계학기',
}

const STATUS_LABEL: Record<SemesterStatus, string> = {
  planned: '예정',
  enrolling: '수강신청 중',
  active: '수업 중',
  closed: '종료',
}

const STATUS_COLOR: Record<SemesterStatus, string> = {
  planned: 'bg-muted text-muted-foreground',
  enrolling: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-muted text-muted-foreground',
}

const STATUS_BORDER: Record<SemesterStatus, string> = {
  planned: 'border-border/60',
  enrolling: 'border-blue-400 dark:border-blue-600',
  active: 'border-green-400 dark:border-green-600',
  closed: 'border-border/40',
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

function formatDateFull(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default async function SemestersPage() {
  let semesters: Semester[] = []
  try {
    semesters = await semesterApi.list()
  } catch {
    semesters = []
  }

  const enrolling = semesters.find((s) => s.status === 'enrolling')
  const active = semesters.find((s) => s.status === 'active')
  const hero = enrolling ?? active

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">학사일정</h1>
        <p className="text-sm text-muted-foreground">학점은행제 강좌는 학기별로 개설·운영됩니다.</p>
      </div>

      {/* 현재 수강신청 중인 학기 히어로 카드 */}
      {hero && (
        <div className={`rounded-xl border-2 p-6 mb-8 ${STATUS_BORDER[hero.status]} bg-card`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[hero.status]}`}>
                  {STATUS_LABEL[hero.status]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {hero.year}학년도 {TERM_LABEL[hero.term]}
                </span>
              </div>
              <h2 className="text-xl font-bold">{hero.year} {TERM_LABEL[hero.term]}</h2>
              {hero.enroll_start_at && hero.enroll_end_at && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    수강신청: {formatDate(hero.enroll_start_at)} ~ {formatDate(hero.enroll_end_at)}
                  </span>
                  {/* D-day 클라이언트 컴포넌트 */}
                  {hero.status === 'enrolling' && <SemesterDday endAt={hero.enroll_end_at} />}
                </div>
              )}
              {hero.class_start_at && hero.class_end_at && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    수업기간: {formatDate(hero.class_start_at)} ~ {formatDate(hero.class_end_at)}
                  </span>
                </div>
              )}
            </div>
            {hero.status === 'enrolling' && (
              <Link
                href={`/semesters/${hero.id}/offerings`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
              >
                수강신청 바로가기 <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 전체 학기 타임라인 */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">전체 학기</h2>
        {semesters.map((s) => (
          <div
            key={s.id}
            className={`rounded-lg border p-4 bg-card transition-all ${
              s.status === 'closed' ? 'opacity-60' : ''
            } ${STATUS_BORDER[s.status]}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3">
                {/* 상태 인디케이터 */}
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                  s.status === 'enrolling' ? 'bg-blue-500' :
                  s.status === 'active' ? 'bg-green-500' :
                  s.status === 'planned' ? 'bg-amber-400' :
                  'bg-muted-foreground/30'
                }`} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{s.year} {TERM_LABEL[s.term]}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_COLOR[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {s.enroll_start_at && s.enroll_end_at && (
                      <p>수강신청: {formatDateFull(s.enroll_start_at)} ~ {formatDateFull(s.enroll_end_at)}</p>
                    )}
                    <p>수업기간: {formatDateFull(s.class_start_at)} ~ {formatDateFull(s.class_end_at)}</p>
                  </div>
                </div>
              </div>
              {(s.status === 'enrolling' || s.status === 'active') && (
                <Link
                  href={`/semesters/${s.id}/offerings`}
                  className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0"
                >
                  개설강좌 보기 <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
