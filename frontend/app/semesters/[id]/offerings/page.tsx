'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Search, Loader2, Users, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth'
import { semesterApi, enrollmentApi, ApiError } from '@/lib/api'
import type { CourseOffering, Semester, SemesterTerm } from '@/types/semester'
import type { Enrollment } from '@/types/enrollment'

const TERM_LABEL: Record<SemesterTerm, string> = {
  spring: '봄학기', summer: '하계학기', fall: '가을학기', winter: '동계학기',
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export default function OfferingsPage() {
  const params = useParams()
  const router = useRouter()
  const semesterId = Number(params.id)
  const { user, token, isLoaded } = useAuthStore()

  const [semester, setSemester] = useState<Semester | null>(null)
  const [offerings, setOfferings] = useState<CourseOffering[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  // 신청 확인 모달
  const [modalOffering, setModalOffering] = useState<CourseOffering | null>(null)
  const [enrolling, setEnrolling] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const res = await semesterApi.offerings(semesterId)
      setSemester(res.semester)
      setOfferings(res.offerings)
    } catch {
      toast.error('강좌 정보를 불러올 수 없습니다.')
      router.replace('/semesters')
      return
    }

    if (token) {
      try {
        const list = await enrollmentApi.myList(token)
        setEnrollments(list.filter((e) => e.status !== 'withdrawn'))
      } catch {
        // 인증 오류는 조용히 처리
      }
    }
    setLoading(false)
  }, [semesterId, token, router])

  useEffect(() => {
    if (!isLoaded) return
    loadData()
  }, [isLoaded, loadData])

  const enrolledOfferingIds = new Set(enrollments.map((e) => e.offering_id).filter(Boolean))

  const filtered = offerings.filter((o) =>
    !query || o.course.title.toLowerCase().includes(query.toLowerCase()),
  )

  const isEnrollingOpen = semester?.status === 'enrolling'

  // 수강신청 실행
  const handleEnroll = async () => {
    if (!modalOffering || !token) return
    setEnrolling(true)
    try {
      const enrollment = await enrollmentApi.create(token, {
        course_id: modalOffering.course_id,
        offering_id: modalOffering.id,
      })
      toast.success('수강신청이 완료되었습니다!')
      setEnrollments((prev) => [...prev, enrollment])
      // current_students 즉시 갱신
      setOfferings((prev) =>
        prev.map((o) =>
          o.id === modalOffering.id
            ? { ...o, current_students: o.current_students + 1, remaining: o.remaining - 1 }
            : o,
        ),
      )
      setModalOffering(null)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message)
      } else {
        toast.error('수강신청 중 오류가 발생했습니다.')
      }
    } finally {
      setEnrolling(false)
    }
  }

  // 취소
  const handleCancel = async (enrollmentId: number, offeringId: number) => {
    if (!token) return
    try {
      await enrollmentApi.cancel(token, enrollmentId)
      toast.success('수강신청이 취소되었습니다.')
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId))
      setOfferings((prev) =>
        prev.map((o) =>
          o.id === offeringId
            ? {
                ...o,
                current_students: Math.max(0, o.current_students - 1),
                remaining: o.remaining + 1,
                status: o.status === 'full' && o.remaining + 1 > 0 ? 'open' : o.status,
              }
            : o,
        ),
      )
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : '취소 중 오류가 발생했습니다.')
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!semester) return null

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* 브레드크럼 */}
      <Link href="/semesters" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-5">
        <ChevronLeft className="h-4 w-4" /> 학사일정
      </Link>

      {/* 학기 헤더 */}
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-bold">
          {semester.year} {TERM_LABEL[semester.term]} 개설강좌
        </h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {semester.enroll_start_at && (
            <span>수강신청: {formatDate(semester.enroll_start_at)} ~ {formatDate(semester.enroll_end_at)}</span>
          )}
          {semester.class_start_at && (
            <span>수업기간: {formatDate(semester.class_start_at)} ~ {formatDate(semester.class_end_at)}</span>
          )}
          <span className={`font-medium ${
            isEnrollingOpen ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'
          }`}>
            {semester.status === 'enrolling' ? '수강신청 중' :
             semester.status === 'active' ? '수업 진행 중' :
             semester.status === 'planned' ? '신청 예정' : '종료'}
          </span>
        </div>
        {!isEnrollingOpen && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            수강신청 기간이 아닙니다. 신청 버튼이 비활성화됩니다.
          </p>
        )}
        {!user && (
          <p className="text-xs text-muted-foreground mt-1">
            수강신청하려면{' '}
            <Link href="/login" className="text-primary hover:underline">로그인</Link>
            이 필요합니다.
          </p>
        )}
      </div>

      {/* 검색 */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="강좌명 검색..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* 개설강좌 테이블 */}
      <div className="rounded-lg border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-10">#</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">강좌명</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-14">학점</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-28">튜터</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-24">
                  <div className="flex items-center justify-center gap-1"><Users className="h-3.5 w-3.5" /> 정원</div>
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-20">잔여석</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground w-28">신청</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <BookOpen className="h-8 w-8 opacity-30 mx-auto mb-2" />
                    <p className="text-sm">검색 결과가 없습니다.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((offering, idx) => {
                  const isEnrolled = enrolledOfferingIds.has(offering.id)
                  const myEnrollment = enrollments.find((e) => e.offering_id === offering.id)
                  const isFull = offering.remaining <= 0 || offering.status !== 'open'
                  const canCancel = isEnrolled && myEnrollment && isEnrollingOpen &&
                    (myEnrollment.status === 'pending' || myEnrollment.status === 'studying')

                  return (
                    <tr
                      key={offering.id}
                      className={`border-b border-border/40 last:border-0 transition-colors ${
                        isEnrolled ? 'bg-primary/5' : 'hover:bg-muted/20'
                      }`}
                    >
                      <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/courses/${offering.course.slug}`}
                          className="font-medium hover:text-primary hover:underline transition-colors"
                        >
                          {offering.course.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {offering.course.credit_hours ?? '-'}학점
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {offering.tutor?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                        {offering.current_students}/{offering.max_students}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {offering.remaining <= 0 ? (
                          <span className="text-xs font-medium text-destructive">마감</span>
                        ) : (
                          <span className={`text-xs font-medium ${
                            offering.remaining <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                          }`}>
                            {offering.remaining}석
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isEnrolled ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-primary">신청완료</span>
                            {canCancel && (
                              <button
                                onClick={() => myEnrollment && handleCancel(myEnrollment.id, offering.id)}
                                className="text-[10px] text-destructive hover:underline"
                              >
                                취소
                              </button>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant={isFull || !isEnrollingOpen ? 'outline' : 'default'}
                            disabled={isFull || !isEnrollingOpen || !user}
                            onClick={() => setModalOffering(offering)}
                            className="h-7 px-3 text-xs"
                          >
                            {isFull ? '마감' : '신청'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 수강신청 확인 모달 */}
      <Dialog open={!!modalOffering} onOpenChange={(o) => { if (!o) setModalOffering(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수강신청 확인</DialogTitle>
            <DialogDescription>아래 강좌를 신청하시겠습니까?</DialogDescription>
          </DialogHeader>

          {modalOffering && (
            <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/30 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">강좌명</span>
                <span className="font-medium text-right max-w-[200px]">{modalOffering.course.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">학점</span>
                <span>{modalOffering.course.credit_hours ?? '-'}학점</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">학기</span>
                <span>{semester.year} {TERM_LABEL[semester.term]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">튜터</span>
                <span>{modalOffering.tutor?.name ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">잔여석</span>
                <span className="text-primary font-medium">{modalOffering.remaining}석</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button variant="outline" size="sm">취소</Button>
            </DialogClose>
            <Button size="sm" onClick={handleEnroll} disabled={enrolling}>
              {enrolling && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              신청하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
