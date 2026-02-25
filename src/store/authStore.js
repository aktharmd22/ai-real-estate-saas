import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user:            JSON.parse(localStorage.getItem('auth_user')) || null,
  token:           localStorage.getItem('auth_token') || null,
  isAuthenticated: !!localStorage.getItem('auth_token'),

  setAuth: (user, token) => {
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  updateUser: (user) => {
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ user })
  },
}))

export default useAuthStore