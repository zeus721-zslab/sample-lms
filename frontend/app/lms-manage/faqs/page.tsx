'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { adminFaqApi } from '@/lib/api'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { FilterBar } from '@/components/admin/FilterBar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import type { FaqItem } from '@/types/notice'

type FaqPaginated = { data: FaqItem[]; total: number; last_page: number; current_page: number; per_page: number }

function FaqFormDialog({ open, faq, onClose, onSaved }: {
  open: boolean; faq: FaqItem | null; onClose: () => void; onSaved: () => void
}) {
  const { token } = useAdminAuthStore()
  const [category, setCategory] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [orderNo, setOrderNo] = useState(0)
  const [isPublished, setIsPublished] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && faq) {
      setCategory(faq.category); setQuestion(faq.question); setAnswer(faq.answer)
      setOrderNo(faq.order_no); setIsPublished(faq.is_published)
    } else if (open) {
      setCategory(''); setQuestion(''); setAnswer(''); setOrderNo(0); setIsPublished(true)
    }
  }, [open, faq])

  const handleSave = async () => {
    if (!token || !category.trim() || !question.trim() || !answer.trim()) return
    setSaving(true)
    try {
      const data = { category, question, answer, order_no: orderNo, is_published: isPublished }
      if (faq) await adminFaqApi.update(token, faq.id, data)
      else await adminFaqApi.create(token, data)
      toast.success(faq ? 'FAQ를 수정했습니다.' : 'FAQ를 등록했습니다.')
      onSaved(); onClose()
    } catch { toast.error('저장 실패') } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <div className="space-y-4 pt-2">
          <h2 className="text-base font-semibold">{faq ? 'FAQ 수정' : 'FAQ 등록'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">카테고리</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="예: 수강, 시험·과제, 자격증" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">정렬 순서</label>
                <Input type="number" min={0} value={orderNo} onChange={(e) => setOrderNo(Number(e.target.value))} />
              </div>
              <div className="space-y-1 flex flex-col justify-end pb-0.5">
                <label className="text-xs font-medium">공개</label>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">질문</label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="자주 묻는 질문" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">답변</label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={5} placeholder="답변 내용" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>취소</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !category.trim() || !question.trim() || !answer.trim()}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AdminFaqsPage() {
  const { token } = useAdminAuthStore()
  const [data, setData] = useState<FaqPaginated | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editFaq, setEditFaq] = useState<FaqItem | null>(null)
  const [deleteFaq, setDeleteFaq] = useState<FaqItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try { setData(await adminFaqApi.list(token, { page })) }
    catch { toast.error('불러오기 실패') } finally { setLoading(false) }
  }, [token, page])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? (data?.data ?? []).filter((f) => f.question.includes(search) || f.category.includes(search))
    : (data?.data ?? [])

  const handleDelete = async () => {
    if (!token || !deleteFaq) return
    setDeleting(true)
    try { await adminFaqApi.delete(token, deleteFaq.id); toast.success('삭제됨'); load() }
    catch { toast.error('삭제 실패') } finally { setDeleting(false); setDeleteFaq(null) }
  }

  const columns = [
    {
      key: 'category', label: '카테고리',
      render: (row: FaqItem) => <Badge variant="secondary" className="text-xs">{row.category}</Badge>,
    },
    {
      key: 'question', label: '질문',
      render: (row: FaqItem) => <p className="text-sm truncate max-w-[300px]">{row.question}</p>,
    },
    {
      key: 'order_no', label: '순서',
      render: (row: FaqItem) => <span className="text-sm tabular-nums">{row.order_no}</span>,
    },
    {
      key: 'is_published', label: '공개',
      render: (row: FaqItem) => <Badge variant={row.is_published ? 'outline' : 'secondary'} className="text-xs">{row.is_published ? '공개' : '비공개'}</Badge>,
    },
    {
      key: 'actions', label: '',
      render: (row: FaqItem) => (
        <div className="flex gap-1 justify-end">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditFaq(row); setFormOpen(true) }}>수정</Button>
          <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteFaq(row) }}>삭제</Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="FAQ"
        description="자주 묻는 질문을 카테고리별로 관리합니다."
        actions={
          <Button size="sm" onClick={() => { setEditFaq(null); setFormOpen(true) }}>
            <Plus className="h-4 w-4 mr-1" />등록
          </Button>
        }
      />
      <div className="p-6 space-y-4">
        <FilterBar search={search} onSearchChange={(v) => setSearch(v)} searchPlaceholder="질문·카테고리 검색..." onReset={() => setSearch('')} />
        <DataTable columns={columns} rows={filtered} rowKey={(r) => r.id} loading={loading} emptyMessage="FAQ가 없습니다." />
      </div>
      <FaqFormDialog open={formOpen} faq={editFaq} onClose={() => setFormOpen(false)} onSaved={load} />
      <ConfirmDialog
        open={!!deleteFaq}
        title="FAQ 삭제"
        description={`이 FAQ를 삭제하시겠습니까?`}
        confirmLabel="삭제"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteFaq(null)}
      />
    </div>
  )
}
