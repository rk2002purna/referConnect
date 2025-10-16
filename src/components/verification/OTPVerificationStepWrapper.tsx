import React from 'react'
import { OTPVerificationStep } from './OTPVerificationStep'
import { OnboardingStepProps } from '../../types/onboarding'

export function OTPVerificationStepWrapper(props: OnboardingStepProps) {
  const { companyEmail, companyId, onVerificationComplete, onPrevious, onResendOTP } = props
  
  if (!companyEmail) {
    throw new Error('companyEmail is required for OTPVerificationStep')
  }
  
  if (!companyId) {
    throw new Error('companyId is required for OTPVerificationStep')
  }
  
  if (!onVerificationComplete) {
    throw new Error('onVerificationComplete is required for OTPVerificationStep')
  }

  return (
    <OTPVerificationStep
      companyEmail={companyEmail}
      companyId={companyId}
      onVerificationComplete={onVerificationComplete}
      onPrevious={onPrevious}
      onResendOTP={onResendOTP}
    />
  )
}
