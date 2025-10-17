import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Badge } from '../components/ui/Badge'
import { 
  profileAPI, 
  ProfileResponse, 
  EmployeeProfileResponse,
  ProfileUpdateData,
  EmployeeProfileUpdateData,
  VerificationStatus,
  verificationAPI,
  SendOTPData,
  VerifyOTPData,
  authAPI
} from '../lib/api'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Globe, 
  Building,
  Save, 
  Edit3, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Eye,
  Download,
  Camera,
  Award,
  Calendar,
  Users,
  TrendingUp,
  Gift,
  Bell,
  Settings,
  Shield,
  Clock,
  ExternalLink,
  Target,
  BarChart3,
  Briefcase
} from 'lucide-react'

interface EmployeeProfileData {
  // Basic profile info
  first_name: string
  last_name: string
  email: string
  phone?: string
  location?: string
  bio?: string
  linkedin_url?: string
  profile_picture?: string
  
  // Company info
  company_name?: string
  company_logo?: string
  company_industry?: string
  company_email?: string
  job_title?: string
  department?: string
  office_location?: string
  years_at_company?: number
  
  // Referral preferences
  referral_areas?: string[]
  notification_preferences?: {
    referral_requests: boolean
    status_updates: boolean
    weekly_summary: boolean
  }
  profile_visibility?: 'public' | 'company_only'
  compliance_acknowledged?: boolean
  
  // Referral metrics
  referral_stats?: {
    total_referrals: number
    successful_hires: number
    success_rate: number
    total_rewards: number
  }
}

export function EmployeeProfile() {
  const navigate = useNavigate()
  const { user, verificationStatus, refreshVerificationStatus } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Profile data
  const [profileData, setProfileData] = useState<EmployeeProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    linkedin_url: '',
    profile_picture: '',
    company_name: '',
    company_logo: '',
    company_industry: '',
    company_email: '',
    job_title: '',
    department: '',
    office_location: '',
    years_at_company: 0,
    referral_areas: [],
    notification_preferences: {
      referral_requests: true,
      status_updates: true,
      weekly_summary: false
    },
    profile_visibility: 'public',
    compliance_acknowledged: false,
    referral_stats: {
      total_referrals: 0,
      successful_hires: 0,
      success_rate: 0,
      total_rewards: 0
    }
  })
  
  // Edit states
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<EmployeeProfileData>>({})
  
  // Email verification states
  const [emailVerificationPending, setEmailVerificationPending] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)
  
  // New referral area input
  const [newReferralArea, setNewReferralArea] = useState('')

  useEffect(() => {
    // Redirect non-employees to the regular profile page
    if (user && user.role !== 'employee') {
      navigate('/profile', { replace: true })
      return
    }
    loadProfileData()
  }, [user, navigate])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load basic profile
      const profileResponse = await profileAPI.getProfile()
      const profile = profileResponse.data as ProfileResponse
      
      // Load employee profile
      let employeeProfile: EmployeeProfileResponse | null = null
      try {
        const empResponse = await profileAPI.getEmployeeProfile()
        employeeProfile = empResponse.data as EmployeeProfileResponse
      } catch (err) {
        console.log('No employee profile found, will create one')
      }
      
      // Load verification status
      let verification: VerificationStatus | null = null
      try {
        const verResponse = await verificationAPI.getStatus()
        verification = verResponse.data as VerificationStatus
      } catch (err) {
        console.log('No verification status found')
      }
      
      // Load referral stats (mock data for now)
      const mockStats = {
        total_referrals: 12,
        successful_hires: 8,
        success_rate: 67,
        total_rewards: 2400
      }
      
      // Load company data from localStorage (since backend doesn't support these fields)
      const savedCompanyData = localStorage.getItem('employee_company_data')
      let companyData: {
        company_industry?: string
        company_email?: string
        office_location?: string
        job_title?: string
        department?: string
        years_at_company?: number
      } = {}
      if (savedCompanyData) {
        try {
          companyData = JSON.parse(savedCompanyData)
          console.log('Loaded company data from localStorage:', companyData)
        } catch (err) {
          console.error('Failed to parse saved company data:', err)
        }
      }
      
      setProfileData({
        first_name: profile.first_name || 'Doddi Purna Gana Rama',
        last_name: profile.last_name || 'Krishna',
        email: profile.email,
        phone: profile.phone || '',
        location: profile.location || 'Chennai',
        bio: profile.bio || '',
        linkedin_url: profile.linkedin_url || '',
        profile_picture: profile.profile_picture || '',
        company_name: verification?.company_name || 'TechCorp Inc.',
        company_logo: '',
        company_industry: companyData.company_industry || 'Technology',
        company_email: companyData.company_email || profile.email || 'dineshase@gmail.com',
        job_title: companyData.job_title || employeeProfile?.title || '',
        department: companyData.department || '',
        office_location: companyData.office_location || profile.location || 'Chennai',
        years_at_company: companyData.years_at_company || 0,
        referral_areas: ['Product Management', 'UX Design', 'Engineering', 'Data Science'],
        notification_preferences: {
          referral_requests: true,
          status_updates: true,
          weekly_summary: false
        },
        profile_visibility: 'public',
        compliance_acknowledged: true,
        referral_stats: mockStats
      })
      
    } catch (err: any) {
      console.error('Failed to load profile data:', err)
      setError('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (section: string) => {
    console.log('handleEdit called for section:', section)
    console.log('Current profileData:', profileData)
    setEditingSection(section)
    // Initialize editData with current profile values
    const initialEditData = {
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      company_name: profileData.company_name,
      company_industry: profileData.company_industry,
      company_email: profileData.company_email,
      job_title: profileData.job_title,
      department: profileData.department,
      office_location: profileData.office_location,
      years_at_company: profileData.years_at_company,
      bio: profileData.bio,
      linkedin_url: profileData.linkedin_url,
      referral_areas: profileData.referral_areas,
      profile_visibility: profileData.profile_visibility,
      compliance_acknowledged: profileData.compliance_acknowledged,
      notification_preferences: profileData.notification_preferences
    }
    console.log('Setting editData to:', initialEditData)
    setEditData(initialEditData)
    setError(null)
    setSuccess(null)
  }

  const handleRefreshToken = async () => {
    try {
      setLoading(true)
      await authAPI.refreshToken()
      setSuccess('Token refreshed successfully! You can now save your changes.')
      // Reload profile data with new token
      await loadProfileData()
    } catch (error) {
      console.error('Token refresh failed:', error)
      setError('Failed to refresh token. Please log in again.')
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const isSaveDisabled = (section: string) => {
    if (saving) return true
    
    switch (section) {
      case 'basic-info':
        return !editData.first_name?.trim() || !editData.last_name?.trim()
      case 'company-info':
        return !editData.company_industry?.trim() || 
               !editData.company_email?.trim() || 
               !editData.office_location?.trim()
      case 'professional-info':
        return !editData.first_name?.trim() || !editData.last_name?.trim() || !editData.office_location?.trim() || !editData.bio?.trim()
      case 'referral-preferences':
        return false // No required fields
      case 'notification-settings':
        return false // No required fields
      default:
        return false
    }
  }

  const handleSave = async (section: string) => {
    try {
      setSaving(true)
      setError(null)
      
      // Validate required fields before saving
      if (section === 'basic-info') {
        if (!editData.first_name?.trim() || !editData.last_name?.trim()) {
          setError('First name and last name are required')
          setSaving(false)
          return
        }
      } else if (section === 'company-info') {
        if (!editData.company_industry?.trim() || !editData.company_email?.trim() || !editData.office_location?.trim()) {
          setError('Industry, email, and office location are required')
          setSaving(false)
          return
        }
      } else if (section === 'professional-info') {
        if (!editData.first_name?.trim() || !editData.last_name?.trim() || !editData.office_location?.trim() || !editData.bio?.trim()) {
          setError('First name, last name, location, and professional bio are required')
          setSaving(false)
          return
        }
      }
      
      if (section === 'basic-info') {
        await profileAPI.updateProfile(editData as ProfileUpdateData)
      } else if (section === 'company-info') {
        // Check if company information has changed (triggers re-verification)
        // Note: company_name is read-only, so we don't check it
        const companyChanged = editData.company_industry !== profileData.company_industry || 
                              editData.company_email !== profileData.company_email
        
        if (companyChanged) {
          // Handle company email change with re-verification
          if (editData.company_email && editData.company_email !== profileData.company_email) {
            await handleEmailChange(editData.company_email)
            return
          }
        }
        
        // Update employee profile with supported fields only
        const employeeUpdateData: EmployeeProfileUpdateData = {
          title: editData.job_title
        }
        await profileAPI.updateEmployeeProfile(employeeUpdateData)
        
        console.log('Employee profile API call completed - only title saved to database')
        console.log('Department and years_at_company are not supported by backend API - saving to localStorage only')
        
        // Update regular profile with basic fields only (API limitation)
        const profileUpdateData: ProfileUpdateData = {
          location: editData.office_location
        }
        await profileAPI.updateProfile(profileUpdateData)
        
        console.log('API calls completed - only location saved to database')
        console.log('Company fields (name, industry, email, department, years) are stored locally only - backend API does not support these fields')
        
        // Update local state with all company fields
        console.log('Updating profile data with editData:', editData)
        setProfileData(prev => {
          const updatedData = {
            ...prev,
            company_name: editData.company_name !== undefined ? editData.company_name : prev.company_name,
            company_industry: editData.company_industry !== undefined ? editData.company_industry : prev.company_industry,
            company_email: editData.company_email !== undefined ? editData.company_email : prev.company_email,
            office_location: editData.office_location !== undefined ? editData.office_location : prev.office_location,
            job_title: editData.job_title !== undefined ? editData.job_title : prev.job_title,
            department: editData.department !== undefined ? editData.department : prev.department,
            years_at_company: editData.years_at_company !== undefined ? editData.years_at_company : prev.years_at_company
          }
          console.log('Updated profile data:', updatedData)
          
          // Save company data to localStorage for persistence
          // Note: company_name is read-only, department and years_at_company are not supported by API
          const companyData = {
            company_industry: updatedData.company_industry,
            company_email: updatedData.company_email,
            office_location: updatedData.office_location,
            job_title: updatedData.job_title,
            department: updatedData.department,
            years_at_company: updatedData.years_at_company
          }
          localStorage.setItem('employee_company_data', JSON.stringify(companyData))
          console.log('Company data saved to localStorage:', companyData)
          
          return updatedData
        })
      } else if (section === 'professional-info') {
        // Update basic profile with name, location, and bio
        const profileUpdateData: ProfileUpdateData = {
          first_name: editData.first_name,
          last_name: editData.last_name,
          location: editData.office_location,
          bio: editData.bio,
          linkedin_url: editData.linkedin_url
        }
        await profileAPI.updateProfile(profileUpdateData)
      } else if (section === 'referral-preferences') {
        await profileAPI.updateEmployeeProfile(editData as EmployeeProfileUpdateData)
      }
      
      setSuccess(`${section.replace('-', ' ')} updated successfully`)
      setEditingSection(null)
      setEditData({})
      
      // Note: We don't need to reload profile data since we're updating local state manually
      
    } catch (err: any) {
      console.error('Failed to save profile:', err)
      setError('Failed to save profile changes')
    } finally {
      setSaving(false)
    }
  }

  const handleEmailChange = async (newEmail: string) => {
    try {
      setEmailVerificationPending(true)
      setError(null)
      
      // Send OTP to new email
      const otpData: SendOTPData = {
        company_id: verificationStatus?.company_id || 1,
        company_email: newEmail
      }
      
      await verificationAPI.sendOTP(otpData)
      setShowOtpModal(true)
      setEditData({ ...editData, company_email: newEmail })
      
    } catch (err: any) {
      console.error('Failed to send OTP:', err)
      setError('Failed to send verification code')
      setEmailVerificationPending(false)
    }
  }

  const handleOtpVerification = async () => {
    try {
      setError(null)
      
      const verifyData: VerifyOTPData = {
        company_id: verificationStatus?.company_id || 1,
        company_email: editData.company_email!,
        otp_code: otpCode
      }
      
      await verificationAPI.verifyOTP(verifyData)
      
      // Update profile with new email
      await profileAPI.updateEmployeeProfile({
        company_id: verificationStatus?.company_id
      })
      
      setShowOtpModal(false)
      setEmailVerificationPending(false)
      setSuccess('Email verified and updated successfully')
      setEditingSection(null)
      setEditData({})
      
      // Reload profile data
      await loadProfileData()
      await refreshVerificationStatus()
      
    } catch (err: any) {
      console.error('Failed to verify OTP:', err)
      setVerificationError('Invalid verification code')
    }
  }

  const handleCancel = () => {
    setEditingSection(null)
    setEditData({})
    setError(null)
    setSuccess(null)
  }

  const addReferralArea = () => {
    console.log('addReferralArea called with:', newReferralArea)
    console.log('Current editData.referral_areas:', editData.referral_areas)
    console.log('Current profileData.referral_areas:', profileData.referral_areas)
    
    if (newReferralArea.trim()) {
      const currentAreas = editData.referral_areas || profileData.referral_areas || []
      const newAreas = [...currentAreas, newReferralArea.trim()]
      console.log('New areas will be:', newAreas)
      
      setEditData({
        ...editData,
        referral_areas: newAreas
      })
      setNewReferralArea('')
    } else {
      console.log('newReferralArea is empty, not adding')
    }
  }

  const removeReferralArea = (area: string) => {
    console.log('removeReferralArea called with:', area)
    console.log('Current editData.referral_areas:', editData.referral_areas)
    
    const currentAreas = editData.referral_areas || profileData.referral_areas || []
    const filteredAreas = currentAreas.filter(a => a !== area)
    console.log('Filtered areas will be:', filteredAreas)
    
    setEditData({
      ...editData,
      referral_areas: filteredAreas
    })
  }

  // Don't render anything if user is not an employee (will be redirected)
  if (user && user.role !== 'employee') {
    return null
  }

  const getVerificationStatus = () => {
    console.log('Current verification status:', verificationStatus)
    if (!verificationStatus) return { status: 'unverified', color: 'red', text: 'Not Verified' }
    
    switch (verificationStatus.status) {
      case 'verified':
        return { status: 'verified', color: 'green', text: 'Verified Employee' }
      case 'pending_email':
        return { status: 'pending', color: 'yellow', text: 'Email Verification Pending' }
      case 'pending_id_card':
        return { status: 'pending', color: 'yellow', text: 'ID Verification Pending' }
      case 'rejected':
        return { status: 'rejected', color: 'red', text: 'Verification Rejected' }
      default:
        return { status: 'unverified', color: 'red', text: 'Not Verified' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const verificationInfo = getVerificationStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-200/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Header - View Only */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    {profileData.first_name} {profileData.last_name}
                  </h1>
                  <p className="text-blue-100 text-lg mb-2">
                    at {profileData.company_name}
                  </p>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{profileData.company_email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{profileData.office_location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{profileData.years_at_company} years at company</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 ml-8">
                <div className="text-right">
                  <div className="text-2xl font-bold">{profileData.referral_stats?.total_referrals || 0}</div>
                  <div className="text-blue-100 text-sm">Total Referrals</div>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Last active: Today</span>
                </div>
              </div>
              <Badge 
                className={`px-4 py-2 text-sm font-medium rounded-full ${
                  verificationInfo.color === 'green' 
                    ? 'bg-green-500 text-white' 
                    : verificationInfo.color === 'yellow'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {verificationInfo.text}
              </Badge>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
              {error.includes('Authentication error') && (
                <Button
                  onClick={handleRefreshToken}
                  disabled={loading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Refreshing...' : 'Refresh Token'}
                </Button>
              )}
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-12 space-y-6">

            {/* Company Information Section */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Company Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit('company-info')}
                    disabled={editingSection === 'company-info'}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingSection === 'company-info' ? (
                  <div className="space-y-6">
                    {/* Company Information - Requires Re-verification */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold text-amber-800 mb-1">Company Change Notice</h4>
                          <p className="text-sm text-amber-700">
                            Changing company information will require re-verification. You'll need to verify your new company email.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Company Name *
                        </label>
                        <div className="relative">
                          <Input
                            value={profileData.company_name}
                            readOnly
                            className="border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                        <p className="text-xs text-amber-600 mt-1 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Verified company name cannot be changed. Contact support for company changes.
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Industry *
                        </label>
                        <Input
                          value={editData.company_industry !== undefined ? editData.company_industry : profileData.company_industry}
                          onChange={(e) => setEditData({ ...editData, company_industry: e.target.value })}
                          placeholder="Industry"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Email *
                      </label>
                      <Input
                        value={editData.company_email !== undefined ? editData.company_email : profileData.company_email}
                        onChange={(e) => setEditData({ ...editData, company_email: e.target.value })}
                        placeholder="company@example.com"
                        type="email"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="text-sm text-amber-600 mt-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Changing company email will trigger re-verification process
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Office Location *
                      </label>
                      <Input
                        value={editData.office_location !== undefined ? editData.office_location : profileData.office_location}
                        onChange={(e) => setEditData({ ...editData, office_location: e.target.value })}
                        placeholder="Office location"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Additional Information - Optional Fields */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Information (Optional)</h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-2">
                            <p className="text-xs text-blue-700">
                              <strong>Job Title</strong> saves to database • <strong>Department & Years</strong> save locally
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Job Title
                          </label>
                          <Input
                            value={editData.job_title !== undefined ? editData.job_title : profileData.job_title || ''}
                            onChange={(e) => setEditData({ ...editData, job_title: e.target.value })}
                            placeholder="Job title (optional)"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Department
                          </label>
                          <Input
                            value={editData.department !== undefined ? editData.department : profileData.department || ''}
                            onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                            placeholder="Department (optional)"
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Years at Company
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={editData.years_at_company !== undefined ? editData.years_at_company : profileData.years_at_company || ''}
                          onChange={(e) => setEditData({ ...editData, years_at_company: parseInt(e.target.value) || 0 })}
                          placeholder="Years at company (optional)"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-4 border-t border-gray-100">
                      <Button 
                        onClick={() => handleSave('company-info')} 
                        disabled={isSaveDisabled('company-info')} 
                        className={`bg-blue-600 hover:bg-blue-700 ${isSaveDisabled('company-info') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="hover:bg-gray-50">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{profileData.company_name}</h3>
                        <p className="text-gray-600">{profileData.company_industry}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        <span className="text-green-600 text-sm font-medium">Email Verified</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600">{profileData.office_location}</span>
                      </div>
                    </div>
                    {(profileData.job_title || profileData.department || profileData.years_at_company) && (
                      <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          {profileData.job_title && (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-600">{profileData.job_title}</span>
                            </div>
                          )}
                          {profileData.department && (
                            <div className="flex items-center">
                              <Building className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-600">{profileData.department}</span>
                            </div>
                          )}
                          {profileData.years_at_company !== undefined && profileData.years_at_company > 0 && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-600">{profileData.years_at_company} years at company</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Professional Information Section */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Professional Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit('professional-info')}
                    disabled={editingSection === 'professional-info'}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingSection === 'professional-info' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name
                        </label>
                        <Input
                          value={editData.first_name !== undefined ? editData.first_name : profileData.first_name}
                          onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                          placeholder="First name"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name
                        </label>
                        <Input
                          value={editData.last_name !== undefined ? editData.last_name : profileData.last_name}
                          onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                          placeholder="Last name"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Location
                      </label>
                      <Input
                        value={editData.office_location !== undefined ? editData.office_location : profileData.office_location}
                        onChange={(e) => setEditData({ ...editData, office_location: e.target.value })}
                        placeholder="Your location"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Professional Bio
                      </label>
                      <Textarea
                        value={editData.bio !== undefined ? editData.bio : profileData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        placeholder="Tell us about your professional background, expertise, and what makes you unique..."
                        rows={4}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        LinkedIn URL
                      </label>
                      <Input
                        value={editData.linkedin_url !== undefined ? editData.linkedin_url : profileData.linkedin_url}
                        onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        type="url"
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Referral Areas
                      </label>
                      {/* Debug Info for Referral Areas */}
                      <div className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded text-xs">
                        <strong>Debug:</strong> newReferralArea: "{newReferralArea}" | 
                        editData.referral_areas: {JSON.stringify(editData.referral_areas)} | 
                        profileData.referral_areas: {JSON.stringify(profileData.referral_areas)}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(editData.referral_areas || profileData.referral_areas || []).map((area, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 border-blue-200">
                            {area}
                        <button
                          onClick={() => removeReferralArea(area)}
                          className="ml-2 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                          aria-label={`Remove ${area} from referral areas`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          value={newReferralArea}
                          onChange={(e) => {
                            console.log('newReferralArea input changed to:', e.target.value)
                            setNewReferralArea(e.target.value)
                          }}
                          placeholder="Add referral area..."
                          onKeyPress={(e) => {
                            console.log('Key pressed in referral area input:', e.key)
                            if (e.key === 'Enter') {
                              addReferralArea()
                            }
                          }}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <Button 
                          onClick={addReferralArea} 
                          size="sm"
                          aria-label="Add referral area"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex space-x-3 pt-4 border-t border-gray-100">
                      <Button 
                        onClick={() => handleSave('professional-info')} 
                        disabled={isSaveDisabled('professional-info')} 
                        className={`bg-blue-600 hover:bg-blue-700 ${isSaveDisabled('professional-info') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="hover:bg-gray-50">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Name</h4>
                        <p className="text-gray-600">{profileData.first_name} {profileData.last_name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                        <p className="text-gray-600">{profileData.office_location}</p>
                      </div>
                    </div>
                    {profileData.bio && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Professional Bio</h4>
                        <p className="text-gray-600">{profileData.bio}</p>
                      </div>
                    )}
                    {profileData.linkedin_url && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">LinkedIn</h4>
                        <a
                          href={profileData.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          {profileData.linkedin_url}
                          <ExternalLink className="w-4 h-4 ml-1" />
                        </a>
                      </div>
                    )}
                    {profileData.referral_areas && profileData.referral_areas.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Referral Areas</h4>
                        <div className="flex flex-wrap gap-2">
                          {profileData.referral_areas.map((area, index) => (
                            <Badge key={index} variant="secondary">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Referral Preferences Section */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Referral Preferences</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit('referral-preferences')}
                    disabled={editingSection === 'referral-preferences'}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingSection === 'referral-preferences' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Visibility
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="visibility"
                            value="public"
                            checked={(editData.profile_visibility || profileData.profile_visibility) === 'public'}
                            onChange={(e) => setEditData({ ...editData, profile_visibility: e.target.value as 'public' | 'company_only' })}
                            className="mr-2"
                          />
                          <span className="text-sm">Public to Platform</span>
                          <Badge className="ml-2 bg-green-100 text-green-800">Visible</Badge>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="visibility"
                            value="company_only"
                            checked={(editData.profile_visibility || profileData.profile_visibility) === 'company_only'}
                            onChange={(e) => setEditData({ ...editData, profile_visibility: e.target.value as 'public' | 'company_only' })}
                            className="mr-2"
                          />
                          <span className="text-sm">Company Only</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editData.compliance_acknowledged || profileData.compliance_acknowledged || false}
                          onChange={(e) => setEditData({ ...editData, compliance_acknowledged: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm">Referral guidelines acknowledged</span>
                        <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                      </label>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleSave('referral-preferences')} 
                        disabled={isSaveDisabled('referral-preferences')}
                        className={isSaveDisabled('referral-preferences') ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Preferred Referral Method</h4>
                      <p className="text-gray-600">Internal Portal + Email Notification</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Profile Visibility</h4>
                      <div className="flex items-center">
                        <span className="text-gray-600">Public to Platform</span>
                        <Badge className="ml-2 bg-green-100 text-green-800">Visible</Badge>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Compliance</h4>
                      <div className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-gray-600">Referral guidelines acknowledged</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Notification Settings */}
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Notification Settings</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit('notification-settings')}
                    disabled={editingSection === 'notification-settings'}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingSection === 'notification-settings' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Get notified of new opportunities</span>
                      <input
                        type="checkbox"
                        checked={editData.notification_preferences?.referral_requests ?? profileData.notification_preferences?.referral_requests ?? true}
                        onChange={(e) => {
                          const currentPrefs = editData.notification_preferences || profileData.notification_preferences || {
                            referral_requests: true,
                            status_updates: true,
                            weekly_summary: false
                          }
                          setEditData({
                            ...editData,
                            notification_preferences: {
                              referral_requests: e.target.checked,
                              status_updates: currentPrefs.status_updates,
                              weekly_summary: currentPrefs.weekly_summary
                            }
                          })
                        }}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Updates on referral progress</span>
                      <input
                        type="checkbox"
                        checked={editData.notification_preferences?.status_updates ?? profileData.notification_preferences?.status_updates ?? true}
                        onChange={(e) => {
                          const currentPrefs = editData.notification_preferences || profileData.notification_preferences || {
                            referral_requests: true,
                            status_updates: true,
                            weekly_summary: false
                          }
                          setEditData({
                            ...editData,
                            notification_preferences: {
                              referral_requests: currentPrefs.referral_requests,
                              status_updates: e.target.checked,
                              weekly_summary: currentPrefs.weekly_summary
                            }
                          })
                        }}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Weekly activity digest</span>
                      <input
                        type="checkbox"
                        checked={editData.notification_preferences?.weekly_summary ?? profileData.notification_preferences?.weekly_summary ?? false}
                        onChange={(e) => {
                          const currentPrefs = editData.notification_preferences || profileData.notification_preferences || {
                            referral_requests: true,
                            status_updates: true,
                            weekly_summary: false
                          }
                          setEditData({
                            ...editData,
                            notification_preferences: {
                              referral_requests: currentPrefs.referral_requests,
                              status_updates: currentPrefs.status_updates,
                              weekly_summary: e.target.checked
                            }
                          })
                        }}
                        className="rounded"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleSave('notification-settings')} 
                        disabled={isSaveDisabled('notification-settings')} 
                        size="sm"
                        className={isSaveDisabled('notification-settings') ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancel} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Get notified of new opportunities</span>
                      <div className={`w-10 h-6 rounded-full ${profileData.notification_preferences?.referral_requests ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 ${profileData.notification_preferences?.referral_requests ? 'right-1' : 'left-1'} transition-all`}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Updates on referral progress</span>
                      <div className={`w-10 h-6 rounded-full ${profileData.notification_preferences?.status_updates ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 ${profileData.notification_preferences?.status_updates ? 'right-1' : 'left-1'} transition-all`}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Weekly activity digest</span>
                      <div className={`w-10 h-6 rounded-full ${profileData.notification_preferences?.weekly_summary ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 ${profileData.notification_preferences?.weekly_summary ? 'right-1' : 'left-1'} transition-all`}></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-300">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics Dashboard
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-300">
                    <Users className="w-4 h-4 mr-2" />
                    Leaderboard
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-300">
                    <Plus className="w-4 h-4 mr-2" />
                    Make Referral
                  </Button>
                  <Button variant="outline" className="w-full justify-start hover:bg-purple-50 hover:border-purple-300">
                    <Eye className="w-4 h-4 mr-2" />
                    Public Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-modal-title"
        >
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle id="otp-modal-title">Verify New Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  We've sent a verification code to {editData.company_email}. Please enter it below.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <Input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    aria-label="Verification code"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
                {verificationError && (
                  <p className="text-sm text-red-600">{verificationError}</p>
                )}
                <div className="flex space-x-2">
                  <Button onClick={handleOtpVerification} disabled={!otpCode || saving} className="flex-1">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Verify
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowOtpModal(false)
                      setOtpCode('')
                      setVerificationError(null)
                      setEmailVerificationPending(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
