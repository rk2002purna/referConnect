import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { profileAPI, ProfileCompletionResponse } from '../lib/api'
import { useAuth } from './AuthContext'

interface ProfileCompletionContextType {
  completionStatus: ProfileCompletionResponse | null
  loading: boolean
  refreshCompletionStatus: () => Promise<void>
  isOnboardingComplete: boolean
}

const ProfileCompletionContext = createContext<ProfileCompletionContextType | undefined>(undefined)

export function useProfileCompletion() {
  const context = useContext(ProfileCompletionContext)
  if (context === undefined) {
    throw new Error('useProfileCompletion must be used within a ProfileCompletionProvider')
  }
  return context
}

interface ProfileCompletionProviderProps {
  children: ReactNode
}

export function ProfileCompletionProvider({ children }: ProfileCompletionProviderProps) {
  const { user } = useAuth()
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletionResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const refreshCompletionStatus = useCallback(async () => {
    // Only fetch if user is authenticated
    if (!user) {
      setCompletionStatus(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await profileAPI.getProfileCompletion()
      setCompletionStatus(response.data as ProfileCompletionResponse)
    } catch (error) {
      console.error('Failed to fetch profile completion status:', error)
      // Fallback: assume profile is complete if API fails
      setCompletionStatus({
        basic_info_completion: 100,
        jobseeker_completion: 100,
        employee_completion: 100,
        overall_completion: 100,
        missing_fields: [],
        is_complete: true
      })
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refreshCompletionStatus()
  }, [refreshCompletionStatus])

  const isOnboardingComplete = completionStatus?.is_complete || false

  const value = {
    completionStatus,
    loading,
    refreshCompletionStatus,
    isOnboardingComplete
  }

  return (
    <ProfileCompletionContext.Provider value={value}>
      {children}
    </ProfileCompletionContext.Provider>
  )
}
