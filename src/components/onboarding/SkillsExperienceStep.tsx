import React, { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { OnboardingStepProps } from '../../types/onboarding'
import { Plus, X, Briefcase, GraduationCap, Award } from 'lucide-react'

const SKILL_SUGGESTIONS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'C#',
  'SQL', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git', 'Linux',
  'Machine Learning', 'Data Analysis', 'Project Management', 'Agile', 'Scrum',
  'UI/UX Design', 'Figma', 'Adobe Creative Suite', 'Sales', 'Marketing',
  'Customer Service', 'Leadership', 'Communication', 'Problem Solving'
]

const EDUCATION_LEVELS = [
  'High School',
  'Associate Degree',
  'Bachelor\'s Degree',
  'Master\'s Degree',
  'PhD',
  'Professional Certification',
  'Bootcamp',
  'Self-taught'
]

export default function SkillsExperienceStep({ data, updateData }: OnboardingStepProps) {
  const [skillInput, setSkillInput] = useState('')
  const [certInput, setCertInput] = useState('')

  const handleAddSkill = () => {
    if (skillInput.trim() && !data.jobseeker?.skills?.includes(skillInput.trim())) {
      const newSkills = [...(data.jobseeker?.skills || []), skillInput.trim()]
      updateData({
        jobseeker: {
          ...data.jobseeker,
          skills: newSkills
        }
      })
      setSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    const newSkills = data.jobseeker?.skills?.filter(skill => skill !== skillToRemove) || []
    updateData({
      jobseeker: {
        ...data.jobseeker,
        skills: newSkills
      }
    })
  }

  const handleAddCertification = () => {
    if (certInput.trim() && !data.jobseeker?.certifications?.includes(certInput.trim())) {
      const newCerts = [...(data.jobseeker?.certifications || []), certInput.trim()]
      updateData({
        jobseeker: {
          ...data.jobseeker,
          certifications: newCerts
        }
      })
      setCertInput('')
    }
  }

  const handleRemoveCertification = (certToRemove: string) => {
    const newCerts = data.jobseeker?.certifications?.filter(cert => cert !== certToRemove) || []
    updateData({
      jobseeker: {
        ...data.jobseeker,
        certifications: newCerts
      }
    })
  }

  const handleSkillSuggestionClick = (skill: string) => {
    if (!data.jobseeker?.skills?.includes(skill)) {
      const newSkills = [...(data.jobseeker?.skills || []), skill]
      updateData({
        jobseeker: {
          ...data.jobseeker,
          skills: newSkills
        }
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Skills Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Skills *
        </label>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add a skill (e.g., JavaScript, Python, Project Management)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddSkill}
              disabled={!skillInput.trim()}
              className="px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Skill Suggestions */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Popular skills:</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_SUGGESTIONS.map((skill) => (
                <button
                  key={skill}
                  onClick={() => handleSkillSuggestionClick(skill)}
                  disabled={data.jobseeker?.skills?.includes(skill)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    data.jobseeker?.skills?.includes(skill)
                      ? 'bg-blue-100 text-blue-800 border-blue-200 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Skills */}
          {data.jobseeker?.skills && data.jobseeker.skills.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Your skills:</p>
              <div className="flex flex-wrap gap-2">
                {data.jobseeker.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
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

      {/* Experience Section */}
      <div>
        <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience *
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            id="years_experience"
            type="number"
            min="0"
            max="50"
            value={data.jobseeker?.years_experience || ''}
            onChange={(e) => updateData({
              jobseeker: {
                ...data.jobseeker,
                years_experience: parseInt(e.target.value) || 0
              }
            })}
            placeholder="0"
            className="pl-10"
            required
          />
        </div>
      </div>

      {/* Current Job */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="current_company" className="block text-sm font-medium text-gray-700 mb-2">
            Current Company
          </label>
          <Input
            id="current_company"
            value={data.jobseeker?.current_company || ''}
            onChange={(e) => updateData({
              jobseeker: {
                ...data.jobseeker,
                current_company: e.target.value
              }
            })}
            placeholder="Company name"
          />
        </div>

        <div>
          <label htmlFor="current_job_title" className="block text-sm font-medium text-gray-700 mb-2">
            Current Job Title
          </label>
          <Input
            id="current_job_title"
            value={data.jobseeker?.current_job_title || ''}
            onChange={(e) => updateData({
              jobseeker: {
                ...data.jobseeker,
                current_job_title: e.target.value
              }
            })}
            placeholder="Job title"
          />
        </div>
      </div>

      {/* Education */}
      <div>
        <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">
          Education Level
        </label>
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            id="education"
            value={data.jobseeker?.education || ''}
            onChange={(e) => updateData({
              jobseeker: {
                ...data.jobseeker,
                education: e.target.value
              }
            })}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select education level</option>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Certifications
        </label>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                value={certInput}
                onChange={(e) => setCertInput(e.target.value)}
                placeholder="Add a certification (e.g., AWS Certified, PMP, etc.)"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
              />
            </div>
            <Button
              type="button"
              onClick={handleAddCertification}
              disabled={!certInput.trim()}
              className="px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Selected Certifications */}
          {data.jobseeker?.certifications && data.jobseeker.certifications.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Your certifications:</p>
              <div className="flex flex-wrap gap-2">
                {data.jobseeker.certifications.map((cert) => (
                  <Badge
                    key={cert}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <Award className="w-3 h-3" />
                    {cert}
                    <button
                      onClick={() => handleRemoveCertification(cert)}
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
    </div>
  )
}
