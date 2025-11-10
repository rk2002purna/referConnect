import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { VerificationStatusBanner } from '../components/verification'
import { jobPostAPI, profileAPI, ProfileResponse } from '../lib/api'
import { MapPin, Building2, DollarSign, Clock, Briefcase, Plus, X, Save, Eye, Shield, Loader2 } from 'lucide-react'

interface JobFormData {
  title: string
  company: string
  location: string
  job_type: 'full-time' | 'part-time' | 'contract' | 'internship'
  salary_min: string
  salary_max: string
  currency: string
  description: string
  requirements: string
  benefits: string
  skills_required: string[]
  experience_level: 'entry' | 'mid' | 'senior' | 'executive'
  remote_work: boolean
  application_deadline: string
  contact_email: string
  department: string
  job_link: string
  max_applicants: string
}

const PostJob: React.FC = () => {
  const { user, verificationStatus, refreshVerificationStatus } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const verificationStatusRef = useRef(verificationStatus)
  const justVerified = (location.state as any)?.justVerified || false
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [hasCheckedVerification, setHasCheckedVerification] = useState(false)
  const [isCheckingVerification, setIsCheckingVerification] = useState(true)
  
  // Keep ref in sync with verificationStatus
  useEffect(() => {
    verificationStatusRef.current = verificationStatus
  }, [verificationStatus])

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    location: '',
    job_type: 'full-time',
    salary_min: '',
    salary_max: '',
    currency: 'USD',
    description: '',
    requirements: '',
    benefits: '',
    skills_required: [],
    experience_level: 'mid',
    remote_work: false,
    application_deadline: '',
    contact_email: user?.email || '',
    department: '',
    job_link: '',
    max_applicants: ''
  })

  // Function to load company data
  const loadCompanyData = async () => {
    try {
      // First try to get company name from profile API
      const profileResponse = await profileAPI.getProfile()
      const profile = profileResponse.data as ProfileResponse
      
      if (profile.company_name) {
        setFormData(prev => ({ ...prev, company: profile.company_name || '' }))
        return
      }
      
      // Fallback to localStorage data (from onboarding)
      const savedCompanyData = localStorage.getItem('employee_company_data')
      if (savedCompanyData) {
        const companyData = JSON.parse(savedCompanyData)
        if (companyData.company_name) {
          setFormData(prev => ({ ...prev, company: companyData.company_name }))
          return
        }
      }
      
      // If no company data found, show error
      setError('Company information not found. Please complete your profile first.')
    } catch (error) {
      console.error('Failed to load company data:', error)
      setError('Failed to load company information. Please try again.')
    }
  }

  useEffect(() => {
    // Prevent multiple checks and redirects
    if (hasCheckedVerification) return
    
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role !== 'employee') {
      navigate('/search')
      return
    }
    
    // If we just verified, wait a bit longer for verification status to be available
    const checkTimeout = justVerified ? 2000 : 1000
    
    // Check if user is verified - if not, redirect to onboarding
    if (verificationStatus !== null) {
      // Verification status has been loaded
      setIsCheckingVerification(false)
      setHasCheckedVerification(true)
      
      if (verificationStatus.status !== 'verified') {
        // If we just verified but status is not verified yet, wait a bit more and refresh
        if (justVerified) {
          // Refresh verification status in case it wasn't loaded yet
          refreshVerificationStatus()
          
          const timer = setTimeout(() => {
            const currentStatus = verificationStatusRef.current
            if (!currentStatus || currentStatus.status !== 'verified') {
              console.log('User not verified after verification, but we just verified - allowing access')
              // Since we just verified, allow access anyway - verification status will update soon
              loadCompanyData()
            } else {
              loadCompanyData()
            }
          }, 2000)
          return () => clearTimeout(timer)
        }
        
        console.log('User not verified, redirecting to onboarding...')
        navigate('/onboarding', { replace: true })
        return
      }
      
      // User is verified, load company data
      loadCompanyData()
    } else {
      // If verification status is not loaded yet, wait a bit and check again
      // This handles the case where verification status is still loading
      const timer = setTimeout(() => {
        setIsCheckingVerification(false)
        setHasCheckedVerification(true)
        
        // Re-check verification status after timeout using ref
        const currentStatus = verificationStatusRef.current
        
        // If we just verified, give it more time before redirecting
        if (justVerified && (!currentStatus || currentStatus.status !== 'verified')) {
          console.log('Just verified but status not loaded yet, waiting a bit more...')
          // Wait another second and check again
          setTimeout(() => {
            const finalStatus = verificationStatusRef.current
            if (!finalStatus || finalStatus.status !== 'verified') {
              console.log('Still not verified after extended wait, but we just verified - allowing access')
              // Since we just verified, allow access anyway
              loadCompanyData()
            } else {
              loadCompanyData()
            }
          }, 1500)
          return
        }
        
        if (!currentStatus || currentStatus.status !== 'verified') {
          console.log('User not verified (after timeout), redirecting to onboarding...')
          navigate('/onboarding', { replace: true })
        } else {
          // User is verified, load company data
          loadCompanyData()
        }
      }, checkTimeout)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate, verificationStatus, hasCheckedVerification, justVerified])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    // Prevent changes to company field
    if (name === 'company') {
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills_required.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter(s => s !== skill)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if user is verified before allowing job posting
      if (!verificationStatus || verificationStatus.status !== 'verified') {
        throw new Error('You must verify your company email before posting jobs. Please complete the verification process.')
      }
      
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Job title is required')
      }
      if (!formData.company.trim()) {
        throw new Error('Company name is required')
      }
      if (!formData.location.trim()) {
        throw new Error('Location is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Job description is required')
      }
      if (!formData.contact_email.trim()) {
        throw new Error('Contact email is required')
      }

      // Validate application deadline if provided
      if (formData.application_deadline) {
        const deadlineDate = new Date(formData.application_deadline)
        const now = new Date()
        if (deadlineDate <= now) {
          throw new Error('Application deadline must be in the future')
        }
      }

      // Convert form data to API format
      const jobData = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        job_type: formData.job_type,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : undefined,
        currency: formData.currency,
        description: formData.description.trim(),
        requirements: formData.requirements?.trim() || undefined,
        benefits: formData.benefits?.trim() || undefined,
        skills_required: formData.skills_required,
        experience_level: formData.experience_level,
        remote_work: formData.remote_work,
        application_deadline: formData.application_deadline ? new Date(formData.application_deadline).toISOString() : undefined,
        contact_email: formData.contact_email.trim(),
        department: formData.department?.trim() || undefined,
        job_link: formData.job_link?.trim() || undefined,
        max_applicants: formData.max_applicants ? parseInt(formData.max_applicants) : undefined
      }

      const response = await jobPostAPI.createJobPost(jobData)
      console.log('Job posted successfully:', response.data)
      
      setSuccess('Job posted successfully! Job seekers will be notified about this opportunity.')
      
      // Reset form
      setFormData({
        title: '',
        company: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}'s Company` : '',
        location: '',
        job_type: 'full-time',
        salary_min: '',
        salary_max: '',
        currency: 'USD',
        description: '',
        requirements: '',
        benefits: '',
        skills_required: [],
        experience_level: 'mid',
        remote_work: false,
        application_deadline: '',
        contact_email: user?.email || '',
        department: '',
        job_link: '',
        max_applicants: ''
      })
    } catch (err: any) {
      console.error('Job posting error:', err)
      
      // Handle different types of errors
      if (err.response?.status === 422) {
        // Validation error
        const errorData = err.response.data
        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((e: any) => e.msg || e.message || e).join(', ')
            setError(`Validation error: ${errorMessages}`)
          } else {
            setError(`Validation error: ${errorData.detail}`)
          }
        } else {
          setError('Please check your input and try again.')
        }
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.')
      } else {
        setError(err.message || 'Failed to post job. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'full-time': return 'bg-green-100 text-green-800'
      case 'part-time': return 'bg-blue-100 text-blue-800'
      case 'contract': return 'bg-purple-100 text-purple-800'
      case 'internship': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-green-100 text-green-800'
      case 'mid': return 'bg-blue-100 text-blue-800'
      case 'senior': return 'bg-purple-100 text-purple-800'
      case 'executive': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user || user.role !== 'employee') {
    return null
  }

  // Check if employee is verified
  const isVerified = verificationStatus?.status === 'verified'
  const isVerificationPending = verificationStatus && verificationStatus.status !== 'verified'

  // Show loading state while checking verification
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Checking verification status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
          <p className="mt-2 text-gray-600">
            Create a job posting to attract top talent for your company
          </p>
        </div>

        {/* Verification Status Banner */}
        {isVerificationPending && (
          <div className="mb-6">
            <VerificationStatusBanner
              status={verificationStatus.status}
              verificationMethod={verificationStatus.method}
              onRetry={() => {
                navigate('/onboarding')
              }}
              onResendOTP={async () => {
                // Handle OTP resend
                console.log('Resending OTP...')
              }}
            />
          </div>
        )}

        {/* Verification Required Block */}
        {!isVerified && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">
                    Verification Required
                  </h3>
                  <p className="text-orange-800 mb-4">
                    You need to complete employee verification before you can post jobs. 
                    This helps us ensure the quality and authenticity of job postings on our platform.
                  </p>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => navigate('/onboarding')}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Complete Verification
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/dashboard')}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Only show form content if verified */}
        {isVerified && (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            <div className="flex gap-4 mb-6">
          <Button
            type="button"
            variant={!previewMode ? "default" : "outline"}
            onClick={() => setPreviewMode(false)}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Edit Job
          </Button>
          <Button
            type="button"
            variant={previewMode ? "default" : "outline"}
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {previewMode ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl">{formData.title || 'Job Title'}</CardTitle>
                      <CardDescription className="text-lg mt-1">{formData.company}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getJobTypeColor(formData.job_type)}>
                        {formData.job_type.replace('-', ' ').toUpperCase()}
                      </Badge>
                      <Badge className={getExperienceColor(formData.experience_level)}>
                        {formData.experience_level.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 mt-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{formData.location || 'Location'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      <span>{formData.department || 'Department'}</span>
                    </div>
                    {formData.remote_work && (
                      <Badge variant="outline">Remote</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {formData.salary_min && formData.salary_max && (
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-4 h-4" />
                        <span>
                          {formData.currency} {formData.salary_min} - {formData.salary_max}
                        </span>
                      </div>
                    )}

                    {formData.description && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{formData.description}</p>
                      </div>
                    )}

                    {formData.requirements && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{formData.requirements}</p>
                      </div>
                    )}

                    {formData.skills_required.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills_required.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.benefits && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Benefits</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{formData.benefits}</p>
                      </div>
                    )}

                    {formData.application_deadline && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Application Deadline: {new Date(formData.application_deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about the job position</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title *
                    </label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g., Senior Software Engineer"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <Input
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                      placeholder="Loading company name..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Company name is automatically set from your profile
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location *
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., San Francisco, CA"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g., Engineering"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="job_type" className="block text-sm font-medium text-gray-700 mb-1">
                      Job Type *
                    </label>
                    <Select name="job_type" value={formData.job_type} onValueChange={(value: string) => setFormData(prev => ({ ...prev, job_type: value as 'full-time' | 'part-time' | 'contract' | 'internship' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="internship">Internship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level *
                    </label>
                    <Select name="experience_level" value={formData.experience_level} onValueChange={(value: string) => setFormData(prev => ({ ...prev, experience_level: value as 'entry' | 'mid' | 'senior' | 'executive' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entry">Entry Level</SelectItem>
                        <SelectItem value="mid">Mid Level</SelectItem>
                        <SelectItem value="senior">Senior Level</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remote_work"
                    name="remote_work"
                    checked={formData.remote_work}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="remote_work" className="text-sm font-medium text-gray-700">
                    Remote work available
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compensation</CardTitle>
                <CardDescription>Salary and benefits information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="salary_min" className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Salary
                    </label>
                    <Input
                      id="salary_min"
                      name="salary_min"
                      type="number"
                      value={formData.salary_min}
                      onChange={handleInputChange}
                      placeholder="e.g., 80000"
                    />
                  </div>
                  <div>
                    <label htmlFor="salary_max" className="block text-sm font-medium text-gray-700 mb-1">
                      Maximum Salary
                    </label>
                    <Input
                      id="salary_max"
                      name="salary_max"
                      type="number"
                      value={formData.salary_max}
                      onChange={handleInputChange}
                      placeholder="e.g., 120000"
                    />
                  </div>
                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <Select name="currency" value={formData.currency} onValueChange={(value: string) => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
                <CardDescription>Detailed description and requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description *
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the role, responsibilities, and what the candidate will be working on..."
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
                    Requirements
                  </label>
                  <Textarea
                    id="requirements"
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    placeholder="List the required qualifications, experience, and skills..."
                    rows={4}
                  />
                </div>

                <div>
                  <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-1">
                    Benefits & Perks
                  </label>
                  <Textarea
                    id="benefits"
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleInputChange}
                    placeholder="List the benefits, perks, and what makes this opportunity attractive..."
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Skills
                  </label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button type="button" onClick={addSkill} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills_required.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>How candidates can apply and important dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email *
                    </label>
                    <Input
                      id="contact_email"
                      name="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="application_deadline" className="block text-sm font-medium text-gray-700 mb-1">
                      Application Deadline
                    </label>
                    <Input
                      id="application_deadline"
                      name="application_deadline"
                      type="date"
                      value={formData.application_deadline}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if there's no deadline
                    </p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="job_link" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Application Link
                  </label>
                  <Input
                    id="job_link"
                    name="job_link"
                    type="url"
                    value={formData.job_link}
                    onChange={handleInputChange}
                    placeholder="https://company.com/careers/job-123"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Direct link to the job posting on your company's career page or job board
                  </p>
                </div>

                <div>
                  <label htmlFor="max_applicants" className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Applicants
                  </label>
                  <Input
                    id="max_applicants"
                    name="max_applicants"
                    type="number"
                    min="1"
                    value={formData.max_applicants}
                    onChange={handleInputChange}
                    placeholder="e.g., 50"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Set a limit on how many people can apply for this position (leave empty for unlimited)
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting Job...
                  </>
                ) : (
                  <>
                    Post Job
                    <Briefcase className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tips for Better Job Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600">
                    <h4 className="font-semibold text-gray-900 mb-2">Job Title</h4>
                    <p>Use clear, specific titles that job seekers would search for. Avoid internal jargon.</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p>Include key responsibilities, what makes this role exciting, and growth opportunities.</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
                    <p>List must-have skills vs. nice-to-have. Be realistic about experience levels.</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                    <p>Highlight unique perks, company culture, and what makes you stand out.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Form Completion</span>
                      <span className="font-semibold">
                        {Math.round(
                          (Object.values(formData).filter(value => 
                            value !== '' && 
                            value !== null && 
                            value !== undefined &&
                            (Array.isArray(value) ? value.length > 0 : true)
                          ).length / Object.keys(formData).length) * 100
                        )}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(
                            (Object.values(formData).filter(value => 
                              value !== '' && 
                              value !== null && 
                              value !== undefined &&
                              (Array.isArray(value) ? value.length > 0 : true)
                            ).length / Object.keys(formData).length) * 100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PostJob
