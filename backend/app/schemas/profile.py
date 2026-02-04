from typing import Optional, List, Union, Dict, Any
from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
from datetime import datetime


class ProfileUpdateRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    phone_country_code: Optional[str] = None
    linkedin_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    
    @field_validator('linkedin_url', 'website')
    @classmethod
    def validate_urls(cls, v):
        if v == "" or v is None:
            return None
        return v


class JobSeekerProfileUpdateRequest(BaseModel):
    # Basic Info
    skills: Optional[str] = None
    years_experience: Optional[int] = None
    current_company: Optional[str] = None
    current_job_title: Optional[str] = None
    education: Optional[str] = None
    certifications: Optional[str] = None
    
    # Job Preferences
    preferred_job_types: Optional[str] = None
    salary_expectation_min: Optional[int] = None
    salary_expectation_max: Optional[int] = None
    salary_currency: Optional[str] = None
    notice_period: Optional[int] = None
    availability: Optional[str] = None
    industries: Optional[str] = None
    willing_to_relocate: Optional[bool] = None
    work_authorization: Optional[str] = None
    
    # Languages
    languages: Optional[str] = None
    
    # Portfolio & Links
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    
    # Privacy
    privacy_excluded_companies: Optional[str] = None


# Enhanced Employee Profile Schemas
class CompanyInfo(BaseModel):
    id: int
    name: str
    domain: str
    industry: Optional[str] = None
    size: Optional[str] = None
    logo_url: Optional[str] = None
    location: Optional[str] = None


class EmployeeCompanyDetails(BaseModel):
    company: CompanyInfo
    job_title: str
    department: Optional[str] = None
    office_location: Optional[str] = None
    years_at_company: Optional[str] = None
    start_date: Optional[datetime] = None


class ReferralPreference(BaseModel):
    roles: List[str] = []
    preferred_method: str = "platform_portal"  # platform_portal, direct_ats, email_intro
    notification_preferences: Dict[str, bool] = {
        "new_referral_requests": True,
        "referral_status_updates": True,
        "weekly_activity_summary": False
    }


class PrivacySettings(BaseModel):
    profile_visibility: str = "all_users"  # all_users, company_only, private
    show_contact_info: bool = True
    show_referral_history: bool = True


class ComplianceSettings(BaseModel):
    referral_guidelines_acknowledged: bool = False
    data_processing_consent: bool = False
    marketing_consent: bool = False


class ProfileMetrics(BaseModel):
    total_referrals: int = 0
    successful_hires: int = 0
    success_rate: float = 0.0
    rewards_earned: float = 0.0
    profile_completion: int = 0
    last_activity: Optional[datetime] = None


class EmployeeProfileResponse(BaseModel):
    # Basic user info
    user_id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    phone: Optional[str] = None
    phone_country_code: Optional[str] = None
    location: Optional[str] = None
    
    # Company details
    company_details: Optional[EmployeeCompanyDetails] = None
    
    # Verification status
    is_email_verified: bool = False
    verification_status: str = "pending"  # pending, verified, rejected, expired
    last_verified: Optional[datetime] = None
    
    # Referral preferences
    referral_preferences: ReferralPreference = ReferralPreference()
    
    # Privacy settings
    privacy_settings: PrivacySettings = PrivacySettings()
    
    # Compliance
    compliance_settings: ComplianceSettings = ComplianceSettings()
    
    # Metrics
    metrics: ProfileMetrics = ProfileMetrics()
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


class EmployeeProfileUpdateRequest(BaseModel):
    # Basic info
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    phone: Optional[str] = None
    phone_country_code: Optional[str] = None
    location: Optional[str] = None
    profile_picture: Optional[str] = None
    
    # Company details
    job_title: Optional[str] = None
    department: Optional[str] = None
    office_location: Optional[str] = None
    years_at_company: Optional[str] = None
    
    # Email change (triggers re-verification)
    company_email: Optional[EmailStr] = None
    
    # Referral preferences
    referral_roles: Optional[List[str]] = None
    preferred_referral_method: Optional[str] = None
    notification_preferences: Optional[Dict[str, bool]] = None
    
    # Privacy settings
    profile_visibility: Optional[str] = None
    show_contact_info: Optional[bool] = None
    show_referral_history: Optional[bool] = None
    
    # Compliance
    referral_guidelines_acknowledged: Optional[bool] = None
    data_processing_consent: Optional[bool] = None
    marketing_consent: Optional[bool] = None


class ProfilePictureUploadResponse(BaseModel):
    profile_picture_url: str
    message: str


class EmailVerificationRequest(BaseModel):
    company_email: EmailStr
    company_id: int


class EmailVerificationResponse(BaseModel):
    message: str
    verification_required: bool
    otp_sent: bool


class ProfileResponse(BaseModel):
    id: int
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    phone_country_code: Optional[str] = None
    linkedin_url: Optional[str] = None
    profile_picture: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    is_email_verified: bool
    is_active: bool
    resume_filename: Optional[str] = None
    resume_url: Optional[str] = None
    resume_key: Optional[str] = None


class JobSeekerProfileResponse(BaseModel):
    user_id: int
    skills: Optional[str] = None
    years_experience: Optional[int] = None
    current_company: Optional[str] = None
    current_job_title: Optional[str] = None
    education: Optional[str] = None
    certifications: Optional[str] = None
    preferred_job_types: Optional[str] = None
    salary_expectation_min: Optional[int] = None
    salary_expectation_max: Optional[int] = None
    salary_currency: Optional[str] = None
    notice_period: Optional[int] = None
    availability: Optional[str] = None
    industries: Optional[str] = None
    willing_to_relocate: Optional[bool] = None
    work_authorization: Optional[str] = None
    languages: Optional[str] = None
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    privacy_excluded_companies: Optional[str] = None
    trust_score: int
    resume_filename: Optional[str] = None
    resume_url: Optional[str] = None
    resume_key: Optional[str] = None


class PublicJobSeekerProfileResponse(BaseModel):
    profile: ProfileResponse
    jobseeker_profile: Optional[JobSeekerProfileResponse] = None


class LegacyEmployeeProfileResponse(BaseModel):
    user_id: int
    title: Optional[str] = None
    badges: Optional[str] = None
    company_id: Optional[int] = None


class ProfileCompletionResponse(BaseModel):
    basic_info_completion: int  # percentage
    jobseeker_completion: int   # percentage (if jobseeker)
    employee_completion: int    # percentage (if employee)
    overall_completion: int     # percentage
    missing_fields: List[str]
    is_complete: bool = False   # whether onboarding is complete


class ResumeUploadResponse(BaseModel):
    filename: str
    path: str
    size: int
    uploaded_at: str


# Experience schemas
class ExperienceCreate(BaseModel):
    title: str
    company: str
    start_date: str
    end_date: Optional[str] = None
    description: Optional[str] = None
    current: bool = False


class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    current: Optional[bool] = None


class ExperienceResponse(BaseModel):
    id: int
    user_id: int
    title: str
    company: str
    start_date: str
    end_date: Optional[str] = None
    description: Optional[str] = None
    current: bool
    created_at: str
    updated_at: str


# Education schemas
class EducationCreate(BaseModel):
    degree: str
    school: str
    start_date: str
    end_date: str
    description: Optional[str] = None


class EducationUpdate(BaseModel):
    degree: Optional[str] = None
    school: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None


class EducationResponse(BaseModel):
    id: int
    user_id: int
    degree: str
    school: str
    start_date: str
    end_date: str
    description: Optional[str] = None
    created_at: str
    updated_at: str


# Certification schemas
class CertificationCreate(BaseModel):
    name: str
    issuer: str
    date: str
    credential_id: Optional[str] = None


class CertificationUpdate(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None
    date: Optional[str] = None
    credential_id: Optional[str] = None


class CertificationResponse(BaseModel):
    id: int
    user_id: int
    name: str
    issuer: str
    date: str
    credential_id: Optional[str] = None
    created_at: str
    updated_at: str
