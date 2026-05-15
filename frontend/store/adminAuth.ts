'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, type LmsUser } from '@/lib/api'

interface AdminAuthState {
  user: LmsUser | null
  token: string | null
  isLoaded: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  me: () => Promise<void>
  setAuth: (user: LmsUser, token: string) => void
  clearAuth: () => void
}

let _markAdminLoaded: (() => void) | null = null

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => {
      _markAdminLoaded = () => set({ isLoaded: true })
      return {
        user: null,
        token: null,
        isLoaded: false,

        setAuth: (user, token) => set({ user, token, isLoaded: true }),

        clearAuth: () => set({ user: null, token: null, isLoaded: true }),

        login: async (email, password) => {
          const { token, user } = await authApi.login({ email, password, login_type: 'admin' })
          set({ user, token, isLoaded: true })
        },

        logout: async () => {
          const { token } = get()
          if (token) {
            await authApi.logout(token).catch(() => {})
          }
          set({ user: null, token: null, isLoaded: true })
        },

        me: async () => {
          const { token } = get()
          if (!token) return
          const { user, token_type } = await authApi.me(token)
          set({ user: { ...user, token_type }, isLoaded: true })
        },
      }
    },
    {
      name: 'lms-admin-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => () => {
        _markAdminLoaded?.()
      },
    },
  ),
)
