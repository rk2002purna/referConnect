import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { X, Mail, Clock, RefreshCw, CheckCircle } from 'lucide-react'
import { verificationAPI } from '../../lib/api'

interface OTPVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  companyEmail: string
  companyId: number
  companyName: string
}

export function OTPVerificationModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  companyEmail, 
  companyId,
  companyName 
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [error, setError] = useState('')
  const [canResend, setCanResend] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (isOpen && !otpSent) {
      // Automatically send OTP when modal opens
      handleSendOTP()
    }
  }, [isOpen])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const handleSendOTP = async () => {
    setResendLoading(true)
    setError('')
    
    try {
      await verificationAPI.sendOTP({
        company_id: companyId,
        company_email: companyEmail
      })
      setOtpSent(true)
      setTimeLeft(600) // Reset timer
      setCanResend(false)
    } catch (err: any) {
      console.error('Send OTP error:', err)
      let errorMessage = 'Failed to send verification code. Please try again.'
      
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
      const response = await verificationAPI.verifyOTP({
        company_id: companyId,
        company_email: companyEmail,
        otp_code: otpString
      })
      
      if (response.data.success) {
        // Show success state
        setVerificationSuccess(true)
        setError('')
        setTimeout(() => {
          onSuccess()
        }, 2000)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Verify Your Email</h3>
                <p className="text-sm text-gray-500">{companyName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Instructions or Success Message */}
          {verificationSuccess ? (
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Email Verified Successfully!</h3>
              <p className="text-sm text-green-600">
                Your company email has been verified. You can now complete your registration.
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                We've sent a 6-digit verification code to:
              </p>
              <p className="font-medium text-gray-900">{companyEmail}</p>
            </div>
          )}

          {/* OTP Input - Only show if not verified */}
          {!verificationSuccess && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter verification code
              </label>
              <div className="flex space-x-2 justify-center">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Timer - Only show if not verified */}
          {!verificationSuccess && timeLeft > 0 && (
            <div className="flex items-center justify-center mb-4 text-sm text-gray-500">
              <Clock className="w-4 h-4 mr-2" />
              Code expires in {formatTime(timeLeft)}
            </div>
          )}

          {/* Resend Button - Only show if not verified */}
          {!verificationSuccess && canResend && (
            <div className="text-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSendOTP}
                disabled={resendLoading}
                className="text-blue-600 hover:text-blue-700"
              >
                {resendLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {verificationSuccess ? (
              <Button
                onClick={onClose}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Continue to Registration
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVerify}
                  disabled={loading || otp.join('').length !== 6}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
