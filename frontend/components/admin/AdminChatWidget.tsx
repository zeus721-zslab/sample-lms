'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuthStore } from '@/store/adminAuth'
import { useAdminChatStore } from '@/store/adminChat'
import { adminInquiryApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send, ChevronLeft, Circle, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ChatMessage } from '@/hooks/useChat'

const CHAT_URL = process.env.NEXT_PUBLIC_CHAT_URL ?? ''

// ── 아바타 ────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-red-400', 'bg-orange-400', 'bg-amber-400', 'bg-emerald-400',
  'bg-teal-400', 'bg-cyan-400', 'bg-blue-400', 'bg-violet-400',
  'bg-purple-400', 'bg-pink-400',
]
function avatarColor(name?: string | null): string {
  if (!name) return AVATAR_COLORS[0]
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function AvatarCircle({ name, size = 'sm' }: { name?: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs'
  return (
    <div className={cn('rounded-full flex items-center justify-center font-semibold text-white shrink-0', avatarColor(name), cls)}>
      {name ? name[0].toUpperCase() : '?'}
    </div>
  )
}

// ── 날짜 구분선 ───────────────────────────────────────────────────────────────
function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-2 my-2">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-muted-foreground">{date}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}
function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ── 채팅방 패널 ───────────────────────────────────────────────────────────────
function ChatRoomPanel({
  roomId,
  roomName,
  userId,
  onBack,
}: {
  roomId: number
  roomName: string | null
  userId: number | null
  onBack: () => void
}) {
  const router = useRouter()
  const { socket, messages, markRoomRead } = useAdminChatStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgs = messages[roomId] ?? []

  useEffect(() => {
    if (socket && roomId) socket.emit('join_room', { roomId })
  }, [socket, roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    markRoomRead(roomId)
  }, [msgs.length, roomId, markRoomRead])

  const handleSend = useCallback(() => {
    if (!socket || !input.trim()) return
    socket.emit('send_message', { roomId, message: input.trim() })
    setInput('')
  }, [socket, input, roomId])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b shrink-0">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground p-0.5 rounded">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <AvatarCircle name={roomName} size="sm" />
        <span className="text-sm font-medium truncate flex-1">{roomName ?? `문의 #${roomId}`}</span>
        {userId !== null && (
          <button
            onClick={() => router.push(`/lms-manage/users/${userId}`)}
            className="shrink-0 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border/60 rounded px-1.5 py-0.5 transition-colors"
            title="회원 정보 보기"
          >
            <ExternalLink className="h-3 w-3" />
            회원 정보
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {msgs.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-8">메시지가 없습니다.</p>
        )}
        {(() => {
          const dateLabels = msgs.map((msg) => formatDateLabel(msg.created_at))
          const showDates = dateLabels.map((label, i) => i === 0 || label !== dateLabels[i - 1])
          return msgs.map((msg, i) => {
            const isMine = msg.sender_type === 'admin'
            const dateLabel = dateLabels[i]
            const showDate = showDates[i]
            const prev = msgs[i - 1]
            const isConsecutive = !showDate && prev && prev.sender_type === msg.sender_type

            return (
              <div key={msg.id}>
                {showDate && <DateSeparator date={dateLabel} />}
                <div className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start', isConsecutive && 'mt-0.5')}>
                  {!isMine && !isConsecutive && <AvatarCircle name={roomName} size="sm" />}
                  {!isMine && isConsecutive && <div className="w-7" />}
                  <div>
                    <div className={cn(
                      'max-w-[200px] px-3 py-1.5 text-sm leading-relaxed break-words',
                      isMine ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm' : 'bg-muted rounded-2xl rounded-bl-sm',
                    )}>
                      {msg.message}
                    </div>
                    {(() => {
                      const next = msgs[i + 1]
                      const isLast = !next || next.sender_type !== msg.sender_type || dateLabels[i + 1] !== dateLabel
                      return isLast ? (
                        <p className={cn('text-[10px] text-muted-foreground mt-0.5', isMine ? 'text-right' : 'text-left')}>
                          {formatTime(msg.created_at)}
                        </p>
                      ) : null
                    })()}
                  </div>
                </div>
              </div>
            )
          })
        })()}
        <div ref={bottomRef} />
      </div>

      <div className="border-t px-3 py-2 flex items-center gap-2 shrink-0">
        <input
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          placeholder="답변을 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
        />
        <button onClick={handleSend} disabled={!input.trim()} className="text-primary hover:opacity-75 disabled:opacity-30 transition-opacity">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── 방 목록 패널 ──────────────────────────────────────────────────────────────
function RoomListPanel({ onSelect }: { onSelect: (id: number, name: string | null, userId: number | null) => void }) {
  const { rooms, connected } = useAdminChatStore()
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b flex items-center gap-1.5 shrink-0">
        <Circle className={cn('h-2 w-2 shrink-0', connected ? 'fill-emerald-500 text-emerald-500' : 'fill-amber-400 text-amber-400')} />
        <span className="text-xs text-muted-foreground">{connected ? '연결됨' : '연결 중...'}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-10">문의가 없습니다.</p>
        )}
        {rooms.map((room) => {
          const name = room.user?.name ?? null
          const time = room.last_message_at ? formatTime(room.last_message_at) : ''
          return (
            <button
              key={room.id}
              className="w-full text-left px-3 py-3 flex items-center gap-2.5 hover:bg-muted/60 border-b transition-colors"
              onClick={() => onSelect(room.id, name, room.user?.id ?? null)}
            >
              <AvatarCircle name={name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium truncate max-w-[130px]">{name ?? `문의 #${room.id}`}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate max-w-[190px]">{room.last_message ?? '메시지 없음'}</p>
              </div>
              {room.unread_count > 0 && (
                <span className="shrink-0 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {room.unread_count > 9 ? '9+' : room.unread_count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 소켓 연결 훅 (AdminShell 전용) ───────────────────────────────────────────
export function useAdminChatConnection() {
  const { token } = useAdminAuthStore()
  const { setSocket, setConnected, setChatToken, setRooms, receiveMessage, setMessages } = useAdminChatStore()
  const socketRef = useRef<ReturnType<typeof import('socket.io-client')['io']> | null>(null)
  const seenMsgIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!token || !CHAT_URL) return
    let mounted = true

    const init = async () => {
      try {
        const { token: ct } = await adminInquiryApi.token(token)
        const roomList = await adminInquiryApi.list(token)
        if (!mounted) return
        setChatToken(ct)
        setRooms(roomList)

        const { io } = await import('socket.io-client')
        const socket = io(CHAT_URL, {
          auth: { token: ct },
          transports: ['websocket', 'polling'],
          path: '/chat/socket.io',
        })

        socket.on('connect', () => { if (mounted) { setConnected(true); setSocket(socket) } })
        socket.on('disconnect', () => { if (mounted) setConnected(false) })

        socket.on('room_joined', ({ messages: hist, room }: { messages: ChatMessage[]; room: { id: number } }) => {
          if (mounted && room?.id) setMessages(room.id, hist ?? [])
        })

        socket.on('message_received', (msg: ChatMessage) => {
          if (!mounted) return
          if (seenMsgIds.current.has(msg.id)) return
          seenMsgIds.current.add(msg.id)
          if (seenMsgIds.current.size > 500) {
            const arr = Array.from(seenMsgIds.current)
            seenMsgIds.current = new Set(arr.slice(arr.length - 200))
          }

          receiveMessage(msg.room_id, msg)

          const store = useAdminChatStore.getState()
          const isKnownRoom = store.rooms.some(r => r.id === msg.room_id)
          if (!isKnownRoom && token) {
            adminInquiryApi.list(token).then(updated => { if (mounted) setRooms(updated) }).catch(() => {})
            socket.emit('join_room', { roomId: msg.room_id })
          }

          // A·B 양쪽 모두 보고 있지 않을 때만 toast
          const { activeRoomId, widgetRoomId } = store
          if (activeRoomId !== msg.room_id && widgetRoomId !== msg.room_id) {
            toast.info(`새 문의: ${msg.message.slice(0, 30)}`, { duration: 4000 })
          }
        })

        socket.on('force_logout', () => {
          if (!mounted) return
          try { localStorage.removeItem('lms-auth') } catch {}
          const returnUrl = encodeURIComponent(window.location.pathname)
          window.location.href = `/lms-manage/login?reason=session_expired&return_url=${returnUrl}`
        })

        socketRef.current = socket
      } catch (e) {
        console.warn('[AdminChat] init failed', e)
      }
    }

    init()
    return () => {
      mounted = false
      socketRef.current?.disconnect()
      socketRef.current = null
      seenMsgIds.current.clear()
      setSocket(null)
      setConnected(false)
    }
  }, [token, setChatToken, setConnected, setMessages, setRooms, receiveMessage, setSocket])
}

// ── B 위젯 (우측 하단 플로팅) ────────────────────────────────────────────────
//
// 상태 머신 — 단 2개 state로 구동:
//   isOpen      : boolean   — 위젯 창 열림/닫힘 (AdminChatWidget 내부 전용, 외부 제어 금지)
//   widgetRoomId: number|null (store) — 현재 열린 방 (null = ChatList)
//
// 렌더 분기:
//   !mounted                       → null (SSR/hydration 완료 전)
//   !isOpen                        → 플로팅 버튼
//   isOpen && widgetRoomId !== null → ChatRoom
//   isOpen && widgetRoomId === null → ChatList  ← 항상 fallback
//
// view string state 없음 → 불일치 상태 불가능
// mounted 가드 → SSR 시 마크업 미생성 → 플로팅 버튼·채팅창 동시 렌더 방지
export function AdminChatWidget() {
  const { unreadTotal, widgetRoomId, setWidgetRoom } = useAdminChatStore()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [roomName, setRoomName] = useState<string | null>(null)
  const [roomUserId, setRoomUserId] = useState<number | null>(null)

  // 클라이언트 마운트 후에만 렌더 시작 — isOpen 초기값(false)이 SSR HTML에 포함되지 않음
  useEffect(() => {
    setMounted(true)
  }, [])

  // 위젯 열기 — 항상 ChatList부터
  const handleOpen = useCallback(() => {
    setWidgetRoom(null)   // store 먼저 초기화 → widgetRoomId=null → ChatList 렌더 보장
    setRoomName(null)
    setRoomUserId(null)
    setIsOpen(true)
  }, [setWidgetRoom])

  // 방 진입
  const handleEnterRoom = useCallback((id: number, name: string | null, userId: number | null) => {
    setRoomName(name)
    setRoomUserId(userId)
    setWidgetRoom(id)     // widgetRoomId=id → ChatRoom 렌더
  }, [setWidgetRoom])

  // 목록으로 복귀
  const handleBackToList = useCallback(() => {
    setWidgetRoom(null)   // widgetRoomId=null → ChatList 렌더
    setRoomName(null)
    setRoomUserId(null)
  }, [setWidgetRoom])

  // 위젯 닫기
  const handleClose = useCallback(() => {
    setWidgetRoom(null)
    setRoomName(null)
    setRoomUserId(null)
    setIsOpen(false)
  }, [setWidgetRoom])

  // ── 렌더 분기 ──────────────────────────────────────────────────────────────

  // 0. 마운트 전 → null (SSR 및 hydration 중 위젯 마크업 미생성)
  if (!mounted) return null

  // 1. 닫힌 상태 → 플로팅 버튼
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg relative"
          onClick={handleOpen}
        >
          <MessageCircle className="h-5 w-5" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          )}
        </Button>
      </div>
    )
  }

  // 2. 열린 상태 → 위젯 창
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 h-[500px] max-h-[calc(100vh-6rem)] rounded-xl border shadow-2xl bg-background flex flex-col overflow-hidden sm:w-80 w-full sm:right-6 right-0 sm:bottom-6 bottom-0 sm:rounded-xl rounded-b-none">
      {/* 공통 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-xl shrink-0">
        <p className="font-semibold text-sm">1:1 문의 관리</p>
        <button onClick={handleClose} className="opacity-75 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 내용 영역: widgetRoomId(store)가 진실의 원천 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {widgetRoomId !== null ? (
          // ChatRoom
          <ChatRoomPanel
            roomId={widgetRoomId}
            roomName={roomName}
            userId={roomUserId}
            onBack={handleBackToList}
          />
        ) : (
          // ChatList — widgetRoomId=null이면 항상 여기
          <RoomListPanel onSelect={handleEnterRoom} />
        )}
      </div>
    </div>
  )
}
