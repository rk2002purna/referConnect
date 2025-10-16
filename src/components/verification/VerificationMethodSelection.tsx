import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Mail, CreditCard, ArrowRight } from 'lucide-react'

interface VerificationMethodSelectionProps {
  onSelectMethod: (method: 'email' | 'id_card') => void
  onPrevious?: () => void
}

export function VerificationMethodSelection({ onSelectMethod, onPrevious }: VerificationMethodSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose Verification Method
        </h3>
        <p className="text-gray-600">
          Select how you'd like to verify your employee status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email Verification Option */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => onSelectMethod('email')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Company Email Verification</CardTitle>
            <CardDescription>
              Verify using your company email address
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                <span>Quick verification (2-3 minutes)</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                <span>No document upload required</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                <span>Instant access to features</span>
              </div>
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={(e) => {
                e.stopPropagation()
                onSelectMethod('email')
              }}
            >
              Choose Email Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* ID Card Upload Option */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
          onClick={() => onSelectMethod('id_card')}
        >
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">ID Card Upload</CardTitle>
            <CardDescription>
              Upload your company ID card for verification
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                <span>Manual review (4-5 business days)</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                <span>Requires company ID card</span>
              </div>
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></div>
                <span>Higher security verification</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              onClick={(e) => {
                e.stopPropagation()
                onSelectMethod('id_card')
              }}
            >
              Choose ID Card Upload
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {onPrevious && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={onPrevious}>
            Back to Registration
          </Button>
        </div>
      )}
    </div>
  )
}


