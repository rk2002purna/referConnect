import React from 'react'
import { Textarea } from '../ui/Textarea'
import { OnboardingStepProps } from '../../types/onboarding'
import { Mail, FileText, Hand, Bell, CheckCircle } from 'lucide-react'

export default function ReferralPreferencesStep({ data, updateData }: OnboardingStepProps) {
  const handlePreferenceChange = (field: string, value: any) => {
    updateData({
      employee: {
        ...data.employee,
        [field]: value
      }
    })
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    updateData({
      employee: {
        ...data.employee,
        notification_preferences: {
          email: false,
          in_app: false,
          sms: false,
          referral_updates: false,
          job_updates: false,
          ...data.employee?.notification_preferences,
          [field]: value
        }
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Referral Method */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preferred Referral Method</h3>
        <p className="text-sm text-gray-600 mb-6">
          How would you prefer to handle referral requests?
        </p>

        <div className="space-y-4">
          {[
            {
              id: 'email',
              title: 'Email',
              description: 'Receive referral requests via email and respond directly',
              icon: Mail,
              benefits: ['Direct communication', 'Easy to track', 'Personal touch']
            },
            {
              id: 'ats',
              title: 'Internal ATS',
              description: 'Use your company\'s applicant tracking system',
              icon: FileText,
              benefits: ['Integrated workflow', 'Company process', 'Formal tracking']
            },
            {
              id: 'manual',
              title: 'Manual Process',
              description: 'Handle referrals through our platform manually',
              icon: Hand,
              benefits: ['Full control', 'Custom approach', 'Platform integration']
            }
          ].map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                data.employee?.referral_preferences?.method === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePreferenceChange('referral_preferences', {
                ...data.employee?.referral_preferences,
                method: method.id
              })}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  data.employee?.referral_preferences?.method === method.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <method.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{method.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {method.benefits.map((benefit) => (
                      <span
                        key={benefit}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <input
                    type="radio"
                    name="referral_method"
                    checked={data.employee?.referral_preferences?.method === method.id}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Guidelines */}
      <div>
        <label htmlFor="referral_guidelines" className="block text-sm font-medium text-gray-700 mb-2">
          Referral Guidelines
        </label>
        <Textarea
          id="referral_guidelines"
          value={data.employee?.referral_preferences?.guidelines || ''}
          onChange={(e) => handlePreferenceChange('referral_preferences', {
            ...data.employee?.referral_preferences,
            guidelines: e.target.value
          })}
          placeholder="Share any specific guidelines or preferences for referrals (e.g., 'I prefer candidates with 3+ years experience', 'Please include a brief cover letter', etc.)"
          rows={4}
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional - helps job seekers understand your preferences
        </p>
      </div>

      {/* Notification Preferences */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
        <p className="text-sm text-gray-600 mb-6">
          Choose how you'd like to be notified about referral activities.
        </p>

        <div className="space-y-4">
          {[
            {
              id: 'email',
              title: 'Email Notifications',
              description: 'Receive updates via email',
              icon: Mail
            },
            {
              id: 'in_app',
              title: 'In-App Notifications',
              description: 'See notifications when you log in',
              icon: Bell
            },
            {
              id: 'referral_updates',
              title: 'Referral Updates',
              description: 'Get notified about referral status changes',
              icon: CheckCircle
            },
            {
              id: 'job_updates',
              title: 'Job Updates',
              description: 'Be notified about new relevant job postings',
              icon: FileText
            }
          ].map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                  <notification.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.employee?.notification_preferences?.[notification.id as keyof typeof data.employee.notification_preferences] || false}
                  onChange={(e) => handleNotificationChange(notification.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Success Tips */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-green-900 mb-3">💡 Tips for Successful Referrals</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">
              <strong>Be specific:</strong> Provide detailed feedback about why you're referring someone
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">
              <strong>Know the role:</strong> Only refer candidates for positions you understand well
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">
              <strong>Follow up:</strong> Check in on referred candidates and provide updates
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-sm text-green-800">
              <strong>Be honest:</strong> Only refer candidates you genuinely believe are a good fit
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
