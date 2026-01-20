'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { apiFetch } from '@/lib/api'

export type User = {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  phoneNumber?: string
  userAddress?: string
  profileImage?: string
  userIsVerified?: boolean
}

type AuthContextType = {
  user: User | null
  isLoggedIn: boolean
  isLoading: boolean
  login: (token: string, userData: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('Logout failed:', e)
    } finally {
      localStorage.removeItem('accessToken')
      setUser(null)
      setIsLoading(false)
    }
  }

  const fetchMe = async () => {
    try {
      // Always attempt to fetch current user. The backend may authenticate via httpOnly cookies.
      const res = await apiFetch('/api/v1/auth/me')
      if (res?.data?.user) {
        setUser(res.data.user)
      } else {
        try { localStorage.removeItem('accessToken') } catch {}
        setUser(null)
      }
    } catch (error: any) {
        // Treat 401/400 and connection failures (status 0) as expected: clear local session
        if (error.status === 401 || error.status === 400 || error.status === 0) {
        try { localStorage.removeItem('accessToken') } catch {}
        setUser(null)
        } else {
          // Only log truly unexpected errors
          console.error('Auth fetch error:', error)
        }
    } finally {
      // Always ensure loading is set to false
      setIsLoading(false)
    }
  }

  // Check auth & refresh token automatically
  const checkAuth = async () => {

    // Attempt to load current user regardless of localStorage token presence

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('Auth check timed out, setting loading to false')
      setIsLoading(false)
    }, 10000) // 10 second timeout

    try {
      await fetchMe()
    } finally {
      clearTimeout(timeout)
    }
  }

  useEffect(() => {
    checkAuth()
    // Periodically refresh session every 5 minutes (only if token exists and is valid)
    const interval = setInterval(() => {
      // Periodically re-check session; this will use cookies if available.
      if (typeof window !== 'undefined') {
        fetchMe()
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  const login = (token: string, userData: User) => {
    try {
      if (token) localStorage.setItem('accessToken', token)
    } catch {}
    setUser(userData)
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
