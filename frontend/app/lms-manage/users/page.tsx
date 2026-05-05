'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminUserApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { AdminUser, AdminUserPaginated } from '@/types/admin'

const ROLE_OPTIONS = [
  { value: 'student', label: '학생' },
  { value: 'tutor', label: '튜터' },
  { value: 'professor', label: '교수' },
  { value: 'admin', label: '관리자' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: '활성' },
  { value: 'suspended', label: '정지' },
  { value: 'withdrawn', label: '탈퇴' },
]

export default function AdminUsersPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<AdminUserPaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null)
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate'>('suspend')
  const [acting, setActing] = useState(false)
  const [concurrentTogglingId, setConcurrentTogglingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminUserApi.list(token, { q: search || undefined, role: role || undefined, status: status || undefined, page })
      setData(res)
    } catch {
      toast.error('회원 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, role, status, page])

  useEffect(() => { load() }, [load])

  const handleConcurrentToggle = async (user: AdminUser, checked: boolean) => {
    if (!token) return
    setConcurrentTogglingId(user.id)
    try {
      await adminUserApi.update(token, user.id, { allow_concurrent_session: checked })
      toast.success(`${user.name} 동시접속 ${checked ? '허용' : '차단'}`)
      load()
    } catch {
      toast.error('변경에 실패했습니다.')
    } finally {
      setConcurrentTogglingId(null)
    }
  }

  const handleAction = async () => {
    if (!token || !confirmUser) return
    setActing(true)
    try {
      if (confirmAction === 'suspend') {
        await adminUserApi.suspend(token, confirmUser.id)
        toast.success('계정이 정지되었습니다.')
      } else {
        await adminUserApi.activate(token, confirmUser.id)
        toast.success('계정이 활성화되었습니다.')
      }
      setConfirmUser(null)
      load()
    } catch {
      toast.error('처리 중 오류가 발생했습니다.')
    } finally {
      setActing(false)
    }
  }

  return (
    <div>
      <PageHeader title="회원 관리" description="등록된 회원 목록을 조회하고 관리합니다." />

      <div className="p-6 space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="이름·이메일 검색"
          selects={[
            { value: role, onChange: (v) => { setRole(v); setPage(1) }, options: ROLE_OPTIONS, placeholder: '역할 전체' },
            { value: status, onChange: (v) => { setStatus(v); setPage(1) }, options: STATUS_OPTIONS, placeholder: '상태 전체' },
          ]}
          onReset={() => { setSearch(''); setRole(''); setStatus(''); setPage(1) }}
        />

        <DataTable
          loading={loading}
          rows={data?.data ?? []}
          rowKey={(u) => u.id}
          onRowClick={(u) => router.push(`/lms-manage/users/${u.id}`)}
          emptyMessage="검색 결과가 없습니다."
          columns={[
            { key: 'id', label: 'ID', className: 'w-12', render: (u) => <span className="text-muted-foreground text-xs">#{u.id}</span> },
            {
              key: 'name', label: '이름', render: (u) => (
                <div>
                  <p className="font-medium text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
              )
            },
            {
              key: 'roles', label: '역할', render: (u) => (
                <div className="flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <span key={r.code} className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.name}</span>
                  ))}
                </div>
              )
            },
            { key: 'status', label: '상태', render: (u) => <StatusBadge status={u.status} /> },
            { key: 'enrollments', label: '수강', className: 'text-right', render: (u) => <span className="text-sm">{u.enrollments_count}</span> },
            {
              key: 'concurrent', label: '동시접속', className: 'text-center',
              render: (u) => (
                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                  <Switch
                    checked={!!u.allow_concurrent_session}
                    disabled={concurrentTogglingId === u.id}
                    onCheckedChange={(v) => handleConcurrentToggle(u, v)}
                  />
                </div>
              )
            },
            {
              key: 'actions', label: '', className: 'text-right', render: (u) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {u.status === 'active' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => { setConfirmUser(u); setConfirmAction('suspend') }}
                    >
                      정지
                    </Button>
                  ) : u.status === 'suspended' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-emerald-600"
                      onClick={() => { setConfirmUser(u); setConfirmAction('activate') }}
                    >
                      활성화
                    </Button>
                  ) : null}
                </div>
              )
            },
          ]}
        />

        {/* 페이지네이션 */}
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

      <ConfirmDialog
        open={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleAction}
        title={confirmAction === 'suspend' ? `${confirmUser?.name} 계정을 정지하시겠습니까?` : `${confirmUser?.name} 계정을 활성화하시겠습니까?`}
        description={confirmAction === 'suspend' ? '정지된 계정은 로그인할 수 없습니다.' : '계정이 다시 활성화됩니다.'}
        confirmLabel={confirmAction === 'suspend' ? '정지' : '활성화'}
        destructive={confirmAction === 'suspend'}
        loading={acting}
      />
    </div>
  )
}
