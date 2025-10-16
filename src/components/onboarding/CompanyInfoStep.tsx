import React from 'react'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { OnboardingStepProps } from '../../types/onboarding'
import { Briefcase, Building, MapPin, Calendar } from 'lucide-react'

export default function CompanyInfoStep({ data, updateData }: OnboardingStepProps) {
  const handleInputChange = (field: string, value: string | number | string[]) => {
    updateData({
      employee: {
        ...data.employee,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Job Title */}
      <div>
        <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
          Job Title *
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="job_title"
            value={data.employee?.job_title || ''}
            onChange={(e) => handleInputChange('job_title', e.target.value)}
            placeholder="e.g., Software Engineer, Product Manager, Marketing Director"
            className="pl-10"
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Your current job title at your company
        </p>
      </div>

      {/* Department */}
      <div>
        <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
          Department
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="department"
            value={data.employee?.department || ''}
            onChange={(e) => handleInputChange('department', e.target.value)}
            placeholder="e.g., Engineering, Marketing, Sales, HR"
            className="pl-10"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional - helps categorize your referrals
        </p>
      </div>

      {/* Years at Company */}
      <div>
        <label htmlFor="years_at_company" className="block text-sm font-medium text-gray-700 mb-2">
          Years at Company *
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="years_at_company"
            type="number"
            min="0"
            max="50"
            value={data.employee?.years_at_company || ''}
            onChange={(e) => handleInputChange('years_at_company', parseInt(e.target.value) || 0)}
            placeholder="0"
            className="pl-10"
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          How long have you been with your current company?
        </p>
      </div>

      {/* Office Location */}
      <div>
        <label htmlFor="office_location" className="block text-sm font-medium text-gray-700 mb-2">
          Office Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="office_location"
            value={data.employee?.office_location || ''}
            onChange={(e) => handleInputChange('office_location', e.target.value)}
            placeholder="e.g., San Francisco, CA or Remote"
            className="pl-10"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Optional - helps with location-based referrals
        </p>
      </div>

      {/* Skills Areas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Areas You Can Help With
        </label>
        <p className="text-sm text-gray-600 mb-4">
          Select the areas where you feel comfortable providing referrals and guidance.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Software Engineering',
            'Product Management',
            'Data Science',
            'Design',
            'Marketing',
            'Sales',
            'Operations',
            'Finance',
            'HR',
            'Customer Success',
            'DevOps',
            'QA/Testing',
            'Business Development',
            'Content',
            'Analytics',
            'Other'
          ].map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => {
                const currentAreas = data.employee?.skills_areas || []
                const newAreas = currentAreas.includes(area)
                  ? currentAreas.filter(a => a !== area)
                  : [...currentAreas, area]
                handleInputChange('skills_areas', newAreas)
              }}
              className={`p-3 text-sm rounded-lg border transition-colors ${
                data.employee?.skills_areas?.includes(area)
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
        
        {data.employee?.skills_areas && data.employee.skills_areas.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Selected areas:</p>
            <div className="flex flex-wrap gap-2">
              {data.employee.skills_areas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
          Professional Bio
        </label>
        <Textarea
          id="bio"
          value={data.employee?.bio || ''}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell us about your professional background, what you do, and how you can help job seekers..."
          rows={4}
        />
        <p className="mt-1 text-xs text-gray-500">
          Optional - helps job seekers understand your background and expertise
        </p>
      </div>

      {/* Company Verification Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">Company Verification</h4>
        <p className="text-sm text-yellow-700">
          Your company email domain will be used to verify your employment. 
          This helps maintain the integrity of our referral system and ensures 
          that referrals come from legitimate employees.
        </p>
      </div>
    </div>
  )
}
