from typing import Optional, Dict, Any
from datetime import datetime
from sqlmodel import Field, SQLModel, Column, JSON
from app.models.base import TimestampedModel


class ReferralRequest(TimestampedModel, table=True):
    __tablename__ = "referral_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Job and Employee info
    job_id: int = Field(index=True, foreign_key="jobs.id")
    employee_id: int = Field(index=True, foreign_key="users.id")
    
    # Job Seeker info
    jobseeker_id: int = Field(index=True, foreign_key="users.id")
    jobseeker_name: str = Field(max_length=200)
    jobseeker_email: str = Field(max_length=255, index=True)
    jobseeker_phone: Optional[str] = Field(default=None, max_length=20)
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    
    # Resume handling
    resume_filename: Optional[str] = Field(default=None, max_length=255)
    resume_file_path: Optional[str] = Field(default=None, max_length=500)
    resume_file_size: Optional[int] = Field(default=None)
    resume_mime_type: Optional[str] = Field(default=None, max_length=100)
    
    # Request details
    personal_note: Optional[str] = Field(default=None, max_length=2000)
    status: str = Field(default="pending", max_length=20, index=True)  # pending, accepted, declined, withdrawn
    priority: str = Field(default="normal", max_length=20)  # low, normal, high, urgent
    
    # Employee response
    employee_response: Optional[str] = Field(default=None, max_length=2000)
    employee_notes: Optional[str] = Field(default=None, max_length=2000)
    responded_at: Optional[datetime] = Field(default=None)
    
    # Additional metadata
    request_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Tracking
    viewed_by_employee: bool = Field(default=False)
    viewed_at: Optional[datetime] = Field(default=None)
    last_activity: Optional[datetime] = Field(default=None)
    
    # Notifications
    notification_sent: bool = Field(default=False)
    notification_sent_at: Optional[datetime] = Field(default=None)
    reminder_sent: bool = Field(default=False)
    reminder_sent_at: Optional[datetime] = Field(default=None)
    
    # Analytics
    response_time_hours: Optional[float] = Field(default=None)
    outcome: Optional[str] = Field(default=None, max_length=50)  # hired, interviewed, rejected, no_response
