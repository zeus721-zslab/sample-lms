'use client'

import { useEffect, useState } from 'react'
import { faqApi } from '@/lib/api'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { FaqGroup, FaqItem } from '@/types/notice'

function AccordionItem({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-start justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-sm pr-4">{item.question}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />}
      </button>
      {open && (
        <div className="px-4 py-3 bg-muted/30 border-t text-sm text-muted-foreground whitespace-pre-wrap">
          {item.answer}
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [groups, setGroups] = useState<FaqGroup[]>([])
  const [activeTab, setActiveTab] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    faqApi.list().then((data) => {
      setGroups(data)
      if (data.length > 0) setActiveTab(data[0].category)
    }).finally(() => setLoading(false))
  }, [])

  const activeGroup = groups.find((g) => g.category === activeTab)

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <h1 className="text-2xl font-bold mb-1">자주 묻는 질문</h1>
      <p className="text-muted-foreground text-sm mb-6">궁금하신 점을 빠르게 찾아보세요.</p>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">불러오는 중...</div>
      ) : (
        <>
          {/* 카테고리 탭 */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {groups.map((g) => (
              <button
                key={g.category}
                onClick={() => setActiveTab(g.category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeTab === g.category
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {g.category}
              </button>
            ))}
          </div>

          {/* 아코디언 목록 */}
          <div className="space-y-2">
            {activeGroup?.items.map((item) => (
              <AccordionItem key={item.id} item={item} />
            ))}
            {!activeGroup?.items.length && (
              <div className="text-center py-8 text-muted-foreground">등록된 FAQ가 없습니다.</div>
            )}
          </div>
        </>
      )}

      <div className="mt-10 p-4 bg-muted/40 rounded-lg text-sm text-center">
        원하는 답변을 찾지 못하셨나요?{' '}
        <button
          className="text-primary underline underline-offset-2 hover:no-underline"
          onClick={() => window.dispatchEvent(new CustomEvent('open-chat'))}
        >
          1:1 문의하기
        </button>
      </div>
    </div>
  )
}
