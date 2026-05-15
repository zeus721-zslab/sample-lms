'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, CalendarDays, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth'
import { enrollmentApi, orderApi, semesterApi, ApiError } from '@/lib/api'
import type { CourseType } from '@/types/course'
import type { Enrollment } from '@/types/enrollment'
import type { Semester } from '@/types/semester'

interface Props {
  courseId: number
  courseType: CourseType
  price: number
  courseTitle: string
}

export function EnrollButton({ courseId, courseType, price, courseTitle }: Props) {
  const router = useRouter()
  const { user, token, isLoaded } = useAuthStore()
  const [existing, setExisting] = useState<Enrollment | null | undefined>(undefined)
  const [currentSemester, setCurrentSemester] = useState<Semester | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (token) {
      enrollmentApi.myList(token).then((list) => {
        const found = list.find((e) => e.course_id === courseId && e.status !== 'withdrawn')
        setExisting(found ?? null)
      }).catch(() => setExisting(null))
    } else {
       
      setExisting(null)
    }

    if (courseType === 'credit_bank') {
      semesterApi.current().then((s) => setCurrentSemester(s)).catch(() => {})
    }
  }, [isLoaded, token, courseId, courseType])

  const handleFreeEnroll = async () => {
    if (!user || !token) {
      router.push(`/login?return_url=${encodeURIComponent('/courses')}`)
      return
    }
    if (existing) {
      router.push(`/my/courses/${existing.id}`)
      return
    }
    setLoading(true)
    try {
      const enrollment = await enrollmentApi.create(token, { course_id: courseId })
      toast.success('수강신청이 완료되었습니다!')
      router.push(`/my/courses/${enrollment.id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422) toast.error('이미 신청한 강좌입니다.')
        else if (err.status === 400) toast.info('학점은행제 강좌는 학기제 운영입니다.')
        else toast.error(err.message)
      } else {
        toast.error('수강신청 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentConfirm = async () => {
    if (!token) return
    setPaymentModalOpen(false)
    setLoading(true)
    try {
      const result = await orderApi.create(token, { course_id: courseId })
      toast.success('결제가 완료되었습니다!')
      router.push(`/my/courses/${result.enrollment.id}`)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 422) toast.error('이미 수강 중인 강좌입니다.')
        else toast.error(err.message)
      } else {
        toast.error('결제 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  // 로딩 중
  if (!isLoaded || existing === undefined) {
    return (
      <Button className="w-full" size="lg" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        확인 중...
      </Button>
    )
  }

  // 학점은행 처리
  if (courseType === 'credit_bank') {
    if (existing) {
      return (
        <Button className="w-full" size="lg" variant="secondary" onClick={() => router.push(`/my/courses/${existing.id}`)}>
          학습 계속하기
        </Button>
      )
    }
    const semId = currentSemester?.status === 'enrolling' ? currentSemester.id : null
    return (
      <Button className="w-full" size="lg" variant="outline" asChild>
        <Link href={semId ? `/semesters/${semId}/offerings` : '/semesters'}>
          <CalendarDays className="mr-2 h-4 w-4" />
          {semId ? '학기 수강신청' : '학사일정 보기'}
        </Link>
      </Button>
    )
  }

  // 이미 수강 중
  if (existing) {
    return (
      <Button className="w-full" size="lg" variant="secondary" onClick={() => router.push(`/my/courses/${existing.id}`)}>
        학습 계속하기
      </Button>
    )
  }

  // 유료 코스
  if (price > 0) {
    return (
      <>
        <Button
          className="w-full"
          size="lg"
          onClick={() => {
            if (!user || !token) {
              router.push(`/login?return_url=${encodeURIComponent('/courses')}`)
              return
            }
            setPaymentModalOpen(true)
          }}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="mr-2 h-4 w-4" />
          )}
          결제하기 (₩{price.toLocaleString('ko-KR')})
        </Button>

        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>결제 확인</DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>아래 강좌를 결제합니다.</p>
                  <div className="rounded-md border p-3 space-y-1 text-foreground">
                    <p className="font-medium">{courseTitle}</p>
                    <p className="text-lg font-bold text-primary">₩{price.toLocaleString('ko-KR')}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ※ 현재 MVP stub 결제로, 확인 즉시 자동 승인됩니다.
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handlePaymentConfirm} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                결제 확인
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // 무료 코스 수강신청
  return (
    <Button className="w-full" size="lg" onClick={handleFreeEnroll} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      수강신청 (무료)
    </Button>
  )
}
