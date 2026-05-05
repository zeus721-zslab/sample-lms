'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type ChatMessage = {
  id: number
  room_id: number
  sender_id: string
  sender_type: 'user' | 'admin'
  message: string
  created_at: string
}

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL ?? ''

export function useChat(chatToken: string | null, roomId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<ReturnType<typeof import('socket.io-client')['io']> | null>(null)
  const joinedRef = useRef(false)

  useEffect(() => {
    if (!chatToken || !roomId || !CHAT_URL) return

    let mounted = true

    // io() 인스턴스를 동적으로 import 후 즉시 연결
    // cleanup은 effect return에서 처리 (ref로 연결 후 disconnect)
    import('socket.io-client').then(({ io }) => {
      if (!mounted) return

      const socket = io(CHAT_URL, {
        auth: { token: chatToken },
        transports: ['websocket', 'polling'],
        path: '/chat/socket.io',
      })

      socketRef.current = socket

      socket.on('connect', () => {
        if (!mounted) return
        setConnected(true)
        if (!joinedRef.current) {
          socket.emit('join_room', { roomId })
          joinedRef.current = true
        }
      })

      socket.on('connect_error', (err) => {
        console.error('[useChat] connect_error', err.message, err.cause ?? '')
      })

      socket.on('room_joined', ({ messages: hist }: { messages: ChatMessage[] }) => {
        if (mounted) setMessages(hist ?? [])
      })

      socket.on('message_received', (msg: ChatMessage) => {
        if (mounted) setMessages((prev) => [...prev, msg])
      })

      socket.on('disconnect', () => {
        if (mounted) setConnected(false)
      })
    })

    // React cleanup — import()가 완료되기 전에 unmount되면 mounted=false로 취소
    return () => {
      mounted = false
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      joinedRef.current = false
      setConnected(false)
    }
  }, [chatToken, roomId])

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current || !roomId || !message.trim()) return
    socketRef.current.emit('send_message', { roomId, message: message.trim() })
  }, [roomId])

  const markRead = useCallback(() => {
    if (!socketRef.current || !roomId) return
    socketRef.current.emit('mark_read', { roomId })
  }, [roomId])

  return { messages, connected, sendMessage, markRead }
}
