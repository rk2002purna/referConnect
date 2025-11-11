from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy.orm import Mapped

from .base import TimestampedModel


class UserRole(str, Enum):
    employee = "employee"
    jobseeker = "jobseeker"
    admin = "admin"


class User(TimestampedModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True, nullable=False)
    email_domain: str = Field(index=True, nullable=False)
    is_email_verified: bool = Field(default=False, nullable=False)
    is_active: bool = Field(default=True, nullable=False)
    role: UserRole = Field(nullable=False, index=True)

    # Security
    hashed_password: str = Field(nullable=False)
    mfa_enabled: bool = Field(default=False, nullable=False)
    
    # Profile fields
    first_name: Optional[str] = Field(default=None, nullable=True)
    last_name: Optional[str] = Field(default=None, nullable=True)
    phone: Optional[str] = Field(default=None, nullable=True)
    phone_country_code: Optional[str] = Field(default='+91', nullable=True, sa_column_kwargs={'server_default': '+91'})
    linkedin_url: Optional[str] = Field(default=None, nullable=True)
    profile_picture: Optional[str] = Field(default=None, nullable=True)
    bio: Optional[str] = Field(default=None, nullable=True)
    location: Optional[str] = Field(default=None, nullable=True)
    website: Optional[str] = Field(default=None, nullable=True)
    
    # Resume fields
    resume_filename: Optional[str] = Field(default=None, nullable=True)
    resume_url: Optional[str] = Field(default=None, nullable=True)
    resume_key: Optional[str] = Field(default=None, nullable=True)

    # Links - using simple relationships for now
    # employee_profile: Optional["Employee"] = Relationship(back_populates="user")
    # jobseeker_profile: Optional["JobSeeker"] = Relationship(back_populates="user")
    
    # Dashboard relationships
    # job_recommendations: List["JobRecommendation"] = Relationship(back_populates="user")
    # activity_feed: List["ActivityFeed"] = Relationship(back_populates="user")
    # saved_searches: List["SavedSearch"] = Relationship(back_populates="user")
    # profile_completion: Optional["UserProfileCompletion"] = Relationship(back_populates="user")
    # dashboard_stats: List["DashboardStats"] = Relationship(back_populates="user")


class Company(SQLModel, table=True):
    __tablename__ = "companies"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    domain: str = Field(index=True, unique=True)


class Employee(TimestampedModel, table=True):
    __tablename__ = "employees"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    company_id: Optional[int] = Field(default=None, foreign_key="companies.id", index=True)
    title: Optional[str] = Field(default=None)
    badges: Optional[str] = Field(default=None, description="CSV of badges")

    # user: User = Relationship(back_populates="employee_profile")


class JobSeeker(TimestampedModel, table=True):
    __tablename__ = "job_seekers"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    
    # Basic Info
    skills: Optional[str] = Field(default=None, description="Comma-separated skills")
    years_experience: Optional[int] = Field(default=None)
    current_company: Optional[str] = Field(default=None, max_length=255)
    current_job_title: Optional[str] = Field(default=None, max_length=255)
    education: Optional[str] = Field(default=None, max_length=500)
    certifications: Optional[str] = Field(default=None, description="Comma-separated certifications")
    
    # Job Preferences
    preferred_job_types: Optional[str] = Field(default=None, description="Comma-separated job types")
    salary_expectation_min: Optional[int] = Field(default=None)
    salary_expectation_max: Optional[int] = Field(default=None)
    salary_currency: Optional[str] = Field(default=None, max_length=10)
    notice_period: Optional[int] = Field(default=None)
    availability: Optional[str] = Field(default=None, max_length=100)
    industries: Optional[str] = Field(default=None, description="Comma-separated industries")
    willing_to_relocate: Optional[bool] = Field(default=None)
    work_authorization: Optional[str] = Field(default=None, max_length=100)
    
    # Languages
    languages: Optional[str] = Field(default=None, description="JSON string of languages and levels")
    
    # Portfolio & Links
    portfolio_url: Optional[str] = Field(default=None, max_length=500)
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    github_url: Optional[str] = Field(default=None, max_length=500)
    
    # Resume
    resume_filename: Optional[str] = Field(default=None, max_length=255)
    resume_path: Optional[str] = Field(default=None, max_length=500)
    
    # Privacy
    privacy_excluded_companies: Optional[str] = Field(default=None, description="Comma-separated company names")
    
    # Trust & Scoring
    trust_score: int = Field(default=0)

    # user: User = Relationship(back_populates="jobseeker_profile")


class Job(TimestampedModel, table=True):
    __tablename__ = "jobs"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, max_length=255)
    description: str
    location: str = Field(max_length=255)
    employment_type: str = Field(max_length=50)  # full-time, part-time, contract, internship
    skills: Optional[str] = Field(default=None)  # TEXT field for skills
    min_experience: Optional[int] = Field(default=None)
    company_id: int = Field(foreign_key="companies.id", index=True)
    employee_id: int = Field(foreign_key="employees.id", index=True)
    is_active: bool = Field(default=True, index=True)
    job_link: Optional[str] = Field(default=None, max_length=500)


class ReferralStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    submitted = "submitted"  # referred to ATS
    hired = "hired"
    rejected = "rejected"


class Experience(TimestampedModel, table=True):
    __tablename__ = "experiences"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    title: str = Field(max_length=255)
    company: str = Field(max_length=255)
    start_date: str = Field(max_length=7)  # YYYY-MM format
    end_date: Optional[str] = Field(default=None, max_length=7)
    description: Optional[str] = Field(default=None)
    current: bool = Field(default=False)


class Education(TimestampedModel, table=True):
    __tablename__ = "educations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    degree: str = Field(max_length=255)
    school: str = Field(max_length=255)
    start_date: str = Field(max_length=7)  # YYYY-MM format
    end_date: str = Field(max_length=7)
    description: Optional[str] = Field(default=None)


class Certification(TimestampedModel, table=True):
    __tablename__ = "certifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=255)
    issuer: str = Field(max_length=255)
    date: str = Field(max_length=7)  # YYYY-MM format
    credential_id: Optional[str] = Field(default=None, max_length=255)


class ReferralStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    submitted = "submitted"  # referred to ATS
    hired = "hired"
    rejected = "rejected"


class Referral(TimestampedModel, table=True):
    __tablename__ = "referrals"

    id: Optional[int] = Field(default=None, primary_key=True)
    job_id: int = Field(foreign_key="jobs.id", index=True)
    seeker_id: int = Field(foreign_key="job_seekers.id", index=True)
    employee_id: int = Field(foreign_key="employees.id", index=True)
    status: ReferralStatus = Field(default=ReferralStatus.pending, index=True)
    notes: Optional[str] = Field(default=None)


