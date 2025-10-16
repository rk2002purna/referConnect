import React, { useState } from 'react'
import { CompanyEmailStep } from './CompanyEmailStep'
import { OnboardingStepProps } from '../../types/onboarding'
import { verificationAPI } from '../../lib/api'

export function CompanyEmailStepWrapper(props: OnboardingStepProps) {
  const { data, onPrevious, onNext } = props
  const [isSendingOTP, setIsSendingOTP] = useState(false)
  const [otpError, setOtpError] = useState('')
  
  const companyName = data.verification?.company_name || ''
  const companyDomain = data.verification?.company_domain || ''
  const personalEmail = data.email || ''
  const companyId = data.verification?.company_id || 0

  const handleEmailSubmit = async (personalEmail: string, companyEmail: string) => {
    if (!companyId) {
      setOtpError('Company ID is missing. Please go back and select a company.')
      return
    }

    setIsSendingOTP(true)
    setOtpError('')

    try {
      // Send OTP to company email
      const response = await verificationAPI.sendOTP({
        company_id: companyId,
        company_email: companyEmail
      })

      if (response.data.success) {
        // Update the data with both emails and OTP info
        props.updateData({
          verification: {
            ...data.verification,
            personal_email: personalEmail,
            company_email: companyEmail,
            status: 'pending_email'
          }
        })
        
        // Move to next step (OTP verification)
        onNext()
      } else {
        setOtpError(response.data.message || 'Failed to send verification code')
      }
    } catch (err: any) {
      console.error('Send OTP error:', err)
      let errorMessage = 'Failed to send verification code. Please try again.'
      
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setOtpError(errorMessage)
    } finally {
      setIsSendingOTP(false)
    }
  }

  return (
    <CompanyEmailStep
      companyName={companyName}
      companyDomain={companyDomain}
      personalEmail={personalEmail}
      onEmailSubmit={handleEmailSubmit}
      onPrevious={onPrevious}
      onNext={onNext}
      isSendingOTP={isSendingOTP}
      otpError={otpError}
    />
  )
}
