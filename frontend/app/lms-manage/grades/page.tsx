'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminRecordApi, adminSemesterApi, adminOfferingApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { EmptyState } from '@/components/admin/EmptyState'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { BarChart2 } from 'lucide-react'
import type { AcademicRecord, AcademicRecordPaginated, Semester, Offering } from '@/types/credit-bank'

const TERM_LABEL: Record<string, string> = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }

const GRADE_COLOR: Record<string, string> = {
  'A+': 'text-emerald-600 font-bold',
  'A': 'text-emerald-600 font-medium',
  'B+': 'text-blue-600 font-bold',
  'B': 'text-blue-600 font-medium',
  'C+': 'text-yellow-600 font-bold',
  'C': 'text-yellow-600',
  'D+': 'text-orange-600 font-bold',
  'D': 'text-orange-600',
  'F': 'text-destructive font-bold',
}

const emptyScoreForm = () => ({
  attendance_score: '',
  assignment_score: '',
  midterm_score: '',
  final_score: '',
})

export default function GradesPage() {
  const { token } = useAdminAuthStore()
  const [data, setData] = useState<AcademicRecordPaginated | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [offerings, setOfferings] = useState<Offering[]>([])
  const [loading, setLoading] = useState(true)
  const [semFilter, setSemFilter] = useState('')
  const [offeringFilter, setOfferingFilter] = useState('')
  const [page, setPage] = useState(1)

  // 점수 입력 모달
  const [scoreTarget, setScoreTarget] = useState<AcademicRecord | null>(null)
  const [scoreForm, setScoreForm] = useState(emptyScoreForm())
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!token || !offeringFilter) return
    setLoading(true)
    try {
      const res = await adminRecordApi.list(token, {
        semester_id: semFilter ? Number(semFilter) : undefined,
        offering_id: offeringFilter ? Number(offeringFilter) : undefined,
        page,
      })
      setData(res)
    } catch {
      toast.error('성적 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, semFilter, offeringFilter, page])

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

  useEffect(() => { if (offeringFilter) load() }, [load, offeringFilter])

  const openScoreEdit = (rec: AcademicRecord) => {
    setScoreTarget(rec)
    setScoreForm({
      attendance_score: String(rec.attendance_score ?? ''),
      assignment_score: String(rec.assignment_score ?? ''),
      midterm_score: rec.midterm_score != null ? String(rec.midterm_score) : '',
      final_score: rec.final_score != null ? String(rec.final_score) : '',
    })
  }

  const handleScoreSave = async () => {
    if (!token || !scoreTarget) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      if (scoreForm.attendance_score !== '') payload.attendance_score = Number(scoreForm.attendance_score)
      if (scoreForm.assignment_score !== '') payload.assignment_score = Number(scoreForm.assignment_score)
      if (scoreForm.midterm_score !== '') payload.midterm_score = Number(scoreForm.midterm_score)
      else payload.midterm_score = null
      if (scoreForm.final_score !== '') payload.final_score = Number(scoreForm.final_score)
      else payload.final_score = null

      await adminRecordApi.updateScores(token, scoreTarget.enrollment_id, payload)
      toast.success('성적이 저장되었습니다.')
      setScoreTarget(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '저장 실패')
    } finally {
      setSaving(false)
    }
  }

  const semOptions = semesters.map((s) => ({ value: String(s.id), label: `${s.year}년 ${TERM_LABEL[s.term]}` }))
  const offeringOptions = offerings.map((o) => ({ value: String(o.id), label: `#${o.id} ${o.course?.title ?? ''}` }))

  const needsFilter = !offeringFilter

  return (
    <div>
      <PageHeader title="출석·성적 관리" description="분반을 선택하면 수강생 성적을 조회·입력할 수 있습니다." />

      <div className="p-6 space-y-4">
        {/* 필터 (학기 선택 → 분반 선택) */}
        <div className="flex flex-wrap gap-2">
          <select
            value={semFilter}
            onChange={(e) => { setSemFilter(e.target.value); setPage(1) }}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">학기 선택</option>
            {semOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={offeringFilter}
            onChange={(e) => { setOfferingFilter(e.target.value); setPage(1) }}
            disabled={!semFilter}
            className="h-8 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
          >
            <option value="">분반 선택</option>
            {offeringOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {needsFilter ? (
          <EmptyState
            icon={BarChart2}
            title="학기와 분반을 선택하세요"
            description="성적을 조회하려면 먼저 학기와 분반을 선택해야 합니다."
          />
        ) : (
          <>
            <DataTable
              loading={loading}
              rows={data?.data ?? []}
              rowKey={(r) => r.id}
              emptyMessage="성적 데이터가 없습니다."
              columns={[
                {
                  key: 'user', label: '학습자', render: (r) => (
                    <div>
                      <p className="font-medium text-sm">{r.enrollment?.user?.name ?? '-'}</p>
                      <p className="text-xs text-muted-foreground">{r.enrollment?.user?.email ?? ''}</p>
                    </div>
                  ),
                },
                { key: 'attend', label: '출석(30%)', className: 'text-right', render: (r) => <span className="text-sm">{r.attendance_score ?? '-'}</span> },
                { key: 'assign', label: '과제(20%)', className: 'text-right', render: (r) => <span className="text-sm">{r.assignment_score ?? '-'}</span> },
                { key: 'mid', label: '중간(20%)', className: 'text-right', render: (r) => <span className="text-sm">{r.midterm_score ?? '-'}</span> },
                { key: 'final', label: '기말(30%)', className: 'text-right', render: (r) => <span className="text-sm">{r.final_score ?? '-'}</span> },
                {
                  key: 'total', label: '총점', className: 'text-right font-medium', render: (r) => (
                    <span className="text-sm font-medium">{r.total_score ?? '-'}</span>
                  ),
                },
                {
                  key: 'grade', label: '등급', className: 'text-center', render: (r) => (
                    <span className={`text-sm ${r.final_grade ? GRADE_COLOR[r.final_grade] ?? '' : 'text-muted-foreground'}`}>
                      {r.final_grade ?? '-'}
                    </span>
                  ),
                },
                {
                  key: 'pass', label: '합격', className: 'text-center', render: (r) => (
                    r.pass_yn == null
                      ? <span className="text-xs text-muted-foreground">-</span>
                      : r.pass_yn
                        ? <span className="text-xs text-emerald-600 font-medium">합격</span>
                        : <span className="text-xs text-destructive font-medium">불합격</span>
                  ),
                },
                {
                  key: 'actions', label: '', className: 'text-right', render: (r) => (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => openScoreEdit(r)}>
                      점수 입력
                    </Button>
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
          </>
        )}
      </div>

      {/* 점수 입력 모달 */}
      <Dialog open={!!scoreTarget} onOpenChange={(o) => !o && setScoreTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>점수 입력 — {scoreTarget?.enrollment?.user?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              총점 = 출석×0.3 + 과제×0.2 + 중간×0.2 + 기말×0.3, 60점 이상 합격
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>출석 점수 (0~100)</Label>
                <Input type="number" min="0" max="100" value={scoreForm.attendance_score}
                  onChange={(e) => setScoreForm({ ...scoreForm, attendance_score: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>과제 점수 (0~100)</Label>
                <Input type="number" min="0" max="100" value={scoreForm.assignment_score}
                  onChange={(e) => setScoreForm({ ...scoreForm, assignment_score: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>중간고사 (선택)</Label>
                <Input type="number" min="0" max="100" placeholder="미입력 시 0점" value={scoreForm.midterm_score}
                  onChange={(e) => setScoreForm({ ...scoreForm, midterm_score: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>기말고사 (선택)</Label>
                <Input type="number" min="0" max="100" placeholder="미입력 시 0점" value={scoreForm.final_score}
                  onChange={(e) => setScoreForm({ ...scoreForm, final_score: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreTarget(null)}>취소</Button>
            <Button onClick={handleScoreSave} disabled={saving}>{saving ? '저장 중...' : '저장 및 계산'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
