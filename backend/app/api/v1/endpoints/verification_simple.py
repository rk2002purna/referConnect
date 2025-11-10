from __future__ import annotations

import sqlite3
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
import sys
import os

# Add the app directory to the path
sys.path.append('/Users/pradeepdyd/referconnect-backend')

# Import email service
from app.services.email_service import email_service
from sqlmodel import Session
from sqlalchemy import text
from app.db.session import get_db_session
from app.schemas.verification import CompanySearchResponse
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()


"""
Note: Using app.schemas.verification.CompanySearchResponse for response_model.
"""


# OTP Verification Schemas
class SendOTPRequest(BaseModel):
    company_id: int
    company_email: EmailStr

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    expires_at: str
    service_used: str

class VerifyOTPRequest(BaseModel):
    company_id: int
    company_email: EmailStr
    otp_code: str = Field(min_length=6, max_length=6)

class VerifyOTPResponse(BaseModel):
    success: bool
    message: str
    verification_id: Optional[int] = None


@router.get("/companies", response_model=CompanySearchResponse)
async def get_verified_companies(query: Optional[str] = None, db: Session = Depends(get_db_session)):
    """Get list of companies with optional search using the production `companies` table.

    Expected columns in `companies` table: id, name, domain, industry, size.
    We add `verified=True` in the response for compatibility with the schema.
    """
    try:
        params: dict[str, str] = {}
        if query and query.strip():
            params["q"] = f"%{query.lower()}%"
            sql = text(
                """
                SELECT id, name, domain,
                       NULL::text AS industry,
                       NULL::text AS size
                FROM companies
                WHERE (LOWER(name) LIKE :q OR LOWER(domain) LIKE :q)
                ORDER BY name
                """
            )
        else:
            sql = text(
                """
                SELECT id, name, domain,
                       NULL::text AS industry,
                       NULL::text AS size
                FROM companies
                ORDER BY name
                LIMIT 100
                """
            )

        result = db.execute(sql, params if query and query.strip() else {})
        rows = result.fetchall()

        companies = [
            {
                "id": row[0],
                "name": row[1],
                "domain": row[2],
                "industry": row[3],
                "size": row[4],
                "verified": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            }
            for row in rows
        ]

        return CompanySearchResponse(companies=companies)
    except Exception as e:
        # Ensure the session is usable for subsequent requests
        try:
            db.rollback()
        except Exception:
            pass
        # Surface exact error for diagnosis
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to load companies: {type(e).__name__}: {e}")



@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(
    request: SendOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Send OTP to company email for verification"""
    try:
        # Generate 6-digit OTP
        otp_code = ''.join(secrets.choice(string.digits) for _ in range(6))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        
        # Ensure OTP table exists in Postgres and insert OTP
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS otp_verifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                company_id INTEGER,
                company_email TEXT,
                otp_code TEXT,
                expires_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                verified BOOLEAN DEFAULT FALSE
            )
        """))
        db.execute(
            text("""
                INSERT INTO otp_verifications (user_id, company_id, company_email, otp_code, expires_at)
                VALUES (:user_id, :company_id, :company_email, :otp_code, :expires_at)
            """),
            {
                "user_id": current_user.id,  # Use actual user ID
                "company_id": request.company_id,
                "company_email": request.company_email,
                "otp_code": otp_code,
                "expires_at": expires_at,
            }
        )
        db.commit()
        
        # Get company name for email (use companies table to match prod schema)
        company_name = "Unknown Company"
        res = db.execute(text("SELECT name FROM companies WHERE id = :id"), {"id": request.company_id}).fetchone()
        if res and res[0]:
            company_name = res[0]
        
        # Send email using SendGrid
        email_sent = await email_service.send_otp_email(
            to_email=request.company_email,
            otp_code=otp_code,
            company_name=company_name
        )
        
        if not email_sent:
            print(f"Failed to send email to {request.company_email}")
        
        return SendOTPResponse(
            success=True,
            message="OTP sent successfully",
            expires_at=expires_at.isoformat(),
            service_used=email_service.active_service
        )
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to send OTP: {e}")


@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(
    request: VerifyOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Verify OTP code"""
    try:
        # Find valid OTP in Postgres for this specific user
        result = db.execute(
            text("""
                SELECT id, expires_at FROM otp_verifications
                WHERE user_id = :user_id AND company_id = :company_id AND company_email = :company_email AND otp_code = :otp_code AND verified = FALSE
                ORDER BY created_at DESC LIMIT 1
            """),
            {
                "user_id": current_user.id,  # Filter by actual user ID
                "company_id": request.company_id,
                "company_email": request.company_email,
                "otp_code": request.otp_code,
            }
        ).fetchone()
        
        if not result:
            return VerifyOTPResponse(
                success=False,
                message="Invalid or expired OTP code"
            )
        
        otp_id, expires_at_val = result
        # Normalize expires_at to timezone-aware UTC
        if isinstance(expires_at_val, str):
            parsed = datetime.fromisoformat(expires_at_val)
        else:
            parsed = expires_at_val
        if parsed.tzinfo is None:
            expires_at = parsed.replace(tzinfo=timezone.utc)
        else:
            expires_at = parsed.astimezone(timezone.utc)
        
        # Check if OTP is expired
        if datetime.now(timezone.utc) > expires_at:
            return VerifyOTPResponse(
                success=False,
                message="OTP code has expired"
            )
        
        # Mark OTP as verified
        db.execute(text("UPDATE otp_verifications SET verified = TRUE WHERE id = :id"), {"id": otp_id})
        db.commit()
        
        return VerifyOTPResponse(
            success=True,
            message="OTP verified successfully",
            verification_id=otp_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to verify OTP: {e}")


@router.get("/status")
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get verification status for current user"""
    try:
        # Check if current user has any verified OTPs in Postgres
        res = db.execute(
            text("""SELECT company_id, company_email, created_at 
                    FROM otp_verifications 
                    WHERE verified = TRUE AND user_id = :user_id
                    ORDER BY created_at DESC 
                    LIMIT 1"""),
            {"user_id": current_user.id}
        ).fetchone()
        
        # If there are verified OTPs for this user, return verified status with company_id
        if res and res[0]:
            company_id = res[0]
            company_email = res[1] if res[1] else None
            created_at = res[2] if res[2] else datetime.now(timezone.utc)
            created_at_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at)
            
            response_data = {
                "status": "verified",
                "method": "email",
                "company_id": company_id,
                "verified_at": created_at_str,
                "created_at": created_at_str,
                "updated_at": created_at_str
            }
            
            # Include company_email if available
            if company_email:
                response_data["company_email"] = company_email
            
            return response_data
        else:
            # No verified OTP found for this user
            raise HTTPException(status_code=404, detail="No verification found")
            
    except HTTPException:
        raise
    except Exception as e:
        # If there's an error, raise 404
        raise HTTPException(status_code=404, detail="No verification found")

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Verification service is running"}
