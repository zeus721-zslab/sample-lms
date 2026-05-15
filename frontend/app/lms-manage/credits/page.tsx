'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminCreditAppApi, adminSemesterApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import type { CreditApplication, CreditApplicationPaginated, CreditAppStatus, Semester } from '@/types/credit-bank'

const TERM_LABEL: Record<string, string> = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }

const STATUS_OPTIONS = [
  { value: 'requested', label: '신청' },
  { value: 'processing', label: '처리중' },
  { value: 'submitted_to_nile', label: 'NILE제출' },
  { value: 'approved', label: '승인' },
  { value: 'rejected', label: '반려' },
]

const STATUS_TRANSITIONS: Record<CreditAppStatus, CreditAppStatus[]> = {
  requested: ['processing'],
  processing: ['submitted_to_nile', 'rejected'],
  submitted_to_nile: ['approved', 'rejected'],
  approved: [],
  rejected: [],
}

export default function CreditApplicationsPage() {
  const { token } = useAdminAuthStore()
  const [data, setData] = useState<CreditApplicationPaginated | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [semFilter, setSemFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  // status 변경 모달
  const [statusTarget, setStatusTarget] = useState<CreditApplication | null>(null)
  const [newStatus, setNewStatus] = useState<CreditAppStatus>('processing')
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)

  // CSV export 학기 선택
  const [exportSemId, setExportSemId] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminCreditAppApi.list(token, {
        status: statusFilter || undefined,
        semester_id: semFilter ? Number(semFilter) : undefined,
        page,
      })
      setData(res)
    } catch {
      toast.error('학점인정 신청 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, semFilter, statusFilter, page])

  useEffect(() => {
    if (!token) return
    adminSemesterApi.list(token).then(setSemesters).catch(() => {})
  }, [token])

  useEffect(() => { load() }, [load])

  const openStatusChange = (app: CreditApplication) => {
    setStatusTarget(app)
    const nexts = STATUS_TRANSITIONS[app.status]
    setNewStatus(nexts[0] ?? app.status)
    setNote('')
  }

  const handleStatusChange = async () => {
    if (!token || !statusTarget) return
    setActing(true)
    try {
      await adminCreditAppApi.changeStatus(token, statusTarget.id, {
        status: newStatus,
        note: note || undefined,
      })
      toast.success('상태가 변경되었습니다.')
      setStatusTarget(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '변경 실패')
    } finally {
      setActing(false)
    }
  }

  const handleExport = () => {
    if (!token) return
    const semId = exportSemId ? Number(exportSemId) : undefined
    const qs = semId ? `?semester_id=${semId}` : ''
    fetch(`/api/admin/credit-applications/export${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        const sem = semesters.find((s) => String(s.id) === exportSemId)
        const label = sem ? `${sem.year}_${sem.term}` : 'all'
        a.download = `nile_export_${label}_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(a.href)
        toast.success('CSV 다운로드가 시작되었습니다.')
      })
      .catch(() => toast.error('다운로드 실패'))
  }

  const semOptions = semesters.map((s) => ({ value: String(s.id), label: `${s.year}년 ${TERM_LABEL[s.term]}` }))

  return (
    <div>
      <PageHeader
        title="학점인정 신청 관리"
        description="학습자의 학점인정 신청을 처리하고 NILE에 제출합니다."
        actions={
          <div className="flex items-center gap-2">
            <select
              value={exportSemId}
              onChange={(e) => setExportSemId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">전체 학기</option>
              {semOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" />
              NILE CSV 다운로드
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        <FilterBar
          search=""
          onSearchChange={() => {}}
          selects={[
            { value: semFilter, onChange: (v) => { setSemFilter(v); setPage(1) }, options: semOptions, placeholder: '학기 전체' },
            { value: statusFilter, onChange: (v) => { setStatusFilter(v); setPage(1) }, options: STATUS_OPTIONS, placeholder: '상태 전체' },
          ]}
          onReset={() => { setSemFilter(''); setStatusFilter(''); setPage(1) }}
        />

        <DataTable
          loading={loading}
          rows={data?.data ?? []}
          rowKey={(a) => a.id}
          emptyMessage="학점인정 신청이 없습니다."
          columns={[
            { key: 'id', label: 'ID', className: 'w-12', render: (a) => <span className="text-muted-foreground text-xs">#{a.id}</span> },
            {
              key: 'user', label: '신청자', render: (a) => (
                <div>
                  <p className="font-medium text-sm">{a.user?.name ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{a.user?.email ?? ''}</p>
                </div>
              ),
            },
            {
              key: 'semester', label: '학기', render: (a) => (
                <span className="text-sm">{a.semester ? `${a.semester.year}년 ${TERM_LABEL[a.semester.term]}` : '-'}</span>
              ),
            },
            { key: 'applied_at', label: '신청일', render: (a) => <span className="text-xs text-muted-foreground">{a.applied_at?.slice(0, 10)}</span> },
            { key: 'status', label: '상태', render: (a) => <StatusBadge status={a.status} /> },
            {
              key: 'nile', label: 'NILE 제출일', render: (a) => (
                <span className="text-xs text-muted-foreground">{a.nile_submitted_at?.slice(0, 10) ?? '-'}</span>
              ),
            },
            {
              key: 'actions', label: '', className: 'text-right w-24', render: (a) => {
                const hasNext = STATUS_TRANSITIONS[a.status]?.length > 0
                return (
                  <div onClick={(e) => e.stopPropagation()}>
                    {hasNext && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openStatusChange(a)}>
                        처리
                      </Button>
                    )}
                  </div>
                )
              },
            },
          ]}
        />

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>총 {data.total.toLocaleString()}건</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
              <span className="flex items-center px-2">{page} / {data.last_page}</span>
              <Button variant="ghost" size="sm" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>다음</Button>
            </div>
          </div>
        )}
      </div>

      {/* status 변경 모달 */}
      <Dialog open={!!statusTarget} onOpenChange={(o) => !o && setStatusTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>학점인정 신청 처리</DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>{statusTarget?.user?.name}</strong>의 신청을 처리합니다.
            </p>
            <div className="space-y-1">
              <Label>처리 상태</Label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as CreditAppStatus)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {(STATUS_TRANSITIONS[statusTarget?.status ?? 'requested'] ?? []).map((s) => {
                  const opt = STATUS_OPTIONS.find((o) => o.value === s)
                  return <option key={s} value={s}>{opt?.label ?? s}</option>
                })}
              </select>
            </div>
            <div className="space-y-1">
              <Label>메모 (선택)</Label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                placeholder="처리 메모를 입력하세요..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusTarget(null)}>취소</Button>
            <Button onClick={handleStatusChange} disabled={acting}>{acting ? '처리 중...' : '확인'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
