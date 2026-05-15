'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminSemesterApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Semester } from '@/types/credit-bank'

const TERM_OPTIONS = [
  { value: 'spring', label: '봄 (Spring)' },
  { value: 'summer', label: '여름 (Summer)' },
  { value: 'fall', label: '가을 (Fall)' },
  { value: 'winter', label: '겨울 (Winter)' },
]

const TERM_LABEL: Record<string, string> = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }

const STATUS_TRANSITIONS: Record<string, string[]> = {
  planned: ['enrolling'],
  enrolling: ['active', 'planned'],
  active: ['closed'],
  closed: [],
}

const STATUS_BTN: Record<string, { label: string; cls: string }> = {
  enrolling: { label: '수강신청 개시', cls: 'text-emerald-600' },
  active: { label: '수업 시작', cls: 'text-blue-600' },
  planned: { label: '예정으로 되돌리기', cls: 'text-muted-foreground' },
  closed: { label: '학기 종료', cls: 'text-destructive' },
}

const emptyForm = () => ({
  year: new Date().getFullYear(),
  term: 'spring',
  start_date: '',
  end_date: '',
  enroll_start_at: '',
  enroll_end_at: '',
  class_start_at: '',
  class_end_at: '',
})

export default function SemestersPage() {
  const { token } = useAdminAuthStore()
  const router = useRouter()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)

  // 등록 모달
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  // status 전환 confirm
  const [confirmSem, setConfirmSem] = useState<Semester | null>(null)
  const [confirmStatus, setConfirmStatus] = useState('')
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminSemesterApi.list(token)
      setSemesters(res)
    } catch {
      toast.error('학기 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!token) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        year: Number(form.year),
        term: form.term,
        start_date: form.start_date,
        end_date: form.end_date,
      }
      if (form.enroll_start_at) payload.enroll_start_at = form.enroll_start_at
      if (form.enroll_end_at) payload.enroll_end_at = form.enroll_end_at
      if (form.class_start_at) payload.class_start_at = form.class_start_at
      if (form.class_end_at) payload.class_end_at = form.class_end_at

      await adminSemesterApi.create(token, payload)
      toast.success('학기가 등록되었습니다.')
      setShowCreate(false)
      setForm(emptyForm())
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '등록 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async () => {
    if (!token || !confirmSem) return
    setActing(true)
    try {
      await adminSemesterApi.changeStatus(token, confirmSem.id, confirmStatus)
      toast.success('학기 상태가 변경되었습니다.')
      setConfirmSem(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '변경 실패')
    } finally {
      setActing(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="학기 관리"
        description="학점은행 학기를 생성하고 상태를 관리합니다."
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>+ 학기 등록</Button>
        }
      />

      <div className="p-6 space-y-4">
        <DataTable
          loading={loading}
          rows={semesters}
          rowKey={(s) => s.id}
          onRowClick={(s) => router.push(`/lms-manage/semesters/${s.id}`)}
          emptyMessage="등록된 학기가 없습니다."
          columns={[
            { key: 'id', label: 'ID', className: 'w-12', render: (s) => <span className="text-muted-foreground text-xs">#{s.id}</span> },
            {
              key: 'name', label: '학기', render: (s) => (
                <div>
                  <p className="font-medium text-sm">{s.year}년 {TERM_LABEL[s.term]}</p>
                  <p className="text-xs text-muted-foreground">{s.start_date} ~ {s.end_date}</p>
                </div>
              ),
            },
            {
              key: 'enroll', label: '수강신청 기간', render: (s) => (
                <span className="text-xs text-muted-foreground">
                  {s.enroll_start_at ? s.enroll_start_at.slice(0, 10) : '-'} ~ {s.enroll_end_at ? s.enroll_end_at.slice(0, 10) : '-'}
                </span>
              ),
            },
            { key: 'offerings', label: '분반', className: 'text-right', render: (s) => <span className="text-sm">{s.offerings_count ?? 0}</span> },
            { key: 'status', label: '상태', render: (s) => <StatusBadge status={s.status} /> },
            {
              key: 'actions', label: '', className: 'text-right w-40', render: (s) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {STATUS_TRANSITIONS[s.status]?.map((nextStatus) => {
                    const btn = STATUS_BTN[nextStatus]
                    return (
                      <Button
                        key={nextStatus}
                        variant="ghost" size="sm"
                        className={`h-7 text-xs ${btn.cls}`}
                        onClick={() => { setConfirmSem(s); setConfirmStatus(nextStatus) }}
                      >
                        {btn.label}
                      </Button>
                    )
                  })}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* 학기 등록 모달 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>학기 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>연도</Label>
                <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <Label>학기</Label>
                <select
                  value={form.term}
                  onChange={(e) => setForm({ ...form, term: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {TERM_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>시작일</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>종료일</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>수강신청 시작</Label>
                <Input type="datetime-local" value={form.enroll_start_at} onChange={(e) => setForm({ ...form, enroll_start_at: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>수강신청 종료</Label>
                <Input type="datetime-local" value={form.enroll_end_at} onChange={(e) => setForm({ ...form, enroll_end_at: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>수업 시작</Label>
                <Input type="datetime-local" value={form.class_start_at} onChange={(e) => setForm({ ...form, class_start_at: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>수업 종료</Label>
                <Input type="datetime-local" value={form.class_end_at} onChange={(e) => setForm({ ...form, class_end_at: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>취소</Button>
            <Button onClick={handleCreate} disabled={saving || !form.start_date || !form.end_date}>
              {saving ? '저장 중...' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmSem}
        onClose={() => setConfirmSem(null)}
        onConfirm={handleStatusChange}
        title={`"${confirmSem?.year}년 ${TERM_LABEL[confirmSem?.term ?? '']} 학기" 상태를 "${STATUS_BTN[confirmStatus]?.label ?? confirmStatus}"(으)로 변경하시겠습니까?`}
        description="학기 상태는 단방향으로만 전환됩니다."
        confirmLabel="변경"
        destructive={confirmStatus === 'closed'}
        loading={acting}
      />
    </div>
  )
}
