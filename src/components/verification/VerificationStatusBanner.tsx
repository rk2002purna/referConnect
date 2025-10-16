import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight,
  Shield,
  Mail,
  CreditCard
} from 'lucide-react'

export type VerificationStatus = 
  | 'pending_email' 
  | 'pending_id_card' 
  | 'verified' 
  | 'rejected' 
  | 'expired'

interface VerificationStatusBannerProps {
  status: VerificationStatus
  verificationMethod?: 'email' | 'id_card'
  onRetry?: () => void
  onResendOTP?: () => void
  className?: string
}

export function VerificationStatusBanner({ 
  status, 
  verificationMethod,
  onRetry, 
  onResendOTP,
  className = '' 
}: VerificationStatusBannerProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          title: 'Verification Complete',
          description: 'Your employee status has been verified. You can now post jobs and make referrals.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          badge: { text: 'Verified', variant: 'default' as const, className: 'bg-green-100 text-green-800' }
        }
      
      case 'pending_email':
        return {
          icon: Mail,
          title: 'Email Verification Pending',
          description: 'Please check your company email and enter the verification code to complete verification.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          badge: { text: 'Pending', variant: 'secondary' as const, className: 'bg-blue-100 text-blue-800' }
        }
      
      case 'pending_id_card':
        return {
          icon: CreditCard,
          title: 'ID Card Review Pending',
          description: 'Your ID card is under review. This typically takes 4-5 business days. You\'ll receive an email notification once approved.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          badge: { text: 'Under Review', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' }
        }
      
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Verification Rejected',
          description: 'Your verification was rejected. Please review the requirements and try again with valid documents.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          badge: { text: 'Rejected', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' }
        }
      
      case 'expired':
        return {
          icon: AlertTriangle,
          title: 'Verification Expired',
          description: 'Your verification code has expired. Please request a new verification code to continue.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          badge: { text: 'Expired', variant: 'secondary' as const, className: 'bg-orange-100 text-orange-800' }
        }
      
      default:
        return {
          icon: Shield,
          title: 'Verification Required',
          description: 'Please complete employee verification to access all features.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-600',
          badge: { text: 'Required', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' }
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const getActionButton = () => {
    switch (status) {
      case 'pending_email':
        return onResendOTP ? (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onResendOTP}
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Resend Code
          </Button>
        ) : null
      
      case 'rejected':
      case 'expired':
        return onRetry ? (
          <Button 
            size="sm" 
            onClick={onRetry}
            className="flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        ) : null
      
      case 'pending_id_card':
        return (
          <div className="text-sm text-gray-600">
            <Clock className="w-4 h-4 inline mr-1" />
            Review in progress
          </div>
        )
      
      case 'verified':
        return (
          <div className="text-sm text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            All features unlocked
          </div>
        )
      
      default:
        return (
          <Button 
            size="sm" 
            onClick={onRetry}
            className="flex items-center"
          >
            Start Verification
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )
    }
  }

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border-2 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${config.bgColor}`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-semibold ${config.textColor}`}>
                  {config.title}
                </h3>
                <Badge 
                  variant={config.badge.variant}
                  className={config.badge.className}
                >
                  {config.badge.text}
                </Badge>
              </div>
              <p className={`text-sm ${config.textColor} opacity-90`}>
                {config.description}
              </p>
            </div>
          </div>
          
          <div className="flex-shrink-0 ml-4">
            {getActionButton()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


