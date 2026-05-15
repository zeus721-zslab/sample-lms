'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { chatApi } from '@/lib/api'
import { useChat } from '@/hooks/useChat'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

function ChatPanel({
  chatToken,
  roomId,
  onClose,
}: {
  chatToken: string
  roomId: number
  onClose: () => void
}) {
  const { messages, connected, sendMessage, markRead } = useChat(chatToken, roomId)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    markRead()
  }, [messages, markRead])

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground rounded-t-xl">
        <div>
          <p className="font-semibold text-sm">1:1 문의</p>
          <p className="text-xs opacity-75">{connected ? '관리자 연결됨' : '연결 중...'}</p>
        </div>
        <button onClick={onClose} className="opacity-75 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-xs py-4">
            안녕하세요! 무엇을 도와드릴까요?
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_type === 'user'
          return (
            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] px-3 py-1.5 rounded-2xl text-sm leading-snug',
                  isMine
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm',
                )}
              >
                {msg.message}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t">
        <input
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          placeholder="메시지 입력..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <button
          onClick={handleSend}
          className="text-primary hover:opacity-75 transition-opacity disabled:opacity-30"
          disabled={!input.trim() || !connected}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function ChatWidget() {
  const { token, user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [chatToken, setChatToken] = useState<string | null>(null)
  const [roomId, setRoomId] = useState<number | null>(null)
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-chat', handler)
    return () => window.removeEventListener('open-chat', handler)
  }, [])

  const initialize = async () => {
    if (!token || chatToken) { setOpen(true); return }
    setInitializing(true)
    try {
      const [{ token: ct }, room] = await Promise.all([
        chatApi.token(token),
        chatApi.createRoom(token),
      ])
      setChatToken(ct)
      setRoomId(room.id)
      setOpen(true)
    } catch {
      // silently fail
    } finally {
      setInitializing(false)
    }
  }

  if (!token || !user) return null

  return (
    <>
      {/* 위젯 버튼 */}
      <div className="fixed bottom-6 right-6 z-50">
        {!open && (
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={initialize}
            disabled={initializing}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* 채팅창 */}
      {open && chatToken && roomId && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-[420px] rounded-xl border shadow-2xl bg-background flex flex-col overflow-hidden">
          <ChatPanel chatToken={chatToken} roomId={roomId} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  )
}
