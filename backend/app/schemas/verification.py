from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


class VerifiedCompanyBase(BaseModel):
    name: str
    domain: str
    industry: Optional[str] = None
    size: Optional[str] = None
    verified: bool = True


class VerifiedCompanyCreate(VerifiedCompanyBase):
    pass


class VerifiedCompanyUpdate(VerifiedCompanyBase):
    pass


class VerifiedCompany(VerifiedCompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CompanySearchResponse(BaseModel):
    companies: List[VerifiedCompany]


# OTP Verification Schemas
class SendOTPRequest(BaseModel):
    company_id: int
    company_email: EmailStr

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    expires_at: datetime
    service_used: str

class VerifyOTPRequest(BaseModel):
    company_id: int
    company_email: EmailStr
    otp_code: str

class VerifyOTPResponse(BaseModel):
    success: bool
    message: str
    verification_id: Optional[int] = None


class UploadIDCardRequest(BaseModel):
    company_id: int
    notes: Optional[str] = None


class UploadIDCardResponse(BaseModel):
    success: bool
    message: str
    verification_id: int


class VerificationStatusResponse(BaseModel):
    status: str
    method: Optional[str] = None
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    company_domain: Optional[str] = None
    verified_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UpdateVerificationStatusRequest(BaseModel):
    status: str
    method: Optional[str] = None
    company_id: Optional[int] = None


class PendingVerificationResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_email: str
    method: str
    status: str
    selfie_url: Optional[str] = None
    id_card_url: Optional[str] = None
    notes: Optional[str] = None
    submitted_at: datetime
    company_name: Optional[str] = None


class ApproveVerificationRequest(BaseModel):
    notes: Optional[str] = None


class RejectVerificationRequest(BaseModel):
    reason: str
    notes: Optional[str] = None







