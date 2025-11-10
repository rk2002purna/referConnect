import React, { useState } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { ArrowLeft, ArrowRight, Mail, Building2, CheckCircle } from 'lucide-react'

interface CompanyEmailStepProps {
  companyName: string
  companyDomain: string
  personalEmail: string
  onEmailSubmit: (personalEmail: string, companyEmail: string) => void
  onPrevious?: () => void
  isSendingOTP?: boolean
  otpError?: string
}

export function CompanyEmailStep({ 
  companyName, 
  companyDomain, 
  personalEmail,
  onEmailSubmit, 
  onPrevious,
  isSendingOTP = false,
  otpError = ''
}: CompanyEmailStepProps) {
  const [companyEmail, setCompanyEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(companyEmail)) {
      setError('Please enter a valid company email address')
      setLoading(false)
      return
    }

    // Validate email domain matches company domain
    const emailDomain = companyEmail.split('@')[1]?.toLowerCase()
    const companyDomainLower = companyDomain.toLowerCase()
    
    if (emailDomain !== companyDomainLower) {
      setError(`Company email must be from ${companyDomain} domain`)
      setLoading(false)
      return
    }

    // Check if personal and company emails are different
    if (personalEmail.toLowerCase() === companyEmail.toLowerCase()) {
      setError('Company email must be different from your personal email')
      setLoading(false)
      return
    }

    try {
      // Call the email submit handler which will send OTP
      await onEmailSubmit(personalEmail, companyEmail)
    } catch (err) {
      setError('Failed to validate email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Email Verification Setup
        </h3>
        <p className="text-gray-600">
          We need both your personal and company email addresses for verification
        </p>
      </div>

      {/* Company Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{companyName}</h4>
              <p className="text-sm text-gray-600">Domain: {companyDomain}</p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="text-xs font-medium">Verified Company</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Input Form */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Personal Email (Read-only) */}
            <div>
              <label htmlFor="personal_email" className="block text-sm font-medium text-gray-700 mb-2">
                Personal Email Address
              </label>
              <Input
                id="personal_email"
                type="email"
                value={personalEmail}
                disabled
                className="h-11 bg-gray-50"
              />
              <p className="mt-2 text-xs text-gray-500">
                This is the email you used to register your account
              </p>
            </div>

            {/* Company Email */}
            <div>
              <label htmlFor="company_email" className="block text-sm font-medium text-gray-700 mb-2">
                Company Email Address *
              </label>
              <Input
                id="company_email"
                type="email"
                value={companyEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCompanyEmail(e.target.value)
                  setError('')
                }}
                placeholder={`your.name@${companyDomain}`}
                className="h-11"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Enter your work email address from {companyDomain}
              </p>
            </div>

            {/* Error Messages */}
            {(error || otpError) && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error || otpError}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              {onPrevious && (
                <Button variant="outline" onClick={onPrevious}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              <div className="flex-1" />
              
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={loading || isSendingOTP || !companyEmail.trim()}
                className="flex items-center"
              >
                {loading || isSendingOTP ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isSendingOTP ? 'Sending Code...' : 'Validating...'}
                  </>
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-2">Why do we need both email addresses?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Personal Email:</strong> Used for account notifications and login</li>
          <li>• <strong>Company Email:</strong> Verifies your employment at {companyName}</li>
          <li>• Ensures the authenticity of job postings and referrals</li>
          <li>• Helps maintain the quality and trust of our platform</li>
          <li>• We'll send a verification code to your company email</li>
        </ul>
      </div>
    </div>
  )
}
