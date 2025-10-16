import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useProfileCompletion } from '../../contexts/ProfileCompletionContext'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Progress } from '../ui/Progress'
import { CheckCircle, ArrowLeft, ArrowRight, X } from 'lucide-react'
import { OnboardingData, JOB_SEEKER_STEPS, EMPLOYEE_STEPS } from '../../types/onboarding'
import { profileAPI, verificationAPI } from '../../lib/api'

interface OnboardingWizardProps {
  initialData?: Partial<OnboardingData>
}

export function OnboardingWizard({ initialData }: OnboardingWizardProps) {
  const { user } = useAuth()
  const { refreshCompletionStatus } = useProfileCompletion()
  const navigate = useNavigate()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    ...initialData
  })
  const [errors, setErrors] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update data when user data changes
  useEffect(() => {
    if (user) {
      setData(prev => ({
        ...prev,
        first_name: user.first_name || prev.first_name,
        last_name: user.last_name || prev.last_name,
        email: user.email || prev.email
      }))
    }
  }, [user])

  // Get steps based on role and verification method
  const getSteps = () => {
    if (user?.role === 'jobseeker') {
      return JOB_SEEKER_STEPS
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

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({
      ...prev,
      ...updates
    }))
    setErrors([])
  }

  const validateCurrentStep = (): boolean => {
    if (!currentStep.validation) return true
    
    const stepErrors = currentStep.validation(data)
    setErrors(stepErrors)
    return stepErrors.length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1)
      } else {
        handleComplete()
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
    updateData({
      verification: {
        ...data.verification,
        company_id: company.id,
        company_name: company.name,
        company_domain: company.domain,
        personal_email: data.email // Set personal email from registration data
      }
    })
    // Move to next step after company selection
    setCurrentStepIndex(prev => prev + 1)
  }

  // Handle OTP verification
  const handleOTPVerification = (success: boolean) => {
    if (success) {
      updateData({
        verification: {
          ...data.verification,
          status: 'verified'
        }
      })
      // Move to next step after OTP verification
      setCurrentStepIndex(prev => prev + 1)
    }
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
      setCurrentStepIndex(prev => prev - 1)
      setErrors([])
    }
  }

  const handleSkip = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
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
          skills: data.jobseeker.skills?.join(',') || '',
          years_experience: data.jobseeker.years_experience || 0,
          current_company: data.jobseeker.current_company,
          privacy_excluded_companies: data.jobseeker.privacy_excluded_companies?.join(',') || ''
        })
      } else if (user?.role === 'employee' && data.employee) {
        await profileAPI.updateEmployeeProfile({
          title: data.employee.job_title,
          badges: data.employee.skills_areas?.join(',') || ''
        })
      }

      // Refresh profile completion status
      await refreshCompletionStatus()
      
      // Redirect based on role
      if (user?.role === 'jobseeker') {
        navigate('/search')
      } else {
        navigate('/dashboard')
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
              onVerificationComplete={handleOTPVerification}
              onUploadComplete={handleIDCardUpload}
              onResendOTP={handleResendOTP}
              companyEmail={data.verification?.company_email || ''}
              companyId={data.verification?.company_id || 0}
            />

            {/* Navigation Buttons */}
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
                  disabled={isSubmitting}
                  className="flex items-center"
                >
                  {isSubmitting ? (
                    'Saving...'
                  ) : currentStepIndex === steps.length - 1 ? (
                    'Complete Setup'
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
