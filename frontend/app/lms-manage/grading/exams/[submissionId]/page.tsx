'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminGradingApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { GradingExamDetail } from '@/types/admin-assessment'

const Q_TYPE_LABELS: Record<string, string> = { single: '단일선택', multiple: '복수선택', short: '단답형', essay: '서술형' }

export default function ExamGradingDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const { token } = useAuthStore()
  const router = useRouter()
  const [detail, setDetail] = useState<GradingExamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<Record<number, { score: string; feedback: string }>>({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminGradingApi.examShow(token, Number(submissionId))
      setDetail(res)
      // 기존 점수 초기화
      const init: Record<number, { score: string; feedback: string }> = {}
      res.answers.forEach((a) => {
        init[a.id] = { score: String(a.score ?? ''), feedback: '' }
      })
      setScores(init)
    } catch {
      toast.error('채점 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, submissionId])

  useEffect(() => { load() }, [load])

  const handleGrade = async () => {
    if (!token || !detail) return
    setSaving(true)
    try {
      const answers = Object.entries(scores).map(([answerId, v]) => ({
        answer_id: Number(answerId),
        score: Number(v.score),
        feedback: v.feedback || undefined,
      }))
      await adminGradingApi.examGrade(token, Number(submissionId), { answers })
      toast.success('채점이 완료되었습니다.')
      router.push('/lms-manage/grading')
    } catch {
      toast.error('채점에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground text-sm">로딩 중...</div>
  if (!detail) return <div className="p-6 text-muted-foreground text-sm">채점 정보를 찾을 수 없습니다.</div>

  const essayAnswers = detail.answers.filter((a) => a.question?.type === 'essay')
  const hasEssay = essayAnswers.length > 0

  return (
    <div>
      <PageHeader
        title={`${detail.exam.title} — 채점`}
        description={`수강생: ${detail.user.name} (${detail.user.email})`}
        actions={
          hasEssay && detail.status !== 'graded'
            ? <Button onClick={handleGrade} disabled={saving}>{saving ? '저장 중...' : '채점 완료'}</Button>
            : null
        }
      />
      <div className="p-6 space-y-4">
        {/* 요약 카드 */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground mb-1">상태</p><StatusBadge status={detail.status} /></div>
              <div><p className="text-xs text-muted-foreground mb-1">총점</p><span className="font-medium">{detail.total_score ?? '-'}점</span></div>
              <div><p className="text-xs text-muted-foreground mb-1">합격선</p><span className="font-medium">{detail.exam.pass_score}점</span></div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">합격 여부</p>
                {detail.pass_yn !== null
                  ? detail.pass_yn
                    ? <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium"><CheckCircle2 className="h-3.5 w-3.5" />합격</span>
                    : <span className="flex items-center gap-1 text-destructive text-xs font-medium"><XCircle className="h-3.5 w-3.5" />불합격</span>
                  : <span className="text-muted-foreground text-xs">-</span>
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 답안 목록 */}
        {detail.answers.map((answer) => {
          const q = answer.question
          if (!q) return null
          const isEssay = q.type === 'essay'
          const isAutoGraded = !isEssay

          return (
            <Card key={answer.id} className={isEssay ? 'border-primary/30' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{q.order_no}번</Badge>
                  <Badge variant="outline" className="text-xs">{Q_TYPE_LABELS[q.type] ?? q.type}</Badge>
                  {isEssay && <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">수동 채점 필요</Badge>}
                  <span className="ml-auto text-xs text-muted-foreground">{q.score}점 배점</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm bg-muted/40 rounded-md p-3">{q.body}</div>

                {q.choices && (
                  <div className="text-xs space-y-1">
                    {q.choices.map((c, i) => (
                      <div key={i} className={`flex items-center gap-1.5 px-2 py-1 rounded ${q.correct_answer?.includes(c) ? 'bg-green-500/10 text-green-700 dark:text-green-400' : ''}`}>
                        <span>{String.fromCharCode(65 + i)}.</span>
                        <span>{c}</span>
                        {q.correct_answer?.includes(c) && <span className="ml-auto">✓ 정답</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm">
                  <p className="text-xs text-muted-foreground mb-1">학생 답안</p>
                  <div className="bg-muted/40 rounded-md p-2 text-sm">{(answer.answer ?? []).join(', ') || '(없음)'}</div>
                </div>

                {isAutoGraded && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">자동 채점 점수: </span>
                    <span className="font-medium">{answer.score ?? 0}점</span>
                  </div>
                )}

                {isEssay && (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-xs">점수 (0~{q.score})</Label>
                      <Input
                        type="number"
                        min={0}
                        max={q.score}
                        value={scores[answer.id]?.score ?? ''}
                        onChange={(e) => setScores((p) => ({ ...p, [answer.id]: { ...p[answer.id], score: e.target.value } }))}
                        className="w-28 h-7 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">피드백</Label>
                      <Textarea
                        rows={2}
                        value={scores[answer.id]?.feedback ?? ''}
                        onChange={(e) => setScores((p) => ({ ...p, [answer.id]: { ...p[answer.id], feedback: e.target.value } }))}
                        placeholder="채점 피드백 (선택)"
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {!hasEssay && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            모든 문제가 자동 채점되었습니다.
          </div>
        )}
      </div>
    </div>
  )
}
