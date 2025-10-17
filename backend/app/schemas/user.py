from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

from app.models.user import UserRole


class UserProfileBase(BaseModel):
    email: EmailStr
    is_email_verified: bool = False
    is_active: bool = True


class UserProfileUpdate(BaseModel):
    is_email_verified: Optional[bool] = None
    is_active: Optional[bool] = None


class UserProfileResponse(UserProfileBase):
    id: int
    role: UserRole
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeProfileBase(BaseModel):
    title: Optional[str] = None
    badges: Optional[str] = None


class EmployeeProfileCreate(EmployeeProfileBase):
    company_domain: str


class EmployeeProfileUpdate(EmployeeProfileBase):
    company_id: Optional[int] = None


class EmployeeProfileResponse(EmployeeProfileBase):
    id: int
    user_id: int
    company_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobSeekerProfileBase(BaseModel):
    skills: Optional[str] = None
    years_experience: Optional[int] = None
    current_company: Optional[str] = None
    privacy_excluded_companies: Optional[str] = None


class JobSeekerProfileCreate(JobSeekerProfileBase):
    pass


class JobSeekerProfileUpdate(JobSeekerProfileBase):
    trust_score: Optional[int] = None


class JobSeekerProfileResponse(JobSeekerProfileBase):
    id: int
    user_id: int
    trust_score: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompanyBase(BaseModel):
    name: str
    domain: str


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    id: int
    email: str
    role: UserRole
    is_email_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserDetailResponse(UserListResponse):
    employee_profile: Optional[EmployeeProfileResponse] = None
    job_seeker_profile: Optional[JobSeekerProfileResponse] = None
    # company: Optional[CompanyResponse] = None  # Commented out for now
