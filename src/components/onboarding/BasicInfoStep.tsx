import React, { useState, useCallback, useEffect } from 'react'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import PhoneNumberInput from '../ui/PhoneNumberInput'
import { OnboardingStepProps } from '../../types/onboarding'
import { User, Mail, MapPin, FileText } from 'lucide-react'

export default function BasicInfoStep({ data, updateData }: OnboardingStepProps) {
  const [phoneValidation, setPhoneValidation] = useState<{isValid: boolean, error?: string}>({isValid: true})

  // Log data changes for debugging
  useEffect(() => {
    console.log('BasicInfoStep data updated:', data);
    console.log('Phone data:', { phone: data.phone, countryCode: data.phone_country_code });
  }, [data]);
  
  const handleInputChange = (field: string, value: string) => {
    updateData({ [field]: value })
  }

  const handlePhoneChange = (phoneNumber: string, countryCode: string) => {
    console.log('Phone number changed:', { phoneNumber, countryCode });
    // Store both phone number and country code
    updateData({ 
      phone: phoneNumber,
      phone_country_code: countryCode 
    })
  }

  const handlePhoneValidation = useCallback((isValid: boolean, error?: string) => {
    setPhoneValidation({ isValid, error })
  }, [])

  return (
    <div className="space-y-6">
      {/* Pre-populated data notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <User className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Pre-filled from Registration
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>Your name and email have been pre-filled from your registration. You can edit your name if needed, but your email cannot be changed as it's used for login.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="first_name"
              value={data.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Enter your first name"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="last_name"
              value={data.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Enter your last name"
              className="pl-10"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="email"
            type="email"
            value={data.email}
            disabled
            className="pl-10 bg-gray-50 text-gray-600"
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          This is your login email address and cannot be changed
        </p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <PhoneNumberInput
          value={data.phone || ''}
          countryCode={data.phone_country_code || '+91'}
          onChange={handlePhoneChange}
          onValidationChange={handlePhoneValidation}
          placeholder="Enter your phone number"
          className="w-full"
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional - helps with verification and communication
        </p>
        {!phoneValidation.isValid && phoneValidation.error && (
          <p className="mt-1 text-xs text-red-600">
            {phoneValidation.error}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="location"
            value={data.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="City, State/Country"
            className="pl-10"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional - helps us show you relevant opportunities
        </p>
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
          Bio
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <Textarea
            id="bio"
            value={data.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell us a bit about yourself..."
            className="pl-10 min-h-[100px]"
            rows={4}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional - a brief introduction about yourself
        </p>
      </div>
    </div>
  )
}
