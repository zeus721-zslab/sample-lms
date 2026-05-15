'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminCertVerificationApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import type { AdminVerificationLog, AdminVerificationLogPaginated } from '@/types/admin-certificate'

export default function AdminVerificationsPage() {
  const { token } = useAdminAuthStore()
  const [data, setData] = useState<AdminVerificationLogPaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminCertVerificationApi.list(token, { q: search || undefined, page })
      setData(res)
    } catch {
      toast.error('진위확인 로그를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, page])

  useEffect(() => { load() }, [load])

  const columns = [
    {
      key: 'user',
      label: '소유자',
      render: (row: AdminVerificationLog) => (
        <div>
          <p className="font-medium">{row.user.name}</p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'certificate',
      label: '자격증',
      render: (row: AdminVerificationLog) => (
        <div>
          <p className="font-medium truncate max-w-[160px]">{row.certificate.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{row.serial_no}</p>
        </div>
      ),
    },
    {
      key: 'verifications_count',
      label: '진위확인 횟수',
      render: (row: AdminVerificationLog) => (
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium tabular-nums">{row.verifications_count}회</span>
        </div>
      ),
    },
    {
      key: 'latest_verified_at',
      label: '최근 확인',
      render: (row: AdminVerificationLog) => (
        <span className="text-sm tabular-nums">
          {row.latest_verified_at ? new Date(row.latest_verified_at).toLocaleString('ko-KR') : '-'}
        </span>
      ),
    },
    {
      key: 'latest_verifier_ip',
      label: '최근 IP',
      render: (row: AdminVerificationLog) => (
        <span className="text-xs font-mono text-muted-foreground">{row.latest_verifier_ip ?? '-'}</span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (row: AdminVerificationLog) => (
        <Badge variant={row.status === 'active' ? 'outline' : 'destructive'} className="text-xs">
          {row.status === 'active' ? '유효' : '회수됨'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="진위확인 로그"
        description="자격증 진위확인 요청 기록입니다."
      />
      <div className="p-6 space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="일련번호·이름 검색..."
          onReset={() => { setSearch(''); setPage(1) }}
        />
        <DataTable
          columns={columns}
          rows={data?.data ?? []}
          rowKey={(r) => r.id}
          loading={loading}
          emptyMessage="진위확인 로그가 없습니다."
        />
        {data && data.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
              <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
