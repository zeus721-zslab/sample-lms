'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, Loader2, BookOpen, CalendarDays, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'
import { enrollmentApi, ApiError } from '@/lib/api'
import type { Enrollment, EnrollmentStatus } from '@/types/enrollment'

const STATUS_LABEL: Record<EnrollmentStatus, string> = {
  pending: '결제 대기',
  studying: '학습 중',
  completed: '완료',
  withdrawn: '취소',
}

const STATUS_COLOR: Record<EnrollmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  studying: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  withdrawn: 'bg-muted text-muted-foreground',
}

type Tab = 'all' | 'studying' | 'completed' | 'credit_bank'

export default function MyCoursesPage() {
  const router = useRouter()
  const { token, isLoaded } = useAuthStore()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    if (!isLoaded) return
    if (!token) { router.replace('/login'); return }

    enrollmentApi.myList(token).then((list) => {
      setEnrollments(list.filter((e) => e.status !== 'withdrawn'))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [isLoaded, token, router])

  const handleCancel = async (id: number) => {
    if (!token) return
    if (!confirm('수강신청을 취소하시겠습니까?')) return
    try {
      await enrollmentApi.cancel(token, id)
      setEnrollments((prev) => prev.filter((e) => e.id !== id))
      toast.success('수강신청이 취소되었습니다.')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '취소 중 오류가 발생했습니다.')
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const creditBankCount = enrollments.filter((e) => e.course.course_type === 'credit_bank').length

  const filtered = enrollments.filter((e) => {
    if (tab === 'studying') return (e.status === 'studying' || e.status === 'pending') && e.course.course_type !== 'credit_bank'
    if (tab === 'completed') return e.status === 'completed' && e.course.course_type !== 'credit_bank'
    if (tab === 'credit_bank') return e.course.course_type === 'credit_bank'
    return true
  })

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'all', label: '전체' },
    { key: 'studying', label: '학습 중' },
    { key: 'completed', label: '완료' },
    ...(creditBankCount > 0 ? [{ key: 'credit_bank' as Tab, label: '학점은행', count: creditBankCount }] : []),
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">내 강의실</h1>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b border-border/60">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            {t.count != null ? (
              <span className="ml-1.5 text-xs text-muted-foreground">({t.count})</span>
            ) : tab === t.key ? (
              <span className="ml-1.5 text-xs text-muted-foreground">({filtered.length})</span>
            ) : null}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
          <BookOpen className="h-12 w-12 opacity-30" />
          <p className="text-sm">
            {tab === 'credit_bank' ? '수강신청한 학점은행제 강좌가 없습니다.' : '수강 중인 강좌가 없습니다.'}
          </p>
          <Link
            href={tab === 'credit_bank' ? '/semesters' : '/courses'}
            className="text-sm text-primary hover:underline"
          >
            {tab === 'credit_bank' ? '학사일정 보기' : '강좌 둘러보기'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <EnrollmentCard key={e.id} enrollment={e} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  )
}

function EnrollmentCard({
  enrollment: e,
  onCancel,
}: {
  enrollment: Enrollment
  onCancel: (id: number) => void
}) {
  const isCreditBank = e.course.course_type === 'credit_bank'
  const canCancel = isCreditBank && (e.status === 'pending' || e.status === 'studying')

  return (
    <div className="group relative rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all overflow-hidden">
      <Link href={`/my/courses/${e.id}`} className="block">
        {/* 썸네일 */}
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          {e.course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={e.course.thumbnail}
              alt={e.course.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <GraduationCap className="h-10 w-10 text-primary/25" />
            </div>
          )}
          {/* 상태 뱃지 */}
          <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[e.status]}`}>
            {STATUS_LABEL[e.status]}
          </span>
          {/* 학점은행 뱃지 */}
          {isCreditBank && (
            <span className="absolute top-2 left-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              학점은행
            </span>
          )}
        </div>

        {/* 정보 */}
        <div className="p-4 space-y-2">
          <p className="text-sm font-medium leading-snug line-clamp-2">{e.course.title}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>총 {e.course.total_lessons}강</span>
            {isCreditBank && e.offering && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {e.offering.semester.year} {
                  ({ spring: '봄', summer: '하계', fall: '가을', winter: '동계' } as Record<string, string>)[e.offering.semester.term] ?? ''
                }학기
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* 취소 버튼 (학점은행, 수강신청 기간 내) */}
      {canCancel && (
        <div className="px-4 pb-3">
          <button
            onClick={(ev) => { ev.preventDefault(); onCancel(e.id) }}
            className="flex items-center gap-1 text-[11px] text-destructive hover:underline"
          >
            <X className="h-3 w-3" /> 수강신청 취소
          </button>
        </div>
      )}
    </div>
  )
}
