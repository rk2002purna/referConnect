"""
OTP Service for email verification
"""
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlmodel import Session, select
from fastapi import HTTPException

from app.models.verification import OTPVerification, VerifiedCompany, EmployeeVerification, VerificationMethod, VerificationStatus
from app.schemas.verification import SendOTPRequest, VerifyOTPRequest
from app.services.email_service import email_service

class OTPService:
    def __init__(self, db: Session):
        self.db = db
        self.otp_length = 6
        self.otp_expiry_minutes = 10
        self.max_attempts = 3
        
    def generate_otp(self) -> str:
        """Generate a secure OTP code"""
        return ''.join(secrets.choice(string.digits) for _ in range(self.otp_length))
    
    async def send_otp(self, request: SendOTPRequest, user_id: int) -> Dict[str, Any]:
        """Send OTP to company email"""
        try:
            # Check if company exists
            company = self.db.get(VerifiedCompany, request.company_id)
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")
            
            # Check for recent OTP (rate limiting)
            recent_otp = self.db.exec(
                select(OTPVerification).where(
                    OTPVerification.user_id == user_id,
                    OTPVerification.company_id == request.company_id,
                    OTPVerification.company_email == request.company_email,
                    OTPVerification.created_at > datetime.utcnow() - timedelta(minutes=1)
                )
            ).first()
            
            if recent_otp:
                raise HTTPException(
                    status_code=429, 
                    detail="Please wait before requesting another OTP code"
                )
            
            # Generate new OTP
            otp_code = self.generate_otp()
            expires_at = datetime.utcnow() + timedelta(minutes=self.otp_expiry_minutes)
            
            # Invalidate any existing unverified OTPs for this user/company/email
            existing_otps = self.db.exec(
                select(OTPVerification).where(
                    OTPVerification.user_id == user_id,
                    OTPVerification.company_id == request.company_id,
                    OTPVerification.company_email == request.company_email,
                    OTPVerification.verified == False
                )
            ).all()
            
            for otp in existing_otps:
                self.db.delete(otp)
            
            # Create new OTP record
            otp_verification = OTPVerification(
                user_id=user_id,
                company_id=request.company_id,
                company_email=request.company_email,
                otp_code=otp_code,
                expires_at=expires_at,
                verified=False,
                attempts=0
            )
            
            self.db.add(otp_verification)
            self.db.commit()
            self.db.refresh(otp_verification)
            
            # Send OTP email
            email_sent = await email_service.send_otp_email(
                to_email=request.company_email,
                otp_code=otp_code,
                company_name=company.name
            )
            
            if not email_sent:
                # If email fails, still return success but log the issue
                print(f"⚠️ Email sending failed for {request.company_email}, but OTP is stored")
            
            return {
                "success": True,
                "message": "OTP sent successfully",
                "expires_at": expires_at,
                "service_used": email_service.active_service
            }
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Error sending OTP: {e}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to send OTP. Please try again."
            )
    
    def verify_otp(self, request: VerifyOTPRequest, user_id: int) -> Dict[str, Any]:
        """Verify OTP code"""
        try:
            # Find the most recent unverified OTP for this user/company/email
            otp_record = self.db.exec(
                select(OTPVerification).where(
                    OTPVerification.user_id == user_id,
                    OTPVerification.company_id == request.company_id,
                    OTPVerification.company_email == request.company_email,
                    OTPVerification.verified == False
                ).order_by(OTPVerification.created_at.desc())
            ).first()
            
            if not otp_record:
                raise HTTPException(
                    status_code=404, 
                    detail="No OTP found. Please request a new OTP code."
                )
            
            # Check if OTP has expired
            if datetime.utcnow() > otp_record.expires_at:
                raise HTTPException(
                    status_code=400, 
                    detail="OTP has expired. Please request a new code."
                )
            
            # Check attempt limit
            if otp_record.attempts >= self.max_attempts:
                raise HTTPException(
                    status_code=400, 
                    detail="Maximum attempts exceeded. Please request a new OTP code."
                )
            
            # Verify OTP code
            if otp_record.otp_code != request.otp_code:
                # Increment attempt counter
                otp_record.attempts += 1
                self.db.commit()
                
                remaining_attempts = self.max_attempts - otp_record.attempts
                if remaining_attempts > 0:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Invalid OTP code. {remaining_attempts} attempts remaining."
                    )
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail="Maximum attempts exceeded. Please request a new OTP code."
                    )
            
            # Mark OTP as verified
            otp_record.verified = True
            self.db.commit()
            
            # Create or update employee verification
            verification = self.db.exec(
                select(EmployeeVerification).where(
                    EmployeeVerification.user_id == user_id,
                    EmployeeVerification.company_id == request.company_id
                )
            ).first()
            
            if verification:
                verification.status = VerificationStatus.verified
                verification.verified_at = datetime.utcnow()
                verification.company_email = request.company_email
                verification.verification_method = VerificationMethod.email
            else:
                verification = EmployeeVerification(
                    user_id=user_id,
                    company_id=request.company_id,
                    verification_method=VerificationMethod.email,
                    status=VerificationStatus.verified,
                    company_email=request.company_email,
                    verified_at=datetime.utcnow()
                )
                self.db.add(verification)
            
            self.db.commit()
            self.db.refresh(verification)
            
            return {
                "success": True,
                "message": "OTP verified successfully",
                "verification_id": verification.id
            }
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"❌ Error verifying OTP: {e}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to verify OTP. Please try again."
            )
    
    def cleanup_expired_otps(self) -> int:
        """Clean up expired OTPs (can be called periodically)"""
        try:
            expired_otps = self.db.exec(
                select(OTPVerification).where(
                    OTPVerification.expires_at < datetime.utcnow()
                )
            ).all()
            
            count = len(expired_otps)
            for otp in expired_otps:
                self.db.delete(otp)
            
            self.db.commit()
            return count
            
        except Exception as e:
            print(f"❌ Error cleaning up expired OTPs: {e}")
            return 0
