'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { noticeApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pin, Search } from 'lucide-react'
import type { Notice, NoticePaginated } from '@/types/notice'

export default function NoticesPage() {
  const [data, setData] = useState<NoticePaginated | null>(null)
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    noticeApi.list({ q: search || undefined, page }).then(setData).finally(() => setLoading(false))
  }, [search, page])

  const handleSearch = () => { setSearch(input); setPage(1) }

  const categoryLabel: Record<string, string> = {
    general: '일반', system: '시스템', event: '이벤트',
  }
  const categoryColor: Record<string, string> = {
    general: 'secondary', system: 'outline', event: 'default',
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">공지사항</h1>
      <p className="text-muted-foreground text-sm mb-6">학습 관련 주요 공지를 확인하세요.</p>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="제목 검색..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-xs"
        />
        <Button size="sm" onClick={handleSearch} variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
      ) : (
        <div className="divide-y border rounded-lg overflow-hidden">
          {data?.data.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">공지사항이 없습니다.</div>
          )}
          {data?.data.map((notice: Notice) => (
            <Link
              key={notice.id}
              href={`/notices/${notice.id}`}
              className={`flex items-start gap-3 px-5 py-4 hover:bg-muted/50 transition-colors ${notice.is_pinned ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}
            >
              {notice.is_pinned && <Pin className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
              {!notice.is_pinned && <div className="w-4" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={(categoryColor[notice.category] as 'secondary' | 'outline' | 'default') ?? 'secondary'} className="text-xs">
                    {categoryLabel[notice.category] ?? notice.category}
                  </Badge>
                  {notice.is_pinned && <Badge variant="outline" className="text-xs border-amber-400 text-amber-600">고정</Badge>}
                </div>
                <p className="font-medium truncate">{notice.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(notice.published_at ?? notice.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
            <Button key={p} size="sm" variant={p === page ? 'default' : 'outline'} onClick={() => setPage(p)}>{p}</Button>
          ))}
        </div>
      )}
    </div>
  )
}
