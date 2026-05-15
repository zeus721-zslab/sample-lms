'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminSemesterApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Semester } from '@/types/credit-bank'

const TERM_LABEL: Record<string, string> = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }

const STATUS_TRANSITIONS: Record<string, string[]> = {
  planned: ['enrolling'],
  enrolling: ['active', 'planned'],
  active: ['closed'],
  closed: [],
}

const STATUS_BTN: Record<string, { label: string; destructive?: boolean }> = {
  enrolling: { label: '수강신청 개시' },
  active: { label: '수업 시작' },
  planned: { label: '예정으로 되돌리기' },
  closed: { label: '학기 종료', destructive: true },
}

export default function SemesterDetailPage() {
  const { token } = useAdminAuthStore()
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [semester, setSemester] = useState<Semester | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<Partial<Semester>>({})
  const [saving, setSaving] = useState(false)

  const [confirmStatus, setConfirmStatus] = useState('')
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const list = await adminSemesterApi.list(token)
      const found = list.find((s) => s.id === id) ?? null
      setSemester(found)
      if (found) setForm(found)
    } catch {
      toast.error('학기 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!token || !semester) return
    setSaving(true)
    try {
      const updated = await adminSemesterApi.update(token, semester.id, {
        start_date: form.start_date,
        end_date: form.end_date,
        enroll_start_at: form.enroll_start_at ?? null,
        enroll_end_at: form.enroll_end_at ?? null,
        class_start_at: form.class_start_at ?? null,
        class_end_at: form.class_end_at ?? null,
      })
      setSemester(updated)
      setForm(updated)
      setEditMode(false)
      toast.success('학기 정보가 수정되었습니다.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '수정 실패')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async () => {
    if (!token || !semester) return
    setActing(true)
    try {
      const updated = await adminSemesterApi.changeStatus(token, semester.id, confirmStatus)
      setSemester(updated)
      setConfirmStatus('')
      toast.success('상태가 변경되었습니다.')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '변경 실패')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground text-sm">불러오는 중...</div>
  if (!semester) return <div className="p-8 text-center text-muted-foreground text-sm">학기를 찾을 수 없습니다.</div>

  const nextStatuses = STATUS_TRANSITIONS[semester.status] ?? []

  return (
    <div>
      <PageHeader
        title={`${semester.year}년 ${TERM_LABEL[semester.term]} 학기`}
        description={`학기 상세 · ${semester.start_date} ~ ${semester.end_date}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>← 목록</Button>
            {!editMode && <Button size="sm" onClick={() => setEditMode(true)}>수정</Button>}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* 상태 및 전환 */}
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border/60 bg-muted/20">
          <span className="text-sm text-muted-foreground">현재 상태:</span>
          <StatusBadge status={semester.status} />
          {nextStatuses.length > 0 && (
            <div className="flex gap-2 ml-auto">
              {nextStatuses.map((next) => (
                <Button
                  key={next}
                  size="sm"
                  variant={STATUS_BTN[next]?.destructive ? 'destructive' : 'outline'}
                  onClick={() => setConfirmStatus(next)}
                >
                  {STATUS_BTN[next]?.label ?? next}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* 학기 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>시작일</Label>
            {editMode
              ? <Input type="date" value={form.start_date ?? ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              : <p className="text-sm py-2">{semester.start_date}</p>
            }
          </div>
          <div className="space-y-1">
            <Label>종료일</Label>
            {editMode
              ? <Input type="date" value={form.end_date ?? ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              : <p className="text-sm py-2">{semester.end_date}</p>
            }
          </div>
          <div className="space-y-1">
            <Label>수강신청 시작</Label>
            {editMode
              ? <Input type="datetime-local" value={(form.enroll_start_at ?? '').slice(0, 16)} onChange={(e) => setForm({ ...form, enroll_start_at: e.target.value })} />
              : <p className="text-sm py-2">{semester.enroll_start_at?.slice(0, 16) ?? '-'}</p>
            }
          </div>
          <div className="space-y-1">
            <Label>수강신청 종료</Label>
            {editMode
              ? <Input type="datetime-local" value={(form.enroll_end_at ?? '').slice(0, 16)} onChange={(e) => setForm({ ...form, enroll_end_at: e.target.value })} />
              : <p className="text-sm py-2">{semester.enroll_end_at?.slice(0, 16) ?? '-'}</p>
            }
          </div>
          <div className="space-y-1">
            <Label>수업 시작</Label>
            {editMode
              ? <Input type="datetime-local" value={(form.class_start_at ?? '').slice(0, 16)} onChange={(e) => setForm({ ...form, class_start_at: e.target.value })} />
              : <p className="text-sm py-2">{semester.class_start_at?.slice(0, 16) ?? '-'}</p>
            }
          </div>
          <div className="space-y-1">
            <Label>수업 종료</Label>
            {editMode
              ? <Input type="datetime-local" value={(form.class_end_at ?? '').slice(0, 16)} onChange={(e) => setForm({ ...form, class_end_at: e.target.value })} />
              : <p className="text-sm py-2">{semester.class_end_at?.slice(0, 16) ?? '-'}</p>
            }
          </div>
        </div>

        {editMode && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
            <Button variant="outline" onClick={() => { setEditMode(false); setForm(semester) }}>취소</Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus('')}
        onConfirm={handleStatusChange}
        title={`상태를 "${STATUS_BTN[confirmStatus]?.label ?? confirmStatus}"(으)로 변경하시겠습니까?`}
        description="학기 상태는 되돌리기 어렵습니다."
        confirmLabel="변경"
        destructive={STATUS_BTN[confirmStatus]?.destructive}
        loading={acting}
      />
    </div>
  )
}
