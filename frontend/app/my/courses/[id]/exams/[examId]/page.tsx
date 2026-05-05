'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Clock, FileText, Trophy, AlertCircle,
  CheckCircle2, XCircle, Loader2, CalendarDays, Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth'
import { examApi, ApiError } from '@/lib/api'
import type { ExamDetailResponse } from '@/types/exam'

const EXAM_TYPE_LABEL: Record<string, string> = {
  quiz: '퀴즈', midterm: '중간고사', final: '기말고사',
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ExamInfoPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isLoaded } = useAuthStore()
  const enrollmentId = Number(params.id)
  const examId = Number(params.examId)

  const [data, setData] = useState<ExamDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!token) { router.replace('/login'); return }
    examApi.detail(token, examId)
      .then(setData)
      .catch(() => { toast.error('시험 정보를 불러올 수 없습니다.'); router.replace(`/my/courses/${enrollmentId}`) })
      .finally(() => setLoading(false))
  }, [isLoaded, token, examId, enrollmentId, router])

  const handleStart = async () => {
    if (!token) return
    setStarting(true)
    try {
      await examApi.start(token, examId)
      router.push(`/my/courses/${enrollmentId}/exams/${examId}/take`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        toast.error(err.message)
        // 이미 진행 중이면 take 페이지로 이동
        router.push(`/my/courses/${enrollmentId}/exams/${examId}/take`)
      } else {
        toast.error('시험 시작 중 오류가 발생했습니다.')
        setStarting(false)
      }
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) return null

  const { exam, can_start, submission } = data
  const isGraded = submission?.status === 'graded'
  const isSubmitted = submission?.status === 'submitted'
  const isInProgress = submission?.status === 'in_progress'

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      {/* 브레드크럼 */}
      <Link
        href={`/my/courses/${enrollmentId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> 학습 페이지로
      </Link>

      {/* 시험 정보 카드 */}
      <div className="rounded-xl border border-border/60 bg-card p-6 mb-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {EXAM_TYPE_LABEL[exam.type] ?? exam.type}
              </span>
            </div>
            <h1 className="text-xl font-bold leading-snug">{exam.title}</h1>
          </div>
        </div>

        {/* 시험 메타 정보 그리드 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Clock, label: '제한 시간', value: `${exam.duration_min}분` },
            { icon: FileText, label: '문항 수', value: `${data.submission ? '-' : '5'}문항` },
            { icon: Target, label: '합격 기준', value: `${exam.pass_score}점 이상` },
            { icon: CalendarDays, label: '만점', value: `${exam.total_score}점` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg bg-muted/40 p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5" />{label}
              </div>
              <p className="text-sm font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {/* 시험 기간 */}
        {(exam.start_at || exam.end_at) && (
          <div className="text-sm text-muted-foreground border-t border-border/40 pt-4">
            <span className="font-medium text-foreground">응시 기간: </span>
            {formatDate(exam.start_at) ?? '제한 없음'} ~ {formatDate(exam.end_at) ?? '제한 없음'}
          </div>
        )}
      </div>

      {/* 결과 카드 (graded) */}
      {isGraded && submission && (
        <div className={`rounded-xl border-2 p-6 mb-6 ${
          submission.pass_yn
            ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20'
            : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 ${
              submission.pass_yn ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'
            }`}>
              {submission.pass_yn
                ? <Trophy className="h-7 w-7 text-green-600 dark:text-green-400" />
                : <AlertCircle className="h-7 w-7 text-red-500" />
              }
            </div>
            <div>
              <p className={`text-2xl font-bold ${submission.pass_yn ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'}`}>
                {submission.total_score}점
              </p>
              <p className={`text-sm font-semibold ${submission.pass_yn ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {submission.pass_yn ? '합격' : '불합격'} · 합격 기준 {exam.pass_score}점
              </p>
              {submission.submitted_at && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  제출: {new Date(submission.submitted_at).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 채점 대기 카드 (submitted) */}
      {isSubmitted && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-5 mb-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">채점 대기 중</p>
            <p className="text-xs text-muted-foreground mt-0.5">서술형 문항 포함으로 교수자 채점 후 결과가 반영됩니다.</p>
          </div>
        </div>
      )}

      {/* 진행 중 카드 */}
      {isInProgress && (
        <div className="rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 p-5 mb-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">응시 진행 중</p>
            <p className="text-xs text-muted-foreground mt-0.5">이전 응시 세션이 있습니다. 이어서 응시하실 수 있습니다.</p>
          </div>
        </div>
      )}

      {/* 유의사항 */}
      {!submission && (
        <div className="rounded-xl border border-border/60 bg-muted/30 p-5 mb-6">
          <h3 className="text-sm font-semibold mb-3">응시 전 유의사항</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              '응시 시작 후에는 재응시가 불가합니다.',
              `제한 시간은 ${exam.duration_min}분이며, 시간 종료 시 자동으로 제출됩니다.`,
              '페이지를 벗어나면 이탈 경고가 표시됩니다.',
              '단답형은 대소문자·앞뒤 공백을 구분하지 않습니다.',
              '객관식은 제출 즉시 자동 채점되며, 서술형은 교수자 채점 후 결과가 반영됩니다.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center gap-3">
        <Button variant="outline" asChild>
          <Link href={`/my/courses/${enrollmentId}`}>
            <ChevronLeft className="mr-1 h-4 w-4" /> 돌아가기
          </Link>
        </Button>

        {can_start && (
          <Button onClick={handleStart} disabled={starting} size="lg" className="flex-1 sm:flex-none sm:min-w-[160px]">
            {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            응시 시작
          </Button>
        )}

        {isInProgress && (
          <Button asChild size="lg" className="flex-1 sm:flex-none sm:min-w-[160px]">
            <Link href={`/my/courses/${enrollmentId}/exams/${examId}/take`}>
              이어서 응시
            </Link>
          </Button>
        )}

        {(isGraded || isSubmitted) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {isGraded
              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
              : <XCircle className="h-4 w-4 text-amber-500" />
            }
            재응시 불가
          </div>
        )}
      </div>
    </div>
  )
}
