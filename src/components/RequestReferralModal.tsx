import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { 
  X, 
  Upload, 
  File, 
  User, 
  Mail, 
  Phone, 
  Linkedin, 
  MessageSquare, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { profileAPI } from '../lib/api'

interface Job {
  id: number
  title: string
  company: string
  location: string
}

interface RequestReferralModalProps {
  isOpen: boolean
  onClose: () => void
  job: Job
  onSuccess?: () => void
}

interface FormData {
  jobseeker_name: string
  jobseeker_email: string
  jobseeker_phone: string
  linkedin_url: string
  personal_note: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export function RequestReferralModal({ isOpen, onClose, job, onSuccess }: RequestReferralModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    jobseeker_name: '',
    jobseeker_email: '',
    jobseeker_phone: '',
    linkedin_url: '',
    personal_note: '',
    priority: 'normal'
  })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [savedResumeFilename, setSavedResumeFilename] = useState<string>('')
  const [showSavedResume, setShowSavedResume] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [jobseekerProfile, setJobseekerProfile] = useState<any>(null)

  // Pre-populate form with user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user && isOpen) {
        try {
          // Fetch basic profile
          const profileResponse = await profileAPI.getProfile();
          const profileData: any = profileResponse.data;

          // Fetch jobseeker profile if available
          try {
            const jobseekerResponse = await profileAPI.getJobSeekerProfile();
            const jobseekerData: any = jobseekerResponse.data;
            setJobseekerProfile(jobseekerData);
          } catch (error) {
            console.log('No jobseeker profile found');
          }

          // Set form data with user information
          setFormData(prev => ({
            ...prev,
            jobseeker_name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
            jobseeker_email: user.email || '',
            jobseeker_phone: profileData.phone || '',
            linkedin_url: profileData.linkedin_url || jobseekerProfile?.linkedin_url || ''
          }));
          
          // Set saved resume filename if available
          if (profileData.resume_filename) {
            setSavedResumeFilename(profileData.resume_filename);
            setShowSavedResume(true);
          } else if (jobseekerProfile?.resume_filename) {
            setSavedResumeFilename(jobseekerProfile.resume_filename);
            setShowSavedResume(true);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user data
          setFormData(prev => ({
            ...prev,
            jobseeker_name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
            jobseeker_email: user.email || '',
          }));
        }
      }
    };

    fetchUserData();
  }, [user, isOpen, jobseekerProfile?.linkedin_url, jobseekerProfile?.resume_filename])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF, DOC, DOCX, or TXT file')
        return
      }
      
      setResumeFile(file)
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.jobseeker_name || !formData.jobseeker_email) {
        throw new Error('Name and email are required')
      }
      
      // Resume is required (must be uploaded)
      if (!resumeFile) {
        throw new Error('Resume is required')
      }

      // Create FormData for multipart upload
      const submitData = new FormData()
      submitData.append('job_id', job.id.toString())
      submitData.append('jobseeker_name', formData.jobseeker_name)
      submitData.append('jobseeker_email', formData.jobseeker_email)
      submitData.append('jobseeker_phone', formData.jobseeker_phone)
      submitData.append('linkedin_url', formData.linkedin_url)
      submitData.append('personal_note', formData.personal_note)
      submitData.append('priority', formData.priority)
      
      if (resumeFile) {
        submitData.append('resume', resumeFile)
      }

      // Submit request
      const response = await fetch('/api/v1/referral-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: submitData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to submit referral request')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
        setSuccess(false)
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to submit referral request')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        jobseeker_name: '',
        jobseeker_email: '',
        jobseeker_phone: '',
        linkedin_url: '',
        personal_note: '',
        priority: 'normal'
      })
      setResumeFile(null)
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">Request Referral</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          
          <CardContent>

            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Request Submitted!</h3>
                <p className="text-gray-600">Your referral request has been sent to the employee.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        name="jobseeker_name"
                        value={formData.jobseeker_name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        className="pl-10"
                        required
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        name="jobseeker_email"
                        type="email"
                        value={formData.jobseeker_email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="pl-10"
                        required
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        name="jobseeker_phone"
                        type="tel"
                        value={formData.jobseeker_phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn Profile
                    </label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        name="linkedin_url"
                        type="url"
                        value={formData.linkedin_url}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/yourprofile"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Resume Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resume *
                  </label>
                  <div className={`border-2 border-dashed rounded-lg p-4 ${resumeFile ? 'border-green-300 bg-green-50' : showSavedResume ? 'border-blue-300 bg-blue-50' : 'border-red-300 bg-red-50'}`}>
                    <input
                      type="file"
                      id="resume"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="resume"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      {resumeFile ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <File className="w-5 h-5" />
                          <span className="text-sm font-medium">{resumeFile.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                      ) : showSavedResume ? (
                        <div className="flex items-center space-x-2 text-blue-600">
                          <File className="w-5 h-5" />
                          <span className="text-sm font-medium">Using saved resume: {savedResumeFilename}</span>
                          <span className="text-xs text-gray-500">
                            Click to upload different resume
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <Upload className="w-8 h-8 text-red-400" />
                          <span className="text-sm text-red-600 font-medium">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-gray-500">
                            PDF, DOC, DOCX, TXT (max 10MB)
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                  {!resumeFile && !showSavedResume && (
                    <p className="mt-1 text-sm text-red-600">Resume is required to submit the referral request</p>
                  )}
                  {showSavedResume && !resumeFile && (
                    <p className="mt-1 text-sm text-blue-600">Using your saved resume. Click upload area to use a different resume.</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Personal Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Note
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      name="personal_note"
                      value={formData.personal_note}
                      onChange={handleInputChange}
                      placeholder="Tell the employee why you're interested in this role and how you can contribute..."
                      rows={4}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
