'use client'

/**
 * useForceLogoutSocket
 *
 * 로그인 상태일 때 zslab-chat 서버와 소켓 연결을 유지하고
 * force_logout 이벤트를 수신하면 즉시 로컬 세션을 초기화하고
 * /login?reason=session_expired 으로 리다이렉트한다.
 *
 * ChatWidget이 제거된 환경에서 단일 세션 강제의 실시간 알림 전용 연결.
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth'
import { chatApi } from '@/lib/api'

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL ?? ''

export function useForceLogoutSocket() {
  const { token, user } = useAuthStore()
  const socketRef = useRef<ReturnType<typeof import('socket.io-client')['io']> | null>(null)

  useEffect(() => {
    // 미로그인, CHAT_URL 미설정, 관리자(AdminShell에서 별도 처리) 시 연결 안 함
    if (!token || !user || !CHAT_URL) return
    if (user.roles.includes('admin')) return

    let mounted = true

    const connect = async () => {
      try {
        // chat JWT 발급
        const { token: chatToken } = await chatApi.token(token)
        if (!mounted) return

        const { io } = await import('socket.io-client')
        if (!mounted) return

        const socket = io(CHAT_URL, {
          auth: { token: chatToken },
          transports: ['websocket', 'polling'],
          path: '/chat/socket.io',
        })

        socketRef.current = socket

        socket.on('connect', () => {
          if (mounted) console.log('[ForceLogout] socket connected')
        })

        socket.on('force_logout', () => {
          if (!mounted) return
          console.log('[ForceLogout] received — clearing session')

          // Zustand persist 스토어 삭제 → 다음 로드 시 비로그인 상태
          try { localStorage.removeItem('lms-auth') } catch {}

          // isAdminPath 기반 리다이렉트
          const isAdmin = window.location.pathname.startsWith('/lms-manage')
          const returnUrl = encodeURIComponent(window.location.pathname)
          const loginBase = isAdmin ? '/lms-manage/login' : '/login'
          window.location.href = `${loginBase}?reason=session_expired&return_url=${returnUrl}`
        })

        socket.on('connect_error', (err: Error) => {
          console.warn('[ForceLogout] connect_error', err.message)
        })
      } catch (err) {
        console.warn('[ForceLogout] init failed', err)
      }
    }

    connect()

    return () => {
      mounted = false
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [token, user?.id]) // user?.id — 사용자 변경 시 재연결
}
