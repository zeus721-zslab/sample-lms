'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { noticeApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Pin } from 'lucide-react'
import type { Notice } from '@/types/notice'

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    noticeApi.show(Number(id))
      .then(setNotice)
      .catch(() => router.push('/notices'))
      .finally(() => setLoading(false))
  }, [id, router])

  if (loading) return <div className="container mx-auto px-4 py-10 max-w-4xl text-center text-muted-foreground">불러오는 중...</div>
  if (!notice) return null

  const categoryLabel: Record<string, string> = { general: '일반', system: '시스템', event: '이벤트' }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/notices"><ChevronLeft className="h-4 w-4 mr-1" />목록</Link>
      </Button>

      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{categoryLabel[notice.category] ?? notice.category}</Badge>
          {notice.is_pinned && (
            <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 flex items-center gap-1">
              <Pin className="h-3 w-3" /> 고정
            </Badge>
          )}
        </div>

        <h1 className="text-2xl font-bold">{notice.title}</h1>
        <p className="text-sm text-muted-foreground">
          {new Date(notice.published_at ?? notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <hr />

        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-sm">
          {notice.body}
        </div>
      </div>

      <div className="mt-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/notices">목록으로</Link>
        </Button>
      </div>
    </div>
  )
}
