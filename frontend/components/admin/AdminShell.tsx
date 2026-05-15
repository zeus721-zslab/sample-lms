'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  GraduationCap,
  PanelLeft,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Search,
  Command,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/auth'
import { AdminNav } from './AdminNav'
import { CommandPalette } from './CommandPalette'
import { KeyboardShortcutsDialog } from './KeyboardShortcutsDialog'
import { useAdminChatConnection, AdminChatWidget } from './AdminChatWidget'

const SIDEBAR_KEY = 'admin-sidebar-collapsed'

function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY)
       
      if (stored !== null) setCollapsed(stored === 'true')
    } catch {}
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_KEY, String(next)) } catch {}
      return next
    })
  }, [])

  return { collapsed, toggle }
}

function Breadcrumb() {
  const pathname = usePathname()
  const parts = pathname?.replace('/lms-manage', '').split('/').filter(Boolean) ?? []
  const LABELS: Record<string, string> = {
    users: '회원', roles: '역할', suspended: '정지',
    courses: '강의', categories: '카테고리', review: '검수·승인', lessons: '차시',
    semesters: '학기', offerings: '분반',
    enrollments: '수강신청', grades: '성적', credits: '학점인정',
    exams: '시험', assignments: '과제', grading: '채점',
    certificates: '자격증', issues: '발급', verifications: '진위확인',
    orders: '주문', refunds: '환불',
    notices: '공지', faqs: 'FAQ', inquiries: '문의',
    system: '시스템', connections: '동시접속', settings: '설정', logs: '로그',
  }

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/lms-manage" className="hover:text-foreground transition-colors">관리자</Link>
      {parts.map((part, i) => {
        const href = '/lms-manage/' + parts.slice(0, i + 1).join('/')
        const isLast = i === parts.length - 1
        return (
          <span key={part} className="flex items-center gap-1">
            <span>/</span>
            {isLast
              ? <span className="text-foreground font-medium">{LABELS[part] ?? part}</span>
              : <Link href={href} className="hover:text-foreground transition-colors">{LABELS[part] ?? part}</Link>
            }
          </span>
        )
      })}
    </nav>
  )
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebarState()
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuthStore()
  const router = useRouter()

  // 관리자 채팅 소켓 연결 (전체 라이프사이클)
  useAdminChatConnection()

  const [cmdOpen, setCmdOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 키보드 단축키
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggle()
      }
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [toggle])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
    toast.success('로그아웃되었습니다.')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── 사이드바 (데스크탑) ────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col border-r border-border/60 bg-card transition-all duration-200 shrink-0 ${
          collapsed ? 'w-14' : 'w-60'
        }`}
      >
        {/* 로고 */}
        <div className={`flex items-center border-b border-border/60 h-14 px-3 shrink-0 ${collapsed ? 'justify-center' : 'gap-2'}`}>
          <Link href="/lms-manage" className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none truncate">zslab LMS</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">관리자</p>
              </div>
            )}
          </Link>
        </div>

        {/* 네비게이션 */}
        <AdminNav collapsed={collapsed} />

        {/* 하단 토글 */}
        <div className="border-t border-border/60 p-2 shrink-0">
          <button
            onClick={toggle}
            className="w-full flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={collapsed ? '사이드바 펼치기 (⌘B)' : '사이드바 접기 (⌘B)'}
          >
            <PanelLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </aside>

      {/* ── 모바일 사이드바 Drawer ─────────────────────────── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-card border-r border-border/60 md:hidden">
            <div className="flex items-center gap-2 border-b border-border/60 h-14 px-4 shrink-0">
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <p className="text-sm font-semibold">zslab LMS 관리자</p>
            </div>
            <AdminNav collapsed={false} />
          </aside>
        </>
      )}

      {/* ── 메인 영역 ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">

        {/* 상단바 */}
        <header className="flex items-center h-14 border-b border-border/60 bg-card/50 backdrop-blur-sm px-4 gap-3 shrink-0">
          {/* 모바일 햄버거 */}
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
            onClick={() => setDrawerOpen(true)}
          >
            <PanelLeft className="h-4 w-4" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden sm:block flex-1 min-w-0">
            <Breadcrumb />
          </div>
          <div className="flex-1 sm:hidden" />

          {/* 글로벌 검색 */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 h-8 px-3 rounded-md border border-border/60 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">검색...</span>
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] bg-muted px-1.5 py-0.5 rounded">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>

          {/* 다크모드 */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* 프로필 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-1.5 px-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {user?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-xs max-w-[80px] truncate">{user?.name}</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <div className="px-3 py-2">
                <p className="text-xs font-medium truncate">{user?.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer text-xs">
                  학습자 사이트 보기
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShortcutsOpen(true)}
                className="text-xs cursor-pointer"
              >
                단축키 가이드 <kbd className="ml-auto text-muted-foreground">?</kbd>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive text-xs cursor-pointer"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* 페이지 본문 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* 커맨드 팔레트 */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* 단축키 가이드 */}
      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* 관리자 채팅 위젯 */}
      <AdminChatWidget />

    </div>
  )
}
