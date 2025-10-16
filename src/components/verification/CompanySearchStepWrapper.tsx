import React from 'react'
import { CompanySearchStep } from './CompanySearchStep'
import { OnboardingStepProps } from '../../types/onboarding'

export function CompanySearchStepWrapper(props: OnboardingStepProps) {
  const { onCompanySelect, onPrevious, onNext } = props
  
  if (!onCompanySelect) {
    throw new Error('onCompanySelect is required for CompanySearchStep')
  }

  return (
    <CompanySearchStep
      onCompanySelect={onCompanySelect}
      onPrevious={onPrevious}
      onNext={onNext}
    />
  )
}





