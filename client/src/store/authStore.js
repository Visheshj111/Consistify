import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false })
      },

      login: async (credential) => {
        try {
          const response = await api.post('/auth/google', { credential })
          const { user, token } = response.data
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          console.error('Login error:', error)
          return { success: false, error: error.response?.data?.error || 'Login failed' }
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        localStorage.removeItem('flow-goals-auth')
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) {
          set({ isLoading: false })
          return
        }

        try {
          const response = await api.get('/auth/me')
          set({ user: response.data, isAuthenticated: true, isLoading: false })
        } catch (error) {
          console.error('Auth check failed:', error)
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: { ...state.user, ...updates }
        }))
      }
    }),
    {
      name: 'flow-goals-auth',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
)
