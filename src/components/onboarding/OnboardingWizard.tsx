import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProfileCompletion } from '../../contexts/ProfileCompletionContext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import { CheckCircle, ArrowLeft, ArrowRight, X, Save } from 'lucide-react'
import { OnboardingData, JOB_SEEKER_STEPS, EMPLOYEE_STEPS } from '../../types/onboarding'
import { profileAPI, verificationAPI } from '../../lib/api'
import ResumeUploadStep from './ResumeUploadStep'
import { VerificationSuccessModal } from '../verification/VerificationSuccessModal'
import { 
  saveOnboardingData, 
  loadOnboardingData, 
  saveCurrentStep, 
  loadCurrentStep,
  saveCompletedSteps,
  loadCompletedSteps,
  saveOnboardingDataToAPI,
  loadOnboardingDataFromAPI,
  clearOnboardingData
} from '../../lib/onboardingPersistence'

interface OnboardingWizardProps {
  initialData?: Partial<OnboardingData>
}

export function OnboardingWizard({ initialData }: OnboardingWizardProps) {
  const { user, verificationStatus, refreshVerificationStatus } = useAuth()
  const { refreshCompletionStatus } = useProfileCompletion()
  const navigate = useNavigate()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    jobseeker: {
      skills: [],
      preferred_job_types: [],
      industries: [],
      languages: [],
      certifications: [],
      privacy_excluded_companies: []
    },
    ...initialData
  })
  const [completedSteps, setCompletedSteps] = useState<string[]>(loadCompletedSteps())
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false)
  const redirectTimerRef = React.useRef<NodeJS.Timeout | null>(null)


  // Initialize onboarding data and step
  useEffect(() => {
    const initializeOnboarding = async () => {
      if (user) {
        // Load from localStorage first
        const localData = loadOnboardingData()
        const localStep = loadCurrentStep()
        const localCompletedSteps = loadCompletedSteps()
        
        let finalData = {
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          jobseeker: {
            skills: [],
            preferred_job_types: [],
            industries: [],
            languages: [],
            certifications: [],
            privacy_excluded_companies: []
          },
          ...initialData
        }
        
        // If we have local data, merge it with user data
        if (localData) {
          finalData = { ...finalData, ...localData }
        }
        
        // Load from API if localStorage data is empty or incomplete
        if (!localData) {
          try {
            const apiData = await loadOnboardingDataFromAPI(user.role as 'jobseeker' | 'employee')
            if (apiData) {
              finalData = { ...finalData, ...apiData }
            }
          } catch (error) {
            console.log('Failed to load from API, using local data')
          }
        }
        
        setData(finalData)
        setCompletedSteps(localCompletedSteps)
        setCurrentStepIndex(localStep)
        
        // Save initial data to localStorage
        saveOnboardingData(finalData)
      }
    }
    
    initializeOnboarding()
  }, [user, initialData])

  // Get steps based on role and verification method
  const getSteps = () => {
    if (user?.role === 'jobseeker') {
      // Add ResumeUploadStep to the jobseeker steps as mandatory
      const jobseekerSteps = [...JOB_SEEKER_STEPS]
      jobseekerSteps.push({
        id: 'resume-upload',
        title: 'Resume Upload',
        description: 'Upload your resume (required)',
        component: ResumeUploadStep,
        isRequired: true,
        validation: (data) => {
          const errors: string[] = []
          if (!data.jobseeker?.resume_filename) {
            errors.push('Resume upload is required')
          }
          return errors
        }
      })
      return jobseekerSteps
    }
    
    // For employees, filter steps based on verification method
    const allEmployeeSteps = EMPLOYEE_STEPS
    const verificationMethod = data.verification?.method
    
    if (!verificationMethod) {
      // Show only basic info and verification method selection
      return allEmployeeSteps.slice(0, 2)
    }
    
    if (verificationMethod === 'email') {
      // Show email verification flow: basic info, method, company search, company email, OTP verification, company info, referral preferences
      return allEmployeeSteps.filter(step => 
        step.id !== 'id-card-upload'
      )
    } else if (verificationMethod === 'id_card') {
      // Show ID card verification flow: basic info, method, company search, ID card upload, company info, referral preferences
      return allEmployeeSteps.filter(step => 
        step.id !== 'otp-verification' && step.id !== 'company-email'
      )
    }
    
    return allEmployeeSteps
  }
  
  const steps = getSteps()
  const currentStep = steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
    }
  }, [])

  const updateData = (updates: Partial<OnboardingData>) => {
    console.log('Updating onboarding data with:', updates)
    setData(prev => {
      const newData = {
        ...prev,
        ...updates
      }
      console.log('New onboarding data:', newData)
      
      // Save to localStorage immediately
      saveOnboardingData(newData)
      return newData
    })
    setErrors([])
  }

  const validateCurrentStep = (): boolean => {
    if (!currentStep.validation) return true
    
    const stepErrors = currentStep.validation(data)
    setErrors(stepErrors)
    return stepErrors.length === 0
  }

  const saveCurrentStepData = async (): Promise<boolean> => {
    if (!user) return false
    
    setIsSaving(true)
    try {
      // Save to localStorage
      saveOnboardingData(data)
      saveCurrentStep(currentStepIndex)
      
      // Add current step to completed steps
      const updatedCompletedSteps = [...completedSteps, currentStep.id]
      const uniqueCompletedSteps = Array.from(new Set(updatedCompletedSteps))
      setCompletedSteps(uniqueCompletedSteps)
      saveCompletedSteps(uniqueCompletedSteps)
      
      // Save to API
      const success = await saveOnboardingDataToAPI(data, user.role as 'jobseeker' | 'employee')
      
      if (success) {
        console.log(`Step ${currentStep.id} data saved successfully`)
      } else {
        console.warn(`Step ${currentStep.id} data saved to localStorage but failed to save to API`)
      }
      
      return true
    } catch (error) {
      console.error('Failed to save step data:', error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleNext = async () => {
    if (validateCurrentStep()) {
      // Save current step data before moving to next step
      const saveSuccess = await saveCurrentStepData()
      
      if (saveSuccess) {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1)
        } else {
          handleComplete()
        }
      } else {
        setErrors(['Failed to save data. Please try again.'])
      }
    }
  }

  // Handle verification method selection
  const handleVerificationMethodSelect = (method: 'email' | 'id_card') => {
    updateData({
      verification: {
        ...data.verification,
        method
      }
    })
    // Move to next step after method selection
    setCurrentStepIndex(prev => prev + 1)
  }

  // Handle company selection
  const handleCompanySelect = (company: any) => {
    console.log('Company selected:', company)
    const updatedData = {
      verification: {
        ...data.verification,
        company_id: company.id,
        company_name: company.name,
        company_domain: company.domain,
        personal_email: data.email // Set personal email from registration data
      }
    }
    console.log('Updated verification data:', updatedData.verification)
    updateData(updatedData)
    // Move to next step after company selection
    setCurrentStepIndex(prev => prev + 1)
  }

  // Handle company email submission and OTP send
  const handleCompanyEmailSubmit = async (personalEmail: string, companyEmail: string) => {
    console.log('Company email submitted:', { personalEmail, companyEmail })
    updateData({
      verification: {
        ...data.verification,
        personal_email: personalEmail,
        company_email: companyEmail,
        status: 'pending_email'
      }
    })
    // Move to next step after email submission (OTP verification)
    setCurrentStepIndex(prev => prev + 1)
  }

  // Handle OTP verification
  const handleOTPVerification = async (success: boolean) => {
    if (success) {
      console.log('OTP Verification successful - starting save process...')
      
      // Set flags FIRST to prevent any redirects from useEffect
      setIsSubmitting(true)
      
      // Show success modal immediately to prevent any UI changes
      setShowVerificationSuccess(true)
      
      try {
        // Save basic profile information first
        await profileAPI.updateProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          location: data.location,
          bio: data.bio
        })
        console.log('✓ Basic profile saved')

        // Save employee profile
        if (user?.role === 'employee' && data.employee) {
          await profileAPI.updateEmployeeProfile({
            title: data.employee.job_title,
            badges: data.employee.skills_areas?.join(',') || ''
          })
          console.log('✓ Employee profile saved')
          
          // Save employee company data to localStorage for the EmployeeProfile component
          const companyData = {
            company_name: data.verification?.company_name || '',
            company_industry: 'Technology',
            company_email: data.verification?.company_email || data.email,
            office_location: data.employee?.office_location || data.location || '',
            job_title: data.employee?.job_title || '',
            department: data.employee?.department || '',
            years_at_company: data.employee?.years_at_company || 0
          }
          localStorage.setItem('employee_company_data', JSON.stringify(companyData))
          console.log('✓ Employee company data saved to localStorage')
        }
        
        // NOTE: Don't manually update verification status - it's already set by verifyOTP endpoint
        // The backend automatically sets status to 'verified' when OTP is successfully verified
        
        // Set localStorage flags as backup
        localStorage.setItem('onboarding_completed', 'true')
        localStorage.setItem('onboarding_completed_role', user?.role || '')
        console.log('✓ Onboarding marked as completed in localStorage')
        
        // Update local state
        updateData({
          verification: {
            ...data.verification,
            status: 'verified'
          }
        })
        
        // Refresh verification status from server
        await refreshVerificationStatus()
        console.log('✓ Verification status refreshed from server')
        
        // Wait longer to ensure verification status is fully updated in context
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Log the current verification status to verify it's updated
        console.log('Current verification status after refresh:', verificationStatus)
        
        console.log('✓ All data saved successfully - ready to redirect')
      } catch (error) {
        console.error('❌ Failed to save profile data:', error)
        // Continue with verification even if profile save fails
      }
      
      // Auto-redirect after showing modal for 2 seconds (user can also click button)
      redirectTimerRef.current = setTimeout(() => {
        handleVerificationSuccessContinue()
      }, 2000)
    }
  }
  
  // Handle verification success modal close and redirect
  const handleVerificationSuccessContinue = () => {
    console.log('User clicked continue or auto-redirect triggered')
    
    // Clear auto-redirect timer if it exists
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current)
      redirectTimerRef.current = null
    }
    
    // Close modal
    setShowVerificationSuccess(false)
    
    // Ensure submitting flag is still set
    setIsSubmitting(true)
    
    // Set sessionStorage flag to allow immediate access to /post-job
    sessionStorage.setItem('just_verified', 'true')
    
    console.log('Redirecting to /post-job...')
    
    // Redirect immediately to post-job page
    navigate('/post-job', { replace: true })
  }

  // Handle OTP resend
  const handleResendOTP = async () => {
    if (!data.verification?.company_id || !data.verification?.company_email) {
      console.error('Missing company ID or email for OTP resend')
      return
    }

    try {
      const response = await verificationAPI.sendOTP({
        company_id: data.verification.company_id,
        company_email: data.verification.company_email
      })
      
      if (!response.data.success) {
        console.error('Failed to resend OTP:', response.data.message)
      }
    } catch (err) {
      console.error('OTP resend error:', err)
    }
  }

  // Handle ID card upload
  const handleIDCardUpload = (files: { selfie: File; idCard: File }) => {
    updateData({
      verification: {
        ...data.verification,
        status: 'pending_id_card',
        uploaded_files: {
          selfie: files.selfie,
          id_card: files.idCard
        }
      }
    })
    // Move to next step after ID card upload
    setCurrentStepIndex(prev => prev + 1)
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      // Save current data before going back
      saveOnboardingData(data)
      saveCurrentStep(currentStepIndex)
      
      setCurrentStepIndex(prev => prev - 1)
      setErrors([])
    }
  }

  const handleSkip = async () => {
    // Save current step data before skipping
    await saveCurrentStepData()
    
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      console.log('Completing onboarding with data:', data)
      console.log('Jobseeker data:', data.jobseeker)
      
      // Save basic profile information
      await profileAPI.updateProfile({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        location: data.location,
        bio: data.bio,
        linkedin_url: data.jobseeker?.linkedin_url || data.employee?.bio
      })

      // Save role-specific profile
      if (user?.role === 'jobseeker' && data.jobseeker) {
        await profileAPI.updateJobSeekerProfile({
          // Basic Info
          skills: data.jobseeker.skills?.join(',') || '',
          years_experience: data.jobseeker.years_experience || 0,
          current_company: data.jobseeker.current_company,
          current_job_title: data.jobseeker.current_job_title,
          education: data.jobseeker.education,
          certifications: data.jobseeker.certifications?.join(',') || '',
          
          // Job Preferences
          preferred_job_types: data.jobseeker.preferred_job_types?.join(',') || '',
          salary_expectation_min: data.jobseeker.salary_expectation?.min,
          salary_expectation_max: data.jobseeker.salary_expectation?.max,
          salary_currency: data.jobseeker.salary_expectation?.currency,
          notice_period: data.jobseeker.notice_period,
          availability: data.jobseeker.availability,
          industries: data.jobseeker.industries?.join(',') || '',
          willing_to_relocate: data.jobseeker.willing_to_relocate,
          work_authorization: data.jobseeker.work_authorization,
          
          // Languages
          languages: data.jobseeker.languages ? JSON.stringify(data.jobseeker.languages) : '',
          
          // Portfolio & Links
          portfolio_url: data.jobseeker.portfolio_url,
          linkedin_url: data.jobseeker.linkedin_url,
          github_url: data.jobseeker.github_url,
          
          // Privacy
          privacy_excluded_companies: data.jobseeker.privacy_excluded_companies?.join(',') || ''
        })
      } else if (user?.role === 'employee' && data.employee) {
        await profileAPI.updateEmployeeProfile({
          title: data.employee.job_title,
          badges: data.employee.skills_areas?.join(',') || ''
        })
        
        // Save employee company data to localStorage for the EmployeeProfile component
        console.log('Onboarding completion - verification data:', data.verification)
        console.log('Onboarding completion - employee data:', data.employee)
        console.log('Onboarding completion - full data:', data)
        
        const companyData = {
          company_name: data.verification?.company_name || '',
          company_industry: 'Technology', // Default industry, can be enhanced later
          company_email: data.verification?.company_email || data.email,
          office_location: data.employee?.office_location || data.location || '',
          job_title: data.employee?.job_title || '',
          department: data.employee?.department || '',
          years_at_company: data.employee?.years_at_company || 0
        }
        
        console.log('Company data to be saved:', companyData)
        localStorage.setItem('employee_company_data', JSON.stringify(companyData))
        console.log('Employee company data saved to localStorage:', companyData)
        
        // Verify the data was saved correctly
        const savedData = localStorage.getItem('employee_company_data')
        console.log('Verification - data saved to localStorage:', savedData)
      }

      // Save verification status for employees
      if (user?.role === 'employee' && data.verification) {
        try {
          console.log('Saving verification status:', {
            status: data.verification.status || 'verified',
            method: data.verification.method,
            company_id: data.verification.company_id
          })
          
          await verificationAPI.updateStatus({
            status: data.verification.status || 'verified',
            method: data.verification.method,
            company_id: data.verification.company_id
          })
          console.log('Verification status updated successfully')
        } catch (verificationError) {
          console.error('Failed to update verification status:', verificationError)
          // Don't fail the entire onboarding if verification update fails
          // The verification might already be saved from the verification steps
        }
      }

      // Set localStorage flags as backup
      localStorage.setItem('onboarding_completed', 'true')
      localStorage.setItem('onboarding_completed_role', user?.role || '')
      console.log('Onboarding marked as completed in localStorage as backup')
      
      // Refresh profile completion status to get updated server-side completion
      await refreshCompletionStatus()
      
      // Add a small delay to ensure completion status is updated
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Redirect based on role
      if (user?.role === 'jobseeker') {
        navigate('/search')
      } else {
        navigate('/post-job')
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      setErrors(['Failed to save profile. Please try again.'])
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit onboarding? You can complete it later from your profile.')) {
      navigate('/profile')
    }
  }

  const StepComponent = currentStep.component

  // If user is verified and we're showing success modal, don't render onboarding content
  // This prevents any rendering issues while redirecting
  if (showVerificationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <VerificationSuccessModal
          isOpen={showVerificationSuccess}
          onClose={() => setShowVerificationSuccess(false)}
          onContinue={handleVerificationSuccessContinue}
          companyName={data.verification?.company_name}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to ReferConnect!
          </h1>
          <p className="text-gray-600">
            Let's set up your profile to get you started
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 ${
                  index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index < currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : index === currentStepIndex
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Exit
          </Button>
        </div>

        {/* Step Content */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{currentStep.title}</CardTitle>
            <p className="text-gray-600">{currentStep.description}</p>
          </CardHeader>
          <CardContent>
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <ul className="text-sm text-red-600 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <StepComponent
              data={data}
              updateData={updateData}
              errors={errors}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={currentStep.isRequired ? undefined : handleSkip}
              isFirstStep={currentStepIndex === 0}
              isLastStep={currentStepIndex === steps.length - 1}
              // Verification-specific props
              onSelectMethod={handleVerificationMethodSelect}
              onCompanySelect={handleCompanySelect}
              onCompanyEmailSubmit={handleCompanyEmailSubmit}
              onVerificationComplete={handleOTPVerification}
              onUploadComplete={handleIDCardUpload}
              onResendOTP={handleResendOTP}
              companyEmail={data.verification?.company_email || ''}
              companyId={data.verification?.company_id || 0}
            />

            {/* Navigation Buttons - Hide for steps with custom navigation */}
            {!['verification-method', 'company-search', 'company-email', 'otp-verification', 'id-card-upload'].includes(currentStep.id) && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center space-x-3">
                  {!currentStep.isRequired && (
                    <Button
                      variant="ghost"
                      onClick={handleSkip}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Skip for now
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting || isSaving}
                    className="flex items-center"
                  >
                    {isSubmitting ? (
                      'Completing...'
                    ) : isSaving ? (
                      'Saving...'
                    ) : currentStepIndex === steps.length - 1 ? (
                      'Complete Setup'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save and Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Verification Success Modal */}
      <VerificationSuccessModal
        isOpen={showVerificationSuccess}
        onClose={() => setShowVerificationSuccess(false)}
        onContinue={handleVerificationSuccessContinue}
        companyName={data.verification?.company_name}
      />
    </div>
  )
}
