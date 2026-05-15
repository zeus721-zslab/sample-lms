'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminGradingApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { GradingExamSubmission, GradingExamPaginated, GradingAssignmentSubmission, GradingAssignmentPaginated } from '@/types/admin-assessment'

const EXAM_STATUS_OPTIONS = [
  { value: 'submitted', label: '채점 대기' },
  { value: 'graded', label: '채점 완료' },
  { value: 'in_progress', label: '진행 중' },
]

const GRADED_OPTIONS = [
  { value: 'false', label: '미채점' },
  { value: 'true', label: '채점 완료' },
]

function ExamGradingTab() {
  const { token } = useAdminAuthStore()
  const router = useRouter()
  const [data, setData] = useState<GradingExamPaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('submitted')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminGradingApi.examList(token, { q: search || undefined, status: status || undefined, page })
      setData(res)
    } catch {
      toast.error('시험 응시 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, status, page])

  useEffect(() => { load() }, [load])

  const columns = [
    {
      key: 'user',
      label: '수강생',
      render: (row: GradingExamSubmission) => (
        <div>
          <p className="font-medium">{row.user.name}</p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'exam',
      label: '시험',
      render: (row: GradingExamSubmission) => (
        <div>
          <p className="font-medium truncate max-w-[180px]">{row.exam.title}</p>
          <p className="text-xs text-muted-foreground">{row.exam.course?.title ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'submitted_at',
      label: '제출 시각',
      render: (row: GradingExamSubmission) => (
        <span className="text-sm tabular-nums">{row.submitted_at ? new Date(row.submitted_at).toLocaleString('ko-KR') : '-'}</span>
      ),
    },
    {
      key: 'score',
      label: '점수',
      render: (row: GradingExamSubmission) => (
        row.total_score !== null
          ? <span className={`font-medium tabular-nums ${row.pass_yn ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
              {row.total_score}점 {row.pass_yn ? '합격' : '불합격'}
            </span>
          : <span className="text-muted-foreground text-sm">미채점</span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (row: GradingExamSubmission) => <StatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="space-y-4">
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="수강생 이름·이메일 검색..."
        selects={[
          { value: status, onChange: (v) => { setStatus(v); setPage(1) }, options: EXAM_STATUS_OPTIONS, placeholder: '상태 전체' },
        ]}
        onReset={() => { setSearch(''); setStatus('submitted'); setPage(1) }}
      />
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={loading}
        emptyMessage="채점할 응시 기록이 없습니다."
        onRowClick={(r) => router.push(`/lms-manage/grading/exams/${r.id}`)}
      />
      {data && data.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
          ))}
        </div>
      )}
    </div>
  )
}

function AssignmentGradingTab() {
  const { token } = useAdminAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initAssignmentId = searchParams.get('assignment_id')
  const [data, setData] = useState<GradingAssignmentPaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [graded, setGraded] = useState('false')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminGradingApi.assignmentList(token, {
        q: search || undefined,
        assignment_id: initAssignmentId ? Number(initAssignmentId) : undefined,
        graded: graded || undefined,
        page,
      })
      setData(res)
    } catch {
      toast.error('과제 제출 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, search, graded, page, initAssignmentId])

  useEffect(() => { load() }, [load])

  const columns = [
    {
      key: 'user',
      label: '수강생',
      render: (row: GradingAssignmentSubmission) => (
        <div>
          <p className="font-medium">{row.user.name}</p>
          <p className="text-xs text-muted-foreground">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'assignment',
      label: '과제',
      render: (row: GradingAssignmentSubmission) => (
        <div>
          <p className="font-medium truncate max-w-[180px]">{row.assignment.title}</p>
          <p className="text-xs text-muted-foreground">{row.assignment.course?.title ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'submitted_at',
      label: '제출 시각',
      render: (row: GradingAssignmentSubmission) => (
        <span className="text-sm tabular-nums">{new Date(row.submitted_at).toLocaleString('ko-KR')}</span>
      ),
    },
    {
      key: 'score',
      label: '점수',
      render: (row: GradingAssignmentSubmission) => (
        row.score !== null
          ? <span className="font-medium tabular-nums">{row.score}/{row.assignment.max_score}점</span>
          : <span className="text-muted-foreground text-sm">미채점</span>
      ),
    },
    {
      key: 'graded_at',
      label: '채점일',
      render: (row: GradingAssignmentSubmission) => (
        <span className="text-sm tabular-nums">{row.graded_at ? new Date(row.graded_at).toLocaleDateString('ko-KR') : '-'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="수강생 이름·이메일 검색..."
        selects={[
          { value: graded, onChange: (v) => { setGraded(v); setPage(1) }, options: GRADED_OPTIONS, placeholder: '채점 여부' },
        ]}
        onReset={() => { setSearch(''); setGraded('false'); setPage(1) }}
      />
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={loading}
        emptyMessage="제출된 과제가 없습니다."
        onRowClick={(r) => router.push(`/lms-manage/grading/assignments/${r.id}`)}
      />
      {data && data.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function GradingPage() {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('assignment_id') ? 'assignments' : 'exams'

  return (
    <div>
      <PageHeader title="채점 관리" description="시험·과제 제출물을 채점합니다." />
      <div className="p-6">
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="exams">시험 채점</TabsTrigger>
            <TabsTrigger value="assignments">과제 채점</TabsTrigger>
          </TabsList>
          <TabsContent value="exams"><ExamGradingTab /></TabsContent>
          <TabsContent value="assignments"><AssignmentGradingTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
