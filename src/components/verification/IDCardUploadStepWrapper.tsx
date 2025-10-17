import React from 'react'
import { IDCardUploadStep } from './IDCardUploadStep'
import { OnboardingStepProps } from '../../types/onboarding'

export function IDCardUploadStepWrapper(props: OnboardingStepProps) {
  const { onUploadComplete, onPrevious, onNext } = props
  
  if (!onUploadComplete) {
    throw new Error('onUploadComplete is required for IDCardUploadStep')
  }

  return (
    <IDCardUploadStep
      onUploadComplete={onUploadComplete}
      onPrevious={onPrevious}
      onNext={onNext}
    />
  )
}







