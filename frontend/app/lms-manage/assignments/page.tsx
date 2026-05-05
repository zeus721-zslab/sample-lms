'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminAssignmentApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { AdminAssignment, AdminAssignmentPaginated } from '@/types/admin-assessment'

const STATUS_OPTIONS = [
  { value: 'draft', label: '초안' },
  { value: 'published', label: '게시됨' },
  { value: 'closed', label: '종료' },
]

function AssignmentFormDialog({
  open,
  assignment,
  onClose,
  onSaved,
}: {
  open: boolean
  assignment: AdminAssignment | null
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAuthStore()
  const [form, setForm] = useState({ course_id: '', title: '', description: '', due_at: '', max_score: '100', status: 'draft' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (assignment) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        course_id: String(assignment.course_id),
        title: assignment.title,
        description: assignment.description ?? '',
        due_at: assignment.due_at ? assignment.due_at.slice(0, 16) : '',
        max_score: String(assignment.max_score),
        status: assignment.status,
      })
    } else {
      setForm({ course_id: '', title: '', description: '', due_at: '', max_score: '100', status: 'draft' })
    }
  }, [assignment, open])

  const handleSave = async () => {
    if (!token || !form.title || !form.course_id) { toast.error('필수 항목을 입력하세요.'); return }
    setSaving(true)
    try {
      const data = {
        course_id: Number(form.course_id),
        title: form.title,
        description: form.description || null,
        due_at: form.due_at || null,
        max_score: Number(form.max_score),
        status: form.status as AdminAssignment['status'],
      }
      if (assignment) {
        await adminAssignmentApi.update(token, assignment.id, data)
        toast.success('과제가 수정되었습니다.')
      } else {
        await adminAssignmentApi.create(token, data)
        toast.success('과제가 생성되었습니다.')
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
          <DialogTitle>{assignment ? '과제 수정' : '과제 생성'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>강좌 ID <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>최대 점수</Label>
              <Input type="number" value={form.max_score} onChange={(e) => setForm((p) => ({ ...p, max_score: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>과제명 <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>설명</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>마감일</Label>
              <Input type="datetime-local" value={form.due_at} onChange={(e) => setForm((p) => ({ ...p, due_at: e.target.value }))} />
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminAssignmentsPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<AdminAssignmentPaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editAssignment, setEditAssignment] = useState<AdminAssignment | null>(null)
  const [deleteAssignment, setDeleteAssignment] = useState<AdminAssignment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminAssignmentApi.list(token, { q: search || undefined, status: status || undefined, page })
      setData(res)
    } catch {
      toast.error('과제 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, status, page])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!token || !deleteAssignment) return
    setDeleting(true)
    try {
      await adminAssignmentApi.destroy(token, deleteAssignment.id)
      toast.success('삭제되었습니다.')
      setDeleteAssignment(null)
      load()
    } catch {
      toast.error('삭제에 실패했습니다. 제출 기록이 있는 과제는 삭제할 수 없습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'title',
      label: '과제명',
      render: (row: AdminAssignment) => (
        <div>
          <p className="font-medium truncate max-w-[220px]">{row.title}</p>
          <p className="text-xs text-muted-foreground truncate">{row.course?.title ?? `코스 #${row.course_id}`}</p>
        </div>
      ),
    },
    {
      key: 'due_at',
      label: '마감일',
      render: (row: AdminAssignment) => (
        <span className="text-sm tabular-nums">{row.due_at ? new Date(row.due_at).toLocaleDateString('ko-KR') : '-'}</span>
      ),
    },
    {
      key: 'submissions',
      label: '제출수',
      render: (row: AdminAssignment) => <span className="tabular-nums">{row.submissions_count}건</span>,
    },
    {
      key: 'max_score',
      label: '만점',
      render: (row: AdminAssignment) => <span className="tabular-nums">{row.max_score}점</span>,
    },
    {
      key: 'status',
      label: '상태',
      render: (row: AdminAssignment) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row: AdminAssignment) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditAssignment(row); setFormOpen(true) }}>수정</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteAssignment(row) }}>삭제</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="과제 관리"
        actions={<Button size="sm" onClick={() => { setEditAssignment(null); setFormOpen(true) }}><Plus className="h-4 w-4 mr-1.5" />과제 추가</Button>}
      />
      <div className="p-6 space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="과제명 검색..."
          selects={[
            { value: status, onChange: (v) => { setStatus(v); setPage(1) }, options: STATUS_OPTIONS, placeholder: '상태 전체' },
          ]}
          onReset={() => { setSearch(''); setStatus(''); setPage(1) }}
        />
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          emptyMessage="등록된 과제가 없습니다."
          onRowClick={(r) => router.push(`/lms-manage/grading?assignment_id=${r.id}`)}
        />
        {data && data.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
              <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
            ))}
          </div>
        )}
      </div>

      <AssignmentFormDialog open={formOpen} assignment={editAssignment} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!deleteAssignment}
        title="과제 삭제"
        description={`"${deleteAssignment?.title}" 과제를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteAssignment(null)}
      />
    </div>
  )
}
