'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminSystemApi, adminUserApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { SessionPolicy, AdminUser } from '@/types/admin'

export default function ConnectionsPage() {
  const { token } = useAdminAuthStore()
  const [policy, setPolicy] = useState<SessionPolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminSystemApi.getSessionPolicy(token)
      setPolicy(res)
    } catch {
      toast.error('세션 정책을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const handleGlobalToggle = async (checked: boolean) => {
    if (!token) return
    setToggling(true)
    try {
      await adminSystemApi.updateSessionPolicy(token, checked)
      setPolicy((p) => p ? { ...p, single_session_enforce: checked } : p)
      toast.success(checked ? '단일 세션 강제가 활성화되었습니다.' : '단일 세션 강제가 비활성화되었습니다.')
    } catch {
      toast.error('세션 정책 변경에 실패했습니다.')
    } finally {
      setToggling(false)
    }
  }

  const handleUserToggle = async (user: AdminUser, checked: boolean) => {
    if (!token) return
    setTogglingUserId(user.id)
    try {
      await adminUserApi.update(token, user.id, { allow_concurrent_session: checked })
      setPolicy((p) => {
        if (!p) return p
        if (checked) {
          const already = p.exceptions.some((e) => e.id === user.id)
          return {
            ...p,
            exceptions: already ? p.exceptions : [...p.exceptions, { ...user, allow_concurrent_session: true }],
          }
        } else {
          return { ...p, exceptions: p.exceptions.filter((e) => e.id !== user.id) }
        }
      })
      toast.success(`${user.name} 동시접속 ${checked ? '허용' : '차단'}`)
    } catch {
      toast.error('변경에 실패했습니다.')
    } finally {
      setTogglingUserId(null)
    }
  }

  const columns = [
    {
      key: 'name',
      label: '이름',
      render: (u: AdminUser) => (
        <div>
          <p className="font-medium text-sm">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (u: AdminUser) => <StatusBadge status={u.status} />,
    },
    {
      key: 'roles',
      label: '역할',
      render: (u: AdminUser) => (
        <span className="text-xs text-muted-foreground">
          {u.roles.map((r) => r.code).join(', ')}
        </span>
      ),
    },
    {
      key: 'allow_concurrent_session',
      label: '동시접속 허용',
      render: (u: AdminUser) => (
        <Switch
          checked={u.allow_concurrent_session}
          disabled={togglingUserId === u.id}
          onCheckedChange={(v) => handleUserToggle(u, v)}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="동시접속 제어"
        description="전역 단일 세션 정책 및 사용자별 예외를 관리합니다."
      />

      <div className="p-6 space-y-8">
        {/* 전역 토글 */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">전역 단일 세션 강제</h2>
            <p className="text-sm text-muted-foreground mt-1">
              활성화 시, 동일 계정으로 새 로그인이 발생하면 기존 세션(토큰)이 모두 만료됩니다.
              아래 예외 목록의 사용자는 이 정책의 영향을 받지 않습니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="global-enforce"
              checked={policy?.single_session_enforce ?? false}
              disabled={loading || toggling}
              onCheckedChange={handleGlobalToggle}
            />
            <Label htmlFor="global-enforce" className="text-sm font-medium cursor-pointer">
              {policy?.single_session_enforce
                ? '단일 세션 강제 ON — 동시접속 차단'
                : '단일 세션 강제 OFF — 동시접속 허용'}
            </Label>
          </div>
        </div>

        {/* 예외 사용자 DataTable */}
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">동시접속 허용 예외</h2>
            <p className="text-sm text-muted-foreground mt-1">
              allow_concurrent_session = true 인 사용자 목록입니다.
              회원 목록에서도 개별 토글을 통해 예외를 추가·제거할 수 있습니다.
            </p>
          </div>
          <DataTable
            columns={columns}
            rows={policy?.exceptions ?? []}
            rowKey={(u) => u.id}
            loading={loading}
            emptyMessage="동시접속 예외 사용자가 없습니다."
          />
        </div>
      </div>
    </div>
  )
}
