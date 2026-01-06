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
      const res = await apiFetch('/api/v1/auth/me')
      if (res?.data?.user) setUser(res.data.user)
      else {
        localStorage.removeItem('accessToken')
        setUser(null)
      }
    } catch (error: any) {
      if (error.status === 401) {
        localStorage.removeItem('accessToken')
        setUser(null)
      }
    }
  }

  // Check auth & refresh token automatically
  const checkAuth = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!token) {
      setIsLoading(false)
      return
    }
    await fetchMe()
    setIsLoading(false)
  }

  useEffect(() => {
    checkAuth()
    // Periodically refresh session every 5 minutes
    const interval = setInterval(() => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (token) checkAuth()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

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
