import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authAPI, User, RegisterData, VerificationStatus } from '../lib/api'

interface AuthContextType {
  user: User | null
  verificationStatus: VerificationStatus | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  refreshVerificationStatus: () => Promise<void>
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      refreshUser()
    } else {
      setLoading(false)
    }
  }, [])

  const refreshUser = async () => {
    try {
      const response = await authAPI.me()
      console.log('User response:', response.data)
      setUser(response.data as User)
      
      // If user is an employee, also fetch verification status
      if ((response.data as User).role === 'employee') {
        await refreshVerificationStatus()
      }
    } catch (error: any) {
      console.error('Failed to refresh user:', error)
      // Handle different error types safely
      if (error?.response?.data) {
        console.error('API Error:', error.response.data)
        console.error('Error type:', typeof error.response.data)
        console.error('Error keys:', Object.keys(error.response.data || {}))
      }
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      setVerificationStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshVerificationStatus = async () => {
    try {
      const { verificationAPI } = await import('../lib/api')
      const response = await verificationAPI.getStatus()
      setVerificationStatus(response.data as VerificationStatus)
    } catch (error: any) {
      console.error('Failed to refresh verification status:', error)
      // Don't set verification status to null on error, keep existing state
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      const { access_token, refresh_token } = response.data as { access_token: string; refresh_token: string }
      
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      await refreshUser()
    } catch (error: any) {
      console.error('Login failed:', error)
      // Handle different error types safely
      if (error?.response?.data) {
        console.error('API Error:', error.response.data)
        // Extract error message safely
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : error.response.data?.detail || 'Login failed'
        throw new Error(errorMessage)
      }
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      await authAPI.register(data)
      // Auto-login after registration
      await login(data.email, data.password)
    } catch (error: any) {
      console.error('Registration failed:', error)
      // Handle different error types safely
      if (error?.response?.data) {
        console.error('API Error:', error.response.data)
        // Extract error message safely
        const errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : error.response.data?.detail || 'Registration failed'
        throw new Error(errorMessage)
      }
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setVerificationStatus(null)
  }

  const value = {
    user,
    verificationStatus,
    loading,
    login,
    register,
    logout,
    refreshUser,
    refreshVerificationStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
