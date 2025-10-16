import React from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { OnboardingStepProps } from '../../types/onboarding'
import { MapPin, Briefcase, DollarSign, Clock, Globe } from 'lucide-react'

const JOB_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
  'Remote',
  'Hybrid'
]

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media & Entertainment',
  'Real Estate',
  'Government',
  'Non-profit',
  'Other'
]

const SALARY_RANGES = [
  { label: 'Under $30k', min: 0, max: 30000 },
  { label: '$30k - $50k', min: 30000, max: 50000 },
  { label: '$50k - $75k', min: 50000, max: 75000 },
  { label: '$75k - $100k', min: 75000, max: 100000 },
  { label: '$100k - $150k', min: 100000, max: 150000 },
  { label: '$150k+', min: 150000, max: 1000000 }
]

const NOTICE_PERIODS = [
  { label: 'Immediately available', value: 0 },
  { label: '1 week', value: 1 },
  { label: '2 weeks', value: 2 },
  { label: '1 month', value: 4 },
  { label: '2 months', value: 8 },
  { label: '3+ months', value: 12 }
]

export default function LocationPreferencesStep({ data, updateData }: OnboardingStepProps) {
  const handleJobTypeToggle = (jobType: string) => {
    const currentTypes = data.jobseeker?.preferred_job_types || []
    const newTypes = currentTypes.includes(jobType)
      ? currentTypes.filter(type => type !== jobType)
      : [...currentTypes, jobType]
    
    updateData({
      jobseeker: {
        ...data.jobseeker,
        preferred_job_types: newTypes
      }
    })
  }

  const handleIndustryToggle = (industry: string) => {
    const currentIndustries = data.jobseeker?.industries || []
    const newIndustries = currentIndustries.includes(industry)
      ? currentIndustries.filter(ind => ind !== industry)
      : [...currentIndustries, industry]
    
    updateData({
      jobseeker: {
        ...data.jobseeker,
        industries: newIndustries
      }
    })
  }

  const handleSalaryRangeSelect = (range: { min: number; max: number }) => {
    updateData({
      jobseeker: {
        ...data.jobseeker,
        salary_expectation: {
          min: range.min,
          max: range.max,
          currency: 'USD'
        }
      }
    })
  }

  const handleNoticePeriodSelect = (weeks: number) => {
    updateData({
      jobseeker: {
        ...data.jobseeker,
        notice_period: weeks
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Work Location *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="location"
            value={data.location || ''}
            onChange={(e) => updateData({ location: e.target.value })}
            placeholder="City, State/Country or 'Remote'"
            className="pl-10"
            required
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Where would you like to work? You can specify multiple locations or 'Remote'
        </p>
      </div>

      {/* Job Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Job Types *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {JOB_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              variant={data.jobseeker?.preferred_job_types?.includes(type) ? "default" : "outline"}
              onClick={() => handleJobTypeToggle(type)}
              className="justify-start"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Industries of Interest
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INDUSTRIES.map((industry) => (
            <Button
              key={industry}
              type="button"
              variant={data.jobseeker?.industries?.includes(industry) ? "default" : "outline"}
              onClick={() => handleIndustryToggle(industry)}
              className="justify-start"
            >
              <Globe className="w-4 h-4 mr-2" />
              {industry}
            </Button>
          ))}
        </div>
      </div>

      {/* Salary Expectation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Salary Expectation
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SALARY_RANGES.map((range) => (
            <Button
              key={range.label}
              type="button"
              variant={
                data.jobseeker?.salary_expectation?.min === range.min ? "default" : "outline"
              }
              onClick={() => handleSalaryRangeSelect(range)}
              className="justify-start"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Notice Period */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Notice Period
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {NOTICE_PERIODS.map((period) => (
            <Button
              key={period.label}
              type="button"
              variant={
                data.jobseeker?.notice_period === period.value ? "default" : "outline"
              }
              onClick={() => handleNoticePeriodSelect(period.value)}
              className="justify-start"
            >
              <Clock className="w-4 h-4 mr-2" />
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Willing to Relocate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Willing to Relocate?
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="relocate"
              checked={data.jobseeker?.willing_to_relocate === true}
              onChange={() => updateData({
                jobseeker: {
                  ...data.jobseeker,
                  willing_to_relocate: true
                }
              })}
              className="mr-2"
            />
            Yes, I'm open to relocating
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="relocate"
              checked={data.jobseeker?.willing_to_relocate === false}
              onChange={() => updateData({
                jobseeker: {
                  ...data.jobseeker,
                  willing_to_relocate: false
                }
              })}
              className="mr-2"
            />
            No, I prefer to stay local
          </label>
        </div>
      </div>

      {/* Work Authorization */}
      <div>
        <label htmlFor="work_authorization" className="block text-sm font-medium text-gray-700 mb-2">
          Work Authorization
        </label>
        <select
          id="work_authorization"
          value={data.jobseeker?.work_authorization || ''}
          onChange={(e) => updateData({
            jobseeker: {
              ...data.jobseeker,
              work_authorization: e.target.value
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select work authorization status</option>
          <option value="citizen">US Citizen</option>
          <option value="permanent_resident">Permanent Resident</option>
          <option value="h1b">H1B Visa</option>
          <option value="f1_opt">F1 OPT</option>
          <option value="other_visa">Other Visa</option>
          <option value="requires_sponsorship">Requires Sponsorship</option>
        </select>
      </div>

      {/* Selected Preferences Summary */}
      {(data.jobseeker?.preferred_job_types?.length || 0) > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Your Preferences:</h4>
          <div className="space-y-2">
            {data.jobseeker?.preferred_job_types && (
              <div>
                <span className="text-sm text-blue-700 font-medium">Job Types: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.jobseeker.preferred_job_types.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {data.jobseeker?.industries && data.jobseeker.industries.length > 0 && (
              <div>
                <span className="text-sm text-blue-700 font-medium">Industries: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.jobseeker.industries.map((industry) => (
                    <Badge key={industry} variant="secondary" className="text-xs">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
