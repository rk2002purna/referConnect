from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class ReferralStatus(str, Enum):
    pending = "pending"
    submitted = "submitted"
    under_review = "under_review"
    interview_scheduled = "interview_scheduled"
    hired = "hired"
    rejected = "rejected"
    withdrawn = "withdrawn"


class ReferralBase(BaseModel):
    notes: Optional[str] = Field(None, max_length=2000)


class ReferralCreate(ReferralBase):
    job_id: int
    seeker_email: str = Field(..., description="Email of the job seeker being referred")


class ReferralUpdate(BaseModel):
    status: Optional[ReferralStatus] = None
    notes: Optional[str] = Field(None, max_length=2000)


class ReferralResponse(ReferralBase):
    id: int
    job_id: int
    seeker_id: int
    employee_id: int
    status: ReferralStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReferralDetailResponse(ReferralResponse):
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    seeker_name: Optional[str] = None
    seeker_email: Optional[str] = None
    employee_name: Optional[str] = None
    employee_title: Optional[str] = None


class ReferralSearchParams(BaseModel):
    status: Optional[ReferralStatus] = None
    job_id: Optional[int] = None
    seeker_id: Optional[int] = None
    employee_id: Optional[int] = None
    company_id: Optional[int] = None
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)


class ReferralListResponse(BaseModel):
    referrals: List[ReferralDetailResponse]
    total: int
    page: int
    size: int
    pages: int


class ReferralStatsResponse(BaseModel):
    total_referrals: int
    pending_referrals: int
    submitted_referrals: int
    hired_referrals: int
    success_rate: float
    recent_referrals: List[ReferralDetailResponse]
