'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { adminCourseApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { AdminCourse, AdminCoursePaginated } from '@/types/admin'

const TYPE_OPTIONS = [
  { value: 'certificate', label: '자격증' },
  { value: 'credit_bank', label: '학점은행' },
]
const STATUS_OPTIONS = [
  { value: 'draft', label: '초안' },
  { value: 'published', label: '공개' },
  { value: 'closed', label: '종료' },
]

type ConfirmType = 'approve' | 'close'

export default function AdminCoursesPage() {
  const { token } = useAuthStore()
  const router = useRouter()
  const [data, setData] = useState<AdminCoursePaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [courseType, setCourseType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const [confirmCourse, setConfirmCourse] = useState<AdminCourse | null>(null)
  const [confirmType, setConfirmType] = useState<ConfirmType>('approve')
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminCourseApi.list(token, {
        q: search || undefined,
        course_type: courseType || undefined,
        status: status || undefined,
        page,
      })
      setData(res)
    } catch {
      toast.error('강좌 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, courseType, status, page])

  useEffect(() => { load() }, [load])

  const handleConfirm = async () => {
    if (!token || !confirmCourse) return
    setActing(true)
    try {
      if (confirmType === 'approve') {
        await adminCourseApi.approve(token, confirmCourse.id)
        toast.success('강좌가 승인·공개되었습니다.')
      } else {
        await adminCourseApi.close(token, confirmCourse.id)
        toast.success('강좌가 종료되었습니다.')
      }
      setConfirmCourse(null)
      load()
    } catch {
      toast.error('처리 중 오류가 발생했습니다.')
    } finally {
      setActing(false)
    }
  }

  return (
    <div>
      <PageHeader title="강좌 관리" description="강좌 목록 조회, 승인, 종료를 관리합니다." />

      <div className="p-6 space-y-4">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1) }}
          searchPlaceholder="강좌명 검색"
          selects={[
            { value: courseType, onChange: (v) => { setCourseType(v); setPage(1) }, options: TYPE_OPTIONS, placeholder: '유형 전체' },
            { value: status, onChange: (v) => { setStatus(v); setPage(1) }, options: STATUS_OPTIONS, placeholder: '상태 전체' },
          ]}
          onReset={() => { setSearch(''); setCourseType(''); setStatus(''); setPage(1) }}
        />

        <DataTable
          loading={loading}
          rows={data?.data ?? []}
          rowKey={(c) => c.id}
          onRowClick={(c) => router.push(`/lms-manage/courses/${c.id}`)}
          emptyMessage="강좌가 없습니다."
          columns={[
            { key: 'id', label: 'ID', className: 'w-12', render: (c) => <span className="text-muted-foreground text-xs">#{c.id}</span> },
            {
              key: 'title', label: '강좌명', render: (c) => (
                <div>
                  <p className="font-medium text-sm">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.category?.name} · {c.instructor?.name ?? '미지정'}</p>
                </div>
              )
            },
            { key: 'type', label: '유형', render: (c) => <StatusBadge status={c.course_type} /> },
            { key: 'status', label: '상태', render: (c) => <StatusBadge status={c.status} /> },
            { key: 'lessons', label: '차시', className: 'text-right', render: (c) => <span className="text-sm">{c.total_lessons}</span> },
            { key: 'enroll', label: '수강', className: 'text-right', render: (c) => <span className="text-sm">{c.enrollments_count}</span> },
            {
              key: 'actions', label: '', className: 'text-right w-36', render: (c) => (
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <Link href={`/lms-manage/courses/${c.id}/lessons`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">차시</Button>
                  </Link>
                  {c.status === 'draft' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600"
                      onClick={() => { setConfirmCourse(c); setConfirmType('approve') }}>
                      승인
                    </Button>
                  )}
                  {c.status === 'published' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive"
                      onClick={() => { setConfirmCourse(c); setConfirmType('close') }}>
                      종료
                    </Button>
                  )}
                </div>
              )
            },
          ]}
        />

        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>총 {data.total.toLocaleString()}개</span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
              <span className="flex items-center px-2">{page} / {data.last_page}</span>
              <Button variant="ghost" size="sm" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>다음</Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmCourse}
        onClose={() => setConfirmCourse(null)}
        onConfirm={handleConfirm}
        title={confirmType === 'approve' ? `"${confirmCourse?.title}" 강좌를 승인·공개하시겠습니까?` : `"${confirmCourse?.title}" 강좌를 종료하시겠습니까?`}
        description={confirmType === 'approve' ? '승인하면 학습자에게 강좌가 공개됩니다.' : '종료된 강좌는 더 이상 수강신청할 수 없습니다.'}
        confirmLabel={confirmType === 'approve' ? '승인' : '종료'}
        destructive={confirmType === 'close'}
        loading={acting}
      />
    </div>
  )
}
