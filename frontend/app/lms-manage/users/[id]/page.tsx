'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { adminUserApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, User, BookOpen } from 'lucide-react'
import type { AdminUser } from '@/types/admin'

const ALL_ROLES = ['student', 'tutor', 'professor', 'admin']
const ROLE_LABELS: Record<string, string> = {
  student: '학생', tutor: '튜터', professor: '교수', admin: '관리자',
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const { token } = useAuthStore()
  const router = useRouter()

  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  // 상태 변경 확인 다이얼로그
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | null>(null)
  const [acting, setActing] = useState(false)

  // 역할 편집 다이얼로그
  const [rolesOpen, setRolesOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [savingRoles, setSavingRoles] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminUserApi.show(token, userId)
      setUser(res)
      setSelectedRoles(res.roles.map((r) => r.code))
    } catch {
      toast.error('회원 정보를 불러오지 못했습니다.')
      router.push('/lms-manage/users')
    } finally {
      setLoading(false)
    }
  }, [token, userId, router])

  useEffect(() => { load() }, [load])

  const handleStatusAction = async () => {
    if (!token || !user || !confirmAction) return
    setActing(true)
    try {
      if (confirmAction === 'suspend') {
        await adminUserApi.suspend(token, user.id)
        toast.success('계정이 정지되었습니다.')
      } else {
        await adminUserApi.activate(token, user.id)
        toast.success('계정이 활성화되었습니다.')
      }
      setConfirmAction(null)
      load()
    } catch {
      toast.error('처리 중 오류가 발생했습니다.')
    } finally {
      setActing(false)
    }
  }

  const handleSaveRoles = async () => {
    if (!token || !user || selectedRoles.length === 0) return
    setSavingRoles(true)
    try {
      await adminUserApi.syncRoles(token, user.id, selectedRoles)
      toast.success('역할이 업데이트되었습니다.')
      setRolesOpen(false)
      load()
    } catch {
      toast.error('역할 업데이트 중 오류가 발생했습니다.')
    } finally {
      setSavingRoles(false)
    }
  }

  const toggleRole = (code: string) => {
    setSelectedRoles((prev) =>
      prev.includes(code) ? prev.filter((r) => r !== code) : [...prev, code]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div>
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/lms-manage/users">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />목록
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="h-8" onClick={() => setRolesOpen(true)}>
              역할 편집
            </Button>
            {user.status === 'active' ? (
              <Button size="sm" variant="destructive" className="h-8"
                onClick={() => setConfirmAction('suspend')}>
                계정 정지
              </Button>
            ) : user.status === 'suspended' ? (
              <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500"
                onClick={() => setConfirmAction('activate')}>
                계정 활성화
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/60 bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-muted-foreground" />기본 정보
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ['이름', user.name],
                ['이메일', user.email],
                ['전화번호', user.phone ?? '—'],
                ['가입일', formatDate(user.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">{label}</dt>
                  <dd className="font-medium text-right truncate">{value}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">상태</dt>
                <dd><StatusBadge status={user.status} /></dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">역할</dt>
                <dd className="flex flex-wrap gap-1 justify-end">
                  {user.roles.map((r) => (
                    <span key={r.code} className="text-xs bg-muted px-1.5 py-0.5 rounded font-medium">
                      {r.name}
                    </span>
                  ))}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">총 수강</dt>
                <dd className="font-medium">{user.enrollments_count}개</dd>
              </div>
            </dl>
          </div>

          {/* 수강 이력 */}
          <div className="rounded-lg border border-border/60 bg-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-muted-foreground" />최근 수강 이력
            </div>
            {!user.enrollments || user.enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">수강 이력이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {user.enrollments.map((e) => (
                  <div key={e.id} className="flex items-start justify-between gap-2 py-1.5 border-b border-border/40 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{e.course?.title ?? '삭제된 강좌'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={e.status} />
                      <span className="text-xs text-muted-foreground">{Math.round(e.progress_pct)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 상태 변경 확인 */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleStatusAction}
        title={confirmAction === 'suspend'
          ? `${user.name} 계정을 정지하시겠습니까?`
          : `${user.name} 계정을 활성화하시겠습니까?`}
        description={confirmAction === 'suspend'
          ? '정지된 계정은 로그인할 수 없습니다.'
          : '계정이 다시 활성화됩니다.'}
        confirmLabel={confirmAction === 'suspend' ? '정지' : '활성화'}
        destructive={confirmAction === 'suspend'}
        loading={acting}
      />

      {/* 역할 편집 */}
      <Dialog open={rolesOpen} onOpenChange={setRolesOpen}>
        <DialogContent className="sm:max-w-xs">
          <div className="space-y-4">
            <h2 className="text-base font-semibold">역할 편집</h2>
            <p className="text-xs text-muted-foreground">{user.name}의 역할을 선택하세요.</p>
            <div className="space-y-2">
              {ALL_ROLES.map((code) => (
                <label key={code} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(code)}
                    onChange={() => toggleRole(code)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm group-hover:text-foreground transition-colors">
                    {ROLE_LABELS[code]}
                  </span>
                </label>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-destructive">최소 1개의 역할을 선택해야 합니다.</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setRolesOpen(false)} disabled={savingRoles}>취소</Button>
              <Button size="sm" onClick={handleSaveRoles}
                disabled={savingRoles || selectedRoles.length === 0}>
                {savingRoles ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
