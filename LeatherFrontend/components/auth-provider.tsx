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
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const res = await apiFetch('/api/v1/auth/me')
      if (res?.data?.user) setUser(res.data.user)
      else {
        localStorage.removeItem('accessToken')
        setUser(null)
      }
    } catch (error: any) {
        // Treat 401/400 and connection failures (status 0) as expected: clear local session
        if (error.status === 401 || error.status === 400 || error.status === 0) {
          localStorage.removeItem('accessToken')
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

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
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (token) {
        // Only attempt refresh if we have a user (meaning token was previously valid)
        if (user) {
          fetchMe()
        }
      }
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  const login = (token: string, userData: User) => {
    localStorage.setItem('accessToken', token)
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
