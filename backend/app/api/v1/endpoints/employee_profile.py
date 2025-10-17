from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlmodel import Session
from typing import Optional, List

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.profile import (
    EmployeeProfileResponse, EmployeeProfileUpdateRequest, ProfilePictureUploadResponse,
    EmailVerificationRequest, EmailVerificationResponse
)
from app.services.employee_profile_service import EmployeeProfileService

router = APIRouter()


@router.get("/me", response_model=EmployeeProfileResponse)
def get_employee_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get comprehensive employee profile information"""
    if current_user.role.value != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee profile only."
        )
    
    service = EmployeeProfileService(db)
    return service.get_employee_profile(current_user.id)


@router.put("/me", response_model=EmployeeProfileResponse)
def update_employee_profile(
    profile_data: EmployeeProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update comprehensive employee profile"""
    if current_user.role.value != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee profile only."
        )
    
    service = EmployeeProfileService(db)
    return service.update_employee_profile(current_user.id, profile_data)


@router.post("/me/profile-picture", response_model=ProfilePictureUploadResponse)
def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Upload profile picture for employee"""
    if current_user.role.value != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee profile only."
        )
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
        )
    
    # Validate file size (5MB limit)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5MB."
        )
    
    service = EmployeeProfileService(db)
    file_content = file.file.read()
    
    try:
        result = service.upload_profile_picture(current_user.id, file_content, file.filename)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload profile picture: {str(e)}"
        )


@router.post("/me/verify-email", response_model=EmailVerificationResponse)
def initiate_email_verification(
    verification_request: EmailVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Initiate email verification process for company email change"""
    if current_user.role.value != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee profile only."
        )
    
    service = EmployeeProfileService(db)
    
    try:
        result = service.initiate_email_verification(current_user.id, verification_request)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate email verification: {str(e)}"
        )


@router.get("/me/metrics")
def get_profile_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get employee profile metrics and statistics"""
    if current_user.role.value != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee profile only."
        )
    
    service = EmployeeProfileService(db)
    profile = service.get_employee_profile(current_user.id)
    
    return {
        "metrics": profile.metrics,
        "verification_status": profile.verification_status,
        "profile_completion": profile.metrics.profile_completion,
        "last_verified": profile.last_verified
    }


@router.get("/me/completion")
def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get detailed profile completion information"""
    if current_user.role.value != 'employee':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Employee profile only."
        )
    
    service = EmployeeProfileService(db)
    profile = service.get_employee_profile(current_user.id)
    
    # Calculate missing fields
    missing_fields = []
    
    # Basic info fields
    if not profile.first_name:
        missing_fields.append("First Name")
    if not profile.last_name:
        missing_fields.append("Last Name")
    if not profile.phone:
        missing_fields.append("Phone")
    if not profile.linkedin_url:
        missing_fields.append("LinkedIn URL")
    if not profile.bio:
        missing_fields.append("Professional Bio")
    if not profile.location:
        missing_fields.append("Location")
    if not profile.profile_picture:
        missing_fields.append("Profile Picture")
    
    # Company details
    if not profile.company_details:
        missing_fields.append("Company Information")
    else:
        if not profile.company_details.job_title:
            missing_fields.append("Job Title")
        if not profile.company_details.department:
            missing_fields.append("Department")
        if not profile.company_details.office_location:
            missing_fields.append("Office Location")
    
    # Referral preferences
    if not profile.referral_preferences.roles:
        missing_fields.append("Referral Roles")
    
    return {
        "completion_percentage": profile.metrics.profile_completion,
        "missing_fields": missing_fields,
        "sections_complete": {
            "basic_info": len([f for f in [profile.first_name, profile.last_name, profile.phone, profile.linkedin_url, profile.bio, profile.location, profile.profile_picture] if f]) / 7 * 100,
            "company_details": 100 if profile.company_details and all([profile.company_details.job_title, profile.company_details.department, profile.company_details.office_location]) else 0,
            "referral_preferences": 100 if profile.referral_preferences.roles else 0,
            "verification": 100 if profile.is_email_verified else 0
        }
    }
