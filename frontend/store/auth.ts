'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi, type LmsUser } from '@/lib/api'

interface AuthState {
  user: LmsUser | null
  token: string | null
  isLoaded: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  me: () => Promise<void>
  setAuth: (user: LmsUser, token: string) => void
  clearAuth: () => void
}

// zustand v5: toThenable makes localStorage hydration synchronous inside create().
// useAuthStore is undefined when onRehydrateStorage callback fires, so we capture
// the internal set function here before hydrate() runs (config() is called first).
let _markLoaded: (() => void) | null = null

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      _markLoaded = () => set({ isLoaded: true })
      return {
        user: null,
        token: null,
        isLoaded: false,

        setAuth: (user, token) => set({ user, token, isLoaded: true }),

        clearAuth: () => set({ user: null, token: null, isLoaded: true }),

        login: async (email, password) => {
          const { token, user } = await authApi.login({ email, password })
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
          const { user } = await authApi.me(token)
          set({ user, isLoaded: true })
        },
      }
    },
    {
      name: 'lms-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => () => {
        _markLoaded?.()
      },
    },
  ),
)
