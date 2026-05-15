'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminGradingApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { GradingAssignmentSubmission } from '@/types/admin-assessment'

export default function AssignmentGradingDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const { token } = useAdminAuthStore()
  const router = useRouter()
  const [detail, setDetail] = useState<GradingAssignmentSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminGradingApi.assignmentShow(token, Number(submissionId))
      setDetail(res)
      setScore(String(res.score ?? ''))
      setFeedback(res.feedback ?? '')
    } catch {
      toast.error('채점 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, submissionId])

  useEffect(() => { load() }, [load])

  const handleGrade = async () => {
    if (!token || !detail) return
    if (score === '') { toast.error('점수를 입력하세요.'); return }
    setSaving(true)
    try {
      await adminGradingApi.assignmentGrade(token, Number(submissionId), {
        score: Number(score),
        feedback: feedback || undefined,
      })
      toast.success('채점이 완료되었습니다.')
      router.push('/lms-manage/grading?tab=assignments')
    } catch {
      toast.error('채점에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground text-sm">로딩 중...</div>
  if (!detail) return <div className="p-6 text-muted-foreground text-sm">채점 정보를 찾을 수 없습니다.</div>

  return (
    <div>
      <PageHeader
        title={`${detail.assignment.title} — 채점`}
        description={`수강생: ${detail.user.name} (${detail.user.email})`}
        actions={<Button onClick={handleGrade} disabled={saving}>{saving ? '저장 중...' : '채점 저장'}</Button>}
      />
      <div className="p-6 space-y-4">
        {/* 메타 정보 */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground mb-1">강좌</p><span>{detail.assignment.course?.title ?? '-'}</span></div>
              <div><p className="text-xs text-muted-foreground mb-1">제출 시각</p><span className="tabular-nums">{new Date(detail.submitted_at).toLocaleString('ko-KR')}</span></div>
              <div><p className="text-xs text-muted-foreground mb-1">만점</p><span className="font-medium">{detail.assignment.max_score}점</span></div>
            </div>
          </CardContent>
        </Card>

        {/* 제출 내용 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">제출 내용</CardTitle>
          </CardHeader>
          <CardContent>
            {detail.text
              ? <div className="text-sm bg-muted/40 rounded-md p-4 whitespace-pre-wrap">{detail.text}</div>
              : detail.file_path
                ? <a href={detail.file_path} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">첨부 파일 보기</a>
                : <p className="text-sm text-muted-foreground">내용 없음</p>
            }
          </CardContent>
        </Card>

        {/* 채점 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">채점</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>점수 (0~{detail.assignment.max_score})</Label>
              <Input
                type="number"
                min={0}
                max={detail.assignment.max_score}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-32"
              />
            </div>
            <div className="space-y-1.5">
              <Label>피드백</Label>
              <Textarea
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="수강생에게 전달할 피드백을 입력하세요."
                className="resize-none"
              />
            </div>
            {detail.graded_at && (
              <p className="text-xs text-muted-foreground">
                최근 채점: {new Date(detail.graded_at).toLocaleString('ko-KR')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
