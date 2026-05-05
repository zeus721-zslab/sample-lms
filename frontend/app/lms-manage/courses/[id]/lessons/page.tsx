'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { adminCourseApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { toast } from 'sonner'
import { Plus, ArrowLeft, Clock } from 'lucide-react'
import type { AdminCourse, AdminLesson } from '@/types/admin'

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function AdminCourseLessonsPage() {
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)
  const { token } = useAuthStore()

  const [course, setCourse] = useState<AdminCourse | null>(null)
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [loading, setLoading] = useState(true)

  // 폼 상태
  const [formOpen, setFormOpen] = useState(false)
  const [chapter, setChapter] = useState('1')
  const [orderNo, setOrderNo] = useState('1')
  const [title, setTitle] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [durationSec, setDurationSec] = useState('0')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminLesson | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token || !courseId) return
    setLoading(true)
    try {
      const lessonsData = await adminCourseApi.lessons(token, courseId)
      setLessons(lessonsData)
    } catch {
      toast.error('차시 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, courseId])

  useEffect(() => { load() }, [load])

  const openForm = () => {
    const maxChapter = lessons.length > 0 ? Math.max(...lessons.map((l) => l.chapter)) : 1
    const sameChapter = lessons.filter((l) => l.chapter === maxChapter)
    const maxOrder = sameChapter.length > 0 ? Math.max(...sameChapter.map((l) => l.order_no)) : 0
    setChapter(String(maxChapter))
    setOrderNo(String(maxOrder + 1))
    setTitle('')
    setVideoUrl('')
    setDurationSec('0')
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!token || !title.trim()) return
    setSaving(true)
    try {
      await adminCourseApi.createLesson(token, courseId, {
        chapter: Number(chapter),
        order_no: Number(orderNo),
        title: title.trim(),
        video_url: videoUrl.trim() || null,
        duration_sec: Number(durationSec),
      })
      toast.success('차시가 추가되었습니다.')
      setFormOpen(false)
      load()
    } catch {
      toast.error('차시 추가 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="차시 관리"
        description={course?.title ?? `강좌 #${courseId} 차시 관리`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/lms-manage/courses">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                강좌 목록
              </Button>
            </Link>
            <Button size="sm" className="h-8 gap-1.5" onClick={openForm}>
              <Plus className="h-3.5 w-3.5" />
              차시 추가
            </Button>
          </div>
        }
      />

      <div className="p-6">
        <DataTable
          loading={loading}
          rows={lessons}
          rowKey={(l) => l.id}
          emptyMessage="차시가 없습니다. 차시를 추가해 주세요."
          columns={[
            { key: 'ch', label: '챕터', className: 'w-16', render: (l) => <span className="text-sm font-mono">{l.chapter}-{l.order_no}</span> },
            { key: 'title', label: '제목', render: (l) => <span className="text-sm font-medium">{l.title}</span> },
            {
              key: 'duration', label: '길이', className: 'w-20', render: (l) => (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />{formatDuration(l.duration_sec)}
                </span>
              )
            },
            {
              key: 'video', label: '영상', className: 'w-16', render: (l) => (
                <span className={`text-xs ${l.video_url ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                  {l.video_url ? '있음' : '없음'}
                </span>
              )
            },
          ]}
        />
      </div>

      {/* 차시 추가 모달 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <div className="space-y-4">
            <h2 className="text-base font-semibold">차시 추가</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">챕터</label>
                <Input type="number" min="1" value={chapter} onChange={(e) => setChapter(e.target.value)} className="h-8" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">순서</label>
                <Input type="number" min="1" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} className="h-8" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">제목</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="차시 제목" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">영상 URL</label>
              <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://example.com/video.m3u8 또는 mp4" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">재생 시간 (초)</label>
              <Input type="number" min="0" value={durationSec} onChange={(e) => setDurationSec(e.target.value)} className="h-8" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)} disabled={saving}>취소</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !title.trim()}>
                {saving ? '추가 중...' : '추가'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { setDeleteTarget(null) }}
        title={`"${deleteTarget?.title}" 차시를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={deleting}
      />
    </div>
  )
}
