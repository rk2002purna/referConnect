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
      const completionData = response.data as ProfileCompletionResponse
      console.log('Profile completion status from server:', completionData)
      console.log('Is onboarding complete?', completionData.is_complete)
      console.log('User role:', user?.role)
      
      // Use server-side completion status directly - no fallback needed
      // The server now properly checks for mandatory fields (resume + experience for jobseekers)
      setCompletionStatus(completionData)
    } catch (error) {
      console.error('Failed to fetch profile completion status:', error)
      
      // Fallback: If API fails, assume incomplete to be safe
      console.log('API failed, assuming incomplete onboarding')
      setCompletionStatus({
        basic_info_completion: 0,
        jobseeker_completion: 0,
        employee_completion: 0,
        overall_completion: 0,
        missing_fields: ['profile_data'],
        is_complete: false
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
