from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


class VerificationData(BaseModel):
    method: str = Field(..., description="Verification method: 'email' or 'id_card'")
    company_id: int = Field(..., description="ID of the verified company")
    company_name: str = Field(..., description="Name of the company")
    company_domain: str = Field(..., description="Domain of the company")
    company_email: str = Field(..., description="Company email for verification")


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    role: UserRole
    company_domain: Optional[str] = None  # For employee registration
    verification: Optional[VerificationData] = None  # For employee verification


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    phone_country_code: Optional[str] = None
    role: UserRole
    is_email_verified: bool
    is_active: bool

    class Config:
        from_attributes = True
