'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAdminChatStore } from '@/store/adminChat'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  Award,
  CreditCard,
  Megaphone,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
  FolderTree,
  ListChecks,
  CheckSquare,
  Calendar,
  Group,
  ClipboardList,
  BarChart2,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  RotateCcw,
  HelpCircle,
  MessageSquare,
  Wifi,
  Sliders,
  Activity,
  type LucideIcon,
} from 'lucide-react'

type NavItem = { label: string; href: string; icon?: LucideIcon; disabled?: boolean }
type NavGroup = {
  label: string
  icon: LucideIcon
  href?: string
  single?: boolean
  disabled?: boolean
  items?: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: '대시보드',
    icon: LayoutDashboard,
    href: '/lms-manage',
    single: true,
  },
  {
    label: '접속 통계',
    icon: Activity,
    href: '/lms-manage/analytics',
    single: true,
  },
  {
    label: '회원',
    icon: Users,
    items: [
      { label: '회원 목록', href: '/lms-manage/users', icon: Users },
      { label: '역할 관리', href: '/lms-manage/users/roles', icon: UserCheck },
      { label: '정지 회원', href: '/lms-manage/users/suspended', icon: UserX },
    ],
  },
  {
    label: '강의',
    icon: BookOpen,
    items: [
      { label: '카테고리', href: '/lms-manage/courses/categories', icon: FolderTree },
      { label: '강좌 목록', href: '/lms-manage/courses', icon: BookOpen },
      { label: '검수·승인', href: '/lms-manage/courses/review', icon: CheckSquare },
      { label: '차시 관리', href: '/lms-manage/courses/lessons', icon: ListChecks },
    ],
  },
  {
    label: '학점은행',
    icon: GraduationCap,
    items: [
      { label: '학기 관리', href: '/lms-manage/semesters', icon: Calendar },
      { label: '분반 관리', href: '/lms-manage/semesters/offerings', icon: Group },
      { label: '수강신청 현황', href: '/lms-manage/enrollments', icon: ClipboardList },
      { label: '출석·성적', href: '/lms-manage/grades', icon: BarChart2 },
      { label: '학점인정 신청', href: '/lms-manage/credits', icon: ScrollText },
    ],
  },
  {
    label: '평가',
    icon: FileText,
    items: [
      { label: '시험', href: '/lms-manage/exams', icon: FileText },
      { label: '과제', href: '/lms-manage/assignments', icon: ClipboardList },
      { label: '채점', href: '/lms-manage/grading', icon: CheckSquare },
    ],
  },
  {
    label: '자격증',
    icon: Award,
    items: [
      { label: '자격증 마스터', href: '/lms-manage/certificates', icon: Award },
      { label: '발급 내역', href: '/lms-manage/certificates/issues', icon: ScrollText },
      { label: '진위확인 로그', href: '/lms-manage/certificates/verifications', icon: ShieldCheck },
    ],
  },
  {
    label: '결제',
    icon: CreditCard,
    items: [
      { label: '주문', href: '/lms-manage/orders', icon: ShoppingCart },
      { label: '환불', href: '/lms-manage/refunds', icon: RotateCcw },
    ],
  },
  {
    label: '운영',
    icon: Megaphone,
    items: [
      { label: '공지사항', href: '/lms-manage/notices', icon: Megaphone },
      { label: 'FAQ', href: '/lms-manage/faqs', icon: HelpCircle },
      { label: '문의', href: '/lms-manage/inquiries', icon: MessageSquare },
    ],
  },
  {
    label: '시스템',
    icon: Settings,
    items: [
      { label: '동시접속', href: '/lms-manage/system/connections', icon: Wifi },
      { label: 'LMS 설정', href: '/lms-manage/system/settings', icon: Sliders },
      { label: '로그', href: '/lms-manage/system/logs', icon: Activity },
    ],
  },
]

const STORAGE_KEY = 'admin-nav-open'

function getInitialOpen(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function AdminNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const { unreadTotal } = useAdminChatStore()

  useEffect(() => {
    const stored = getInitialOpen()
    // 현재 경로에 해당하는 그룹 자동 열기
    const auto: Record<string, boolean> = { ...stored }
    NAV_GROUPS.forEach((g) => {
      if (!g.single && g.items?.some((item) => pathname?.startsWith(item.href))) {
        auto[g.label] = true
      }
    })
     
    setOpen(auto)
  }, [pathname])

  const toggleGroup = (label: string) => {
    setOpen((prev) => {
      const next = { ...prev, [label]: !prev[label] }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2">
      {NAV_GROUPS.map((group) => {
        if (group.single) {
          const active = pathname === group.href
          const Icon = group.icon
          return (
            <Link
              key={group.label}
              href={group.href!}
              className={`flex items-center gap-2.5 px-3 py-2 mb-0.5 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{group.label}</span>}
            </Link>
          )
        }

        const isGroupActive = group.items?.some((item) => pathname?.startsWith(item.href))
        const isOpen = !collapsed && open[group.label]
        const Icon = group.icon

        return (
          <div key={group.label} className="mb-0.5">
            <button
              onClick={() => !collapsed && !group.disabled && toggleGroup(group.label)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                group.disabled
                  ? 'text-muted-foreground/40 cursor-not-allowed'
                  : isGroupActive
                    ? 'text-foreground font-medium hover:bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={collapsed ? group.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{group.label}</span>
                  {group.disabled
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground/60">준비중</span>
                    : isOpen
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                </>
              )}
            </button>

            {isOpen && !group.disabled && (
              <div className="ml-3 mt-0.5 pl-3 border-l border-border/60 space-y-0.5">
                {group.items?.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(item.href + '/')
                  const ItemIcon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.disabled ? '#' : item.href}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                        item.disabled
                          ? 'text-muted-foreground/40 cursor-not-allowed pointer-events-none'
                          : active
                            ? 'text-primary font-medium bg-primary/8'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {ItemIcon && <ItemIcon className="h-3.5 w-3.5 shrink-0" />}
                      <span className="flex-1">{item.label}</span>
                      {item.href === '/lms-manage/inquiries' && unreadTotal > 0 && (
                        <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold leading-none">
                          {unreadTotal > 9 ? '9+' : unreadTotal}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}
