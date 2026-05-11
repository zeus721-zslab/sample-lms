'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'
import { Footer } from './Footer'
import { useForceLogoutSocket } from '@/hooks/useForceLogoutSocket'
import { ChatWidget } from '@/components/ChatWidget'

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/lms-manage')

  // 단일 세션 강제 실시간 로그아웃 (학습자·관리자 공통)
  useForceLogoutSocket()

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  )
}
