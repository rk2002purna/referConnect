from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class JobType(str, Enum):
    FULL_TIME = "full-time"
    PART_TIME = "part-time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"

class ExperienceLevel(str, Enum):
    ENTRY = "entry"
    MID = "mid"
    SENIOR = "senior"
    EXECUTIVE = "executive"

class JobPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Job title")
    company: str = Field(..., min_length=1, max_length=255, description="Company name")
    location: str = Field(..., min_length=1, max_length=255, description="Job location")
    job_type: JobType = Field(..., description="Type of employment")
    salary_min: Optional[int] = Field(None, ge=0, description="Minimum salary")
    salary_max: Optional[int] = Field(None, ge=0, description="Maximum salary")
    currency: str = Field(default="USD", max_length=3, description="Currency code")
    description: str = Field(..., min_length=10, description="Job description")
    requirements: Optional[str] = Field(None, description="Job requirements")
    benefits: Optional[str] = Field(None, description="Benefits and perks")
    skills_required: List[str] = Field(default=[], description="Required skills")
    experience_level: ExperienceLevel = Field(..., description="Experience level required")
    remote_work: bool = Field(default=False, description="Remote work available")
    application_deadline: Optional[datetime] = Field(None, description="Application deadline")
    contact_email: str = Field(..., description="Contact email for applications")
    department: Optional[str] = Field(None, max_length=255, description="Department")
    job_link: Optional[str] = Field(None, max_length=500, description="Direct link to job posting")
    max_applicants: Optional[int] = Field(None, ge=1, description="Maximum number of applicants allowed")

    @validator('salary_max')
    def validate_salary_range(cls, v, values):
        if v is not None and 'salary_min' in values and values['salary_min'] is not None:
            if v < values['salary_min']:
                raise ValueError('Maximum salary must be greater than or equal to minimum salary')
        return v

    @validator('application_deadline')
    def validate_deadline(cls, v):
        if v is not None and v <= datetime.now():
            raise ValueError('Application deadline must be in the future')
        return v

class JobPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    company: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = Field(None, min_length=1, max_length=255)
    job_type: Optional[JobType] = None
    salary_min: Optional[int] = Field(None, ge=0)
    salary_max: Optional[int] = Field(None, ge=0)
    currency: Optional[str] = Field(None, max_length=3)
    description: Optional[str] = Field(None, min_length=10)
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    skills_required: Optional[List[str]] = None
    experience_level: Optional[ExperienceLevel] = None
    remote_work: Optional[bool] = None
    application_deadline: Optional[datetime] = None
    contact_email: Optional[str] = None
    department: Optional[str] = Field(None, max_length=255)
    job_link: Optional[str] = Field(None, max_length=500)
    max_applicants: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None

class JobPostResponse(BaseModel):
    id: int
    title: str
    company: str
    location: str
    job_type: JobType
    salary_min: Optional[int]
    salary_max: Optional[int]
    currency: str
    description: str
    requirements: Optional[str]
    benefits: Optional[str]
    skills_required: List[str]
    experience_level: ExperienceLevel
    remote_work: bool
    application_deadline: Optional[datetime]
    contact_email: str
    department: Optional[str]
    job_link: Optional[str]
    max_applicants: Optional[int]
    is_active: bool
    views: int
    applications_count: int
    created_at: datetime
    updated_at: datetime
    posted_by: int  # user_id of the employee who posted

    class Config:
        from_attributes = True

class JobPostListResponse(BaseModel):
    jobs: List[JobPostResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

