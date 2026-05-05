'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { adminCategoryApi, adminCourseApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, FolderTree, BookOpen, ChevronRight, Pencil } from 'lucide-react'
import type { AdminCategory, AdminCourse } from '@/types/admin'

export default function AdminCategoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const catId = Number(id)
  const { token } = useAuthStore()
  const router = useRouter()

  const [category, setCategory] = useState<AdminCategory | null>(null)
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const [cats, coursesRes] = await Promise.all([
        adminCategoryApi.list(token),
        adminCourseApi.list(token, { category_id: catId, page: 1 }),
      ])
      // 트리에서 해당 카테고리 탐색
      const find = (list: AdminCategory[]): AdminCategory | null => {
        for (const c of list) {
          if (c.id === catId) return c
          if (c.children) {
            const found = find(c.children)
            if (found) return found
          }
        }
        return null
      }
      const found = find(cats)
      if (!found) {
        toast.error('카테고리를 찾을 수 없습니다.')
        router.push('/lms-manage/courses/categories')
        return
      }
      setCategory(found)
      setEditName(found.name)
      setCourses(coursesRes.data)
    } catch {
      toast.error('카테고리 정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, catId, router])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!token || !editName.trim() || !category) return
    setSaving(true)
    try {
      await adminCategoryApi.update(token, category.id, { name: editName.trim() })
      toast.success('카테고리명이 수정되었습니다.')
      setEditOpen(false)
      load()
    } catch {
      toast.error('수정 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !category) return
    setDeleting(true)
    try {
      await adminCategoryApi.destroy(token, category.id)
      toast.success('카테고리가 삭제되었습니다.')
      router.push('/lms-manage/courses/categories')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!category) return null

  return (
    <div>
      <PageHeader
        title={category.name}
        description={`슬러그: ${category.slug}`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/lms-manage/courses/categories">
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />목록
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="h-8 gap-1.5"
              onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />이름 수정
            </Button>
            <Button size="sm" variant="destructive" className="h-8"
              onClick={() => setDeleteOpen(true)}>
              삭제
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '강좌 수', value: `${category.courses_count}개` },
            { label: '하위 카테고리', value: `${category.children?.length ?? 0}개` },
            { label: '상위 카테고리', value: category.parent_id ? `ID ${category.parent_id}` : '루트' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-border/60 bg-card p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-semibold mt-1">{value}</p>
            </div>
          ))}
        </div>

        {/* 하위 카테고리 */}
        {category.children && category.children.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-card">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60 text-sm font-semibold">
              <FolderTree className="h-4 w-4 text-muted-foreground" />
              하위 카테고리
            </div>
            <div className="divide-y divide-border/40">
              {category.children.map((child) => (
                <Link key={child.id} href={`/lms-manage/courses/categories/${child.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{child.name}</span>
                    <span className="text-xs text-muted-foreground">{child.slug}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{child.courses_count}개</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 소속 강좌 */}
        <div className="rounded-lg border border-border/60 bg-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60 text-sm font-semibold">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            소속 강좌 <span className="font-normal text-muted-foreground">({courses.length}개)</span>
          </div>
          {courses.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">소속 강좌가 없습니다.</div>
          ) : (
            <div className="divide-y divide-border/40">
              {courses.map((course) => (
                <Link key={course.id} href={`/lms-manage/courses/${course.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{course.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.total_lessons}차시 · {course.enrollments_count}명 수강
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={course.course_type} />
                    <StatusBadge status={course.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 이름 수정 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-xs">
          <div className="space-y-4">
            <h2 className="text-base font-semibold">카테고리 이름 수정</h2>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)} disabled={saving}>취소</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !editName.trim()}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`"${category.name}" 카테고리를 삭제하시겠습니까?`}
        description="하위 카테고리나 강좌가 있으면 삭제할 수 없습니다."
        confirmLabel="삭제"
        destructive
        loading={deleting}
      />
    </div>
  )
}
