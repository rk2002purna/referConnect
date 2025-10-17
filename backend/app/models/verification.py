from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy.orm import Mapped

from .base import TimestampedModel


class VerificationMethod(str, Enum):
    email = "email"
    id_card = "id_card"


class VerificationStatus(str, Enum):
    pending_email = "pending_email"
    pending_id_card = "pending_id_card"
    verified = "verified"
    rejected = "rejected"
    expired = "expired"


class VerifiedCompany(TimestampedModel, table=True):
    __tablename__ = "verified_companies"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, nullable=False)
    domain: str = Field(index=True, unique=True, nullable=False)
    industry: Optional[str] = Field(default=None, max_length=100)
    size: Optional[str] = Field(default=None, max_length=50)
    verified: bool = Field(default=True, nullable=False)


class EmployeeVerification(TimestampedModel, table=True):
    __tablename__ = "employee_verifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    company_id: int = Field(foreign_key="verified_companies.id", index=True, nullable=False)
    verification_method: VerificationMethod = Field(nullable=False)
    status: VerificationStatus = Field(nullable=False, index=True)
    personal_email: Optional[str] = Field(default=None, max_length=255)
    company_email: Optional[str] = Field(default=None, max_length=255)
    verified_at: Optional[datetime] = Field(default=None)
    expires_at: Optional[datetime] = Field(default=None)
    rejection_reason: Optional[str] = Field(default=None, max_length=500)


class OTPVerification(TimestampedModel, table=True):
    __tablename__ = "otp_verifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    company_id: int = Field(foreign_key="verified_companies.id", index=True, nullable=False)
    company_email: str = Field(max_length=255, nullable=False)
    otp_code: str = Field(max_length=6, nullable=False)
    expires_at: datetime = Field(nullable=False, index=True)
    verified: bool = Field(default=False, nullable=False)
    attempts: int = Field(default=0, nullable=False)  # Track failed attempts


class IDCardVerification(TimestampedModel, table=True):
    __tablename__ = "id_card_verifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    company_id: int = Field(foreign_key="verified_companies.id", index=True, nullable=False)
    selfie_url: Optional[str] = Field(default=None, max_length=500)
    id_card_url: Optional[str] = Field(default=None, max_length=500)
    status: str = Field(default="pending", max_length=20, index=True)  # pending, approved, rejected
    admin_notes: Optional[str] = Field(default=None)
    rejection_reason: Optional[str] = Field(default=None, max_length=500)
    reviewed_by: Optional[int] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = Field(default=None)







