'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { adminOfferingApi, adminSemesterApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Offering, OfferingPaginated, Semester } from '@/types/credit-bank'

const TERM_LABEL: Record<string, string> = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }

const OFFERING_STATUS_OPTIONS = [
  { value: 'open', label: '모집중' },
  { value: 'full', label: '정원마감' },
  { value: 'closed', label: '마감' },
]

const emptyForm = () => ({
  course_id: '',
  semester_id: '',
  tutor_id: '',
  max_students: '30',
})

type EditTarget = Offering | null

export default function OfferingsPage() {
  const { token } = useAuthStore()
  const [data, setData] = useState<OfferingPaginated | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [semFilter, setSemFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [editTarget, setEditTarget] = useState<EditTarget>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Offering | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminOfferingApi.list(token, {
        semester_id: semFilter ? Number(semFilter) : undefined,
        status: statusFilter || undefined,
        page,
      })
      setData(res)
    } catch {
      toast.error('분반 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, semFilter, statusFilter, page])

  useEffect(() => {
    if (!token) return
    adminSemesterApi.list(token).then(setSemesters).catch(() => {})
  }, [token])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (o: Offering) => {
    setEditTarget(o)
    setForm({
      course_id: String(o.course_id),
      semester_id: String(o.semester_id),
      tutor_id: o.tutor_id ? String(o.tutor_id) : '',
      max_students: String(o.max_students),
    })
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!token) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        max_students: Number(form.max_students),
        tutor_id: form.tutor_id ? Number(form.tutor_id) : null,
      }
      if (!editTarget) {
        payload.course_id = Number(form.course_id)
        payload.semester_id = Number(form.semester_id)
        await adminOfferingApi.create(token, payload)
        toast.success('분반이 등록되었습니다.')
      } else {
        await adminOfferingApi.update(token, editTarget.id, payload)
        toast.success('분반이 수정되었습니다.')
      }
      setShowForm(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    setDeleting(true)
    try {
      await adminOfferingApi.destroy(token, deleteTarget.id)
      toast.success('분반이 삭제되었습니다.')
      setDeleteTarget(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '삭제 실패')
    } finally {
      setDeleting(false)
    }
  }

  const semOptions = semesters.map((s) => ({
    value: String(s.id),
    label: `${s.year}년 ${TERM_LABEL[s.term]}`,
  }))

  return (
    <div>
      <PageHeader
        title="분반 관리"
        description="학기별 강좌 분반을 생성하고 관리합니다."
        actions={<Button size="sm" onClick={openCreate}>+ 분반 등록</Button>}
      />

      <div className="p-6 space-y-4">
        <FilterBar
          search=""
          onSearchChange={() => {}}
          selects={[
            { value: semFilter, onChange: (v) => { setSemFilter(v); setPage(1) }, options: semOptions, placeholder: '학기 전체' },
            { value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1) }, options: OFFERING_STATUS_OPTIONS, placeholder: '상태 전체' },
          ]}
          onReset={() => { setSemFilter(''); setStatusFilter(''); setPage(1) }}
        />

        <DataTable
          loading={loading}
          rows={data?.data ?? []}
          rowKey={(o) => o.id}
          emptyMessage="분반이 없습니다."
          columns={[
            { key: 'id', label: 'ID', className: 'w-12', render: (o) => <span className="text-muted-foreground text-xs">#{o.id}</span> },
            {
              key: 'semester', label: '학기', render: (o) => (
                <span className="text-sm">{o.semester ? `${o.semester.year}년 ${TERM_LABEL[o.semester.term]}` : '-'}</span>
              ),
            },
            {
              key: 'course', label: '강좌', render: (o) => (
                <div>
                  <p className="text-sm font-medium">{o.course?.title ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{o.course?.credit_hours ?? 0}학점</p>
                </div>
              ),
            },
            { key: 'tutor', label: '튜터', render: (o) => <span className="text-sm">{o.tutor?.name ?? '-'}</span> },
            {
              key: 'capacity', label: '정원', className: 'text-center', render: (o) => (
                <span className="text-sm">
                  {o.current_students} / {o.max_students}
                  <span className="ml-1 text-xs text-muted-foreground">(잔여 {Math.max(0, o.max_students - o.current_students)})</span>
                </span>
              ),
            },
            { key: 'status', label: '상태', render: (o) => <StatusBadge status={o.status} /> },
            {
              key: 'actions', label: '', className: 'text-right w-28', render: (o) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openEdit(o)}>수정</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteTarget(o)}>삭제</Button>
                </div>
              ),
            },
          ]}
        />

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>총 {data.total.toLocaleString()}개</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
              <span className="flex items-center px-2">{page} / {data.last_page}</span>
              <Button variant="ghost" size="sm" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>다음</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? '분반 수정' : '분반 등록'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {!editTarget && (
              <>
                <div className="space-y-1">
                  <Label>학기</Label>
                  <select
                    value={form.semester_id}
                    onChange={(e) => setForm({ ...form, semester_id: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">학기 선택</option>
                    {semesters.map((s) => (
                      <option key={s.id} value={s.id}>{s.year}년 {TERM_LABEL[s.term]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>강좌 ID</Label>
                  <Input type="number" placeholder="강좌 ID 입력" value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} />
                </div>
              </>
            )}
            <div className="space-y-1">
              <Label>튜터 ID (선택)</Label>
              <Input type="number" placeholder="튜터 사용자 ID" value={form.tutor_id} onChange={(e) => setForm({ ...form, tutor_id: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>최대 정원</Label>
              <Input type="number" min="1" value={form.max_students} onChange={(e) => setForm({ ...form, max_students: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>취소</Button>
            <Button onClick={handleSubmit} disabled={saving}>{saving ? '저장 중...' : editTarget ? '수정' : '등록'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`분반 #${deleteTarget?.id}을 삭제하시겠습니까?`}
        description="수강생이 있는 분반은 삭제할 수 없습니다."
        confirmLabel="삭제"
        destructive
        loading={deleting}
      />
    </div>
  )
}
