'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/store/auth'
import { adminNoticeApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { FilterBar } from '@/components/admin/FilterBar'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Pin, Plus } from 'lucide-react'
import type { Notice, NoticePaginated } from '@/types/notice'

const CATEGORIES = ['general', 'system', 'event']
const CATEGORY_LABEL: Record<string, string> = { general: '일반', system: '시스템', event: '이벤트' }

function NoticeFormDialog({ open, notice, onClose, onSaved }: {
  open: boolean
  notice: Notice | null
  onClose: () => void
  onSaved: () => void
}) {
  const { token } = useAuthStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('general')
  const [isPinned, setIsPinned] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && notice) {
      setTitle(notice.title); setBody(notice.body)
      setCategory(notice.category); setIsPinned(notice.is_pinned)
    } else if (open) {
      setTitle(''); setBody(''); setCategory('general'); setIsPinned(false)
    }
  }, [open, notice])

  const handleSave = async () => {
    if (!token || !title.trim() || !body.trim()) return
    setSaving(true)
    try {
      const data = { title, body, category, is_pinned: isPinned }
      if (notice) await adminNoticeApi.update(token, notice.id, data)
      else await adminNoticeApi.create(token, data)
      toast.success(notice ? '공지를 수정했습니다.' : '공지를 등록했습니다.')
      onSaved(); onClose()
    } catch { toast.error('저장 실패') } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-semibold">{notice ? '공지 수정' : '공지 등록'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">카테고리</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-0.5">
              <label className="text-xs font-medium">고정 공지</label>
              <Switch checked={isPinned} onCheckedChange={setIsPinned} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">제목</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">내용</label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="공지 내용" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>취소</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !title.trim() || !body.trim()}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminNoticesPage() {
  const { token } = useAuthStore()
  const [data, setData] = useState<NoticePaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editNotice, setEditNotice] = useState<Notice | null>(null)
  const [deleteNotice, setDeleteNotice] = useState<Notice | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try { setData(await adminNoticeApi.list(token, { q: search || undefined, page })) }
    catch { toast.error('불러오기 실패') } finally { setLoading(false) }
  }, [token, search, page])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!token || !deleteNotice) return
    setDeleting(true)
    try { await adminNoticeApi.delete(token, deleteNotice.id); toast.success('삭제됨'); load() }
    catch { toast.error('삭제 실패') } finally { setDeleting(false); setDeleteNotice(null) }
  }

  const columns = [
    {
      key: 'title', label: '제목',
      render: (row: Notice) => (
        <div className="flex items-center gap-2">
          {row.is_pinned && <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
          <span className="font-medium truncate max-w-[300px]">{row.title}</span>
        </div>
      ),
    },
    {
      key: 'category', label: '카테고리',
      render: (row: Notice) => <Badge variant="secondary" className="text-xs">{CATEGORY_LABEL[row.category] ?? row.category}</Badge>,
    },
    {
      key: 'published_at', label: '게시일',
      render: (row: Notice) => <span className="text-sm tabular-nums">{row.published_at ? new Date(row.published_at).toLocaleDateString('ko-KR') : '-'}</span>,
    },
    {
      key: 'actions', label: '',
      render: (row: Notice) => (
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditNotice(row); setFormOpen(true) }}>수정</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteNotice(row) }}>삭제</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="공지사항"
        description="학습자에게 노출되는 공지를 관리합니다."
        actions={
          <Button size="sm" onClick={() => { setEditNotice(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />등록
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <FilterBar search={search} onSearchChange={(v) => { setSearch(v); setPage(1) }} searchPlaceholder="제목 검색..." onReset={() => { setSearch(''); setPage(1) }} />
        <DataTable columns={columns} rows={data?.data ?? []} rowKey={(r) => r.id} loading={loading} emptyMessage="공지가 없습니다." />
        {data && data.last_page > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
              <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
            ))}
          </div>
        )}
      </div>
      <NoticeFormDialog open={formOpen} notice={editNotice} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!deleteNotice}
        title="공지 삭제"
        description={`"${deleteNotice?.title}" 공지를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteNotice(null)}
      />
    </div>
  )
}
