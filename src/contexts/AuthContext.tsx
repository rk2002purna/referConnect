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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshUser = async () => {
    try {
      const response = await authAPI.me()
      console.log('User response:', response.data)
      const userData = response.data as User
      setUser(userData)
      
      // If user is an employee, also fetch verification status BEFORE setting loading to false
      if (userData.role === 'employee') {
        console.log('User is employee, fetching verification status...')
        await refreshVerificationStatus()
        console.log('Verification status fetched')
      } else {
        // For non-employees, clear verification status
        setVerificationStatus(null)
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
      console.log('Auth loading complete')
    }
  }

  const refreshVerificationStatus = async () => {
    console.log('Refreshing verification status...')
    try {
      const { verificationAPI } = await import('../lib/api')
      const response = await verificationAPI.getStatus()
      console.log('✅ Verification status from API:', response.data)
      setVerificationStatus(response.data as VerificationStatus)
    } catch (error: any) {
      console.error('❌ Failed to fetch verification status:', error)
      console.log('Error status:', error?.response?.status)
      
      // If 404 or any error (no verification record exists yet for new user),
      // set verification status to null to indicate NOT verified
      console.log('⚠️ No verification found - user is NOT verified')
      setVerificationStatus(null)
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
      // Auto-login after registration to keep user logged in
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
    // Note: We don't clear onboarding_completed flags anymore since we use server-side completion status
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
