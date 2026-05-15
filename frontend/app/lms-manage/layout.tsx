'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useAdminAuthStore } from '@/store/adminAuth'
import { AdminShell } from '@/components/admin/AdminShell'

const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000 // 2시간
const IDLE_CHECK_INTERVAL = 60_000           // 1분마다 체크

/** 관리자 로그인 URL (return_url 포함) */
function adminLoginUrl(returnTo: string) {
  return `/lms-manage/login?return_url=${encodeURIComponent(returnTo)}`
}

/** 404처럼 보이는 화면 (보안 위장) */
function NotFoundScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center space-y-3">
        <p className="text-8xl font-bold text-muted-foreground/30 select-none">404</p>
        <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">요청하신 페이지가 존재하지 않거나 삭제되었습니다.</p>
        <Link href="/" className="inline-block mt-2 text-sm text-primary hover:underline">홈으로 돌아가기</Link>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, token, isLoaded, logout } = useAdminAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const lastActivityRef = useRef(0)

  useEffect(() => { lastActivityRef.current = Date.now() }, [])

  const isLoginPage = pathname === '/lms-manage/login'
  const isAdmin = user?.roles.includes('admin') ?? false

  // 사용자 활동 추적
  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
  }, [])

  // Idle timeout: 2시간 무활동 시 자동 로그아웃
  useEffect(() => {
    if (isLoginPage || !isAdmin) return

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }))

    const timer = setInterval(async () => {
      if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS) {
        await logout()
        router.replace(adminLoginUrl(pathname))
      }
    }, IDLE_CHECK_INTERVAL)

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity))
      clearInterval(timer)
    }
  }, [isLoginPage, isAdmin, logout, pathname, router, resetActivity])

  // 로그인 페이지는 가드 없이 바로 렌더
  if (isLoginPage) {
    return <>{children}</>
  }

  // 스토어 초기화 중
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 비인증: 관리자 로그인 페이지로
  if (!token) {
    if (typeof window !== 'undefined') {
      router.replace(adminLoginUrl(pathname))
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // 인증됐지만 admin 아님: 404 위장
  if (!isAdmin) {
    return <NotFoundScreen />
  }

  return <AdminShell>{children}</AdminShell>
}
