import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfileCompletion } from '../contexts/ProfileCompletionContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { 
  profileAPI, 
  ProfileResponse, 
  JobSeekerProfileResponse, 
  EmployeeProfileResponse,
  ProfileCompletionResponse,
  ProfileUpdateData,
  JobSeekerProfileUpdateData,
  EmployeeProfileUpdateData,
  ExperienceData,
  EducationData,
  CertificationData
} from '../lib/api'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Globe, 
  FileText, 
  Save, 
  Edit3, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Building,
  Plus,
  X,
  Eye,
  Download,
  Camera,
  Award
} from 'lucide-react'
import { ResumeViewer } from '../components/ResumeViewer'

export function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { refreshCompletionStatus } = useProfileCompletion()

  // Helper function to get API base URL
  const getApiBaseUrl = () => {
    return process.env.REACT_APP_API_URL || 
           process.env.NEXT_PUBLIC_API_URL || 
           process.env.VITE_API_URL || 
           (window.location.hostname === 'localhost' ? 'http://localhost:8000/api/v1' : 'https://referconnect-production.up.railway.app/api/v1')
  }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Profile data
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [jobseekerProfile, setJobseekerProfile] = useState<JobSeekerProfileResponse | null>(null)
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfileResponse | null>(null)
  const [completion, setCompletion] = useState<ProfileCompletionResponse | null>(null)
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<ProfileUpdateData>({})
  const [editJobseekerData, setEditJobseekerData] = useState<JobSeekerProfileUpdateData>({})
  const [editEmployeeData, setEditEmployeeData] = useState<EmployeeProfileUpdateData>({})
  
  // Job seeker specific states
  const [skills, setSkills] = useState<Array<{name: string, proficiency: number}>>([])
  const [excludedCompanies] = useState<string[]>([])
  const [experience, setExperience] = useState<ExperienceData[]>([])
  const [education, setEducation] = useState<EducationData[]>([])
  const [certifications, setCertifications] = useState<CertificationData[]>([])
  
  // Edit states for different sections
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editBio, setEditBio] = useState('')
  const [editContact, setEditContact] = useState({
    phone: '',
    linkedin_url: '',
    website: ''
  })
  const [editSkills, setEditSkills] = useState<Array<{name: string, proficiency: number}>>([])
  const [newSkill, setNewSkill] = useState('')
  const [editPrivacy, setEditPrivacy] = useState({
    profileVisibility: 'public',
    excludedCompanies: [] as string[]
  })
  const [newExcludedCompany, setNewExcludedCompany] = useState('')
  const [editExperience, setEditExperience] = useState<ExperienceData[]>([])
  const [editEducation, setEditEducation] = useState<EducationData[]>([])
  const [editCertifications, setEditCertifications] = useState<CertificationData[]>([])
  const [newExperience, setNewExperience] = useState<ExperienceData>({
    title: '',
    company: '',
    start_date: '',
    end_date: null,
    description: null,
    current: false
  })
  const [newEducation, setNewEducation] = useState<EducationData>({
    degree: '',
    school: '',
    start_date: '',
    end_date: '',
    description: null
  })
  const [newCertification, setNewCertification] = useState<CertificationData>({
    name: '',
    issuer: '',
    date: '',
    credential_id: null
  })
  
  // Resume upload states
  const [uploadingResume, setUploadingResume] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  
  // Resume viewer states
  const [showResumeViewer, setShowResumeViewer] = useState(false)
  
  // Experience and Education data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [experiences] = useState<Array<{
    id: string
    title: string
    company: string
    startDate: string
    endDate: string
    description: string
  }>>([
    {
      id: '1',
      title: 'Senior UX Designer',
      company: 'TechCorp Inc.',
      startDate: '2021',
      endDate: 'Present',
      description: 'Led design initiatives for mobile and web applications serving 2M+ users. Collaborated with cross-functional teams to deliver user-centered solutions.'
    },
    {
      id: '2',
      title: 'UX Designer',
      company: 'Design Studio',
      startDate: '2018',
      endDate: '2021',
      description: 'Designed digital experiences for startups and established brands. Conducted user research and usability testing.'
    }
  ])
  
  
  
  const [privacySettings] = useState({
    profileVisibility: 'public',
    excludedCompanies: []
  })

  // Function to load profile data
  const loadProfileData = async () => {
    // Only load data if user is authenticated
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Load basic profile
      const profileResponse = await profileAPI.getProfile()
      const profile = profileResponse.data as ProfileResponse
      setProfile(profile)
      
      // Load role-specific profile
      if (user.role === 'jobseeker') {
        try {
          const jobseekerResponse = await profileAPI.getJobSeekerProfile()
          const jobseekerProfile = jobseekerResponse.data as JobSeekerProfileResponse
          setJobseekerProfile(jobseekerProfile)
          
          // Parse skills from comma-separated string
          if (jobseekerProfile.skills) {
            const skillsArray = jobseekerProfile.skills.split(',').map(skill => ({
              name: skill.trim(),
              proficiency: 4 // Default proficiency level
            }))
            setSkills(skillsArray)
          }
        } catch (err) {
          console.log('No jobseeker profile found, will create one')
        }
      } else if (user.role === 'employee') {
        try {
          const employeeResponse = await profileAPI.getEmployeeProfile()
          const employeeProfile = employeeResponse.data as EmployeeProfileResponse
          setEmployeeProfile(employeeProfile)
        } catch (err) {
          console.log('No employee profile found, will create one')
        }
      }
      
      // Load completion status
      try {
        const completionResponse = await profileAPI.getProfileCompletion()
        const completionData = completionResponse.data as ProfileCompletionResponse
        setCompletion(completionData)
      } catch (err) {
        console.log('No completion data found')
      }
      
      // Load experience data
      try {
        const experienceResponse = await profileAPI.getExperience()
        const experienceData = experienceResponse.data.map((exp) => ({
          id: exp.id.toString(),
          title: exp.title,
          company: exp.company,
          start_date: exp.start_date,
          end_date: exp.end_date || null,
          description: exp.description || null,
          current: exp.current
        }))
        setExperience(experienceData)
      } catch (err) {
        console.log('No experience data found')
      }
      
      // Load education data
      try {
        const educationResponse = await profileAPI.getEducation()
        const educationData = educationResponse.data.map((edu) => ({
          id: edu.id.toString(),
          degree: edu.degree,
          school: edu.school,
          start_date: edu.start_date,
          end_date: edu.end_date,
          description: edu.description || null
        }))
        setEducation(educationData)
      } catch (err) {
        console.log('No education data found')
      }
      
      // Load certifications data
      try {
        const certificationsResponse = await profileAPI.getCertifications()
        const certificationsData = certificationsResponse.data.map((cert) => ({
          id: cert.id.toString(),
          name: cert.name,
          issuer: cert.issuer,
          date: cert.date,
          credential_id: cert.credential_id || null
        }))
        setCertifications(certificationsData)
      } catch (err) {
        console.log('No certifications data found')
      }
      
    } catch (err: any) {
      console.error('Failed to load profile data:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Debug authentication status
    const token = localStorage.getItem('access_token')
    console.log('Profile page loaded - Token exists:', !!token)
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'No token')
    console.log('Current completion state:', completion)
    
    loadProfileData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debug completion state changes
  useEffect(() => {
    console.log('Completion state updated:', completion)
  }, [completion])

  // Redirect employees to the new EmployeeProfile page
  useEffect(() => {
    if (user && user.role === 'employee') {
      navigate('/employee-profile', { replace: true })
      return
    }
  }, [user, navigate])

  // Don't render anything if user is an employee (will be redirected)
  if (user && user.role === 'employee') {
    return null
  }

  // Function to refresh completion data
  const refreshCompletionData = async () => {
    try {
      console.log('Manually refreshing completion data...')
      console.log('Current token:', localStorage.getItem('access_token'))
      
      // Test the API call directly
      const response = await fetch('http://localhost:8000/api/v1/profile/me/completion', {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Direct fetch response status:', response.status)
      const data = await response.json()
      console.log('Direct fetch response data:', data)
      
      if (response.ok) {
        setCompletion(data as ProfileCompletionResponse)
        console.log('Completion data set successfully')
      } else {
        console.error('API call failed:', data)
      }
    } catch (err) {
      console.error('Failed to refresh completion data:', err)
    }
  }






  const handleEdit = () => {
    setIsEditing(true)
    setEditData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      phone: profile?.phone || '',
      location: profile?.location || '',
      bio: profile?.bio || '',
      linkedin_url: profile?.linkedin_url || ''
    })

    if (user?.role === 'jobseeker' && jobseekerProfile) {
      setEditJobseekerData({
        current_company: jobseekerProfile.current_company || '',
        years_experience: jobseekerProfile.years_experience || 0
      })
    }

    if (user?.role === 'employee' && employeeProfile) {
      setEditEmployeeData({
        title: employeeProfile.title || '',
        badges: employeeProfile.badges || '',
        company_id: employeeProfile.company_id || undefined
      })
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Update basic profile
      await profileAPI.updateProfile(editData)
      
      // Update role-specific profile only if there's data to update
      if (user?.role === 'jobseeker') {
        const jobseekerUpdateData = {
          ...editJobseekerData,
          skills: skills.join(','),
          privacy_excluded_companies: excludedCompanies.join(',')
        }
        await profileAPI.updateJobSeekerProfile(jobseekerUpdateData)
      } else if (user?.role === 'employee' && Object.keys(editEmployeeData).length > 0) {
        await profileAPI.updateEmployeeProfile(editEmployeeData)
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      await loadProfileData()

    } catch (err: any) {
      console.error('Failed to update profile:', err)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
    setEditJobseekerData({})
    setEditEmployeeData({})
    setEditingSection(null)
    setEditBio('')
    setError(null)
    setSuccess(null)
  }

  const handleEditSection = (section: string) => {
    setEditingSection(section)
    if (section === 'bio') {
      setEditBio(profile?.bio || '')
    } else if (section === 'contact') {
      setEditContact({
        phone: profile?.phone || '',
        linkedin_url: profile?.linkedin_url || '',
        website: profile?.website || ''
      })
    } else if (section === 'skills') {
      setEditSkills([...skills])
    } else if (section === 'privacy') {
      setEditPrivacy({
        profileVisibility: privacySettings.profileVisibility,
        excludedCompanies: privacySettings.excludedCompanies
      })
    } else if (section === 'professional') {
      setEditJobseekerData({
        current_company: jobseekerProfile?.current_company || '',
        current_job_title: jobseekerProfile?.current_job_title || '',
        years_experience: jobseekerProfile?.years_experience || 0,
        education: jobseekerProfile?.education || ''
      })
    } else if (section === 'experience') {
      setEditExperience([...experience])
    } else if (section === 'education') {
      setEditEducation([...education])
    } else if (section === 'certifications') {
      setEditCertifications([...certifications])
    }
  }

  const handleSaveSection = async (section: string) => {
    try {
    setSaving(true)
    setError(null)
    setSuccess(null)

      if (section === 'bio') {
        await profileAPI.updateProfile({ bio: editBio })
        setProfile(prev => prev ? { ...prev, bio: editBio } : null)
      } else if (section === 'contact') {
        await profileAPI.updateProfile({
          phone: editContact.phone,
          linkedin_url: editContact.linkedin_url,
          website: editContact.website
        })
        setProfile(prev => prev ? { 
          ...prev, 
          phone: editContact.phone,
          linkedin_url: editContact.linkedin_url,
          website: editContact.website
        } : null)
      } else if (section === 'skills') {
        const skillsString = editSkills.map(s => s.name).join(',')
        await profileAPI.updateJobSeekerProfile({ skills: skillsString })
        setSkills([...editSkills])
        
        // Refresh the jobseeker profile to get updated data
        const jobseekerResponse = await profileAPI.getJobSeekerProfile()
        const updatedJobseekerProfile = jobseekerResponse.data as JobSeekerProfileResponse
        setJobseekerProfile(updatedJobseekerProfile)
      } else if (section === 'professional') {
        await profileAPI.updateJobSeekerProfile({
          current_company: editJobseekerData.current_company,
          current_job_title: editJobseekerData.current_job_title,
          years_experience: editJobseekerData.years_experience,
          education: editJobseekerData.education
        })
        
        // Refresh the jobseeker profile to get updated data
        const jobseekerResponse = await profileAPI.getJobSeekerProfile()
        const updatedJobseekerProfile = jobseekerResponse.data as JobSeekerProfileResponse
        setJobseekerProfile(updatedJobseekerProfile)
      } else if (section === 'privacy') {
        // This would need a separate API endpoint for privacy settings
        console.log('Privacy settings update not implemented yet')
      } else if (section === 'experience') {
        // Save experience data to API
        for (const exp of editExperience) {
          const apiData = {
            title: exp.title,
            company: exp.company,
            start_date: exp.start_date,
            end_date: exp.end_date,
            description: exp.description,
            current: exp.current
          }
          
          // Check if this is a truly existing entry (has numeric ID from database)
          if (exp.id && !isNaN(parseInt(exp.id))) {
            // Update existing experience
            await profileAPI.updateExperience(exp.id, apiData)
          } else {
            // Create new experience
            const response = await profileAPI.createExperience(apiData)
            // Update the local state with the new ID from the response
            exp.id = response.data.id.toString()
          }
        }
        setExperience([...editExperience])
      } else if (section === 'education') {
        // Save education data to API
        for (const edu of editEducation) {
          const apiData = {
            degree: edu.degree,
            school: edu.school,
            start_date: edu.start_date,
            end_date: edu.end_date,
            description: edu.description
          }
          
          // Check if this is a truly existing entry (has numeric ID from database)
          if (edu.id && !isNaN(parseInt(edu.id))) {
            // Update existing education
            await profileAPI.updateEducation(edu.id, apiData)
          } else {
            // Create new education
            const response = await profileAPI.createEducation(apiData)
            // Update the local state with the new ID from the response
            edu.id = response.data.id.toString()
          }
        }
        setEducation([...editEducation])
      } else if (section === 'certifications') {
        // Save certifications data to API
        for (const cert of editCertifications) {
          const apiData = {
            name: cert.name,
            issuer: cert.issuer,
            date: cert.date,
            credential_id: cert.credential_id
          }
          
          // Check if this is a truly existing entry (has numeric ID from database)
          if (cert.id && !isNaN(parseInt(cert.id))) {
            // Update existing certification
            await profileAPI.updateCertification(cert.id, apiData)
          } else {
            // Create new certification
            const response = await profileAPI.createCertification(apiData)
            // Update the local state with the new ID from the response
            cert.id = response.data.id.toString()
          }
        }
        setCertifications([...editCertifications])
      }

      setSuccess(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully!`)
      setEditingSection(null)
      setEditBio('')
      
      // Refresh completion data after update
      try {
        const completionResponse = await profileAPI.getProfileCompletion()
        setCompletion(completionResponse.data as ProfileCompletionResponse)
      } catch (err) {
        console.error('Failed to refresh completion data:', err)
      }
    } catch (err: any) {
      console.error(`Failed to update ${section}:`, err)
      const errorMessage = err?.response?.data?.detail || err?.message || `Failed to update ${section}. Please try again.`
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (file: File) => {
    try {
      setUploadingResume(true)
      setError(null)
      setSuccess(null)

      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('doc') && !file.type.includes('docx')) {
        setError('Please upload a PDF or Word document')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        return
      }

      await profileAPI.uploadResume(file)
      setSuccess('Resume uploaded successfully!')
      
      // Refresh profile data to get updated resume info
      await loadProfileData()
      
      // Refresh completion data after resume upload
      try {
        const completionResponse = await profileAPI.getProfileCompletion()
        setCompletion(completionResponse.data as ProfileCompletionResponse)
      } catch (err) {
        console.error('Failed to refresh completion data:', err)
      }
    } catch (err: any) {
      console.error('Failed to upload resume:', err)
      setError('Failed to upload resume. Please try again.')
    } finally {
      setUploadingResume(false)
    }
  }

  const handleResumeDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your resume? This action cannot be undone.')) {
      return
    }

    try {
      setUploadingResume(true)
      setError(null)
      setSuccess(null)

      await profileAPI.deleteResume()
      setSuccess('Resume deleted successfully!')
      
      // Refresh profile data to get updated resume info
      await loadProfileData()
      
      // Refresh completion data after resume deletion
      try {
        const completionResponse = await profileAPI.getProfileCompletion()
        setCompletion(completionResponse.data as ProfileCompletionResponse)
      } catch (err) {
        console.error('Failed to refresh completion data:', err)
      }
    } catch (err: any) {
      console.error('Failed to delete resume:', err)
      setError('Failed to delete resume. Please try again.')
    } finally {
      setUploadingResume(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setResumeFile(file)
      handleResumeUpload(file)
    }
  }

  // Helper functions for completion
  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getCompletionStatus = (field: string) => {
    if (!completion) return false
    
    // Check if field is in missing fields
    return !completion.missing_fields.includes(field)
  }

  const getCompletionItems = () => {
    if (!completion) return []
    
    const items = [
      { key: 'profile_photo', label: 'Profile photo added', completed: profile?.profile_picture ? true : false },
      { key: 'contact_info', label: 'Contact info complete', completed: getCompletionStatus('Phone') && getCompletionStatus('LinkedIn URL') },
      { key: 'bio', label: 'Professional summary added', completed: getCompletionStatus('Bio') },
      { key: 'skills', label: 'Skills added', completed: getCompletionStatus('Skills') },
      { key: 'resume', label: 'Resume uploaded', completed: jobseekerProfile?.resume_filename ? true : false },
      { key: 'certifications', label: 'Add certifications', completed: false } // This would need to be tracked separately
    ]
    
    return items
  }

  // Skills management functions
  const addSkillToEdit = () => {
    if (newSkill.trim() && !editSkills.some(s => s.name === newSkill.trim())) {
      setEditSkills([...editSkills, { name: newSkill.trim(), proficiency: 4 }])
      setNewSkill('')
    }
  }

  const removeSkillFromEdit = (skillToRemove: string) => {
    setEditSkills(editSkills.filter(skill => skill.name !== skillToRemove))
  }



  const addExcludedCompany = () => {
    if (newExcludedCompany.trim() && !editPrivacy.excludedCompanies.includes(newExcludedCompany.trim())) {
      setEditPrivacy(prev => ({
        ...prev,
        excludedCompanies: [...prev.excludedCompanies, newExcludedCompany.trim()]
      }))
      setNewExcludedCompany('')
    }
  }

  // Experience management functions
  const addExperience = () => {
    if (newExperience.title.trim() && newExperience.company.trim()) {
      setEditExperience([...editExperience, { ...newExperience }])
      setNewExperience({
        title: '',
        company: '',
        start_date: '',
        end_date: null,
        description: null,
        current: false
      })
    }
  }

  const removeExperience = (id: string) => {
    setEditExperience(editExperience.filter(exp => exp.id !== id))
  }

  const updateExperience = (id: string, field: string, value: any) => {
    setEditExperience(editExperience.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ))
  }

  // Education management functions
  const addEducation = () => {
    if (newEducation.degree.trim() && newEducation.school.trim()) {
      setEditEducation([...editEducation, { ...newEducation }])
      setNewEducation({
        degree: '',
        school: '',
        start_date: '',
        end_date: '',
        description: null
      })
    }
  }

  const removeEducation = (id: string) => {
    setEditEducation(editEducation.filter(edu => edu.id !== id))
  }

  const updateEducation = (id: string, field: string, value: any) => {
    setEditEducation(editEducation.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ))
  }

  // Certifications management functions
  const addCertification = () => {
    if (newCertification.name.trim() && newCertification.issuer.trim()) {
      setEditCertifications([...editCertifications, { ...newCertification }])
      setNewCertification({
        name: '',
        issuer: '',
        date: '',
        credential_id: null
      })
    }
  }

  const removeCertification = (id: string) => {
    setEditCertifications(editCertifications.filter(cert => cert.id !== id))
  }

  const updateCertification = (id: string, field: string, value: any) => {
    setEditCertifications(editCertifications.map(cert => 
      cert.id === id ? { ...cert, [field]: value } : cert
    ))
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-md flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

        {/* Job Seeker Profile */}
        {user?.role === 'jobseeker' ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Completion Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Profile Completion</CardTitle>
          </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${getCompletionColor(completion?.overall_completion || 0)}`}>
                          {completion?.overall_completion || 0}%
                </span>
                        <button 
                          onClick={refreshCompletionData}
                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 px-2 py-1 rounded"
                        >
                          Refresh
                        </button>
                      </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(completion?.overall_completion || 0)}`}
                        style={{ width: `${completion?.overall_completion || 0}%` }}
                ></div>
                    </div>
              </div>
              
                  <div className="space-y-2">
                    {getCompletionItems().map((item, index) => (
                      <div key={index} className="flex items-center text-sm">
                        {item.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                        )}
                        <span className={`${item.completed ? 'text-gray-700' : 'text-gray-500'}`}>
                          {item.label}
                      </span>
                      </div>
                    ))}
                  </div>
              
                  {/* Debug info */}
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <p className="font-medium">Debug Info:</p>
                    <p>Overall: {completion?.overall_completion || 0}%</p>
                    <p>Basic: {completion?.basic_info_completion || 0}%</p>
                    <p>Jobseeker: {completion?.jobseeker_completion || 0}%</p>
                    <p>Employee: {completion?.employee_completion || 0}%</p>
                    <p>Missing: {completion?.missing_fields?.length || 0} fields</p>
                </div>
              
                  {completion && completion.overall_completion < 80 && (
                <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">
                        Complete your profile to get better job recommendations and increase your visibility.
                      </p>
                      <div className="text-xs text-gray-500">
                        Missing: {completion.missing_fields.join(', ')}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trust Score Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Trust Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {jobseekerProfile?.trust_score || 0}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Your trust score is based on profile completeness, verification status, and activity.
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((jobseekerProfile?.trust_score || 0) * 10, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.min((jobseekerProfile?.trust_score || 0) * 10, 100)}% complete
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile View Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Profile View</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => console.log('Preview mode clicked')}
                    >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview as Others See
                    </Button>
                    <Button 
                      variant="outline"
                    className="w-full"
                    onClick={() => setIsEditing(true)}
                    >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Mode
                    </Button>
          </CardContent>
        </Card>
                  </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Profile Header Card */}
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-400" />
                </div>
                        <button className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <Camera className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">
                          {profile?.first_name || 'User'} {profile?.last_name || 'Name'}
                        </h1>
                        <p className="text-lg text-gray-600 mt-1">
                          {jobseekerProfile?.current_job_title && jobseekerProfile?.current_company 
                            ? `${jobseekerProfile.current_job_title} at ${jobseekerProfile.current_company}`
                            : jobseekerProfile?.current_job_title 
                            ? jobseekerProfile.current_job_title
                            : jobseekerProfile?.current_company
                            ? `at ${jobseekerProfile.current_company}`
                            : 'Job Seeker'
                          }
                        </p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-1" />
                          {profile?.location || 'Location not specified'}
                    </div>
                        <div className="flex items-center mt-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Available
                          </Badge>
                    </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Last updated: Recently
                        </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                      className="flex items-center"
                      onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

              {/* Contact Information Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => handleEditSection('contact')}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {editingSection === 'contact' ? (
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-3" />
                        <span className="text-gray-600">{profile?.email}</span>
                        <span className="text-xs text-gray-400 ml-2">(Email cannot be changed)</span>
                      </div>
                      
              <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <Input
                          value={editContact.phone}
                          onChange={(e) => setEditContact(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                        <Input
                          value={editContact.linkedin_url}
                          onChange={(e) => setEditContact(prev => ({ ...prev, linkedin_url: e.target.value }))}
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <Input
                          value={editContact.website}
                          onChange={(e) => setEditContact(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingSection(null)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSaveSection('contact')}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                    <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-3" />
                        <a href={`mailto:${profile?.email}`} className="text-blue-600 hover:underline">
                          {profile?.email || 'Email not provided'}
                        </a>
                      </div>
                      {profile?.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-3" />
                          <a href={`tel:${profile.phone}`} className="text-blue-600 hover:underline">
                            {profile.phone}
                          </a>
                    </div>
                  )}
                      {profile?.linkedin_url && (
                    <div className="flex items-center">
                          <Linkedin className="w-4 h-4 text-gray-400 mr-3" />
                          <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.linkedin_url.replace('https://', '')}
                          </a>
                    </div>
                  )}
                      {profile?.website && (
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 text-gray-400 mr-3" />
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {profile.website.replace('https://', '')}
                          </a>
                </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Professional Summary Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Professional Summary</CardTitle>
                  <button 
                    className="text-gray-400 hover:text-gray-600"
                    onClick={() => handleEditSection('bio')}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
            </CardHeader>
            <CardContent>
                  {editingSection === 'bio' ? (
                <div className="space-y-4">
                      <textarea
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Tell us about yourself, your experience, and what makes you unique..."
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                          onClick={() => setEditingSection(null)}
                          disabled={saving}
                        >
                          Cancel
                    </Button>
                        <Button 
                          onClick={() => handleSaveSection('bio')}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {profile?.bio || 'No professional summary provided. Click edit to add your bio and professional summary.'}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Resume Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Resume</CardTitle>
                  {jobseekerProfile?.resume_filename && (
                    <div className="flex items-center space-x-2">
                      {(jobseekerProfile.resume_url || jobseekerProfile.resume_key) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-300 hover:bg-green-50 flex items-center gap-1"
                          onClick={() => setShowResumeViewer(true)}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                      )}
                      {jobseekerProfile.resume_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50 flex items-center gap-1"
                          onClick={() => {
                            // For S3 URLs, open in new tab for download
                            if (jobseekerProfile.resume_url!.includes('amazonaws.com') || jobseekerProfile.resume_url!.includes('s3')) {
                              window.open(jobseekerProfile.resume_url!, '_blank');
                            } else {
                              // For local URLs, use download link
                              const link = document.createElement('a');
                              link.href = jobseekerProfile.resume_url!;
                              link.download = jobseekerProfile.resume_filename!;
                              link.click();
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-1"
                        onClick={handleResumeDelete}
                        disabled={uploadingResume}
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                    {jobseekerProfile?.resume_filename ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                        <div className="flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{jobseekerProfile.resume_filename}</p>
                        {!jobseekerProfile.resume_url && !jobseekerProfile.resume_key && (
                          <p className="text-sm text-amber-600 mb-2">
                            ⚠️ Resume file exists but URL is not available. Please re-upload your resume.
                          </p>
                        )}
                        {(jobseekerProfile.resume_url || jobseekerProfile.resume_key) && (
                          <p className="text-sm text-blue-600 mb-2">
                            📄 Resume is available for viewing
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mb-4">
                          Click to update your resume
                        </p>
                        <div className="space-y-2">
                          <div className="flex gap-2 justify-center">
                            {(jobseekerProfile.resume_url || jobseekerProfile.resume_key) && (
                              <Button 
                                variant="outline"
                                className="border-green-300 text-green-600 hover:bg-green-50 flex items-center gap-2"
                                onClick={() => setShowResumeViewer(true)}
                                disabled={uploadingResume}
                              >
                                <Eye className="w-4 h-4" />
                                View Resume
                              </Button>
                            )}
                            <input
                              type="file"
                              id="resume-upload"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileChange}
                              className="hidden"
                              disabled={uploadingResume}
                            />
                            <label htmlFor="resume-upload">
                              <Button 
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={uploadingResume}
                                asChild
                              >
                                <span>
                                  {uploadingResume ? 'Uploading...' : 'Update Resume'}
                                </span>
                              </Button>
                            </label>
                            <Button 
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={handleResumeDelete}
                              disabled={uploadingResume}
                            >
                              Delete Resume
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                        <div className="flex items-center justify-center mb-4">
                          <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 mb-4">No resume uploaded yet</p>
                        <div className="space-y-2">
                          <input
                            type="file"
                            id="resume-upload"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={uploadingResume}
                          />
                          <label htmlFor="resume-upload">
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={uploadingResume}
                              asChild
                            >
                              <span>
                                {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                              </span>
                            </Button>
                          </label>
                          <p className="text-xs text-gray-400">PDF, DOC, or DOCX files only (max 5MB)</p>
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>

              {/* Skills Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Skills</CardTitle>
                  {editingSection === 'skills' ? (
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingSection(null)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSaveSection('skills')}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Skills'}
                      </Button>
                    </div>
                  ) : (
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => handleEditSection('skills')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </CardHeader>
                <CardContent>
                  {editingSection === 'skills' ? (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill (e.g., JavaScript, Python, React)"
                          onKeyPress={(e) => e.key === 'Enter' && addSkillToEdit()}
                        />
                        <Button onClick={addSkillToEdit} disabled={!newSkill.trim()}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {editSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editSkills.map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1"
                            >
                              {skill.name}
                              <button 
                                onClick={() => removeSkillFromEdit(skill.name)}
                                className="ml-1 hover:text-blue-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {jobseekerProfile?.skills ? (
                        <div className="flex flex-wrap gap-2">
                          {jobseekerProfile.skills.split(',').map((skill, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                            >
                              {skill.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No skills added yet</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Click the edit button to add your skills
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
          </Card>

              {/* Professional Details Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Professional Details</CardTitle>
                  {editingSection === 'professional' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSection(null)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => handleEditSection('professional')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </CardHeader>
                <CardContent>
                  {editingSection === 'professional' ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current Company</label>
                          <Input
                            value={editJobseekerData.current_company || ''}
                            onChange={(e) => setEditJobseekerData(prev => ({ ...prev, current_company: e.target.value }))}
                            placeholder="Your current company"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                          <Input
                            value={editJobseekerData.current_job_title || ''}
                            onChange={(e) => setEditJobseekerData(prev => ({ ...prev, current_job_title: e.target.value }))}
                            placeholder="Your job title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                          <Input
                            type="number"
                            value={editJobseekerData.years_experience || ''}
                            onChange={(e) => setEditJobseekerData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                            placeholder="Years of experience"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Latest Education</label>
                        <select
                          value={editJobseekerData.education || ''}
                          onChange={(e) => setEditJobseekerData(prev => ({ ...prev, education: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select education level</option>
                          <option value="High School">High School</option>
                          <option value="Associate Degree">Associate Degree</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="PhD">PhD</option>
                          <option value="Professional Certification">Professional Certification</option>
                          <option value="Bootcamp">Bootcamp</option>
                          <option value="Self-taught">Self-taught</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Current Company</p>
                          <p className="font-medium">{jobseekerProfile?.current_company || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Job Title</p>
                          <p className="font-medium">{jobseekerProfile?.current_job_title || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Years of Experience</p>
                          <p className="font-medium">{jobseekerProfile?.years_experience || 'Not provided'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Latest Education</p>
                        <p className="font-medium">{jobseekerProfile?.education || 'Not provided'}</p>
                      </div>
                    </div>
                  )}
                  {editingSection === 'professional' && (
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingSection(null)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSaveSection('professional')}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Experience Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Experience</CardTitle>
                  {editingSection === 'experience' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSection(null)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleEditSection('experience')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  )}
              </CardHeader>
                <CardContent>
                  {editingSection === 'experience' ? (
                    <div className="space-y-4">
                      {/* Add new experience form */}
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Add New Experience</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <Input
                              value={newExperience.title}
                              onChange={(e) => setNewExperience(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g., Senior UX Designer"
                      />
                    </div>
                    <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <Input
                              value={newExperience.company}
                              onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                              placeholder="e.g., TechCorp Inc."
                      />
                    </div>
                    <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <Input
                              type="month"
                              value={newExperience.start_date}
                              onChange={(e) => setNewExperience(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <Input
                              type="month"
                              value={newExperience.end_date || ''}
                              onChange={(e) => setNewExperience(prev => ({ ...prev, end_date: e.target.value || null }))}
                              disabled={newExperience.current}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <Textarea
                            value={newExperience.description || ''}
                            onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value || null }))}
                            placeholder="Describe your role and achievements..."
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center mt-3">
                          <input
                            type="checkbox"
                            id="current-job"
                            checked={newExperience.current}
                            onChange={(e) => setNewExperience(prev => ({ ...prev, current: e.target.checked }))}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="current-job" className="ml-2 text-sm font-medium text-gray-900">
                            I currently work here
                          </label>
                        </div>
                        <Button 
                          onClick={addExperience}
                          disabled={!newExperience.title.trim() || !newExperience.company.trim()}
                          className="mt-3"
                        >
                          Add Experience
                        </Button>
                      </div>

                      {/* Edit existing experiences */}
                      {editExperience.map((exp, index) => (
                        <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-900">Experience {index + 1}</h4>
                            <button 
                              onClick={() => removeExperience(exp.id!)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                              <Input
                                value={exp.title}
                                onChange={(e) => updateExperience(exp.id!, 'title', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                              <Input
                                value={exp.company}
                                onChange={(e) => updateExperience(exp.id!, 'company', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                              <Input
                                type="month"
                                value={exp.start_date}
                                onChange={(e) => updateExperience(exp.id!, 'start_date', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                              <Input
                                type="month"
                                value={exp.end_date || ''}
                                onChange={(e) => updateExperience(exp.id!, 'end_date', e.target.value || null)}
                                disabled={exp.current}
                              />
                            </div>
                          </div>
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <Textarea
                              value={exp.description || ''}
                              onChange={(e) => updateExperience(exp.id!, 'description', e.target.value || null)}
                              rows={3}
                            />
                          </div>
                          <div className="flex items-center mt-3">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => updateExperience(exp.id!, 'current', e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label className="ml-2 text-sm font-medium text-gray-900">
                              I currently work here
                            </label>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingSection(null)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSaveSection('experience')}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Experience'}
                        </Button>
                      </div>
                    </div>
                ) : (
                  <>
                      {experience.length > 0 ? (
                        <div className="space-y-6">
                          {experience.map((exp, index) => (
                            <div key={exp.id} className="relative">
                              {index > 0 && (
                                <div className="absolute left-4 top-0 w-0.5 h-6 bg-blue-200 -translate-y-6"></div>
                              )}
                              <div className="flex items-start space-x-4">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                                      <p className="text-blue-600 font-medium">{exp.company}</p>
                                      <p className="text-sm text-gray-500">
                                        {exp.start_date} - {exp.current ? 'Present' : exp.end_date}
                                      </p>
                                      {exp.description && (
                                        <p className="text-gray-700 mt-2 leading-relaxed">{exp.description}</p>
                                      )}
                    </div>
                    </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No experience added yet. Click "Add Experience" to get started.</p>
                        </div>
                      )}
                  </>
                )}
              </CardContent>
            </Card>

              {/* Education Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Education</CardTitle>
                  {editingSection === 'education' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSection(null)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <button 
                      className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
                      onClick={() => handleEditSection('education')}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  )}
              </CardHeader>
                <CardContent>
                  {editingSection === 'education' ? (
                    <div className="space-y-4">
                      {/* Add new education form */}
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Add New Education</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                            <Input
                              value={newEducation.degree}
                              onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                              placeholder="e.g., Bachelor of Design"
                            />
                </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School/University</label>
                            <Input
                              value={newEducation.school}
                              onChange={(e) => setNewEducation(prev => ({ ...prev, school: e.target.value }))}
                              placeholder="e.g., Stanford University"
                            />
                </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <Input
                              type="month"
                              value={newEducation.start_date}
                              onChange={(e) => setNewEducation(prev => ({ ...prev, start_date: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <Input
                              type="month"
                              value={newEducation.end_date}
                              onChange={(e) => setNewEducation(prev => ({ ...prev, end_date: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                          <Textarea
                            value={newEducation.description || ''}
                            onChange={(e) => setNewEducation(prev => ({ ...prev, description: e.target.value || null }))}
                            placeholder="Additional details about your education..."
                            rows={3}
                          />
                        </div>
                        <Button 
                          onClick={addEducation}
                          disabled={!newEducation.degree.trim() || !newEducation.school.trim()}
                          className="mt-3"
                        >
                          Add Education
                        </Button>
                      </div>

                      {/* Edit existing education */}
                      {editEducation.map((edu, index) => (
                        <div key={edu.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-900">Education {index + 1}</h4>
                            <button 
                              onClick={() => removeEducation(edu.id!)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                              <Input
                                value={edu.degree}
                                onChange={(e) => updateEducation(edu.id!, 'degree', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">School/University</label>
                              <Input
                                value={edu.school}
                                onChange={(e) => updateEducation(edu.id!, 'school', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                              <Input
                                type="month"
                                value={edu.start_date}
                                onChange={(e) => updateEducation(edu.id!, 'start_date', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                              <Input
                                type="month"
                                value={edu.end_date}
                                onChange={(e) => updateEducation(edu.id!, 'end_date', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <Textarea
                              value={edu.description || ''}
                              onChange={(e) => updateEducation(edu.id!, 'description', e.target.value || null)}
                              rows={3}
                            />
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingSection(null)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSaveSection('education')}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Education'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {education.length > 0 ? (
                        <div className="space-y-4">
                          {education.map((edu) => (
                            <div key={edu.id}>
                              <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                              <p className="text-blue-600 font-medium">{edu.school}</p>
                              <p className="text-sm text-gray-500">{edu.start_date} - {edu.end_date}</p>
                              {edu.description && (
                                <p className="text-gray-700 mt-2">{edu.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No education added yet. Click the + button to add education.</p>
                        </div>
                      )}
                    </>
                  )}
              </CardContent>
            </Card>

              {/* Certifications Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Certifications</CardTitle>
                  {editingSection === 'certifications' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSection(null)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <button 
                      className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center"
                      onClick={() => handleEditSection('certifications')}
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  )}
            </CardHeader>
            <CardContent>
                  {editingSection === 'certifications' ? (
                <div className="space-y-4">
                      {/* Add new certification form */}
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Add New Certification</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
                            <Input
                              value={newCertification.name}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="e.g., AWS Certified Solutions Architect"
                            />
                  </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
                            <Input
                              value={newCertification.issuer}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                              placeholder="e.g., Amazon Web Services"
                            />
                    </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                            <Input
                              type="month"
                              value={newCertification.date}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, date: e.target.value }))}
                            />
                    </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID (Optional)</label>
                            <Input
                              value={newCertification.credential_id || ''}
                              onChange={(e) => setNewCertification(prev => ({ ...prev, credential_id: e.target.value || null }))}
                              placeholder="e.g., AWS-123456"
                            />
                </div>
                        </div>
                        <Button 
                          onClick={addCertification}
                          disabled={!newCertification.name.trim() || !newCertification.issuer.trim()}
                          className="mt-3"
                        >
                          Add Certification
                        </Button>
                    </div>

                      {/* Edit existing certifications */}
                      {editCertifications.map((cert, index) => (
                        <div key={cert.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-900">Certification {index + 1}</h4>
                            <button 
                              onClick={() => removeCertification(cert.id!)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                    </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
                              <Input
                                value={cert.name}
                                onChange={(e) => updateCertification(cert.id!, 'name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
                              <Input
                                value={cert.issuer}
                                onChange={(e) => updateCertification(cert.id!, 'issuer', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                              <Input
                                type="month"
                                value={cert.date}
                                onChange={(e) => updateCertification(cert.id!, 'date', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID (Optional)</label>
                              <Input
                                value={cert.credential_id || ''}
                                onChange={(e) => updateCertification(cert.id!, 'credential_id', e.target.value || null)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingSection(null)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSaveSection('certifications')}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Certifications'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {certifications.length === 0 ? (
                        <div className="text-center py-8">
                          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">Add your certifications to boost your profile</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {certifications.map((cert) => (
                            <div key={cert.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div>
                                <h4 className="font-medium text-gray-900">{cert.name}</h4>
                                <p className="text-sm text-gray-500">{cert.issuer} • {cert.date}</p>
                                {cert.credential_id && (
                                  <p className="text-xs text-gray-400 mt-1">ID: {cert.credential_id}</p>
                  )}
                </div>
              </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
            </CardContent>
          </Card>




              {/* Languages Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Languages</CardTitle>
                  {editingSection === 'languages' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSection(null)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => handleEditSection('languages')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </CardHeader>
                <CardContent>
                  {editingSection === 'languages' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                        <Textarea
                          value={editJobseekerData.languages || ''}
                          onChange={(e) => setEditJobseekerData(prev => ({ ...prev, languages: e.target.value }))}
                          placeholder="Enter languages and proficiency levels (JSON format)"
                          rows={3}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Format: {"[{\"language\": \"English\", \"level\": \"Native\"}, {\"language\": \"Spanish\", \"level\": \"Intermediate\"}]"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {jobseekerProfile?.languages ? (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Languages</p>
                          <div className="space-y-2">
                            {(() => {
                              try {
                                const languages = JSON.parse(jobseekerProfile.languages);
                                if (Array.isArray(languages)) {
                                  return languages.map((lang, index) => (
                                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                      <span className="font-medium text-gray-900">{lang.language}</span>
                                      <span className="text-sm text-gray-600 bg-blue-100 px-2 py-1 rounded-full">
                                        {lang.level}
                                      </span>
                                    </div>
                                  ));
                                }
                              } catch (e) {
                                // If JSON parsing fails, show as raw text
                                return (
                                  <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="font-medium text-gray-900">{jobseekerProfile.languages}</p>
                                    <p className="text-xs text-gray-500 mt-1">Raw format (not JSON)</p>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No languages added yet</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Privacy Settings Section */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">Privacy Settings</CardTitle>
                  {editingSection === 'privacy' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingSection(null)}
                      disabled={saving}
                    >
                Cancel
              </Button>
                  ) : (
                    <button 
                      className="text-gray-400 hover:text-gray-600"
                      onClick={() => handleEditSection('privacy')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingSection === 'privacy' ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Profile Visibility</h4>
                        <p className="text-sm text-gray-500 mb-3">Control who can see your profile</p>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="public-profile"
                              name="visibility"
                              checked={editPrivacy.profileVisibility === 'public'}
                              onChange={() => setEditPrivacy(prev => ({ ...prev, profileVisibility: 'public' }))}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="public-profile" className="ml-2 text-sm font-medium text-gray-900">
                              Public - Anyone can see your profile
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="private-profile"
                              name="visibility"
                              checked={editPrivacy.profileVisibility === 'private'}
                              onChange={() => setEditPrivacy(prev => ({ ...prev, profileVisibility: 'private' }))}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="private-profile" className="ml-2 text-sm font-medium text-gray-900">
                              Private - Only connections can see your profile
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Company Exclusions</h4>
                        <p className="text-sm text-gray-500 mb-3">Hide profile from specific companies</p>
                        <div className="space-y-2">
                          <Input
                            placeholder="Add company name to exclude"
                            value={newExcludedCompany}
                            onChange={(e) => setNewExcludedCompany(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addExcludedCompany()}
                          />
                          <Button 
                            onClick={addExcludedCompany}
                            disabled={!newExcludedCompany.trim()}
                            variant="outline"
                            size="sm"
                          >
                            Add Company
              </Button>
                          {editPrivacy.excludedCompanies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {editPrivacy.excludedCompanies.map((company, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                  {company}
                                  <button
                                    onClick={() => setEditPrivacy(prev => ({
                                      ...prev,
                                      excludedCompanies: prev.excludedCompanies.filter((_, i) => i !== index)
                                    }))}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
            </div>
          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingSection(null)}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => handleSaveSection('privacy')}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                      </div>
        </div>
      ) : (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Profile Visibility</h4>
                        <p className="text-sm text-gray-500 mb-3">Control who can see your profile</p>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="public-profile"
                            checked={privacySettings.profileVisibility === 'public'}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            readOnly
                          />
                          <label htmlFor="public-profile" className="ml-2 text-sm font-medium text-gray-900">
                            Public
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Company Exclusions</h4>
                        <p className="text-sm text-gray-500 mb-3">Hide profile from specific companies</p>
                        {jobseekerProfile?.privacy_excluded_companies ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {jobseekerProfile.privacy_excluded_companies.split(',').filter(company => company.trim()).map((company, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                  {company.trim()}
                                </span>
                              ))}
                            </div>
                            <button className="text-blue-600 hover:underline text-sm font-medium">
                              Manage List
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm">
                            No companies excluded
                            <button className="text-blue-600 hover:underline text-sm font-medium ml-2">
                              Add Companies
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
        </div>
      ) : (
          // Employee profile content (keeping existing design for now)
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
              {!isEditing && (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <Input
                        value={editData.first_name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <Input
                        value={editData.last_name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <Input
                        value={editData.phone || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <Input
                        value={editData.location || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                    <Input
                      value={editData.linkedin_url || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={editData.bio || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">First Name</p>
                      <p className="font-medium">{profile?.first_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Name</p>
                      <p className="font-medium">{profile?.last_name || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile?.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium">{profile?.location || 'Not provided'}</p>
                  </div>
                  
                  {profile?.linkedin_url && (
                    <div>
                      <p className="text-sm text-gray-500">LinkedIn</p>
                      <a 
                        href={profile.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {profile.linkedin_url}
                      </a>
                    </div>
                  )}
                  
                  {profile?.bio && (
                    <div>
                      <p className="text-sm text-gray-500">Bio</p>
                      <p className="font-medium">{profile.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employee Profile */}
          {user?.role === 'employee' && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <Input
                        value={editEmployeeData.title || ''}
                        onChange={(e) => setEditEmployeeData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Your job title"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Badges</label>
                      <Input
                        value={editEmployeeData.badges || ''}
                        onChange={(e) => setEditEmployeeData(prev => ({ ...prev, badges: e.target.value }))}
                        placeholder="e.g., Senior Engineer, Team Lead"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Job Title</p>
                        <p className="font-medium">{employeeProfile?.title || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Badges</p>
                        <p className="font-medium">{employeeProfile?.badges || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Resume Viewer Modal */}
      <ResumeViewer
        resumeUrl={jobseekerProfile?.resume_url || (jobseekerProfile?.resume_key ? `${getApiBaseUrl()}/files/download?file_path=uploads/resumes/${jobseekerProfile.resume_key}` : undefined)}
        resumeFilename={jobseekerProfile?.resume_filename}
        isOpen={showResumeViewer}
        onClose={() => setShowResumeViewer(false)}
        onDownload={() => {
          if (!jobseekerProfile) return;
          
          const resumeUrl = jobseekerProfile.resume_url || 
            (jobseekerProfile.resume_key ? 
              `${getApiBaseUrl()}/files/download?file_path=uploads/resumes/${jobseekerProfile.resume_key}` : 
              undefined);
              
          if (resumeUrl) {
            // For S3 URLs, open in new tab for download
            if (resumeUrl.includes('amazonaws.com') || resumeUrl.includes('s3')) {
              window.open(resumeUrl, '_blank');
            } else {
              // For local URLs, use download link
              const link = document.createElement('a');
              link.href = resumeUrl;
              link.download = jobseekerProfile.resume_filename || 'resume.pdf';
              link.click();
            }
          }
        }}
      />
      </div>
    </div>
  )
}