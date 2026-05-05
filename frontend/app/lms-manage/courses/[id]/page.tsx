'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { adminCourseApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, BookOpen, Plus, Pencil, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { AdminCourse, AdminLesson } from '@/types/admin'

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

type CourseWithLessons = AdminCourse & { lessons: AdminLesson[] }

// 차시 폼 초기값
function emptyLessonForm(lessons: AdminLesson[]) {
  const maxCh = lessons.length > 0 ? Math.max(...lessons.map((l) => l.chapter)) : 1
  const sameChLessons = lessons.filter((l) => l.chapter === maxCh)
  const maxOrd = sameChLessons.length > 0 ? Math.max(...sameChLessons.map((l) => l.order_no)) : 0
  return { chapter: String(maxCh), order_no: String(maxOrd + 1), title: '', video_url: '', duration_sec: '0' }
}

export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)
  const { token } = useAuthStore()
  const router = useRouter()

  const [course, setCourse] = useState<CourseWithLessons | null>(null)
  const [loading, setLoading] = useState(true)

  // approve/close 확인
  const [confirmType, setConfirmType] = useState<'approve' | 'close' | null>(null)
  const [acting, setActing] = useState(false)

  // 차시 추가/편집 폼
  const [lessonFormOpen, setLessonFormOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<AdminLesson | null>(null)
  const [lessonForm, setLessonForm] = useState({ chapter: '1', order_no: '1', title: '', video_url: '', duration_sec: '0' })
  const [savingLesson, setSavingLesson] = useState(false)

  // 차시 삭제
  const [deleteLesson, setDeleteLesson] = useState<AdminLesson | null>(null)
  const [deletingLesson, setDeletingLesson] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminCourseApi.show(token, courseId)
      setCourse(res)
    } catch {
      toast.error('강좌 정보를 불러오지 못했습니다.')
      router.push('/lms-manage/courses')
    } finally {
      setLoading(false)
    }
  }, [token, courseId, router])

  useEffect(() => { load() }, [load])

  // approve / close
  const handleConfirm = async () => {
    if (!token || !course || !confirmType) return
    setActing(true)
    try {
      if (confirmType === 'approve') {
        await adminCourseApi.approve(token, course.id)
        toast.success('강좌가 승인·공개되었습니다.')
      } else {
        await adminCourseApi.close(token, course.id)
        toast.success('강좌가 종료되었습니다.')
      }
      setConfirmType(null)
      load()
    } catch {
      toast.error('처리 중 오류가 발생했습니다.')
    } finally {
      setActing(false)
    }
  }

  // 차시 폼 열기
  const openAddLesson = () => {
    setEditingLesson(null)
    setLessonForm(emptyLessonForm(course?.lessons ?? []))
    setLessonFormOpen(true)
  }
  const openEditLesson = (lesson: AdminLesson) => {
    setEditingLesson(lesson)
    setLessonForm({
      chapter: String(lesson.chapter),
      order_no: String(lesson.order_no),
      title: lesson.title,
      video_url: lesson.video_url ?? '',
      duration_sec: String(lesson.duration_sec),
    })
    setLessonFormOpen(true)
  }

  const handleSaveLesson = async () => {
    if (!token || !lessonForm.title.trim()) return
    setSavingLesson(true)
    try {
      const payload = {
        chapter: Number(lessonForm.chapter),
        order_no: Number(lessonForm.order_no),
        title: lessonForm.title.trim(),
        video_url: lessonForm.video_url.trim() || null,
        duration_sec: Number(lessonForm.duration_sec),
      }
      if (editingLesson) {
        await adminCourseApi.updateLesson(token, editingLesson.id, payload)
        toast.success('차시가 수정되었습니다.')
      } else {
        await adminCourseApi.createLesson(token, courseId, payload)
        toast.success('차시가 추가되었습니다.')
      }
      setLessonFormOpen(false)
      load()
    } catch {
      toast.error('차시 저장 중 오류가 발생했습니다.')
    } finally {
      setSavingLesson(false)
    }
  }

  const handleDeleteLesson = async () => {
    if (!token || !deleteLesson) return
    setDeletingLesson(true)
    try {
      await adminCourseApi.deleteLesson(token, deleteLesson.id)
      toast.success('차시가 삭제되었습니다.')
      setDeleteLesson(null)
      load()
    } catch {
      toast.error('차시 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingLesson(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!course) return null

  // 챕터별 그룹핑
  const chapters = Array.from(new Set(course.lessons.map((l) => l.chapter))).sort((a, b) => a - b)

  return (
    <div>
      <PageHeader
        title={course.title}
        description={`${course.category?.name ?? '미분류'} · ${course.instructor?.name ?? '미지정'}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/lms-manage/courses">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />목록
              </Button>
            </Link>
            {course.status === 'draft' && (
              <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-500"
                onClick={() => setConfirmType('approve')}>
                <CheckCircle className="h-3.5 w-3.5 mr-1" />승인
              </Button>
            )}
            {course.status === 'published' && (
              <Button size="sm" variant="destructive" className="h-8"
                onClick={() => setConfirmType('close')}>
                <XCircle className="h-3.5 w-3.5 mr-1" />종료
              </Button>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* 강좌 정보 카드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '유형', value: <StatusBadge status={course.course_type} /> },
            { label: '상태', value: <StatusBadge status={course.status} /> },
            { label: '총 차시', value: `${course.total_lessons}개` },
            { label: '수강생', value: `${course.enrollments_count}명` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border/60 bg-card p-4 space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="text-sm font-semibold">{value}</div>
            </div>
          ))}
        </div>

        {/* 차시 목록 */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              차시 목록 <span className="text-muted-foreground font-normal">({course.lessons.length}개)</span>
            </div>
            <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={openAddLesson}>
              <Plus className="h-3.5 w-3.5" />차시 추가
            </Button>
          </div>

          {course.lessons.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              차시가 없습니다. 차시를 추가해 주세요.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {chapters.map((ch) => {
                const chLessons = course.lessons.filter((l) => l.chapter === ch).sort((a, b) => a.order_no - b.order_no)
                return (
                  <div key={ch}>
                    <div className="px-5 py-2 bg-muted/30">
                      <p className="text-xs font-semibold text-muted-foreground">챕터 {ch}</p>
                    </div>
                    {chLessons.map((lesson) => (
                      <div key={lesson.id}
                        className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground w-6 shrink-0 text-right">
                            {lesson.order_no}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{lesson.title}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />{formatDuration(lesson.duration_sec)}
                              </span>
                              <span className={`text-xs ${lesson.video_url ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                {lesson.video_url ? '영상 있음' : '영상 없음'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
                            onClick={() => openEditLesson(lesson)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => setDeleteLesson(lesson)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* approve/close 확인 */}
      <ConfirmDialog
        open={!!confirmType}
        onClose={() => setConfirmType(null)}
        onConfirm={handleConfirm}
        title={confirmType === 'approve'
          ? `"${course.title}" 강좌를 승인·공개하시겠습니까?`
          : `"${course.title}" 강좌를 종료하시겠습니까?`}
        description={confirmType === 'approve'
          ? '승인하면 학습자에게 공개됩니다.'
          : '종료된 강좌는 수강신청할 수 없습니다.'}
        confirmLabel={confirmType === 'approve' ? '승인' : '종료'}
        destructive={confirmType === 'close'}
        loading={acting}
      />

      {/* 차시 추가/편집 */}
      <Dialog open={lessonFormOpen} onOpenChange={setLessonFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <div className="space-y-4">
            <h2 className="text-base font-semibold">{editingLesson ? '차시 수정' : '차시 추가'}</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">챕터</label>
                <Input type="number" min="1" className="h-8"
                  value={lessonForm.chapter}
                  onChange={(e) => setLessonForm((f) => ({ ...f, chapter: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">순서</label>
                <Input type="number" min="1" className="h-8"
                  value={lessonForm.order_no}
                  onChange={(e) => setLessonForm((f) => ({ ...f, order_no: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">제목</label>
              <Input autoFocus placeholder="차시 제목"
                value={lessonForm.title}
                onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">영상 URL</label>
              <Input placeholder="https://example.com/video.m3u8 또는 mp4"
                value={lessonForm.video_url}
                onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">재생 시간 (초)</label>
              <Input type="number" min="0" className="h-8"
                value={lessonForm.duration_sec}
                onChange={(e) => setLessonForm((f) => ({ ...f, duration_sec: e.target.value }))} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setLessonFormOpen(false)} disabled={savingLesson}>취소</Button>
              <Button size="sm" onClick={handleSaveLesson}
                disabled={savingLesson || !lessonForm.title.trim()}>
                {savingLesson ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 차시 삭제 */}
      <ConfirmDialog
        open={!!deleteLesson}
        onClose={() => setDeleteLesson(null)}
        onConfirm={handleDeleteLesson}
        title={`"${deleteLesson?.title}" 차시를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={deletingLesson}
      />
    </div>
  )
}
