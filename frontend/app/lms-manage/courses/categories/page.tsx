'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminCategoryApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import type { AdminCategory } from '@/types/admin'

function CategoryRow({
  cat,
  depth,
  onEdit,
  onDelete,
  onAddChild,
}: {
  cat: AdminCategory
  depth: number
  onEdit: (c: AdminCategory) => void
  onDelete: (c: AdminCategory) => void
  onAddChild: (parentId: number) => void
}) {
  return (
    <>
      <tr className="border-b border-border/60 hover:bg-muted/30 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" style={{ paddingLeft: depth * 20 }}>
            {depth > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            <span className="text-sm font-medium">{cat.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-muted-foreground">{cat.slug}</td>
        <td className="px-4 py-3 text-sm text-right">{cat.courses_count}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-1">
            {depth === 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onAddChild(cat.id)}>
                <Plus className="h-3 w-3 mr-1" />하위
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(cat)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => onDelete(cat)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
      {cat.children?.map((child) => (
        <CategoryRow key={child.id} cat={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </>
  )
}

export default function AdminCategoriesPage() {
  const { token } = useAdminAuthStore()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [parentId, setParentId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminCategoryApi.list(token)
      setCategories(res)
    } catch {
      toast.error('카테고리를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const openCreate = (pid: number | null = null) => {
    setEditing(null)
    setParentId(pid)
    setName('')
    setFormOpen(true)
  }

  const openEdit = (cat: AdminCategory) => {
    setEditing(cat)
    setParentId(cat.parent_id)
    setName(cat.name)
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!token || !name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await adminCategoryApi.update(token, editing.id, { name: name.trim() })
        toast.success('카테고리가 수정되었습니다.')
      } else {
        await adminCategoryApi.create(token, { name: name.trim(), parent_id: parentId })
        toast.success('카테고리가 생성되었습니다.')
      }
      setFormOpen(false)
      load()
    } catch {
      toast.error('처리 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    setDeleting(true)
    try {
      await adminCategoryApi.destroy(token, deleteTarget.id)
      toast.success('카테고리가 삭제되었습니다.')
      setDeleteTarget(null)
      load()
    } catch (e: unknown) {
      const msg = (e instanceof Error) ? e.message : '삭제 중 오류가 발생했습니다.'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="카테고리 관리"
        description="강좌 분류 카테고리를 관리합니다."
        actions={
          <Button size="sm" className="h-8 gap-1.5" onClick={() => openCreate(null)}>
            <Plus className="h-3.5 w-3.5" />
            카테고리 추가
          </Button>
        }
      />

      <div className="p-6">
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">카테고리명</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">슬러그</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">강좌 수</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">불러오는 중...</td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-sm text-muted-foreground">카테고리가 없습니다.</td></tr>
              ) : (
                categories.map((cat) => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    depth={0}
                    onEdit={openEdit}
                    onDelete={setDeleteTarget}
                    onAddChild={openCreate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 생성/수정 모달 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <div className="space-y-4">
            <h2 className="text-base font-semibold">
              {editing ? '카테고리 수정' : parentId ? '하위 카테고리 추가' : '카테고리 추가'}
            </h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">카테고리명</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="카테고리명 입력"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)} disabled={saving}>취소</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`"${deleteTarget?.name}" 카테고리를 삭제하시겠습니까?`}
        description="하위 카테고리나 강좌가 있으면 삭제할 수 없습니다."
        confirmLabel="삭제"
        destructive
        loading={deleting}
      />
    </div>
  )
}
