'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { courseApi } from '@/lib/api'
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

  const [inputValue, setInputValue] = useState(currentQ)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 입력 디바운스 → suggest 호출
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 1) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const items = await courseApi.suggest(q.trim())
        setSuggestions(items)
        setOpen(items.length > 0)
        setActiveIdx(-1)
      } catch {
        setSuggestions([])
        setOpen(false)
      }
    }, 200)
  }, [])

  const navigate = useCallback((q: string) => {
    setOpen(false)
    const next = new URLSearchParams(params.toString())
    if (q) next.set('q', q)
    else next.delete('q')
    next.delete('page')
    startTransition(() => router.push(`/courses?${next.toString()}`))
  }, [params, router, startTransition])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    navigate(inputValue.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault()
      const chosen = suggestions[activeIdx]
      setInputValue(chosen)
      navigate(chosen)
    }
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          name="q"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); fetchSuggestions(e.target.value) }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          onKeyDown={handleKeyDown}
          placeholder="강좌명 검색..."
          className="pl-9 pr-10"
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => { setInputValue(''); setSuggestions([]); setOpen(false); navigate('') }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* 자동완성 드롭다운 */}
      {open && suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border border-border/60 bg-popover shadow-md overflow-hidden">
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setInputValue(s); navigate(s) }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors',
                  i === activeIdx ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
