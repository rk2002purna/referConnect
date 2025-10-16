import React, { useState } from 'react'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { OnboardingStepProps } from '../../types/onboarding'
import { Plus, X, Linkedin, Github, Globe, Shield, Languages } from 'lucide-react'


const COMMON_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Mandarin',
  'Japanese',
  'Korean',
  'Portuguese',
  'Italian',
  'Russian',
  'Arabic',
  'Hindi'
]

export default function AdditionalInfoStep({ data, updateData }: OnboardingStepProps) {
  const [languageInput, setLanguageInput] = useState('')
  const [excludedCompanyInput, setExcludedCompanyInput] = useState('')

  const handleAddLanguage = () => {
    if (languageInput.trim()) {
      const [language, level] = languageInput.trim().split(' - ')
      if (language && level) {
        const newLanguages = [...(data.jobseeker?.languages || []), { language, level }]
        updateData({
          jobseeker: {
            ...data.jobseeker,
            languages: newLanguages
          }
        })
        setLanguageInput('')
      }
    }
  }

  const handleRemoveLanguage = (indexToRemove: number) => {
    const newLanguages = data.jobseeker?.languages?.filter((_, index) => index !== indexToRemove) || []
    updateData({
      jobseeker: {
        ...data.jobseeker,
        languages: newLanguages
      }
    })
  }

  const handleAddExcludedCompany = () => {
    if (excludedCompanyInput.trim() && !data.jobseeker?.privacy_excluded_companies?.includes(excludedCompanyInput.trim())) {
      const newExcluded = [...(data.jobseeker?.privacy_excluded_companies || []), excludedCompanyInput.trim()]
      updateData({
        jobseeker: {
          ...data.jobseeker,
          privacy_excluded_companies: newExcluded
        }
      })
      setExcludedCompanyInput('')
    }
  }

  const handleRemoveExcludedCompany = (companyToRemove: string) => {
    const newExcluded = data.jobseeker?.privacy_excluded_companies?.filter(company => company !== companyToRemove) || []
    updateData({
      jobseeker: {
        ...data.jobseeker,
        privacy_excluded_companies: newExcluded
      }
    })
  }

  const handleLanguageSuggestionClick = (language: string) => {
    const languageWithLevel = `${language} - Fluent`
    setLanguageInput(languageWithLevel)
  }

  return (
    <div className="space-y-8">
      {/* Portfolio Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Portfolio & Links</h3>
        
        <div>
          <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile
          </label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="linkedin_url"
              type="url"
              value={data.jobseeker?.linkedin_url || ''}
              onChange={(e) => updateData({
                jobseeker: {
                  ...data.jobseeker,
                  linkedin_url: e.target.value
                }
              })}
              placeholder="https://linkedin.com/in/yourprofile"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="github_url" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Profile
          </label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="github_url"
              type="url"
              value={data.jobseeker?.github_url || ''}
              onChange={(e) => updateData({
                jobseeker: {
                  ...data.jobseeker,
                  github_url: e.target.value
                }
              })}
              placeholder="https://github.com/yourusername"
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="portfolio_url" className="block text-sm font-medium text-gray-700 mb-2">
            Portfolio Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="portfolio_url"
              type="url"
              value={data.jobseeker?.portfolio_url || ''}
              onChange={(e) => updateData({
                jobseeker: {
                  ...data.jobseeker,
                  portfolio_url: e.target.value
                }
              })}
              placeholder="https://yourportfolio.com"
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Languages</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={languageInput}
                onChange={(e) => setLanguageInput(e.target.value)}
                placeholder="Language - Level (e.g., Spanish - Fluent)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddLanguage}
              disabled={!languageInput.trim()}
              className="px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Language Suggestions */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Common languages:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_LANGUAGES.map((language) => (
                <button
                  key={language}
                  onClick={() => handleLanguageSuggestionClick(language)}
                  className="px-3 py-1 text-xs rounded-full border border-gray-200 bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Languages */}
          {data.jobseeker?.languages && data.jobseeker.languages.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Your languages:</p>
              <div className="flex flex-wrap gap-2">
                {data.jobseeker.languages.map((lang, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <Languages className="w-3 h-3" />
                    {lang.language} ({lang.level})
                    <button
                      onClick={() => handleRemoveLanguage(index)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Companies to Exclude
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Add companies you don't want to see your profile or receive job recommendations from.
          </p>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={excludedCompanyInput}
                onChange={(e) => setExcludedCompanyInput(e.target.value)}
                placeholder="Company name"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExcludedCompany())}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddExcludedCompany}
              disabled={!excludedCompanyInput.trim()}
              className="px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Excluded Companies */}
          {data.jobseeker?.privacy_excluded_companies && data.jobseeker.privacy_excluded_companies.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Excluded companies:</p>
              <div className="flex flex-wrap gap-2">
                {data.jobseeker.privacy_excluded_companies.map((company) => (
                  <Badge
                    key={company}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <Shield className="w-3 h-3" />
                    {company}
                    <button
                      onClick={() => handleRemoveExcludedCompany(company)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Availability */}
      <div>
        <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
          Availability
        </label>
        <Textarea
          id="availability"
          value={data.jobseeker?.availability || ''}
          onChange={(e) => updateData({
            jobseeker: {
              ...data.jobseeker,
              availability: e.target.value
            }
          })}
          placeholder="Tell us about your availability, preferred start date, or any scheduling constraints..."
          rows={3}
        />
      </div>
    </div>
  )
}
