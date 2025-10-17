from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, validator
from enum import Enum


class ReferralRequestStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    withdrawn = "withdrawn"


class ReferralRequestPriority(str, Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class ReferralRequestOutcome(str, Enum):
    hired = "hired"
    interviewed = "interviewed"
    rejected = "rejected"
    no_response = "no_response"


# Request schemas
class ReferralRequestCreate(BaseModel):
    job_id: int
    jobseeker_name: str = Field(..., min_length=1, max_length=200)
    jobseeker_email: EmailStr
    jobseeker_phone: Optional[str] = Field(None, max_length=20)
    linkedin_url: Optional[str] = Field(None, max_length=500)
    personal_note: Optional[str] = Field(None, max_length=2000)
    priority: ReferralRequestPriority = ReferralRequestPriority.normal
    
    @validator('linkedin_url')
    def validate_linkedin_url(cls, v):
        if v and not v.startswith(('http://', 'https://')):
            v = f'https://{v}'
        return v


class ReferralRequestUpdate(BaseModel):
    status: Optional[ReferralRequestStatus] = None
    employee_response: Optional[str] = Field(None, max_length=2000)
    employee_notes: Optional[str] = Field(None, max_length=2000)
    priority: Optional[ReferralRequestPriority] = None
    outcome: Optional[ReferralRequestOutcome] = None


class ReferralRequestResponse(BaseModel):
    id: int
    job_id: int
    employee_id: int
    jobseeker_id: int
    jobseeker_name: str
    jobseeker_email: str
    jobseeker_phone: Optional[str]
    linkedin_url: Optional[str]
    resume_filename: Optional[str]
    personal_note: Optional[str]
    status: str
    priority: str
    employee_response: Optional[str]
    employee_notes: Optional[str]
    responded_at: Optional[datetime]
    viewed_by_employee: bool
    viewed_at: Optional[datetime]
    last_activity: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ReferralRequestList(BaseModel):
    id: int
    job_id: int
    job_title: str
    company_name: str
    jobseeker_name: str
    jobseeker_email: str
    status: str
    priority: str
    created_at: datetime
    viewed_by_employee: bool
    resume_filename: Optional[str]
    personal_note: Optional[str]
    
    class Config:
        from_attributes = True


class ReferralRequestDetail(ReferralRequestResponse):
    job_title: str
    company_name: str
    employee_name: str
    employee_email: str
    request_metadata: Optional[Dict[str, Any]]
    response_time_hours: Optional[float]
    outcome: Optional[str]


class ReferralRequestStats(BaseModel):
    total_requests: int
    pending_requests: int
    accepted_requests: int
    declined_requests: int
    response_rate: float
    average_response_time_hours: Optional[float]
    success_rate: float


class ReferralRequestNotification(BaseModel):
    request_id: int
    job_title: str
    company_name: str
    jobseeker_name: str
    priority: str
    created_at: datetime
    is_urgent: bool = False
