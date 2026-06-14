import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Permissions {
  dashboard: boolean
  vehicles: boolean
  locations: boolean
  tyres: boolean
  allotment: boolean
  stepney: boolean
  history: boolean
  users: boolean
}

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: Permissions
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  hasPermission: (key: keyof Permissions) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      hasPermission: (key) => {
        const { user } = get()
        if (!user) return false
        if (user.role === 'ADMIN') return true
        return user.permissions?.[key] ?? false
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)