// Import step components
import BasicInfoStep from '../components/onboarding/BasicInfoStep'
import SkillsExperienceStep from '../components/onboarding/SkillsExperienceStep'
import LocationPreferencesStep from '../components/onboarding/LocationPreferencesStep'
import AdditionalInfoStep from '../components/onboarding/AdditionalInfoStep'
import CompanyInfoStep from '../components/onboarding/CompanyInfoStep'
import ReferralPreferencesStep from '../components/onboarding/ReferralPreferencesStep'

// Import verification components
import { VerificationMethodSelectionWrapper } from '../components/verification/VerificationMethodSelectionWrapper'
import { CompanySearchStepWrapper } from '../components/verification/CompanySearchStepWrapper'
import { CompanyEmailStepWrapper } from '../components/verification/CompanyEmailStepWrapper'
import { OTPVerificationStepWrapper } from '../components/verification/OTPVerificationStepWrapper'
import { IDCardUploadStepWrapper } from '../components/verification/IDCardUploadStepWrapper'

// Onboarding and Profile Types

export interface OnboardingData {
  // Basic Info (Step 1)
  first_name: string
  last_name: string
  email: string
  phone?: string
  phone_country_code?: string
  location?: string
  bio?: string
  
  // Verification Info (for employees)
  verification?: {
    method?: 'email' | 'id_card'
    company_id?: number
    company_name?: string
    company_domain?: string
    personal_email?: string
    company_email?: string
    status?: 'pending_email' | 'pending_id_card' | 'verified' | 'rejected' | 'expired'
    otp_code?: string
    uploaded_files?: {
      selfie?: File
      id_card?: File
    }
  }
  
  // Job Seeker Specific (Steps 2-4)
  jobseeker?: {
    skills?: string[]
    years_experience?: number
    current_company?: string
    current_job_title?: string
    education?: string
    certifications?: string[]
    preferred_job_types?: string[]
    salary_expectation?: {
      min: number
      max: number
      currency: string
    }
    notice_period?: number
    availability?: string
    industries?: string[]
    willing_to_relocate?: boolean
    work_authorization?: string
    languages?: Array<{ language: string; level: string }>
    portfolio_url?: string
    linkedin_url?: string
    github_url?: string
    resume_filename?: string
    resume_url?: string
    resume_key?: string
    privacy_excluded_companies?: string[]
  }
  
  // Employee Specific (Steps 2-3)
  employee?: {
    job_title?: string
    department?: string
    years_at_company?: number
    office_location?: string
    skills_areas?: string[]
    referral_preferences?: {
      method: 'email' | 'ats' | 'manual'
      guidelines?: string
    }
    bio?: string
    notification_preferences?: {
      email: boolean
      in_app: boolean
      sms: boolean
      referral_updates: boolean
      job_updates: boolean
    }
  }
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  component: React.ComponentType<OnboardingStepProps>
  isRequired: boolean
  validation?: (data: OnboardingData) => string[]
}

export interface OnboardingStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
  errors: string[]
  onNext: () => void
  onPrevious: () => void
  onSkip?: () => void
  isFirstStep: boolean
  isLastStep: boolean
  // Verification-specific props (optional for compatibility)
  onSelectMethod?: (method: 'email' | 'id_card') => void
  onCompanySelect?: (company: any) => void
  onVerificationComplete?: (success: boolean) => void
  onUploadComplete?: (files: { selfie: File; idCard: File }) => void
  onResendOTP?: () => Promise<void>
  companyEmail?: string
  companyId?: number
}

export interface ProfileCompletionStatus {
  basic_info_completion: number
  jobseeker_completion: number
  employee_completion: number
  overall_completion: number
  missing_fields: string[]
  is_complete: boolean
}

// Job Seeker Onboarding Steps
export const JOB_SEEKER_STEPS: OnboardingStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Tell us about yourself',
    component: BasicInfoStep,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (!data.first_name.trim()) errors.push('First name is required')
      if (!data.last_name.trim()) errors.push('Last name is required')
      // Email is pre-populated from registration, no validation needed
      return errors
    }
  },
  {
    id: 'skills-experience',
    title: 'Skills & Experience',
    description: 'Help us understand your background',
    component: SkillsExperienceStep,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (!data.jobseeker?.skills?.length) errors.push('At least one skill is required')
      if (!data.jobseeker?.years_experience) errors.push('Years of experience is required')
      return errors
    }
  },
  {
    id: 'location-preferences',
    title: 'Location & Preferences',
    description: 'Where would you like to work?',
    component: LocationPreferencesStep,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (!data.location?.trim()) errors.push('Location is required')
      if (!data.jobseeker?.preferred_job_types?.length) errors.push('At least one job type preference is required')
      return errors
    }
  },
  {
    id: 'additional-info',
    title: 'Additional Information',
    description: 'Optional details to improve your profile',
    component: AdditionalInfoStep,
    isRequired: false
  }
]

// Employee Onboarding Steps
export const EMPLOYEE_STEPS: OnboardingStep[] = [
  {
    id: 'basic-info',
    title: 'Basic Information',
    description: 'Tell us about yourself',
    component: BasicInfoStep,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (!data.first_name.trim()) errors.push('First name is required')
      if (!data.last_name.trim()) errors.push('Last name is required')
      // Email is pre-populated from registration, no validation needed
      return errors
    }
  },
  {
    id: 'verification-method',
    title: 'Verification Method',
    description: 'Choose how to verify your employee status',
    component: VerificationMethodSelectionWrapper,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (!data.verification?.method) errors.push('Please select a verification method')
      return errors
    }
  },
  {
    id: 'company-search',
    title: 'Company Search',
    description: 'Find and select your company',
    component: CompanySearchStepWrapper,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (!data.verification?.company_id) errors.push('Please select your company')
      return errors
    }
  },
  {
    id: 'company-email',
    title: 'Company Email',
    description: 'Enter your company email address',
    component: CompanyEmailStepWrapper,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (data.verification?.method === 'email') {
        if (!data.verification?.personal_email) {
          errors.push('Personal email is required')
        }
        if (!data.verification?.company_email) {
          errors.push('Company email is required')
        }
      }
      return errors
    }
  },
  {
    id: 'otp-verification',
    title: 'Email Verification',
    description: 'Verify your company email address',
    component: OTPVerificationStepWrapper,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (data.verification?.method === 'email' && !data.verification?.otp_code) {
        errors.push('Please enter the verification code')
      }
      return errors
    }
  },
  {
    id: 'id-card-upload',
    title: 'ID Card Upload',
    description: 'Upload your company ID card for verification',
    component: IDCardUploadStepWrapper,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (data.verification?.method === 'id_card') {
        if (!data.verification?.uploaded_files?.selfie) {
          errors.push('Please upload a selfie photo')
        }
        if (!data.verification?.uploaded_files?.id_card) {
          errors.push('Please upload your company ID card')
        }
      }
      return errors
    }
  },
  {
    id: 'company-info',
    title: 'Company Information',
    description: 'Tell us about your role and company',
    component: CompanyInfoStep,
    isRequired: true,
    validation: (data) => {
      const errors: string[] = []
      if (!data.employee?.job_title?.trim()) errors.push('Job title is required')
      if (!data.employee?.years_at_company) errors.push('Years at company is required')
      return errors
    }
  },
  {
    id: 'referral-preferences',
    title: 'Referral Preferences',
    description: 'How would you like to help with referrals?',
    component: ReferralPreferencesStep,
    isRequired: false
  }
]
