import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        console.log('Attempting token refresh with refresh token:', refreshToken ? 'exists' : 'missing')
        
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token: newRefreshToken } = response.data as { access_token: string; refresh_token: string }
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', newRefreshToken)
          
          console.log('Token refresh successful, retrying original request')

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } else {
          console.log('No refresh token available, redirecting to login')
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post('/auth/login', data),
  refreshToken: async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    })
    
    const { access_token, refresh_token: newRefreshToken } = response.data as { access_token: string; refresh_token: string }
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', newRefreshToken)
    
    return { access_token, refresh_token: newRefreshToken }
  },
  refresh: (data: RefreshData) => api.post('/auth/refresh', data),
  me: () => api.get('/auth/me'),
}

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: UpdateProfileData) => api.put('/users/me', data),
  getEmployeeProfile: () => api.get('/users/me/employee'),
  createEmployeeProfile: (data: CreateEmployeeProfileData) => api.post('/users/me/employee', data),
  updateEmployeeProfile: (data: UpdateEmployeeProfileData) => api.put('/users/me/employee', data),
  getJobSeekerProfile: () => api.get('/users/me/jobseeker'),
  createJobSeekerProfile: (data: CreateJobSeekerProfileData) => api.post('/users/me/jobseeker', data),
  updateJobSeekerProfile: (data: UpdateJobSeekerProfileData) => api.put('/users/me/jobseeker', data),
  getCompanies: () => api.get('/users/companies/'),
}

// Job API
export const jobAPI = {
  create: (data: CreateJobData) => api.post('/jobs/', data),
  search: (params: JobSearchParams) => api.get('/jobs/', { params }),
  getById: (id: number) => api.get(`/jobs/${id}`),
  update: (id: number, data: UpdateJobData) => api.put(`/jobs/${id}`, data),
  delete: (id: number) => api.delete(`/jobs/${id}`),
  getMyJobs: (params?: PaginationParams) => api.get('/jobs/my/jobs', { params }),
  getCompanyJobs: (companyId: number, params?: PaginationParams) => api.get(`/jobs/company/${companyId}`, { params }),
}

// Referral API
export const referralAPI = {
  create: (data: CreateReferralData) => api.post('/referrals/', data),
  search: (params: ReferralSearchParams) => api.get('/referrals/', { params }),
  getById: (id: number) => api.get(`/referrals/${id}`),
  update: (id: number, data: UpdateReferralData) => api.put(`/referrals/${id}`, data),
  getMyReferrals: (params?: PaginationParams) => api.get('/referrals/my/referrals', { params }),
  getReceivedReferrals: (params?: PaginationParams) => api.get('/referrals/my/received', { params }),
  getStats: () => api.get('/referrals/stats/overview'),
  getGlobalStats: () => api.get('/referrals/stats/global'),
}

// Search API
export const searchAPI = {
  search: (data: SearchRequestData) => api.post('/search/', data),
  searchWithParams: (params: SearchParams) => api.get('/search/', { params }),
  getSuggestions: (query: string) => api.get('/search/suggestions', { params: { query } }),
  getAnalytics: () => api.get('/search/analytics'),
  getPopular: (limit?: number) => api.get('/search/popular', { params: { limit } }),
}

// Notification API
export const notificationAPI = {
  getNotifications: (params?: NotificationParams) => api.get('/notifications/', { params }),
  getById: (id: number) => api.get(`/notifications/${id}`),
  update: (id: number, data: UpdateNotificationData) => api.put(`/notifications/${id}`, data),
  markAllRead: () => api.post('/notifications/mark-all-read'),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: NotificationPreferencesData) => api.put('/notifications/preferences', data),
  getStats: () => api.get('/notifications/stats/overview'),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: (params?: AnalyticsParams) => api.get('/analytics/dashboard', { params }),
  getReferralAnalytics: (params?: AnalyticsParams) => api.get('/analytics/referrals', { params }),
  getJobAnalytics: (params?: AnalyticsParams) => api.get('/analytics/jobs', { params }),
  getUserAnalytics: (params?: AnalyticsParams) => api.get('/analytics/users', { params }),
  getCompanyAnalytics: (params?: AnalyticsParams) => api.get('/analytics/companies', { params }),
  getLeaderboard: (type: string, limit?: number) => api.get(`/analytics/leaderboard/${type}`, { params: { limit } }),
  getTrends: (metric: string, params?: AnalyticsParams) => api.get(`/analytics/trends/${metric}`, { params }),
  getMyStats: (params?: AnalyticsParams) => api.get('/analytics/my/stats', { params }),
}

// Trust API
export const trustAPI = {
  getMyScore: () => api.get('/trust/my/score'),
  calculateScore: () => api.post('/trust/my/score/calculate'),
  getAnalysis: () => api.get('/trust/my/analysis'),
  getFraudAlerts: () => api.get('/trust/my/fraud-alerts'),
  getUserScore: (userId: number) => api.get(`/trust/user/${userId}/score`),
  getMetrics: () => api.get('/trust/metrics'),
  getAllFraudAlerts: (params?: FraudAlertParams) => api.get('/trust/fraud-alerts', { params }),
  resolveFraudAlert: (alertId: number, resolution: string) => api.post(`/trust/fraud-alerts/${alertId}/resolve`, null, { params: { resolution } }),
}

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profile/me'),
  updateProfile: (data: ProfileUpdateData) => api.put('/profile/me', data),
  getJobSeekerProfile: () => api.get('/profile/me/jobseeker'),
  updateJobSeekerProfile: (data: JobSeekerProfileUpdateData) => api.put('/profile/me/jobseeker', data),
  getEmployeeProfile: () => api.get('/profile/me/employee'),
  updateEmployeeProfile: (data: EmployeeProfileUpdateData) => api.put('/profile/me/employee', data),
  uploadResume: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/profile/me/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  getProfileCompletion: () => api.get('/profile/me/completion'),
  
  // Experience API
  getExperience: () => api.get<ExperienceResponse[]>('/profile/me/experience'),
  createExperience: (data: ExperienceData) => api.post<ExperienceResponse>('/profile/me/experience', data),
  updateExperience: (id: string, data: ExperienceData) => api.put<ExperienceResponse>(`/profile/me/experience/${id}`, data),
  deleteExperience: (id: string) => api.delete(`/profile/me/experience/${id}`),
  
  // Education API
  getEducation: () => api.get<EducationResponse[]>('/profile/me/education'),
  createEducation: (data: EducationData) => api.post<EducationResponse>('/profile/me/education', data),
  updateEducation: (id: string, data: EducationData) => api.put<EducationResponse>(`/profile/me/education/${id}`, data),
  deleteEducation: (id: string) => api.delete(`/profile/me/education/${id}`),
  
  // Certifications API
  getCertifications: () => api.get<CertificationResponse[]>('/profile/me/certifications'),
  createCertification: (data: CertificationData) => api.post<CertificationResponse>('/profile/me/certifications', data),
  updateCertification: (id: string, data: CertificationData) => api.put<CertificationResponse>(`/profile/me/certifications/${id}`, data),
  deleteCertification: (id: string) => api.delete(`/profile/me/certifications/${id}`),
}

// Verification API
export const verificationAPI = {
  // Company verification
  getVerifiedCompanies: (query?: string) => api.get<{ companies: VerifiedCompany[] }>('/verification/companies', { params: { query } }),
  
  // Email verification
  sendOTP: (data: SendOTPData) => api.post<{ success: boolean; message: string; expires_at: string; service_used: string }>('/verification/send-otp', data),
  verifyOTP: (data: VerifyOTPData) => api.post<{ success: boolean; message: string; verification_id?: number }>('/verification/verify-otp', data),

  // ID card verification
  uploadIDCard: (data: UploadIDCardData) => {
    const formData = new FormData()
    formData.append('selfie', data.selfie)
    formData.append('id_card', data.idCard)
    if (data.notes) formData.append('notes', data.notes)
    return api.post<{ success: boolean; message: string; verification_id: number }>('/verification/upload-id-card', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Verification status
  getStatus: () => api.get<VerificationStatus>('/verification/status'),
  updateStatus: (data: UpdateVerificationStatusData) => api.put<{ message: string }>('/verification/status', data),
  
  // Admin verification management
  getPendingVerifications: (params?: PaginationParams) => api.get('/verification/admin/pending', { params }),
  approveVerification: (verificationId: number, data: ApproveVerificationData) => 
    api.post(`/verification/admin/${verificationId}/approve`, data),
  rejectVerification: (verificationId: number, data: RejectVerificationData) => 
    api.post(`/verification/admin/${verificationId}/reject`, data),
}

// Dashboard API
export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getRecommendations: (limit?: number) => api.get('/dashboard/recommendations', { params: { limit } }),
  getActivityFeed: (limit?: number) => api.get('/dashboard/activity', { params: { limit } }),
  createActivity: (data: CreateActivityData) => api.post('/dashboard/activity', data),
  getSavedSearches: () => api.get('/dashboard/saved-searches'),
  createSavedSearch: (data: CreateSavedSearchData) => api.post('/dashboard/saved-searches', data),
  getProfileCompletion: () => api.get('/dashboard/profile-completion'),
  getStats: () => api.get('/dashboard/stats'),
  getJobSeekerDashboard: () => api.get('/dashboard/jobseeker'),
  getEmployeeDashboard: () => api.get('/dashboard/employee'),
  getAdminDashboard: () => api.get('/dashboard/admin'),
  markActivityRead: (activityId: number) => api.post(`/dashboard/mark-activity-read/${activityId}`),
  markAllActivitiesRead: () => api.post('/dashboard/mark-all-activities-read'),
}

// Type definitions
export interface User {
  id: number
  email: string
  first_name?: string
  last_name?: string
  role: 'employee' | 'jobseeker' | 'admin'
  is_email_verified: boolean
  is_active: boolean
  mfa_enabled: boolean
  created_at: string
  updated_at: string
}

export interface RegisterData {
  first_name: string
  last_name: string
  email: string
  password: string
  role: 'employee' | 'jobseeker' | 'admin'
  company_domain?: string
  verification?: {
    method: 'email' | 'id_card'
    company_id: number
    company_name: string
    company_domain: string
    company_email: string
  }
}

export interface LoginData {
  email: string
  password: string
}

export interface RefreshData {
  refresh_token: string
}

export interface UpdateProfileData {
  is_email_verified?: boolean
  is_active?: boolean
  mfa_enabled?: boolean
}

export interface CreateEmployeeProfileData {
  company_domain: string
  title?: string
  badges?: string
}

export interface UpdateEmployeeProfileData {
  title?: string
  badges?: string
  company_id?: number
}

// Verification types
export interface VerificationStatus {
  status: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
  method?: 'email' | 'id_card'
  company_id?: number
  company_name?: string
  company_domain?: string
  verified_at?: string
  expires_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface VerifiedCompany {
  id: number
  name: string
  domain: string
  industry?: string
  size?: string
  verified: boolean
  created_at: string
}

export interface SendOTPData {
  company_id: number
  company_email: string
}

export interface VerifyOTPData {
  company_id: number
  company_email: string
  otp_code: string
}

export interface UploadIDCardData {
  selfie: File
  idCard: File
  notes?: string
}

export interface UpdateVerificationStatusData {
  status: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
  method?: 'email' | 'id_card'
  company_id?: number
}

export interface ApproveVerificationData {
  notes?: string
}

export interface RejectVerificationData {
  reason: string
  notes?: string
}

export interface PendingVerification {
  id: number
  user_id: number
  user_name: string
  user_email: string
  method: 'id_card'
  status: 'pending_id_card'
  selfie_url: string
  id_card_url: string
  notes?: string
  submitted_at: string
  company_name?: string
}

export interface CreateJobSeekerProfileData {
  skills?: string
  years_experience?: number
  current_company?: string
  privacy_excluded_companies?: string
  trust_score?: number
}

export interface UpdateJobSeekerProfileData {
  skills?: string
  years_experience?: number
  current_company?: string
  privacy_excluded_companies?: string
  trust_score?: number
}

export interface CreateJobData {
  title: string
  description: string
  location?: string
  employment_type?: string
  skills?: string
  min_experience?: number
  company_domain: string
}

export interface UpdateJobData {
  title?: string
  description?: string
  location?: string
  employment_type?: string
  skills?: string
  min_experience?: number
  is_active?: boolean
}

export interface JobSearchParams {
  query?: string
  location?: string
  employment_type?: string
  skills?: string[]
  min_experience?: number
  company_id?: number
  is_active?: boolean
  page?: number
  size?: number
}

export interface CreateReferralData {
  job_id: number
  seeker_email: string
  notes?: string
}

export interface UpdateReferralData {
  status?: string
  notes?: string
}

export interface ReferralSearchParams {
  job_id?: number
  seeker_id?: number
  employee_id?: number
  status?: string
  query?: string
  page?: number
  size?: number
}

export interface SearchRequestData {
  query: string
  search_type: 'all' | 'jobs' | 'users' | 'referrals'
  filters?: {
    location?: string
    employment_type?: string
    min_experience?: number
    skills?: string[]
  }
  page?: number
  size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface SearchParams {
  query: string
  search_type?: string
  location?: string
  employment_type?: string
  min_experience?: number
  skills?: string
  page?: number
  size?: number
  sort_by?: string
  sort_order?: string
}

export interface NotificationParams {
  skip?: number
  limit?: number
  unread_only?: boolean
  notification_type?: string
}

export interface UpdateNotificationData {
  is_read?: boolean
  is_archived?: boolean
}

export interface NotificationPreferencesData {
  email_notifications: boolean
  in_app_notifications: boolean
  sms_notifications: boolean
  push_notifications: boolean
  referral_notifications: boolean
  job_notifications: boolean
  system_notifications: boolean
}

export interface AnalyticsParams {
  time_range?: string
  company_id?: number
  user_id?: number
  start_date?: string
  end_date?: string
}

export interface FraudAlertParams {
  status?: string
  risk_level?: string
}

export interface PaginationParams {
  skip?: number
  limit?: number
}

export interface CreateActivityData {
  activity_type: string
  title: string
  description: string
  status?: string
  action_url?: string
}

export interface CreateSavedSearchData {
  name: string
  query: string
  filters?: Record<string, any>
}

// Profile types
export interface ProfileUpdateData {
  first_name?: string
  last_name?: string
  phone?: string
  linkedin_url?: string
  bio?: string
  location?: string
  website?: string
  // Company information fields
  company_name?: string
  company_industry?: string
  company_email?: string
  office_location?: string
  department?: string
  years_at_company?: number
}

export interface JobSeekerProfileUpdateData {
  skills?: string
  years_experience?: number
  current_company?: string
  privacy_excluded_companies?: string
}

export interface EmployeeProfileUpdateData {
  title?: string
  badges?: string
  company_id?: number
}

// Verification types
export interface VerificationStatus {
  status: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
  method?: 'email' | 'id_card'
  company_id?: number
  company_name?: string
  company_domain?: string
  verified_at?: string
  expires_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface VerifiedCompany {
  id: number
  name: string
  domain: string
  industry?: string
  size?: string
  verified: boolean
  created_at: string
}

export interface SendOTPData {
  company_id: number
  company_email: string
}

export interface VerifyOTPData {
  company_id: number
  company_email: string
  otp_code: string
}

export interface UploadIDCardData {
  selfie: File
  idCard: File
  notes?: string
}

export interface UpdateVerificationStatusData {
  status: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
  method?: 'email' | 'id_card'
  company_id?: number
}

export interface ApproveVerificationData {
  notes?: string
}

export interface RejectVerificationData {
  reason: string
  notes?: string
}

export interface PendingVerification {
  id: number
  user_id: number
  user_name: string
  user_email: string
  method: 'id_card'
  status: 'pending_id_card'
  selfie_url: string
  id_card_url: string
  notes?: string
  submitted_at: string
  company_name?: string
}

export interface ProfileResponse {
  id: number
  email: string
  role: string
  first_name?: string
  last_name?: string
  phone?: string
  linkedin_url?: string
  profile_picture?: string
  bio?: string
  location?: string
  website?: string
  is_email_verified: boolean
  is_active: boolean
  // Company information fields
  company_name?: string
  company_industry?: string
  company_email?: string
  office_location?: string
  department?: string
  years_at_company?: number
}

export interface JobSeekerProfileResponse {
  user_id: number
  skills?: string
  years_experience?: number
  current_company?: string
  privacy_excluded_companies?: string
  trust_score: number
  resume_filename?: string
}

export interface EmployeeProfileResponse {
  user_id: number
  title?: string
  badges?: string
  company_id?: number
}

// Verification types
export interface VerificationStatus {
  status: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
  method?: 'email' | 'id_card'
  company_id?: number
  company_name?: string
  company_domain?: string
  verified_at?: string
  expires_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface VerifiedCompany {
  id: number
  name: string
  domain: string
  industry?: string
  size?: string
  verified: boolean
  created_at: string
}

export interface SendOTPData {
  company_id: number
  company_email: string
}

export interface VerifyOTPData {
  company_id: number
  company_email: string
  otp_code: string
}

export interface UploadIDCardData {
  selfie: File
  idCard: File
  notes?: string
}

export interface UpdateVerificationStatusData {
  status: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
  method?: 'email' | 'id_card'
  company_id?: number
}

export interface ApproveVerificationData {
  notes?: string
}

export interface RejectVerificationData {
  reason: string
  notes?: string
}

export interface PendingVerification {
  id: number
  user_id: number
  user_name: string
  user_email: string
  method: 'id_card'
  status: 'pending_id_card'
  selfie_url: string
  id_card_url: string
  notes?: string
  submitted_at: string
  company_name?: string
}

export interface ProfileCompletionResponse {
  basic_info_completion: number
  jobseeker_completion: number
  employee_completion: number
  overall_completion: number
  missing_fields: string[]
  is_complete: boolean
}

// Experience types
export interface ExperienceData {
  id?: string
  title: string
  company: string
  start_date: string
  end_date: string | null
  description: string | null
  current: boolean
}

export interface ExperienceResponse {
  id: number
  title: string
  company: string
  start_date: string
  end_date: string | null
  description: string | null
  current: boolean
  user_id: number
  created_at: string
  updated_at: string
}

// Education types
export interface EducationData {
  id?: string
  degree: string
  school: string
  start_date: string
  end_date: string
  description: string | null
}

export interface EducationResponse {
  id: number
  degree: string
  school: string
  start_date: string
  end_date: string
  description: string | null
  user_id: number
  created_at: string
  updated_at: string
}

// Certifications types
export interface CertificationData {
  id?: string
  name: string
  issuer: string
  date: string
  credential_id?: string | null
}

export interface CertificationResponse {
  id: number
  name: string
  issuer: string
  date: string
  credential_id: string | null
  user_id: number
  created_at: string
  updated_at: string
}

export interface ProfileUpdateData {
  first_name?: string
  last_name?: string
  phone?: string
  linkedin_url?: string
  bio?: string
  location?: string
  website?: string
  // Company information fields
  company_name?: string
  company_industry?: string
  company_email?: string
  office_location?: string
  department?: string
  years_at_company?: number
}

export interface JobSeekerProfileUpdateData {
  skills?: string
  years_experience?: number
  current_company?: string
  privacy_excluded_companies?: string
}

export interface EmployeeProfileUpdateData {
  title?: string
  badges?: string
  company_id?: number
}

// Verification types
export interface VerificationStatus {
  status: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
  method?: 'email' | 'id_card'
  company_id?: number
  company_name?: string
  company_domain?: string
  verified_at?: string
  expires_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface VerifiedCompany {
  id: number
  name: string
  domain: string
  industry?: string
  size?: string
  verified: boolean
  created_at: string
}

export interface SendOTPData {
  company_id: number
  company_email: string
}

export interface VerifyOTPData {
  company_id: number
  company_email: string
  otp_code: string
}

export interface UploadIDCardData {
  selfie: File
  idCard: File
  notes?: string
}

export interface UpdateVerificationStatusData {
  status: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
  method?: 'email' | 'id_card'
  company_id?: number
}

export interface ApproveVerificationData {
  notes?: string
}

export interface RejectVerificationData {
  reason: string
  notes?: string
}

export interface PendingVerification {
  id: number
  user_id: number
  user_name: string
  user_email: string
  method: 'id_card'
  status: 'pending_id_card'
  selfie_url: string
  id_card_url: string
  notes?: string
  submitted_at: string
  company_name?: string
}

