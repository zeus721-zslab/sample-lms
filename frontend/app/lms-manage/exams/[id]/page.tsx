'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminExamApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Trash2, Save } from 'lucide-react'
import type { AdminExam, AdminQuestion } from '@/types/admin-assessment'

const TYPE_LABELS: Record<string, string> = { quiz: '퀴즈', midterm: '중간', final: '기말', essay: '서술형' }
const Q_TYPE_LABELS: Record<string, string> = { single: '단일', multiple: '복수', short: '단답', essay: '서술' }

function QuestionCard({
  q,
  onUpdate,
  onDelete,
}: {
  q: AdminQuestion
  onUpdate: (id: number, data: Partial<AdminQuestion>) => Promise<void>
  onDelete: (id: number) => void
}) {
  const [form, setForm] = useState({
    type: q.type,
    body: q.body,
    score: String(q.score),
    choices: (q.choices ?? []).join('\n'),
    correct_answer: (q.correct_answer ?? []).join('\n'),
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(q.id, {
      type: form.type as AdminQuestion['type'],
      body: form.body,
      score: Number(form.score),
      choices: form.choices ? form.choices.split('\n').filter(Boolean) : null,
      correct_answer: form.correct_answer ? form.correct_answer.split('\n').filter(Boolean) : null,
    })
    setSaving(false)
  }

  const showChoices = form.type === 'single' || form.type === 'multiple'
  const showCorrect = form.type !== 'essay'

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{q.order_no}번</Badge>
          <div className="flex gap-1">
            {(['single', 'multiple', 'short', 'essay'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setForm((p) => ({ ...p, type: t }))}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${form.type === t ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
              >
                {Q_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1">
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(q.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">문제</Label>
          <Textarea rows={2} value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} className="resize-none text-sm" />
        </div>
        {showChoices && (
          <div className="space-y-1">
            <Label className="text-xs">보기 (줄바꿈으로 구분)</Label>
            <Textarea rows={4} value={form.choices} onChange={(e) => setForm((p) => ({ ...p, choices: e.target.value }))} className="resize-none text-sm font-mono" />
          </div>
        )}
        {showCorrect && (
          <div className="space-y-1">
            <Label className="text-xs">정답 (줄바꿈으로 구분)</Label>
            <Textarea rows={2} value={form.correct_answer} onChange={(e) => setForm((p) => ({ ...p, correct_answer: e.target.value }))} className="resize-none text-sm font-mono" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Label className="text-xs w-14 shrink-0">배점</Label>
          <Input type="number" value={form.score} onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))} className="w-24 h-7 text-sm" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { token } = useAuthStore()
  const [exam, setExam] = useState<AdminExam | null>(null)
  const [questions, setQuestions] = useState<AdminQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteQ, setDeleteQ] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminExamApi.questions(token, Number(id))
      setExam(res.exam)
      setQuestions(res.questions)
    } catch {
      toast.error('시험 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (qId: number, data: Partial<AdminQuestion>) => {
    if (!token) return
    try {
      const updated = await adminExamApi.updateQuestion(token, qId, data)
      setQuestions((prev) => prev.map((q) => (q.id === qId ? updated : q)))
      toast.success('저장되었습니다.')
    } catch {
      toast.error('저장에 실패했습니다.')
    }
  }

  const handleAdd = async () => {
    if (!token) return
    try {
      const q = await adminExamApi.addQuestion(token, Number(id), {
        type: 'single',
        body: '새 문제를 입력하세요.',
        choices: ['선택지 A', '선택지 B', '선택지 C', '선택지 D'],
        correct_answer: ['선택지 A'],
        score: 10,
      })
      setQuestions((prev) => [...prev, q])
      toast.success('문항이 추가되었습니다.')
    } catch {
      toast.error('추가에 실패했습니다.')
    }
  }

  const handleDelete = async () => {
    if (!token || deleteQ === null) return
    setDeleting(true)
    try {
      await adminExamApi.deleteQuestion(token, deleteQ)
      setQuestions((prev) => prev.filter((q) => q.id !== deleteQ))
      setDeleteQ(null)
      toast.success('문항이 삭제되었습니다.')
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!token || !exam) return
    try {
      const updated = await adminExamApi.update(token, exam.id, { status: status as AdminExam['status'] })
      setExam(updated)
      toast.success('상태가 변경되었습니다.')
    } catch {
      toast.error('변경에 실패했습니다.')
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground text-sm">로딩 중...</div>
  if (!exam) return <div className="p-6 text-muted-foreground text-sm">시험을 찾을 수 없습니다.</div>

  return (
    <div>
      <PageHeader
        title={exam.title}
        description={`강좌: ${exam.course?.title ?? `#${exam.course_id}`} · 문항 ${questions.length}개`}
        actions={
          <div className="flex items-center gap-2">
            <Select value={exam.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">초안</SelectItem>
                <SelectItem value="published">게시됨</SelectItem>
                <SelectItem value="closed">종료</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd}><Plus className="h-4 w-4 mr-1.5" />문항 추가</Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* 기본 정보 */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground mb-1">유형</p><Badge variant="outline">{TYPE_LABELS[exam.type] ?? exam.type}</Badge></div>
              <div><p className="text-xs text-muted-foreground mb-1">합격점</p><span className="font-medium">{exam.pass_score}/{exam.total_score}점</span></div>
              <div><p className="text-xs text-muted-foreground mb-1">제한 시간</p><span className="font-medium">{exam.duration_min ?? '-'}분</span></div>
              <div><p className="text-xs text-muted-foreground mb-1">응시 수</p><span className="font-medium">{exam.submissions_count}회</span></div>
            </div>
          </CardContent>
        </Card>

        {/* 문항 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">문항 목록 ({questions.length}개)</h2>
          </div>
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 py-12 text-center text-muted-foreground text-sm">
              등록된 문항이 없습니다. 문항을 추가해 주세요.
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <QuestionCard key={q.id} q={q} onUpdate={handleUpdate} onDelete={(qId) => setDeleteQ(qId)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteQ !== null}
        title="문항 삭제"
        description="이 문항을 삭제하시겠습니까?"
        confirmLabel="삭제"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteQ(null)}
      />
    </div>
  )
}
