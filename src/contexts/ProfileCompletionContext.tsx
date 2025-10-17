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
      
      // For employees, check verification status before assuming completion
      if (user.role === 'employee') {
        try {
          const { verificationAPI } = await import('../lib/api')
          const verificationResponse = await verificationAPI.getStatus()
          const verificationStatus = verificationResponse.data
          console.log('Verification status for employee:', verificationStatus)
          
          // If employee is verified, consider profile complete
          if (verificationStatus.status === 'verified') {
            console.log('Employee is verified, marking profile as complete')
            setCompletionStatus({
              basic_info_completion: 100,
              jobseeker_completion: 0,
              employee_completion: 100,
              overall_completion: 100,
              missing_fields: [],
              is_complete: true
            })
          } else {
            console.log('Employee not verified, marking profile as incomplete')
            // Employee not verified, profile incomplete
            setCompletionStatus({
              basic_info_completion: 50,
              jobseeker_completion: 0,
              employee_completion: 0,
              overall_completion: 25,
              missing_fields: ['verification'],
              is_complete: false
            })
          }
        } catch (verificationError) {
          console.error('Failed to check verification status:', verificationError)
          
          // Check localStorage for onboarding completion flag
          const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true'
          const onboardingRole = localStorage.getItem('onboarding_completed_role')
          
          if (onboardingCompleted && onboardingRole === 'employee') {
            console.log('Using localStorage workaround: Employee onboarding marked as completed')
            setCompletionStatus({
              basic_info_completion: 100,
              jobseeker_completion: 0,
              employee_completion: 100,
              overall_completion: 100,
              missing_fields: [],
              is_complete: true
            })
          } else if (user.first_name && user.last_name && user.email) {
            console.log('Using fallback: Employee has basic data, assuming profile complete')
            setCompletionStatus({
              basic_info_completion: 100,
              jobseeker_completion: 0,
              employee_completion: 100,
              overall_completion: 100,
              missing_fields: [],
              is_complete: true
            })
          } else {
            // If we can't check verification, assume incomplete for employees
            setCompletionStatus({
              basic_info_completion: 50,
              jobseeker_completion: 0,
              employee_completion: 0,
              overall_completion: 25,
              missing_fields: ['verification'],
              is_complete: false
            })
          }
        }
      } else {
        // For job seekers, use the original fallback
        setCompletionStatus({
          basic_info_completion: 100,
          jobseeker_completion: 100,
          employee_completion: 0,
          overall_completion: 100,
          missing_fields: [],
          is_complete: true
        })
      }
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
