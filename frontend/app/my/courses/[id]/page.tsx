'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  Loader2,
  FileText,
  ClipboardList,
  Clock,
  Trophy,
  AlertCircle,
  Award,
  Download,
  Play,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { VideoPlayer } from '@/components/player/VideoPlayer'
import { useAuthStore } from '@/store/auth'
import { enrollmentApi, progressApi, examApi, assignmentApi, certificateApi, ApiError } from '@/lib/api'
import type { EnrollmentDetail, Lesson, Progress } from '@/types/enrollment'
import type { ExamListItem } from '@/types/exam'
import type { AssignmentListItem } from '@/types/assignment'
import type { CertificateIssue } from '@/types/certificate'

function groupByChapter(lessons: Lesson[]): Map<number, Lesson[]> {
  const map = new Map<number, Lesson[]>()
  for (const l of lessons) {
    if (!map.has(l.chapter)) map.set(l.chapter, [])
    map.get(l.chapter)!.push(l)
  }
  return map
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function calcDday(dueAt: string): string {
  const diff = new Date(dueAt).getTime() - Date.now()
  if (diff <= 0) return '마감'
  const days = Math.ceil(diff / 86_400_000)
  return days === 0 ? 'D-day' : `D-${days}`
}

const EXAM_TYPE_LABEL: Record<string, string> = {
  quiz: '퀴즈', midterm: '중간고사', final: '기말고사',
}

/** 이어보기 차시 계산: 미완료 중 progress_pct 가장 높은 차시, 없으면 첫 번째 */
function findResumeLesson(lessons: Lesson[], progMap: Map<number, Progress>): Lesson {
  const inProgress = lessons
    .filter((l) => !progMap.get(l.id)?.completed_at && (progMap.get(l.id)?.progress_pct ?? 0) > 0)
    .sort((a, b) => (progMap.get(b.id)?.progress_pct ?? 0) - (progMap.get(a.id)?.progress_pct ?? 0))
  return inProgress[0] ?? lessons.find((l) => !progMap.get(l.id)?.completed_at) ?? lessons[0]
}

export default function LearningPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isLoaded } = useAuthStore()
  const enrollmentId = Number(params.id)

  const [detail, setDetail] = useState<EnrollmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentLessonId, setCurrentLessonId] = useState<number | null>(null)
  const [progMap, setProgMap] = useState<Map<number, Progress>>(new Map())
  const [exams, setExams] = useState<ExamListItem[]>([])
  const [assignments, setAssignments] = useState<AssignmentListItem[]>([])
  const [sidebarTab, setSidebarTab] = useState<'lessons' | 'exams' | 'assignments'>('lessons')
  const [certIssue, setCertIssue] = useState<CertificateIssue | null | undefined>(undefined)
  const [certIssuing, setCertIssuing] = useState(false)
  const [certDownloading, setCertDownloading] = useState(false)

  // 시작 화면 / 이어보기
  const [isStarted, setIsStarted] = useState(false)
  const [startTime, setStartTime] = useState(0)

  const watchedRef = useRef<number>(0)
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // sendBeacon / keepalive용 stable refs (stale closure 방지)
  const tokenRef = useRef<string | null>(null)
  const currentLessonIdRef = useRef<number | null>(null)
  useEffect(() => { tokenRef.current = token }, [token])
  useEffect(() => { currentLessonIdRef.current = currentLessonId }, [currentLessonId])

  const loadDetail = useCallback(async (tkn: string) => {
    try {
      const d = await enrollmentApi.myDetail(tkn, enrollmentId)
      setDetail(d)
      const map = new Map<number, Progress>()
      for (const p of d.progresses) map.set(p.lesson_id, p)
      setProgMap(map)

      // 이어보기 차시 결정 (시작 화면에서만 사용)
      const lessons = d.course.lessons.slice().sort((a, b) => a.order_no - b.order_no)
      const resume = findResumeLesson(lessons, map)
      if (resume) setCurrentLessonId(resume.id)

      try {
        const [examList, assignList] = await Promise.all([
          examApi.byCourse(tkn, d.course_id),
          assignmentApi.byCourse(tkn, d.course_id),
        ])
        setExams(examList)
        setAssignments(assignList)
      } catch {
        // 시험/과제 없으면 빈 배열 유지
      }

      if (d.status === 'completed' && d.course.course_type === 'certificate') {
        try {
          const certs = await certificateApi.myList(tkn)
          setCertIssue(certs.find(() => true) ?? null)
        } catch {
          setCertIssue(null)
        }
      } else {
        setCertIssue(null)
      }
    } catch {
      toast.error('강의 정보를 불러올 수 없습니다.')
      router.replace('/my/courses')
    } finally {
      setLoading(false)
    }
  }, [enrollmentId, router])

  useEffect(() => {
    if (!isLoaded) return
    if (!token) { router.replace('/login'); return }
    loadDetail(token)
  }, [isLoaded, token, loadDetail, router])

  useEffect(() => {
    if (!currentLessonId) return
    const existing = progMap.get(currentLessonId)
    watchedRef.current = existing?.watched_seconds ?? 0
  }, [currentLessonId, progMap])

  const sendHeartbeat = useCallback(async () => {
    if (!token || !currentLessonId) return
    try {
      const prog = await progressApi.heartbeat(token, {
        enrollment_id: enrollmentId,
        lesson_id: currentLessonId,
        watched_seconds: watchedRef.current,
      })
      setProgMap((prev) => {
        const next = new Map(prev)
        next.set(currentLessonId, prog)
        return next
      })
      if (prog.completed_at) {
        const updated = await enrollmentApi.myDetail(token, enrollmentId)
        setDetail(updated)
        const map = new Map<number, Progress>()
        for (const p of updated.progresses) map.set(p.lesson_id, p)
        setProgMap(map)
      }
    } catch {
      // heartbeat 실패는 조용히 무시
    }
  }, [token, currentLessonId, enrollmentId])

  useEffect(() => {
    if (!isStarted) return
    heartbeatTimer.current = setInterval(sendHeartbeat, 30_000)
    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)
      sendHeartbeat()
    }
  }, [sendHeartbeat, isStarted])

  /**
   * 페이지 종료/새로고침/탭 숨김 시 진도 긴급 저장
   * 1순위: fetch keepalive (Authorization 헤더 유지)
   * 폴백:  navigator.sendBeacon (_token query param)
   */
  const sendBeaconHeartbeat = useCallback(() => {
    const tkn = tokenRef.current
    const lessonId = currentLessonIdRef.current
    const seconds = watchedRef.current
    if (!tkn || !lessonId || seconds <= 0) return

    const body = JSON.stringify({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      watched_seconds: seconds,
    })
    const url = '/api/progress/heartbeat'

    // keepalive fetch — 페이지 언로드 후에도 요청 완료 보장, Authorization 헤더 가능
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tkn}`,
        },
        body,
        keepalive: true,
      })
    } catch {
      // keepalive 미지원 환경 폴백: sendBeacon + _token query param
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          `${url}?_token=${encodeURIComponent(tkn)}`,
          new Blob([body], { type: 'application/json' }),
        )
      }
    }
  }, [enrollmentId])

  // beforeunload + visibilitychange 이벤트 등록
  useEffect(() => {
    if (!isStarted) return

    const handleBeforeUnload = () => sendBeaconHeartbeat()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') sendBeaconHeartbeat()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isStarted, sendBeaconHeartbeat])

  /** 사이드바 차시 클릭 — 시작 화면 없이 바로 재생 */
  const switchLesson = useCallback((lessonId: number) => {
    sendHeartbeat()
    setCurrentLessonId(lessonId)
    setStartTime(progMap.get(lessonId)?.watched_seconds ?? 0)
    setIsStarted(true)
    setSidebarTab('lessons')
  }, [sendHeartbeat, progMap])

  /** "학습 시작하기" 버튼 클릭 */
  const handleStart = useCallback(() => {
    if (!detail) return
    const lessons = detail.course.lessons.slice().sort((a, b) => a.order_no - b.order_no)
    const resume = findResumeLesson(lessons, progMap)
    setCurrentLessonId(resume.id)
    setStartTime(progMap.get(resume.id)?.watched_seconds ?? 0)
    setIsStarted(true)
  }, [detail, progMap])

  const addTestProgress = async () => {
    if (!currentLessonId) return
    watchedRef.current += 60
    await sendHeartbeat()
    const lesson = detail?.course.lessons.find((l) => l.id === currentLessonId)
    const pct = lesson
      ? Math.min(100, Math.round((watchedRef.current / lesson.duration_sec) * 100))
      : 0
    toast.success(`진도 +60초 (${watchedRef.current}초, ${pct}%)`)
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!detail) return null

  const lessons = detail.course.lessons.slice().sort((a, b) => a.order_no - b.order_no)
  const chapterMap = groupByChapter(lessons)
  const currentLesson = lessons.find((l) => l.id === currentLessonId) ?? lessons[0]
  const currentIdx = lessons.findIndex((l) => l.id === currentLessonId)
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null

  const currentProg = currentLessonId ? progMap.get(currentLessonId) : undefined
  const overallPct = lessons.length > 0
    ? Math.round(
        lessons.reduce((sum, l) => sum + (progMap.get(l.id)?.progress_pct ?? 0), 0) /
        lessons.length,
      )
    : 0

  const isCompleted = detail.status === 'completed'

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── 좌측 사이드바 ──────────────────────────────── */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col border-r border-border/60 bg-card overflow-hidden">
        {/* 코스 헤더 */}
        <div className="p-4 border-b border-border/60 space-y-1 shrink-0">
          <Link href="/my/courses" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ChevronLeft className="h-3 w-3" /> 내 강의실
          </Link>
          <p className="text-sm font-semibold leading-snug line-clamp-2">{detail.course.title}</p>
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>전체 진도</span><span>{overallPct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          {isCompleted && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">✓ 수강 완료</p>
          )}
        </div>

        {/* 수료증 섹션 */}
        {isCompleted && detail.course.course_type === 'certificate' && certIssue !== undefined && (
          <div className="p-3 border-b border-border/60 shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-amber-500" /> 수료증
            </p>
            {certIssue ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 p-3 space-y-2">
                <p className="text-xs font-medium text-green-800 dark:text-green-300 truncate">{certIssue.certificate_name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{certIssue.serial_no}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs gap-1.5"
                  disabled={certDownloading}
                  onClick={async () => {
                    if (!token) return
                    setCertDownloading(true)
                    try { await certificateApi.download(token, certIssue.id, certIssue.serial_no) }
                    catch { toast.error('PDF 다운로드 실패') }
                    finally { setCertDownloading(false) }
                  }}
                >
                  {certDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  PDF 다운로드
                </Button>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-3 space-y-2">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {exams.some((e) => e.submission?.pass_yn)
                    ? '자격증을 발급받을 수 있습니다.'
                    : '시험 합격 후 자격증을 발급받을 수 있습니다.'}
                </p>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs gap-1.5"
                  disabled={certIssuing || !exams.some((e) => e.submission?.pass_yn)}
                  onClick={async () => {
                    if (!token) return
                    setCertIssuing(true)
                    try {
                      await certificateApi.issue(token, enrollmentId)
                      toast.success('자격증이 발급되었습니다!')
                      const certs = await certificateApi.myList(token)
                      setCertIssue(certs[0] ?? null)
                    } catch (e) {
                      toast.error(e instanceof ApiError ? e.message : '발급 실패')
                    } finally {
                      setCertIssuing(false)
                    }
                  }}
                >
                  {certIssuing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Award className="h-3 w-3" />}
                  자격증 발급
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 미수료 안내 */}
        {!isCompleted && detail.course.course_type === 'certificate' && (
          <div className="px-3 py-2 border-b border-border/60 shrink-0">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Award className="h-3 w-3 text-muted-foreground/60" />
              수료 후 자격증 발급 가능
            </p>
          </div>
        )}

        {/* 탭 (차시 / 시험 / 과제) */}
        <div className="flex border-b border-border/60 shrink-0">
          {([
            { key: 'lessons' as const, label: '차시', icon: PlayCircle },
            { key: 'exams' as const, label: `시험${exams.length > 0 ? ` ${exams.length}` : ''}`, icon: FileText },
            { key: 'assignments' as const, label: `과제${assignments.length > 0 ? ` ${assignments.length}` : ''}`, icon: ClipboardList },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSidebarTab(key)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                sidebarTab === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">

          {/* 차시 목록 */}
          {sidebarTab === 'lessons' && (
            <div className="py-2">
              {Array.from(chapterMap.entries()).map(([chapter, chapterLessons]) => (
                <div key={chapter}>
                  <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    CHAPTER {chapter}
                  </p>
                  {chapterLessons.map((lesson) => {
                    const prog = progMap.get(lesson.id)
                    const isLessonCompleted = !!prog?.completed_at
                    const isCurrent = lesson.id === currentLessonId
                    const pct = prog?.progress_pct ?? 0
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => switchLesson(lesson.id)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                          isCurrent && isStarted
                            ? 'bg-primary/10 border-l-2 border-primary'
                            : 'hover:bg-muted border-l-2 border-transparent'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {isLessonCompleted
                            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                            : isCurrent && isStarted
                              ? <PlayCircle className="h-4 w-4 text-primary" />
                              : <Circle className="h-4 w-4 text-muted-foreground/50" />
                          }
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs leading-snug ${isCurrent && isStarted ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {lesson.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground/70">{formatDuration(lesson.duration_sec)}</span>
                            {pct > 0 && !isLessonCompleted && <span className="text-[10px] text-primary">{Math.round(pct)}%</span>}
                          </div>
                          {pct > 0 && (
                            <div className="mt-1 h-0.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${isLessonCompleted ? 'bg-green-500' : 'bg-primary'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* 시험 목록 */}
          {sidebarTab === 'exams' && (
            <div className="py-2 px-3 space-y-2">
              {exams.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-8">등록된 시험이 없습니다.</p>
                : exams.map((exam) => {
                  const sub = exam.submission
                  return (
                    <Link key={exam.id} href={`/my/courses/${enrollmentId}/exams/${exam.id}`}
                      className="block rounded-lg border border-border/60 p-3 hover:border-primary/40 hover:bg-muted/30 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-medium leading-snug line-clamp-2 flex-1">{exam.title}</span>
                        {sub ? (
                          sub.status === 'graded'
                            ? <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${sub.pass_yn ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{sub.pass_yn ? '합격' : '불합격'}</span>
                            : <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">채점중</span>
                        ) : exam.is_open
                          ? <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">응시가능</span>
                          : <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">종료</span>
                        }
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{exam.duration_min}분</span>
                        <span>{exam.questions_count}문항</span>
                        <span className="bg-muted px-1.5 py-0.5 rounded">{EXAM_TYPE_LABEL[exam.type] ?? exam.type}</span>
                        {sub?.status === 'graded' && sub.total_score != null && (
                          <span className="font-medium text-foreground ml-auto">{sub.total_score}/{exam.total_score}점</span>
                        )}
                      </div>
                    </Link>
                  )
                })
              }
            </div>
          )}

          {/* 과제 목록 */}
          {sidebarTab === 'assignments' && (
            <div className="py-2 px-3 space-y-2">
              {assignments.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-8">등록된 과제가 없습니다.</p>
                : assignments.map((assign) => {
                  const sub = assign.submission
                  const dday = calcDday(assign.due_at)
                  const isPastDue = dday === '마감'
                  return (
                    <Link key={assign.id} href={`/my/courses/${enrollmentId}/assignments/${assign.id}`}
                      className="block rounded-lg border border-border/60 p-3 hover:border-primary/40 hover:bg-muted/30 transition-all">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-medium leading-snug line-clamp-2 flex-1">{assign.title}</span>
                        {sub
                          ? sub.graded_at
                            ? <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">채점완료</span>
                            : <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">제출완료</span>
                          : isPastDue
                            ? <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">마감</span>
                            : <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">미제출</span>
                        }
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>마감: {formatDateShort(assign.due_at)}</span>
                        <span className={`font-medium ${isPastDue ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'}`}>{dday}</span>
                        <span className="ml-auto">{assign.max_score}점</span>
                      </div>
                    </Link>
                  )
                })
              }
            </div>
          )}
        </div>
      </aside>

      {/* ── 메인 영역 ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-y-auto">

        {/* 시작 화면 or 비디오 플레이어 */}
        {!isStarted ? (
          /* ── 시작 화면 ── */
          <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
            {/* 썸네일 배경 */}
            {detail.course.thumbnail ? (
              <Image
                src={detail.course.thumbnail}
                alt={detail.course.title}
                fill
                className="object-cover opacity-40"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background/80" />
            )}
            {/* 어두운 오버레이 */}
            <div className="absolute inset-0 bg-black/50" />

            {/* 중앙 콘텐츠 */}
            <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-lg">
              <h2 className="text-white text-lg sm:text-xl font-semibold leading-snug line-clamp-3">
                {detail.course.title}
              </h2>

              {/* 진도율 바 */}
              <div className="w-full space-y-1.5">
                <div className="flex justify-between text-xs text-white/70">
                  <span>전체 진도</span>
                  <span>{overallPct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>

              {/* 시작 버튼 */}
              <Button
                size="lg"
                className="gap-2 px-8 text-base font-semibold shadow-lg"
                onClick={handleStart}
              >
                <Play className="h-5 w-5 fill-current" />
                {isCompleted ? '다시 학습하기' : overallPct > 0 ? '이어서 학습하기' : '학습 시작하기'}
              </Button>
            </div>
          </div>
        ) : (
          /* ── 비디오 플레이어 ── */
          <VideoPlayer
            videoUrl={currentLesson?.video_url}
            lessonTitle={currentLesson?.title}
            startTime={startTime}
            autoPlay
            onTimeTick={(seconds) => {
              watchedRef.current = Math.max(watchedRef.current, seconds)
            }}
          />
        )}

        {/* 차시 정보 + 네비게이션 */}
        <div className="p-6 space-y-4 border-b border-border/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {currentLesson && `CHAPTER ${currentLesson.chapter} · 강의 ${currentLesson.order_no}`}
              </p>
              <h2 className="text-lg font-semibold leading-snug">{currentLesson?.title ?? '-'}</h2>
              {currentLesson && (
                <p className="text-sm text-muted-foreground mt-1">
                  총 {formatDuration(currentLesson.duration_sec)}
                  {currentProg && isStarted && (
                    <span className="ml-2 text-primary font-medium">{Math.round(currentProg.progress_pct)}% 학습</span>
                  )}
                </p>
              )}
            </div>
            {/* 테스트 진도 버튼 — video_url 없고 시작된 경우만 표시 */}
            {isStarted && !currentLesson?.video_url && (
              <Button variant="outline" size="sm" onClick={addTestProgress} className="shrink-0 text-xs">
                테스트 진도 +60초
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={!prevLesson}
              onClick={() => prevLesson && switchLesson(prevLesson.id)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> 이전 차시
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={!nextLesson}
              onClick={() => nextLesson && switchLesson(nextLesson.id)}
              className="gap-1"
            >
              다음 차시 <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 시험·과제 요약 */}
        {(exams.length > 0 || assignments.length > 0) && (
          <div className="p-6 space-y-3">
            <h3 className="text-sm font-semibold">시험 &amp; 과제</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {exams.map((exam) => {
                const sub = exam.submission
                return (
                  <Link key={exam.id} href={`/my/courses/${enrollmentId}/exams/${exam.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:border-primary/40 transition-all">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      sub?.status === 'graded' ? (sub.pass_yn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30') : 'bg-primary/10'
                    }`}>
                      {sub?.status === 'graded'
                        ? sub.pass_yn ? <Trophy className="h-4 w-4 text-green-600 dark:text-green-400" /> : <AlertCircle className="h-4 w-4 text-red-500" />
                        : <FileText className="h-4 w-4 text-primary" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{exam.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {sub?.status === 'graded' ? `${sub.total_score}/${exam.total_score}점 · ${sub.pass_yn ? '합격' : '불합격'}` : sub ? '채점 대기 중' : `${exam.duration_min}분 · ${exam.questions_count}문항`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                )
              })}
              {assignments.map((assign) => {
                const sub = assign.submission
                const dday = calcDday(assign.due_at)
                return (
                  <Link key={assign.id} href={`/my/courses/${enrollmentId}/assignments/${assign.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:border-primary/40 transition-all">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${sub ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      <ClipboardList className={`h-4 w-4 ${sub ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{assign.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {sub ? `제출 완료 · ${new Date(sub.submitted_at).toLocaleDateString('ko-KR')}` : `마감: ${formatDateShort(assign.due_at)} (${dday})`}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 모바일 차시 목록 */}
        <div className="md:hidden p-4 border-t border-border/60">
          <p className="text-sm font-semibold mb-3">차시 목록</p>
          <div className="space-y-1">
            {lessons.map((lesson) => {
              const prog = progMap.get(lesson.id)
              const isLessonCompleted = !!prog?.completed_at
              const isCurrent = lesson.id === currentLessonId && isStarted
              return (
                <button key={lesson.id} onClick={() => switchLesson(lesson.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${isCurrent ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                  {isLessonCompleted
                    ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  }
                  <span className={`text-xs truncate ${isCurrent ? 'font-medium' : 'text-muted-foreground'}`}>{lesson.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
