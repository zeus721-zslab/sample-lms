'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Category, CourseType } from '@/types/course'

const TYPE_OPTIONS: { value: '' | CourseType; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'credit_bank', label: '학점은행' },
  { value: 'certificate', label: '자격증' },
]

export function CoursesFilter({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const currentType = (params.get('type') ?? '') as '' | CourseType
  const currentCategory = params.get('category') ?? ''
  const currentQ = params.get('q') ?? ''

  const push = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v)
        else next.delete(k)
      })
      next.delete('page')
      startTransition(() => router.push(`/courses?${next.toString()}`))
    },
    [params, router],
  )

  return (
    <aside className="w-full lg:w-52 shrink-0 space-y-6">
      {/* 타입 필터 */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          강좌 유형
        </p>
        <div className="space-y-1">
          {TYPE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => push({ type: value })}
              className={cn(
                'w-full text-left rounded-md px-3 py-1.5 text-sm transition-colors',
                currentType === value
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          카테고리
        </p>
        <div className="space-y-1">
          <button
            onClick={() => push({ category: '' })}
            className={cn(
              'w-full text-left rounded-md px-3 py-1.5 text-sm transition-colors',
              !currentCategory
                ? 'bg-primary text-primary-foreground font-medium'
                : 'hover:bg-muted text-foreground',
            )}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => push({ category: cat.slug })}
              className={cn(
                'w-full text-left rounded-md px-3 py-1.5 text-sm transition-colors',
                currentCategory === cat.slug
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 필터 초기화 */}
      {(currentType || currentCategory || currentQ) && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground gap-1"
          onClick={() => router.push('/courses')}
        >
          <X className="h-3.5 w-3.5" />
          필터 초기화
        </Button>
      )}
    </aside>
  )
}

export function CourseSearchBar() {
  const router = useRouter()
  const params = useSearchParams()
  const currentQ = params.get('q') ?? ''
  const [, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim()
    const next = new URLSearchParams(params.toString())
    if (q) next.set('q', q)
    else next.delete('q')
    next.delete('page')
    startTransition(() => router.push(`/courses?${next.toString()}`))
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        name="q"
        defaultValue={currentQ}
        placeholder="강좌명 검색..."
        className="pl-9 pr-10"
      />
      {currentQ && (
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(params.toString())
            next.delete('q')
            next.delete('page')
            router.push(`/courses?${next.toString()}`)
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </form>
  )
}
