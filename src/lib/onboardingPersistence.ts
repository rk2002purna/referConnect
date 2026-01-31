import { OnboardingData } from '../types/onboarding'
import { profileAPI } from './api'

// Storage keys
const ONBOARDING_DATA_KEY = 'onboarding_data'
const ONBOARDING_STEP_KEY = 'onboarding_current_step'
const ONBOARDING_COMPLETED_STEPS_KEY = 'onboarding_completed_steps'

/**
 * Save onboarding data to localStorage
 */
export const saveOnboardingData = (data: OnboardingData): void => {
  try {
    localStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(data))
    console.log('Onboarding data saved to localStorage:', data)
  } catch (error) {
    console.error('Failed to save onboarding data to localStorage:', error)
  }
}

/**
 * Load onboarding data from localStorage
 */
export const loadOnboardingData = (): OnboardingData | null => {
  try {
    const data = localStorage.getItem(ONBOARDING_DATA_KEY)
    if (data) {
      const parsedData = JSON.parse(data)
      console.log('Onboarding data loaded from localStorage:', parsedData)
      return parsedData
    }
    return null
  } catch (error) {
    console.error('Failed to load onboarding data from localStorage:', error)
    return null
  }
}

/**
 * Save current step index
 */
export const saveCurrentStep = (stepIndex: number): void => {
  try {
    localStorage.setItem(ONBOARDING_STEP_KEY, stepIndex.toString())
    console.log('Current step saved:', stepIndex)
  } catch (error) {
    console.error('Failed to save current step:', error)
  }
}

/**
 * Load current step index
 */
export const loadCurrentStep = (): number => {
  try {
    const step = localStorage.getItem(ONBOARDING_STEP_KEY)
    const stepIndex = step ? parseInt(step, 10) : 0
    console.log('Current step loaded:', stepIndex)
    return stepIndex
  } catch (error) {
    console.error('Failed to load current step:', error)
    return 0
  }
}

/**
 * Save completed steps
 */
export const saveCompletedSteps = (completedSteps: string[]): void => {
  try {
    localStorage.setItem(ONBOARDING_COMPLETED_STEPS_KEY, JSON.stringify(completedSteps))
    console.log('Completed steps saved:', completedSteps)
  } catch (error) {
    console.error('Failed to save completed steps:', error)
  }
}

/**
 * Load completed steps
 */
export const loadCompletedSteps = (): string[] => {
  try {
    const steps = localStorage.getItem(ONBOARDING_COMPLETED_STEPS_KEY)
    const completedSteps = steps ? JSON.parse(steps) : []
    console.log('Completed steps loaded:', completedSteps)
    return completedSteps
  } catch (error) {
    console.error('Failed to load completed steps:', error)
    return []
  }
}

/**
 * Clear all onboarding data
 */
export const clearOnboardingData = (): void => {
  try {
    localStorage.removeItem(ONBOARDING_DATA_KEY)
    localStorage.removeItem(ONBOARDING_STEP_KEY)
    localStorage.removeItem(ONBOARDING_COMPLETED_STEPS_KEY)
    console.log('Onboarding data cleared from localStorage')
  } catch (error) {
    console.error('Failed to clear onboarding data:', error)
  }
}

/**
 * Save data to backend API based on user role
 */
export const saveOnboardingDataToAPI = async (data: OnboardingData, role: 'jobseeker' | 'employee'): Promise<boolean> => {
  try {
    console.log(`Saving onboarding data to API for ${role}:`, data)
    
    if (role === 'jobseeker' && data.jobseeker) {
      // Save jobseeker profile data
      const jobseekerData = {
        skills: data.jobseeker.skills?.join(',') || '',
        years_experience: data.jobseeker.years_experience,
        current_company: data.jobseeker.current_company || '',
        current_job_title: data.jobseeker.current_job_title || '',
        education: data.jobseeker.education || '',
        certifications: data.jobseeker.certifications?.join(',') || '',
        preferred_job_types: data.jobseeker.preferred_job_types?.join(',') || '',
        salary_expectation_min: data.jobseeker.salary_expectation?.min,
        salary_expectation_max: data.jobseeker.salary_expectation?.max,
        salary_currency: data.jobseeker.salary_expectation?.currency,
        notice_period: data.jobseeker.notice_period,
        availability: data.jobseeker.availability || '',
        industries: data.jobseeker.industries?.join(',') || '',
        willing_to_relocate: data.jobseeker.willing_to_relocate,
        work_authorization: data.jobseeker.work_authorization || '',
        languages: data.jobseeker.languages?.join(',') || '',
        portfolio_url: data.jobseeker.portfolio_url || '',
        linkedin_url: data.jobseeker.linkedin_url || '',
        github_url: data.jobseeker.github_url || '',
        privacy_excluded_companies: data.jobseeker.privacy_excluded_companies?.join(',') || ''
      }
      
      await profileAPI.updateJobSeekerProfile(jobseekerData)
      console.log('Jobseeker profile data saved to API')
    }
    
    if (role === 'employee' && data.employee) {
      // Save employee profile data
      const employeeData = {
        title: data.employee.job_title || '',
        badges: data.employee.skills_areas?.join(',') || '',
        department: data.employee.department || '',
        office_location: data.employee.office_location || '',
        years_at_company: data.employee.years_at_company?.toString() || ''
      }
      
      await profileAPI.updateEmployeeProfile(employeeData)
      console.log('Employee profile data saved to API')
    }
    
    // Save basic profile data
    const profileData = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      phone_country_code: data.phone_country_code,
      location: data.location,
      bio: data.bio,
      linkedin_url: data.jobseeker?.linkedin_url || data.employee?.bio,
      website: data.jobseeker?.portfolio_url
    }
    
    await profileAPI.updateProfile(profileData)
    console.log('Basic profile data saved to API')
    
    return true
  } catch (error) {
    console.error('Failed to save onboarding data to API:', error)
    return false
  }
}

/**
 * Load data from backend API
 */
export const loadOnboardingDataFromAPI = async (role: 'jobseeker' | 'employee'): Promise<OnboardingData | null> => {
  try {
    console.log(`Loading onboarding data from API for ${role}`)
    
    const profileResponse = await profileAPI.getProfile()
    const profileData = profileResponse.data
    
    let jobseekerData = null
    let employeeData = null
    
    if (role === 'jobseeker') {
      try {
        const jobseekerResponse = await profileAPI.getJobSeekerProfile()
        jobseekerData = jobseekerResponse.data
      } catch (error) {
        console.log('No jobseeker profile found, creating new one')
      }
    }
    
    if (role === 'employee') {
      try {
        const employeeResponse = await profileAPI.getEmployeeProfile()
        employeeData = employeeResponse.data
      } catch (error) {
        console.log('No employee profile found, creating new one')
      }
    }
    
    const data: OnboardingData = {
      first_name: (profileData as any).first_name || '',
      last_name: (profileData as any).last_name || '',
      email: (profileData as any).email || '',
      phone: (profileData as any).phone || '',
      phone_country_code: (profileData as any).phone_country_code || '',
      location: (profileData as any).location || '',
      bio: (profileData as any).bio || '',
      jobseeker: jobseekerData ? {
        skills: (jobseekerData as any).skills ? (jobseekerData as any).skills.split(',').map((s: string) => s.trim()) : [],
        years_experience: (jobseekerData as any).years_experience,
        current_company: (jobseekerData as any).current_company || '',
        current_job_title: (jobseekerData as any).current_job_title || '',
        education: (jobseekerData as any).education || '',
        certifications: (jobseekerData as any).certifications ? (jobseekerData as any).certifications.split(',').map((s: string) => s.trim()) : [],
        preferred_job_types: (jobseekerData as any).preferred_job_types ? (jobseekerData as any).preferred_job_types.split(',').map((s: string) => s.trim()) : [],
        salary_expectation: (jobseekerData as any).salary_expectation_min && (jobseekerData as any).salary_expectation_max ? {
          min: (jobseekerData as any).salary_expectation_min,
          max: (jobseekerData as any).salary_expectation_max,
          currency: (jobseekerData as any).salary_currency || 'USD'
        } : undefined,
        notice_period: (jobseekerData as any).notice_period,
        availability: (jobseekerData as any).availability || '',
        industries: (jobseekerData as any).industries ? (jobseekerData as any).industries.split(',').map((s: string) => s.trim()) : [],
        willing_to_relocate: (jobseekerData as any).willing_to_relocate,
        work_authorization: (jobseekerData as any).work_authorization || '',
        languages: (jobseekerData as any).languages ? (jobseekerData as any).languages.split(',').map((s: string) => s.trim()) : [],
        portfolio_url: (jobseekerData as any).portfolio_url || '',
        linkedin_url: (jobseekerData as any).linkedin_url || '',
        github_url: (jobseekerData as any).github_url || '',
        privacy_excluded_companies: (jobseekerData as any).privacy_excluded_companies ? (jobseekerData as any).privacy_excluded_companies.split(',').map((s: string) => s.trim()) : []
      } : {
        skills: [],
        preferred_job_types: [],
        industries: [],
        languages: [],
        certifications: [],
        privacy_excluded_companies: []
      },
      employee: employeeData ? {
        job_title: (employeeData as any).title || '',
        department: (employeeData as any).department || '',
        years_at_company: (employeeData as any).years_at_company ? parseInt((employeeData as any).years_at_company, 10) : 0,
        office_location: (employeeData as any).office_location || '',
        skills_areas: (employeeData as any).badges ? (employeeData as any).badges.split(',').map((s: string) => s.trim()) : [],
        referral_preferences: (employeeData as any).referral_preferences,
        bio: (employeeData as any).bio || '',
        notification_preferences: (employeeData as any).notification_preferences
      } : {
        skills_areas: [],
        referral_preferences: {
          method: 'email'
        },
        notification_preferences: {
          email: true,
          in_app: true,
          sms: false,
          referral_updates: true,
          job_updates: false
        }
      }
    }
    
    console.log('Onboarding data loaded from API:', data)
    return data
  } catch (error) {
    console.error('Failed to load onboarding data from API:', error)
    return null
  }
}