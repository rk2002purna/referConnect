import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { ArrowLeft, ArrowRight, Mail, Clock, RefreshCw } from 'lucide-react'
import { verificationAPI } from '../../lib/api'

interface OTPVerificationStepProps {
  companyEmail: string
  companyId: number
  onVerificationComplete: (success: boolean) => void
  onPrevious?: () => void
  onResendOTP?: () => Promise<void>
}

export function OTPVerificationStep({ 
  companyEmail,
  companyId,
  onVerificationComplete, 
  onPrevious, 
  onResendOTP 
}: OTPVerificationStepProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes
  const [error, setError] = useState('')
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Call the real verification API
      const response = await verificationAPI.verifyOTP({
        company_id: companyId,
        company_email: companyEmail,
        otp_code: otpString
      })
      
      if (response.data.success) {
        onVerificationComplete(true)
      } else {
        setError(response.data.message || 'Invalid verification code. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err: any) {
      console.error('OTP verification error:', err)
      let errorMessage = 'Verification failed. Please try again.'
      
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return

    setResendLoading(true)
    setError('')

    try {
      // Call the real resend OTP API
      await verificationAPI.sendOTP({
        company_id: companyId,
        company_email: companyEmail
      })
      
      setTimeLeft(600) // Reset timer to 10 minutes
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      console.error('Resend OTP error:', err)
      let errorMessage = 'Failed to resend code. Please try again.'
      
      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      setError(errorMessage)
    } finally {
      setResendLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Check Your Email
        </h3>
        <p className="text-gray-600">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-medium text-gray-900">{companyEmail}</p>
      </div>

      {/* OTP Input */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter verification code
              </label>
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-blue-500"
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
                {error}
              </div>
            )}

            {/* Timer */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Code expires in {formatTime(timeLeft)}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Code has expired
                </div>
              )}
            </div>

            {/* Resend Button */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleResend}
                disabled={!canResend || resendLoading}
                className="text-sm"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend code
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="flex items-center"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify Code
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
