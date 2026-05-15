'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminEnrollmentApi, adminSemesterApi, adminOfferingApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { CbEnrollment, CbEnrollmentPaginated, Semester, Offering } from '@/types/credit-bank'

const TERM_LABEL: Record<string, string> = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }

const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'pending', label: '대기' },
  { value: 'paid', label: '결제' },
  { value: 'studying', label: '수강중' },
  { value: 'completed', label: '수료' },
  { value: 'failed', label: '미수료' },
  { value: 'withdrawn', label: '탈퇴' },
]

export default function EnrollmentsPage() {
  const { token } = useAdminAuthStore()
  const [data, setData] = useState<CbEnrollmentPaginated | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [semFilter, setSemFilter] = useState('')
  const [offeringFilter, setOfferingFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // 상태 변경 모달
  const [statusTarget, setStatusTarget] = useState<CbEnrollment | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [actingStatus, setActingStatus] = useState(false)

  // 강제 탈퇴 confirm
  const [withdrawTarget, setWithdrawTarget] = useState<CbEnrollment | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminEnrollmentApi.list(token, {
        semester_id: semFilter ? Number(semFilter) : undefined,
        offering_id: offeringFilter ? Number(offeringFilter) : undefined,
        status: statusFilter || undefined,
        q: search || undefined,
        page,
      })
      setData(res)
    } catch {
      toast.error('수강신청 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, semFilter, offeringFilter, statusFilter, search, page])

  useEffect(() => {
    if (!token) return
    adminSemesterApi.list(token).then(setSemesters).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token || !semFilter) { setOfferings([]); setOfferingFilter(''); return }
    adminOfferingApi.list(token, { semester_id: Number(semFilter), page: 1 })
      .then((r) => setOfferings(r.data))
      .catch(() => {})
  }, [token, semFilter])

  useEffect(() => { load() }, [load])

  const handleStatusUpdate = async () => {
    if (!token || !statusTarget || !newStatus) return
    setActingStatus(true)
    try {
      await adminEnrollmentApi.updateStatus(token, statusTarget.id, newStatus)
      toast.success('상태가 변경되었습니다.')
      setStatusTarget(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '변경 실패')
    } finally {
      setActingStatus(false)
    }
  }

  const handleWithdraw = async () => {
    if (!token || !withdrawTarget) return
    setWithdrawing(true)
    try {
      await adminEnrollmentApi.withdraw(token, withdrawTarget.id)
      toast.success('강제 탈퇴 처리되었습니다.')
      setWithdrawTarget(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '처리 실패')
    } finally {
      setWithdrawing(false)
    }
  }

  const semOptions = semesters.map((s) => ({ value: String(s.id), label: `${s.year}년 ${TERM_LABEL[s.term]}` }))
  const offeringOptions = offerings.map((o) => ({ value: String(o.id), label: `#${o.id} ${o.course?.title ?? ''}` }))

  return (
    <div>
      <PageHeader title="수강신청 현황" description="수강신청 목록을 조회하고 관리합니다." />

      <div className="p-6 space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="이름·이메일 검색"
          selects={[
            { value: semFilter, onChange: (v) => { setSemFilter(v); setPage(1) }, options: semOptions, placeholder: '학기 전체' },
            { value: offeringFilter, onChange: (v) => { setOfferingFilter(v); setPage(1) }, options: offeringOptions, placeholder: '분반 전체' },
            { value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1) }, options: ENROLLMENT_STATUS_OPTIONS, placeholder: '상태 전체' },
          ]}
          onReset={() => { setSearch(''); setSemFilter(''); setOfferingFilter(''); setStatusFilter(''); setPage(1) }}
        />

        <DataTable
          loading={loading}
          rows={data?.data ?? []}
          rowKey={(e) => e.id}
          emptyMessage="수강신청 내역이 없습니다."
          columns={[
            { key: 'id', label: 'ID', className: 'w-12', render: (e) => <span className="text-muted-foreground text-xs">#{e.id}</span> },
            {
              key: 'user', label: '학습자', render: (e) => (
                <div>
                  <p className="font-medium text-sm">{e.user?.name ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{e.user?.email ?? ''}</p>
                </div>
              ),
            },
            { key: 'course', label: '강좌', render: (e) => <span className="text-sm">{e.course?.title ?? '-'}</span> },
            {
              key: 'semester', label: '학기', render: (e) => {
                const sem = e.offering?.semester
                return <span className="text-sm">{sem ? `${sem.year}년 ${TERM_LABEL[sem.term]}` : '-'}</span>
              },
            },
            { key: 'enrolled_at', label: '신청일', render: (e) => <span className="text-xs text-muted-foreground">{e.enrolled_at?.slice(0, 10)}</span> },
            { key: 'status', label: '상태', render: (e) => <StatusBadge status={e.status} /> },
            {
              key: 'actions', label: '', className: 'text-right w-32', render: (e) => (
                <div className="flex justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <Button
                    variant="ghost" size="sm" className="h-7 text-xs"
                    onClick={() => { setStatusTarget(e); setNewStatus(e.status) }}
                  >
                    상태변경
                  </Button>
                  {e.status !== 'withdrawn' && (
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => setWithdrawTarget(e)}
                    >
                      탈퇴
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>총 {data.total.toLocaleString()}명</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
              <span className="flex items-center px-2">{page} / {data.last_page}</span>
              <Button variant="ghost" size="sm" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>다음</Button>
            </div>
          </div>
        )}
      </div>

      {/* 상태 변경 모달 */}
      <Dialog open={!!statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>수강 상태 변경</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>{statusTarget?.user?.name}</strong>의 &quot;<strong>{statusTarget?.course?.title}</strong>&quot; 수강 상태를 변경합니다.
            </p>
            <div className="space-y-1">
              <Label>새 상태</Label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusTarget(null)}>취소</Button>
            <Button onClick={handleStatusUpdate} disabled={actingStatus}>
              {actingStatus ? '변경 중...' : '변경'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!withdrawTarget}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={handleWithdraw}
        title={`${withdrawTarget?.user?.name}의 수강을 강제 탈퇴 처리하시겠습니까?`}
        description="탈퇴 처리된 수강은 되돌릴 수 없습니다."
        confirmLabel="탈퇴 처리"
        destructive
        loading={withdrawing}
      />
    </div>
  )
}
