'use client'

import { create } from 'zustand'
import type { ChatMessage } from '@/hooks/useChat'
import type { InquiryRoom } from '@/lib/api'

type AdminChatState = {
  // 소켓
  socket: ReturnType<typeof import('socket.io-client')['io']> | null
  connected: boolean
  chatToken: string | null

  // 방 목록
  rooms: InquiryRoom[]
  // A 페이지(/lms-manage/inquiries 풀스크린 패널) 전용 activeRoom
  activeRoomId: number | null
  // B 위젯(우측 하단 플로팅) 전용 activeRoom — A와 독립
  widgetRoomId: number | null
  messages: Record<number, ChatMessage[]>  // roomId → messages cache
  unreadTotal: number

  // actions
  setSocket: (s: ReturnType<typeof import('socket.io-client')['io']> | null) => void
  setConnected: (v: boolean) => void
  setChatToken: (t: string) => void
  setRooms: (rooms: InquiryRoom[]) => void
  // A 페이지 전용
  setActiveRoom: (id: number | null) => void
  // B 위젯 전용
  setWidgetRoom: (id: number | null) => void
  setMessages: (roomId: number, msgs: ChatMessage[]) => void
  receiveMessage: (roomId: number, msg: ChatMessage) => void
  markRoomRead: (roomId: number) => void
  updateUnreadTotal: () => void
}

export const useAdminChatStore = create<AdminChatState>((set, get) => ({
  socket: null,
  connected: false,
  chatToken: null,
  rooms: [],
  activeRoomId: null,
  widgetRoomId: null,
  messages: {},
  unreadTotal: 0,

  setSocket: (socket) => set({ socket }),
  setConnected: (connected) => set({ connected }),
  setChatToken: (chatToken) => set({ chatToken }),
  setRooms: (rooms) => {
    const total = rooms.reduce((s, r) => s + r.unread_count, 0)
    set({ rooms, unreadTotal: total })
  },

  setActiveRoom: (id) => set({ activeRoomId: id }),
  setWidgetRoom: (id) => set({ widgetRoomId: id }),

  setMessages: (roomId, msgs) => set((s) => ({
    messages: { ...s.messages, [roomId]: msgs },
  })),

  receiveMessage: (roomId, msg) => {
    set((s) => {
      const existing = s.messages[roomId] ?? []
      const newMessages = { ...s.messages, [roomId]: [...existing, msg] }

      // A(activeRoomId) 또는 B 위젯(widgetRoomId) 중 하나라도 해당 방이면 unread 증가 안 함
      const isBeingViewed = s.activeRoomId === roomId || s.widgetRoomId === roomId

      const updatedRooms = s.rooms.map((r) =>
        r.id === roomId
          ? {
              ...r,
              last_message: msg.message,
              last_message_at: msg.created_at,
              last_sender_type: msg.sender_type,
              unread_count: isBeingViewed ? r.unread_count : r.unread_count + 1,
            }
          : r
      ).sort((a, b) => {
        if (!a.last_message_at) return 1
        if (!b.last_message_at) return -1
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      })

      const total = updatedRooms.reduce((sum, r) => sum + r.unread_count, 0)
      return { messages: newMessages, rooms: updatedRooms, unreadTotal: total }
    })
  },

  markRoomRead: (roomId) => {
    set((s) => {
      const socket = s.socket
      if (socket) socket.emit('mark_read', { roomId })
      const updatedRooms = s.rooms.map((r) => r.id === roomId ? { ...r, unread_count: 0 } : r)
      const total = updatedRooms.reduce((sum, r) => sum + r.unread_count, 0)
      return { rooms: updatedRooms, unreadTotal: total }
    })
  },

  updateUnreadTotal: () => {
    const total = get().rooms.reduce((s, r) => s + r.unread_count, 0)
    set({ unreadTotal: total })
  },
}))
