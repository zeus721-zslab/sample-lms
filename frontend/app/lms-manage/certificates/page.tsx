'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminCertMasterApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, Award } from 'lucide-react'
import type { AdminCertificate, AdminCertificatePaginated } from '@/types/admin-certificate'

function CertFormDialog({
  open,
  cert,
  onClose,
  onSaved,
}: {
  open: boolean
  cert: AdminCertificate | null
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAdminAuthStore()
  const [form, setForm] = useState({ code: '', name: '', issuer: '', required_pass_yn: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (cert) {
      setForm({ code: cert.code, name: cert.name, issuer: cert.issuer ?? '', required_pass_yn: cert.required_pass_yn })
    } else {
      setForm({ code: '', name: '', issuer: '', required_pass_yn: true })
    }
  }, [cert, open])

  const handleSave = async () => {
    if (!token || !form.code || !form.name) { toast.error('필수 항목을 입력하세요.'); return }
    setSaving(true)
    try {
      if (cert) {
        await adminCertMasterApi.update(token, cert.id, form)
        toast.success('수정되었습니다.')
      } else {
        await adminCertMasterApi.create(token, form)
        toast.success('자격증이 생성되었습니다.')
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cert ? '자격증 수정' : '자격증 생성'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>코드 <span className="text-destructive">*</span></Label>
              <Input value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} placeholder="CERT-001" disabled={!!cert} />
            </div>
            <div className="space-y-1.5">
              <Label>발급 기관</Label>
              <Input value={form.issuer} onChange={(e) => setForm((p) => ({ ...p, issuer: e.target.value }))} placeholder="zslab" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>자격증명 <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="pass-required"
              checked={form.required_pass_yn}
              onCheckedChange={(v) => setForm((p) => ({ ...p, required_pass_yn: v }))}
            />
            <Label htmlFor="pass-required" className="cursor-pointer">시험 합격 필수</Label>
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

export default function AdminCertificatesPage() {
  const { token } = useAdminAuthStore()
  const router = useRouter()
  const [data, setData] = useState<AdminCertificatePaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editCert, setEditCert] = useState<AdminCertificate | null>(null)
  const [deleteCert, setDeleteCert] = useState<AdminCertificate | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminCertMasterApi.list(token, { q: search || undefined, page })
      setData(res)
    } catch {
      toast.error('자격증 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!token || !deleteCert) return
    setDeleting(true)
    try {
      await adminCertMasterApi.destroy(token, deleteCert.id)
      toast.success('삭제되었습니다.')
      setDeleteCert(null)
      load()
    } catch {
      toast.error('삭제에 실패했습니다. 발급 이력이 있는 자격증은 삭제할 수 없습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: '자격증명',
      render: (row: AdminCertificate) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{row.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'issuer',
      label: '발급 기관',
      render: (row: AdminCertificate) => <span className="text-sm">{row.issuer ?? '-'}</span>,
    },
    {
      key: 'courses',
      label: '연결 강좌',
      render: (row: AdminCertificate) => <span className="tabular-nums">{row.courses_count}개</span>,
    },
    {
      key: 'issues',
      label: '발급 수',
      render: (row: AdminCertificate) => <span className="tabular-nums">{row.issues_count}건</span>,
    },
    {
      key: 'required_pass_yn',
      label: '합격 필수',
      render: (row: AdminCertificate) => (
        <span className={`text-xs font-medium ${row.required_pass_yn ? 'text-amber-600' : 'text-muted-foreground'}`}>
          {row.required_pass_yn ? '필수' : '선택'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row: AdminCertificate) => (
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditCert(row); setFormOpen(true) }}>수정</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteCert(row) }}>삭제</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="자격증 마스터"
        actions={<Button size="sm" onClick={() => { setEditCert(null); setFormOpen(true) }}><Plus className="h-4 w-4 mr-1.5" />자격증 추가</Button>}
      />
      <div className="p-6 space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="자격증명·코드 검색..."
          onReset={() => { setSearch(''); setPage(1) }}
        />
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          emptyMessage="등록된 자격증이 없습니다."
          onRowClick={(r) => router.push(`/lms-manage/certificates/${r.id}`)}
        />
        {data && data.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
              <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
            ))}
          </div>
        )}
      </div>

      <CertFormDialog open={formOpen} cert={editCert} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!deleteCert}
        title="자격증 삭제"
        description={`"${deleteCert?.name}" 자격증을 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteCert(null)}
      />
    </div>
  )
}
