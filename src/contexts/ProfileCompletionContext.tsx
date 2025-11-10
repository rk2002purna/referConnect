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
  const { user, verificationStatus, loading: authLoading } = useAuth()
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
      
      // IMPORTANT: For employees, ignore backend completion status
      // We ONLY use verification status for employees
      if (user.role === 'employee') {
        console.log('⚠️ User is employee - ignoring backend completion status')
        console.log('⚠️ Employee completion determined by verification status only')
      }
      
      // Clear any stale localStorage flags to ensure server-side status is used
      if (!completionData.is_complete) {
        localStorage.removeItem('onboarding_completed')
        localStorage.removeItem('onboarding_completed_role')
        console.log('Cleared stale localStorage onboarding flags')
      }
      
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

  const isOnboardingComplete = (() => {
    console.log('=== Calculating isOnboardingComplete ===')
    console.log('User:', user)
    console.log('User role:', user?.role)
    console.log('Auth loading:', authLoading)
    console.log('Verification status OBJECT:', JSON.stringify(verificationStatus, null, 2))
    console.log('Verification status?.status:', verificationStatus?.status)
    
    // DEFAULT: If no user, return false
    if (!user) {
      console.log('No user - returning FALSE')
      return false
    }
    
    // For employees: Check verification status AND company_id
    if (user.role === 'employee') {
      // Wait for auth to finish loading
      if (authLoading) {
        console.log('Employee: Still loading - return FALSE')
        return false
      }
      
      // CRITICAL: Must have BOTH verified status AND company_id
      const hasCompanyId = verificationStatus?.company_id && verificationStatus.company_id > 0
      const isVerifiedStatus = verificationStatus?.status === 'verified'
      const isVerified = isVerifiedStatus && hasCompanyId
      
      console.log('Employee verification check:')
      console.log('  - verificationStatus is null?', verificationStatus === null)
      console.log('  - verificationStatus.status:', verificationStatus?.status)
      console.log('  - Is status "verified"?', isVerifiedStatus)
      console.log('  - verificationStatus.company_id:', verificationStatus?.company_id)
      console.log('  - Has company_id?', hasCompanyId)
      console.log('  - FINAL RESULT: isVerified =', isVerified, '(needs BOTH verified status AND company_id)')
      console.log('Employee: Onboarding complete =', isVerified)
      console.log('=======================================')
      
      // DEFAULT TO FALSE for employees
      return isVerified || false
    }
    
    // For job seekers, use the server-side completion status
    const serverComplete = completionStatus?.is_complete || false
    console.log('Job seeker: Server complete =', serverComplete)
    console.log('=======================================')
    return serverComplete
  })()

  const value = {
    completionStatus,
    loading: loading || authLoading, // Include auth loading in overall loading state
    refreshCompletionStatus,
    isOnboardingComplete
  }

  return (
    <ProfileCompletionContext.Provider value={value}>
      {children}
    </ProfileCompletionContext.Provider>
  )
}
