import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  uuid?: string
  username: string
  name: string
  email?: string
  phone?: string
  role: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  hasHydrated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (token, user) => {
        set({ token, user, isAuthenticated: true })
        // 确保 hasHydrated 为 true（登录后不需要等待 hydration）
        set({ hasHydrated: true })
      },
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        // localStorage 恢复完成后设置 hasHydrated 为 true
        setTimeout(() => {
          state?.setHasHydrated(true)
        }, 0)
      },
    }
  )
)