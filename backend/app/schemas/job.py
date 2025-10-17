from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class EmploymentType(str, Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"
    temporary = "temporary"


class JobBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    location: Optional[str] = Field(None, max_length=200)
    employment_type: Optional[EmploymentType] = None
    skills: Optional[str] = Field(None, max_length=1000)
    min_experience: Optional[int] = Field(None, ge=0, le=50)


class JobCreate(JobBase):
    company_domain: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    location: Optional[str] = Field(None, max_length=200)
    employment_type: Optional[EmploymentType] = None
    skills: Optional[str] = Field(None, max_length=1000)
    min_experience: Optional[int] = Field(None, ge=0, le=50)
    is_active: Optional[bool] = None


class JobResponse(JobBase):
    id: int
    company_id: int
    posted_by_employee_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobDetailResponse(JobResponse):
    company_name: Optional[str] = None
    posted_by_name: Optional[str] = None
    posted_by_title: Optional[str] = None


class JobSearchParams(BaseModel):
    query: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    min_experience: Optional[int] = Field(None, ge=0, le=50)
    skills: Optional[List[str]] = None
    company_id: Optional[int] = None
    is_active: bool = True
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)


class JobListResponse(BaseModel):
    jobs: List[JobDetailResponse]
    total: int
    page: int
    size: int
    pages: int
