import React from 'react'
import { CheckCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface VerificationSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  companyName?: string
}

export function VerificationSuccessModal({ 
  isOpen, 
  onClose, 
  onContinue,
  companyName 
}: VerificationSuccessModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            🎉 Congratulations!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-800">
              You're now a verified employee referral!
            </p>
            {companyName && (
              <p className="text-gray-600">
                Your company email at <span className="font-semibold">{companyName}</span> has been successfully verified.
              </p>
            )}
            <p className="text-sm text-gray-500">
              You can now post job openings and help connect talented candidates with opportunities.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={onContinue}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Start Posting Jobs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

