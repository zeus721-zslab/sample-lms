'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminCertIssueApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import type { AdminCertificateIssue, AdminCertificateIssuePaginated } from '@/types/admin-certificate'

const STATUS_OPTIONS = [
  { value: 'active', label: '유효' },
  { value: 'revoked', label: '회수됨' },
]

function ManualIssueDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const { token } = useAdminAuthStore()
  const [form, setForm] = useState({ user_id: '', certificate_id: '', enrollment_id: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) setForm({ user_id: '', certificate_id: '', enrollment_id: '' })
  }, [open])

  const handleSave = async () => {
    if (!token || !form.user_id || !form.certificate_id) { toast.error('필수 항목을 입력하세요.'); return }
    setSaving(true)
    try {
      await adminCertIssueApi.manual(token, {
        user_id: Number(form.user_id),
        certificate_id: Number(form.certificate_id),
        enrollment_id: form.enrollment_id ? Number(form.enrollment_id) : undefined,
      })
      toast.success('수동 발급이 완료되었습니다.')
      onSaved()
      onClose()
    } catch {
      toast.error('발급에 실패했습니다. 이미 발급된 자격증일 수 있습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>수동 발급</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>회원 ID <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.user_id} onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>자격증 ID <span className="text-destructive">*</span></Label>
              <Input type="number" value={form.certificate_id} onChange={(e) => setForm((p) => ({ ...p, certificate_id: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>수강신청 ID (선택)</Label>
            <Input type="number" value={form.enrollment_id} onChange={(e) => setForm((p) => ({ ...p, enrollment_id: e.target.value }))} placeholder="연결할 수강신청 ID" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? '발급 중...' : '발급'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RevokeDialog({ issue, onClose, onSaved }: { issue: AdminCertificateIssue | null; onClose: () => void; onSaved: () => void }) {
  const { token } = useAdminAuthStore()
  const [reason, setReason] = useState('')
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    if (!issue) setReason('')
  }, [issue])

  const handleRevoke = async () => {
    if (!token || !issue || !reason) { toast.error('회수 사유를 입력하세요.'); return }
    setRevoking(true)
    try {
      await adminCertIssueApi.revoke(token, issue.id, reason)
      toast.success('회수되었습니다.')
      onSaved()
      onClose()
    } catch {
      toast.error('회수에 실패했습니다.')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <Dialog open={!!issue} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>자격증 회수</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            <strong>{issue?.user.name}</strong> ({issue?.certificate.name}) 자격증을 회수합니다.
          </p>
          <div className="space-y-1.5">
            <Label>회수 사유 <span className="text-destructive">*</span></Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="회수 사유를 입력하세요." className="resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={revoking}>{revoking ? '처리 중...' : '회수'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminCertificateIssuesPage() {
  const { token } = useAdminAuthStore()
  const [data, setData] = useState<AdminCertificateIssuePaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [manualOpen, setManualOpen] = useState(false)
  const [revokeIssue, setRevokeIssue] = useState<AdminCertificateIssue | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminCertIssueApi.list(token, { q: search || undefined, status: status || undefined, page })
      setData(res)
    } catch {
      toast.error('발급 이력을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, status, page])

  useEffect(() => { load() }, [load])

  const columns = [
    {
      key: 'user',
      label: '수강생',
      render: (row: AdminCertificateIssue) => (
        <div>
          <p className="font-medium">{row.user.name}</p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'certificate',
      label: '자격증',
      render: (row: AdminCertificateIssue) => (
        <div>
          <p className="font-medium truncate max-w-[160px]">{row.certificate.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.certificate.code}</p>
        </div>
      ),
    },
    {
      key: 'serial_no',
      label: '일련번호',
      render: (row: AdminCertificateIssue) => <span className="text-xs font-mono">{row.serial_no}</span>,
    },
    {
      key: 'issued_at',
      label: '발급일',
      render: (row: AdminCertificateIssue) => (
        <span className="text-sm tabular-nums">{new Date(row.issued_at).toLocaleDateString('ko-KR')}</span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (row: AdminCertificateIssue) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row: AdminCertificateIssue) => (
        row.status === 'active'
          ? <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setRevokeIssue(row) }}>회수</Button>
          : <span className="text-xs text-muted-foreground">{row.revoked_reason?.slice(0, 20)}</span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="발급 내역"
        actions={<Button size="sm" onClick={() => setManualOpen(true)}><UserPlus className="h-4 w-4 mr-1.5" />수동 발급</Button>}
      />
      <div className="p-6 space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="일련번호·이름 검색..."
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
          emptyMessage="발급 이력이 없습니다."
        />
        {data && data.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
              <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
            ))}
          </div>
        )}
      </div>

      <ManualIssueDialog open={manualOpen} onClose={() => setManualOpen(false)} onSaved={load} />
      <RevokeDialog issue={revokeIssue} onClose={() => setRevokeIssue(null)} onSaved={load} />
    </div>
  )
}
