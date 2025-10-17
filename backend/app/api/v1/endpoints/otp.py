"""
OTP verification endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.db.session import get_db_session
from app.services.otp_service import OTPService
from app.schemas.verification import SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/send-otp", response_model=SendOTPResponse)
async def send_otp(
    request: SendOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Send OTP to company email for verification"""
    otp_service = OTPService(db)
    result = await otp_service.send_otp(request, current_user.id)
    return SendOTPResponse(**result)

@router.post("/verify-otp", response_model=VerifyOTPResponse)
async def verify_otp(
    request: VerifyOTPRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Verify OTP code"""
    otp_service = OTPService(db)
    result = otp_service.verify_otp(request, current_user.id)
    return VerifyOTPResponse(**result)

@router.get("/status")
async def get_otp_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get OTP verification status for current user"""
    from app.models.verification import EmployeeVerification, VerificationStatus
    from sqlmodel import select
    
    verifications = db.exec(
        select(EmployeeVerification).where(
            EmployeeVerification.user_id == current_user.id,
            EmployeeVerification.status == VerificationStatus.verified
        )
    ).all()
    
    return {
        "verified_companies": [
            {
                "company_id": v.company_id,
                "company_email": v.company_email,
                "verified_at": v.verified_at,
                "method": v.verification_method
            }
            for v in verifications
        ]
    }
