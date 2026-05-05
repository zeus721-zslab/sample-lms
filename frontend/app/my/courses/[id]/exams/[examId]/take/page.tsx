'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, Loader2, Send, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth'
import { examApi, ApiError } from '@/lib/api'
import type { ExamQuestion, ExamStartResponse } from '@/types/exam'

// ── 카운트다운 훅 ─────────────────────────────────────
function useCountdown(startedAt: string, durationMin: number) {
  const calcRemain = useCallback(() => {
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
    return Math.max(0, durationMin * 60 - Math.floor(elapsed))
  }, [startedAt, durationMin])

  const [remain, setRemain] = useState(calcRemain)

  useEffect(() => {
    const t = setInterval(() => setRemain(calcRemain()), 1000)
    return () => clearInterval(t)
  }, [calcRemain])

  return remain
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ── 문항 컴포넌트 ─────────────────────────────────────
function QuestionView({
  question,
  answer,
  onChange,
}: {
  question: ExamQuestion
  answer: string[]
  onChange: (val: string[]) => void
}) {
  const { type, body, choices } = question

  return (
    <div className="space-y-5">
      <p className="text-base font-medium leading-relaxed whitespace-pre-wrap">{body}</p>

      {/* 단일 선택 */}
      {type === 'single' && choices && (
        <div className="space-y-2.5">
          {choices.map((choice, i) => {
            const selected = answer[0] === choice
            return (
              <label key={i}
                className={`flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-all ${
                  selected ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected ? 'border-primary' : 'border-border'
                }`}>
                  {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <input type="radio" className="sr-only" checked={selected}
                  onChange={() => onChange([choice])} />
                <span className="text-sm">{choice}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* 복수 선택 */}
      {type === 'multiple' && choices && (
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground">해당하는 항목을 모두 선택하세요.</p>
          {choices.map((choice, i) => {
            const checked = answer.includes(choice)
            return (
              <label key={i}
                className={`flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-all ${
                  checked ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                }`}
              >
                <span className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? 'border-primary bg-primary' : 'border-border'
                }`}>
                  {checked && (
                    <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <input type="checkbox" className="sr-only" checked={checked}
                  onChange={() => {
                    if (checked) onChange(answer.filter((v) => v !== choice))
                    else onChange([...answer, choice])
                  }} />
                <span className="text-sm">{choice}</span>
              </label>
            )
          })}
        </div>
      )}

      {/* 단답형 */}
      {type === 'short' && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">정답을 입력하세요. (대소문자·앞뒤 공백 무시)</p>
          <Input
            value={answer[0] ?? ''}
            onChange={(e) => onChange([e.target.value])}
            placeholder="답을 입력하세요..."
            className="max-w-sm"
          />
        </div>
      )}

      {/* 서술형 */}
      {type === 'essay' && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">답을 자유롭게 서술하세요. (교수자 채점)</p>
          <textarea
            value={answer[0] ?? ''}
            onChange={(e) => onChange([e.target.value])}
            placeholder="답을 입력하세요..."
            rows={6}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          />
        </div>
      )}
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────
export default function ExamTakePage() {
  const params = useParams()
  const router = useRouter()
  const { token, isLoaded } = useAuthStore()
  const enrollmentId = Number(params.id)
  const examId = Number(params.examId)

  const [examData, setExamData] = useState<ExamStartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string[]>>({})
  const [submitModal, setSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const autoSubmittedRef = useRef(false)

  // 이탈 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [])

  // 데이터 로드: 이미 시작된 응시가 있어야 진입 가능
  useEffect(() => {
    if (!isLoaded) return
    if (!token) { router.replace('/login'); return }

    // start 재호출 (이미 시작됐으면 422 → detail로 redirect)
    examApi.start(token, examId)
      .then((res) => {
        setExamData(res)
        setLoading(false)
      })
      .catch(async (err) => {
        if (err instanceof ApiError && err.status === 422) {
          // 이미 제출됨 → 안내 페이지로
          router.replace(`/my/courses/${enrollmentId}/exams/${examId}`)
        } else {
          toast.error('시험 정보를 불러올 수 없습니다.')
          router.replace(`/my/courses/${enrollmentId}/exams/${examId}`)
        }
      })
  }, [isLoaded, token, examId, enrollmentId, router])

  // 타이머 (started_at 기준으로 남은 시간 계산)
  const remain = useCountdown(
    examData?.started_at ?? new Date().toISOString(),
    examData?.exam.duration_min ?? 30,
  )

  const doSubmit = useCallback(async () => {
    if (!token || !examData) return
    setSubmitting(true)

    const payload = examData.questions.map((q) => ({
      question_id: q.id,
      answer: answers[q.id] ?? [],
    }))

    try {
      const result = await examApi.submit(token, examId, payload)
      toast.success(result.pass_yn ? '합격입니다! 🎉' : `제출 완료 (${result.total_score}점)`)
      router.replace(`/my/courses/${enrollmentId}/exams/${examId}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '제출 중 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }, [token, examData, answers, examId, enrollmentId, router])

  // 자동 제출 (타이머 0)
  useEffect(() => {
    if (remain === 0 && examData && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true
      toast.warning('시간이 종료되어 자동 제출됩니다.')
      doSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remain, examData])

  if (!isLoaded || loading || !examData) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const questions = examData.questions
  const currentQ = questions[currentIdx]
  const currentAnswer = answers[currentQ?.id] ?? []
  const answeredCount = questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length
  const unansweredCount = questions.length - answeredCount

  const isUrgent = remain < 60
  const isWarning = remain < 180

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── 상단 고정 헤더 ──────────────────────────────── */}
      <header className="shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="container mx-auto max-w-3xl flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {currentIdx + 1} / {questions.length}번 문항
            </p>
            <p className="text-sm font-semibold truncate">{examData.exam.title}</p>
          </div>

          {/* 타이머 */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold transition-colors ${
            isUrgent
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
              : isWarning
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-muted text-foreground'
          }`}>
            <Clock className="h-5 w-5" />
            {formatTime(remain)}
          </div>

          <Button
            size="sm"
            onClick={() => setSubmitModal(true)}
            disabled={submitting}
            className="shrink-0 gap-1.5"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">제출하기</span>
          </Button>
        </div>
      </header>

      {/* ── 문항 번호 네비게이션 ─────────────────────────── */}
      <div className="shrink-0 border-b border-border/40 bg-muted/20 px-4 py-2 overflow-x-auto">
        <div className="container mx-auto max-w-3xl flex items-center gap-1.5">
          {questions.map((q, i) => {
            const isAnswered = (answers[q.id]?.length ?? 0) > 0
            const isCurrent = i === currentIdx
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`h-7 w-7 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground scale-110'
                    : isAnswered
                      ? 'bg-primary/20 text-primary border border-primary/40'
                      : 'bg-muted border border-border/60 text-muted-foreground hover:border-primary/40'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
          <span className="ml-2 text-xs text-muted-foreground shrink-0">
            {answeredCount}/{questions.length} 답변
          </span>
        </div>
      </div>

      {/* ── 문항 본문 ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          {/* 문항 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {currentIdx + 1}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {currentQ.type === 'single' ? '단일 선택' :
                 currentQ.type === 'multiple' ? '복수 선택' :
                 currentQ.type === 'short' ? '단답형' : '서술형'}
              </span>
              <span className="text-xs text-muted-foreground">{currentQ.score}점</span>
            </div>
          </div>

          {/* 문항 */}
          {currentQ && (
            <QuestionView
              question={currentQ}
              answer={currentAnswer}
              onChange={(val) => setAnswers((prev) => ({ ...prev, [currentQ.id]: val }))}
            />
          )}

          {/* 이전/다음 */}
          <div className="flex items-center justify-between mt-10">
            <Button variant="outline" size="sm"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => i - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> 이전
            </Button>
            {currentIdx < questions.length - 1 ? (
              <Button variant="outline" size="sm"
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="gap-1"
              >
                다음 <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setSubmitModal(true)} className="gap-1.5">
                <Send className="h-4 w-4" /> 제출하기
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── 제출 확인 모달 ───────────────────────────────── */}
      <Dialog open={submitModal} onOpenChange={(o) => { if (!submitting) setSubmitModal(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {unansweredCount > 0 && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              답안 제출 확인
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {unansweredCount > 0 ? (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  미답변 문항이 {unansweredCount}개 있습니다.
                </p>
                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                  미답변 문항은 0점으로 처리됩니다.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                모든 문항에 답변했습니다. 제출 후에는 수정할 수 없습니다.
              </p>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">답변 완료</span>
              <span className="font-medium">{answeredCount} / {questions.length}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={submitting}>계속 풀기</Button>
            </DialogClose>
            <Button size="sm" onClick={() => { setSubmitModal(false); doSubmit() }} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              제출하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
