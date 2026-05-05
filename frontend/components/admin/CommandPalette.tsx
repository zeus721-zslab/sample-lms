'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, LayoutDashboard, Users, BookOpen, Award, Settings, X,
} from 'lucide-react'

const COMMANDS = [
  { label: '대시보드', href: '/lms-manage', icon: LayoutDashboard, group: '페이지' },
  { label: '회원 목록', href: '/lms-manage/users', icon: Users, group: '회원' },
  { label: '역할 관리', href: '/lms-manage/users/roles', icon: Users, group: '회원' },
  { label: '강좌 목록', href: '/lms-manage/courses', icon: BookOpen, group: '강의' },
  { label: '카테고리', href: '/lms-manage/courses/categories', icon: BookOpen, group: '강의' },
  { label: '검수·승인', href: '/lms-manage/courses/review', icon: BookOpen, group: '강의' },
  { label: '차시 관리', href: '/lms-manage/courses/lessons', icon: BookOpen, group: '강의' },
  { label: '학기 관리', href: '/lms-manage/semesters', icon: Settings, group: '학점은행' },
  { label: '시험 관리', href: '/lms-manage/exams', icon: Settings, group: '평가' },
  { label: '과제 관리', href: '/lms-manage/assignments', icon: Settings, group: '평가' },
  { label: '자격증 마스터', href: '/lms-manage/certificates', icon: Award, group: '자격증' },
  { label: '발급 내역', href: '/lms-manage/certificates/issues', icon: Award, group: '자격증' },
  { label: '공지사항', href: '/lms-manage/notices', icon: Settings, group: '운영' },
  { label: '시스템 설정', href: '/lms-manage/system/settings', icon: Settings, group: '시스템' },
  { label: '시스템 로그', href: '/lms-manage/system/logs', icon: Settings, group: '시스템' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = query
    ? COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.group.toLowerCase().includes(query.toLowerCase()),
      )
    : COMMANDS

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setSelected((s) => Math.min(s + 1, filtered.length - 1))
      if (e.key === 'ArrowUp') setSelected((s) => Math.max(s - 1, 0))
      if (e.key === 'Enter' && filtered[selected]) {
        router.push(filtered[selected].href)
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, filtered, selected, router, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* 검색 입력 */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
            placeholder="페이지, 메뉴 검색..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 결과 목록 */}
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon
              return (
                <button
                  key={cmd.href}
                  onMouseEnter={() => setSelected(i)}
                  onClick={() => { router.push(cmd.href); onClose() }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    i === selected ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1">{cmd.label}</span>
                  <span className="text-xs text-muted-foreground/60">{cmd.group}</span>
                </button>
              )
            })
          )}
        </div>

        {/* 하단 힌트 */}
        <div className="border-t border-border/60 px-4 py-2 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd> 이동</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↵</kbd> 선택</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> 닫기</span>
        </div>
      </div>
    </div>
  )
}
