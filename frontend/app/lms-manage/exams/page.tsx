'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminExamApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { AdminExam, AdminExamPaginated } from '@/types/admin-assessment'

const TYPE_OPTIONS = [
  { value: 'quiz', label: '퀴즈' },
  { value: 'midterm', label: '중간시험' },
  { value: 'final', label: '기말시험' },
  { value: 'essay', label: '서술형' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: '초안' },
  { value: 'published', label: '게시됨' },
  { value: 'closed', label: '종료' },
]

const TYPE_LABELS: Record<string, string> = { quiz: '퀴즈', midterm: '중간', final: '기말', essay: '서술형' }

function ExamFormDialog({
  open,
  exam,
  onClose,
  onSaved,
}: {
  open: boolean
  exam: AdminExam | null
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAdminAuthStore()
  const [form, setForm] = useState({
    course_id: '',
    type: 'quiz',
    title: '',
    pass_score: '60',
    total_score: '100',
    duration_min: '30',
    status: 'draft',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (exam) {
      setForm({
        course_id: String(exam.course_id),
        type: exam.type,
        title: exam.title,
        pass_score: String(exam.pass_score),
        total_score: String(exam.total_score),
        duration_min: String(exam.duration_min ?? 30),
        status: exam.status,
      })
    } else {
      setForm({ course_id: '', type: 'quiz', title: '', pass_score: '60', total_score: '100', duration_min: '30', status: 'draft' })
    }
  }, [exam, open])

  const handleSave = async () => {
    if (!token || !form.title || !form.course_id) { toast.error('필수 항목을 입력하세요.'); return }
    setSaving(true)
    try {
      const data = {
        course_id: Number(form.course_id),
        type: form.type as AdminExam['type'],
        title: form.title,
        pass_score: Number(form.pass_score),
        total_score: Number(form.total_score),
        duration_min: Number(form.duration_min),
        status: form.status as AdminExam['status'],
      }
      if (exam) {
        await adminExamApi.update(token, exam.id, data)
        toast.success('시험이 수정되었습니다.')
      } else {
        await adminExamApi.create(token, data)
        toast.success('시험이 생성되었습니다.')
      }
      onSaved()
      onClose()
    } catch {
      toast.error('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{exam ? '시험 수정' : '시험 생성'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>강좌 ID <span className="text-destructive">*</span></Label>
              <Input placeholder="강좌 ID" value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} type="number" />
            </div>
            <div className="space-y-1.5">
              <Label>유형</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>시험명 <span className="text-destructive">*</span></Label>
            <Input placeholder="시험명" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>합격점</Label>
              <Input type="number" value={form.pass_score} onChange={(e) => setForm((p) => ({ ...p, pass_score: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>총점</Label>
              <Input type="number" value={form.total_score} onChange={(e) => setForm((p) => ({ ...p, total_score: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>시간(분)</Label>
              <Input type="number" value={form.duration_min} onChange={(e) => setForm((p) => ({ ...p, duration_min: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>상태</Label>
            <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminExamsPage() {
  const { token } = useAdminAuthStore()
  const router = useRouter()
  const [data, setData] = useState<AdminExamPaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editExam, setEditExam] = useState<AdminExam | null>(null)
  const [deleteExam, setDeleteExam] = useState<AdminExam | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminExamApi.list(token, { q: search || undefined, type: type || undefined, status: status || undefined, page })
      setData(res)
    } catch {
      toast.error('시험 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, type, status, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!token || !deleteExam) return
    setDeleting(true)
    try {
      await adminExamApi.destroy(token, deleteExam.id)
      toast.success('삭제되었습니다.')
      setDeleteExam(null)
      load()
    } catch {
      toast.error('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'title',
      label: '시험명',
      render: (row: AdminExam) => (
        <div>
          <p className="font-medium truncate max-w-[200px]">{row.title}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.course?.title ?? `코스 #${row.course_id}`}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: '유형',
      render: (row: AdminExam) => <Badge variant="outline" className="text-xs">{TYPE_LABELS[row.type] ?? row.type}</Badge>,
    },
    {
      key: 'questions',
      label: '문항/응시',
      render: (row: AdminExam) => <span className="text-sm tabular-nums">{row.questions_count}문항 / {row.submissions_count}회</span>,
    },
    {
      key: 'pass_score',
      label: '합격점',
      render: (row: AdminExam) => <span className="tabular-nums">{row.pass_score}/{row.total_score}</span>,
    },
    {
      key: 'status',
      label: '상태',
      render: (row: AdminExam) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row: AdminExam) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditExam(row); setFormOpen(true) }}>수정</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteExam(row) }}>삭제</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="시험 관리"
        actions={<Button size="sm" onClick={() => { setEditExam(null); setFormOpen(true) }}><Plus className="h-4 w-4 mr-1.5" />시험 추가</Button>}
      />
      <div className="p-6 space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="시험명 검색..."
          selects={[
            { value: type, onChange: (v) => { setType(v); setPage(1) }, options: TYPE_OPTIONS, placeholder: '유형 전체' },
            { value: status, onChange: (v) => { setStatus(v); setPage(1) }, options: STATUS_OPTIONS, placeholder: '상태 전체' },
          ]}
          onReset={() => { setSearch(''); setType(''); setStatus(''); setPage(1) }}
        />
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          emptyMessage="등록된 시험이 없습니다."
          onRowClick={(r) => router.push(`/lms-manage/exams/${r.id}`)}
        />
        {data && data.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
              <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
            ))}
          </div>
        )}
      </div>

      <ExamFormDialog open={formOpen} exam={editExam} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!deleteExam}
        title="시험 삭제"
        description={`"${deleteExam?.title}" 시험을 삭제하시겠습니까? 응시 기록이 있으면 삭제되지 않습니다.`}
        confirmLabel="삭제"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteExam(null)}
      />
    </div>
  )
}
