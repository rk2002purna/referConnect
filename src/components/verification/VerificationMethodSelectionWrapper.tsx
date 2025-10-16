import React from 'react'
import { VerificationMethodSelection } from './VerificationMethodSelection'
import { OnboardingStepProps } from '../../types/onboarding'

export function VerificationMethodSelectionWrapper(props: OnboardingStepProps) {
  const { onSelectMethod, onPrevious } = props
  
  if (!onSelectMethod) {
    throw new Error('onSelectMethod is required for VerificationMethodSelection')
  }

  return (
    <VerificationMethodSelection
      onSelectMethod={onSelectMethod}
      onPrevious={onPrevious}
    />
  )
}





