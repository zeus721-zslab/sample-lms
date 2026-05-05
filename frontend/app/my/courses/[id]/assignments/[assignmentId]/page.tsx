'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, ClipboardList, Clock, Loader2,
  Send, CheckCircle2, AlertCircle, Paperclip,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth'
import { assignmentApi, ApiError } from '@/lib/api'
import type { AssignmentDetailResponse } from '@/types/assignment'

function calcDday(dueAt: string): string {
  const diff = new Date(dueAt).getTime() - Date.now()
  if (diff <= 0) return '마감'
  const days = Math.ceil(diff / 86_400_000)
  return days === 0 ? 'D-day' : `D-${days}`
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isLoaded } = useAuthStore()
  const enrollmentId = Number(params.id)
  const assignmentId = Number(params.assignmentId)

  const [data, setData] = useState<AssignmentDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitModal, setSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async (tkn: string) => {
    try {
      const res = await assignmentApi.detail(tkn, assignmentId)
      setData(res)
      if (res.submission?.text) setText(res.submission.text)
    } catch {
      toast.error('과제 정보를 불러올 수 없습니다.')
      router.replace(`/my/courses/${enrollmentId}`)
    } finally {
      setLoading(false)
    }
  }, [assignmentId, enrollmentId, router])

  useEffect(() => {
    if (!isLoaded) return
    if (!token) { router.replace('/login'); return }
    loadData(token)
  }, [isLoaded, token, loadData, router])

  const handleSubmit = async () => {
    if (!token || !data) return
    if (!text.trim()) { toast.error('답변 내용을 입력해주세요.'); return }
    setSubmitting(true)
    try {
      await assignmentApi.submit(token, assignmentId, { text: text.trim() })
      toast.success('과제가 제출되었습니다.')
      await loadData(token)
      setSubmitModal(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
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

  const { assignment, can_submit, submission } = data
  const dday = calcDday(assignment.due_at)
  const isPastDue = dday === '마감'
  const isGraded = !!submission?.graded_at

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      {/* 브레드크럼 */}
      <Link
        href={`/my/courses/${enrollmentId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> 학습 페이지로
      </Link>

      {/* 과제 헤더 카드 */}
      <div className="rounded-xl border border-border/60 bg-card p-6 mb-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {submission ? (
                isGraded ? (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    채점완료
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    제출완료 · 채점 대기
                  </span>
                )
              ) : isPastDue ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">마감</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">미제출</span>
              )}
            </div>
            <h1 className="text-xl font-bold leading-snug">{assignment.title}</h1>
          </div>
        </div>

        {/* 메타 정보 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 마감일</p>
            <p className="text-sm font-semibold">{formatDate(assignment.due_at)}</p>
          </div>
          <div className={`rounded-lg p-3 space-y-0.5 ${
            isPastDue ? 'bg-muted/40' : 'bg-amber-50 dark:bg-amber-950/20'
          }`}>
            <p className="text-xs text-muted-foreground">남은 시간</p>
            <p className={`text-sm font-bold ${
              isPastDue ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'
            }`}>{dday}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">만점</p>
            <p className="text-sm font-semibold">{assignment.max_score}점</p>
          </div>
        </div>
      </div>

      {/* 과제 설명 */}
      {assignment.description && (
        <div className="rounded-xl border border-border/60 bg-card p-6 mb-6">
          <h2 className="text-sm font-semibold mb-3">과제 안내</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {assignment.description}
          </p>
        </div>
      )}

      {/* 채점 결과 (graded) */}
      {isGraded && submission && (
        <div className="rounded-xl border-2 border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/20 p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold text-green-700 dark:text-green-300">채점 완료</span>
            {submission.score != null && (
              <span className="ml-auto text-xl font-bold text-green-700 dark:text-green-300">
                {submission.score} / {assignment.max_score}점
              </span>
            )}
          </div>
          {submission.feedback && (
            <div className="rounded-lg bg-white/60 dark:bg-black/20 p-3 text-sm text-muted-foreground leading-relaxed">
              <p className="font-medium text-foreground mb-1 text-xs">교수자 피드백</p>
              {submission.feedback}
            </div>
          )}
          {submission.graded_at && (
            <p className="text-xs text-muted-foreground mt-2">채점일: {formatDate(submission.graded_at)}</p>
          )}
        </div>
      )}

      {/* 채점 대기 (submitted, not graded) */}
      {submission && !isGraded && (
        <div className="rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/20 p-5 mb-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">채점 대기 중</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              제출일: {formatDate(submission.submitted_at)} · 교수자 채점 후 결과가 반영됩니다.
            </p>
          </div>
        </div>
      )}

      {/* 제출 내용 (이미 제출한 경우) */}
      {submission?.text && (
        <div className="rounded-xl border border-border/60 bg-card p-6 mb-6">
          <h2 className="text-sm font-semibold mb-3">제출한 답변</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {submission.text}
          </p>
        </div>
      )}

      {/* 답변 작성 폼 (미제출, 마감 전) */}
      {!submission && (
        <div className="rounded-xl border border-border/60 bg-card p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold">답변 작성</h2>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="과제 답변을 작성하세요..."
            rows={10}
            disabled={isPastDue}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* 파일 업로드 (UI only) */}
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>파일 첨부 (준비 중)</span>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {text.length}자 입력됨
            </p>
            {isPastDue ? (
              <p className="text-sm font-medium text-muted-foreground">마감된 과제입니다.</p>
            ) : (
              <Button
                onClick={() => {
                  if (!text.trim()) { toast.error('답변을 입력해주세요.'); return }
                  setSubmitModal(true)
                }}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" /> 제출하기
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 돌아가기 */}
      <Button variant="outline" asChild>
        <Link href={`/my/courses/${enrollmentId}`}>
          <ChevronLeft className="mr-1 h-4 w-4" /> 학습 페이지로
        </Link>
      </Button>

      {/* 제출 확인 모달 */}
      <Dialog open={submitModal} onOpenChange={(o) => { if (!submitting) setSubmitModal(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>과제 제출 확인</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2 text-sm text-muted-foreground">
            <p>작성한 내용을 제출합니다. 제출 후에는 수정이 불가합니다.</p>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-medium text-foreground mb-1">작성 내용 미리보기</p>
              <p className="text-xs line-clamp-3 text-muted-foreground">{text}</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" disabled={submitting}>취소</Button>
            </DialogClose>
            <Button size="sm" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              제출하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
