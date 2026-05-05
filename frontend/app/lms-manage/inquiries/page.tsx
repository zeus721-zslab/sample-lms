'use client'

import { useEffect, useRef, useState } from 'react'
import { useAdminChatStore } from '@/store/adminChat'
import { PageHeader } from '@/components/admin/PageHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/useChat'
import type { InquiryRoom } from '@/lib/api'

function ChatPanel({ roomId }: { roomId: number }) {
  const { socket, messages, setMessages, markRoomRead } = useAdminChatStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const msgs = messages[roomId] ?? []

  useEffect(() => {
    if (socket && roomId) {
      socket.emit('join_room', { roomId })
    }
  }, [socket, roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    markRoomRead(roomId)
  }, [msgs.length, roomId, markRoomRead])

  const handleSend = () => {
    if (!socket || !input.trim()) return
    socket.emit('send_message', { roomId, message: input.trim() })
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">메시지가 없습니다.</p>
        )}
        {msgs.map((msg) => {
          const isMine = msg.sender_type === 'admin'
          return (
            <div key={msg.id} className={cn('flex gap-2', isMine ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-relaxed',
                isMine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm',
              )}>
                <p>{msg.message}</p>
                <p className={cn('text-[10px] mt-1', isMine ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground')}>
                  {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex items-center gap-2">
        <Input
          className="flex-1"
          placeholder="답변을 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function RoomItem({ room, active, onClick }: { room: InquiryRoom; active: boolean; onClick: () => void }) {
  return (
    <button
      className={cn(
        'w-full text-left px-4 py-3 border-b transition-colors',
        active ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50',
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{room.user?.name ?? '알 수 없음'}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{room.last_message ?? '메시지 없음'}</p>
        </div>
        <div className="shrink-0 text-right">
          {room.unread_count > 0 && (
            <span className="inline-block text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 font-bold mb-1">
              {room.unread_count}
            </span>
          )}
          <p className="text-[10px] text-muted-foreground">
            {room.last_message_at ? new Date(room.last_message_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''}
          </p>
        </div>
      </div>
      {room.user?.email && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{room.user.email}</p>
      )}
    </button>
  )
}

export default function InquiriesPage() {
  const { rooms, activeRoomId, setActiveRoom, connected, unreadTotal } = useAdminChatStore()
  const [search, setSearch] = useState('')

  const filtered = search
    ? rooms.filter((r) => r.user?.name?.includes(search) || r.user?.email?.includes(search) || r.last_message?.includes(search))
    : rooms

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="1:1 문의"
        description={`총 ${rooms.length}개의 문의 ${unreadTotal > 0 ? `(미읽음 ${unreadTotal})` : ''} · ${connected ? '연결됨' : '연결 중...'}`}
      />

      <div className="flex flex-1 overflow-hidden border-t">
        {/* 좌측: 문의 목록 */}
        <div className="w-72 border-r flex flex-col shrink-0">
          <div className="p-3 border-b">
            <Input
              placeholder="이름·이메일 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">문의가 없습니다.</div>
            )}
            {filtered.map((room) => (
              <RoomItem
                key={room.id}
                room={room}
                active={activeRoomId === room.id}
                onClick={() => setActiveRoom(room.id)}
              />
            ))}
          </div>
        </div>

        {/* 우측: 채팅 패널 */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeRoomId ? (
            <ChatPanel roomId={activeRoomId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <MessageSquare className="h-12 w-12 opacity-30" />
              <p className="text-sm">왼쪽에서 문의를 선택하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
