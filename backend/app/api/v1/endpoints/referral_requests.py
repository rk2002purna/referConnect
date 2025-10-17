from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.referral_request import (
    ReferralRequestCreate, ReferralRequestUpdate, ReferralRequestResponse,
    ReferralRequestList, ReferralRequestDetail, ReferralRequestStats,
    ReferralRequestStatus, ReferralRequestPriority
)
from app.services.referral_request_service import ReferralRequestService

router = APIRouter()


@router.post("/", response_model=ReferralRequestResponse, summary="Create a referral request")
async def create_referral_request(
    job_id: int = Form(...),
    jobseeker_name: str = Form(..., min_length=1, max_length=200),
    jobseeker_email: str = Form(...),
    jobseeker_phone: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    personal_note: Optional[str] = Form(None),
    priority: ReferralRequestPriority = Form(ReferralRequestPriority.normal),
    resume: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new referral request with optional resume upload"""
    
    if current_user.role != "jobseeker":
        raise HTTPException(status_code=403, detail="Only job seekers can create referral requests")
    
    # Validate file if provided
    if resume:
        if resume.size > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Resume file too large. Maximum size is 10MB")
        
        allowed_types = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain"
        ]
        if resume.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed"
            )
    
    # Create request data
    request_data = ReferralRequestCreate(
        job_id=job_id,
        jobseeker_name=jobseeker_name,
        jobseeker_email=jobseeker_email,
        jobseeker_phone=jobseeker_phone,
        linkedin_url=linkedin_url,
        personal_note=personal_note,
        priority=priority
    )
    
    # Handle resume upload
    resume_file = None
    resume_filename = None
    resume_mime_type = None
    
    if resume:
        resume_file = await resume.read()
        resume_filename = resume.filename
        resume_mime_type = resume.content_type
    
    # Create referral request
    service = ReferralRequestService(db)
    try:
        referral_request = await service.create_referral_request(
            request_data=request_data,
            jobseeker_id=current_user.id,
            resume_file=resume_file,
            resume_filename=resume_filename,
            resume_mime_type=resume_mime_type
        )
        
        return referral_request
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create referral request")


@router.get("/", response_model=List[ReferralRequestList], summary="Get referral requests")
async def get_referral_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get referral requests for the current user"""
    
    service = ReferralRequestService(db)
    
    if current_user.role == "employee":
        requests = await service.get_referral_requests_for_employee(
            employee_id=current_user.id,
            status=status,
            limit=limit,
            offset=offset
        )
    else:
        requests = await service.get_referral_requests_for_jobseeker(
            jobseeker_id=current_user.id,
            limit=limit,
            offset=offset
        )
    
    return requests


@router.get("/{request_id}", response_model=ReferralRequestDetail, summary="Get referral request details")
async def get_referral_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get detailed information about a specific referral request"""
    
    service = ReferralRequestService(db)
    request = await service.get_referral_request_by_id(request_id, current_user.id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Referral request not found")
    
    # Mark as viewed if user is the employee
    if current_user.role == "employee" and request.employee_id == current_user.id:
        await service.mark_as_viewed(request_id, current_user.id)
    
    return request


@router.put("/{request_id}", response_model=ReferralRequestResponse, summary="Update referral request")
async def update_referral_request(
    request_id: int,
    update_data: ReferralRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update a referral request (employee can respond, job seeker can withdraw)"""
    
    service = ReferralRequestService(db)
    updated_request = await service.update_referral_request(
        request_id=request_id,
        user_id=current_user.id,
        update_data=update_data
    )
    
    if not updated_request:
        raise HTTPException(status_code=404, detail="Referral request not found or access denied")
    
    return updated_request


@router.get("/stats/overview", response_model=ReferralRequestStats, summary="Get referral request statistics")
async def get_referral_request_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get referral request statistics for the current user"""
    
    service = ReferralRequestService(db)
    stats = await service.get_referral_request_stats(
        user_id=current_user.id,
        user_role=current_user.role
    )
    
    return stats


@router.get("/notifications/pending", response_model=List[ReferralRequestList], summary="Get pending notifications")
async def get_pending_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get pending referral request notifications (employee only)"""
    
    if current_user.role != "employee":
        raise HTTPException(status_code=403, detail="Only employees can view pending notifications")
    
    service = ReferralRequestService(db)
    notifications = await service.get_pending_notifications(current_user.id)
    
    return notifications


@router.post("/{request_id}/mark-notification-sent", summary="Mark notification as sent")
async def mark_notification_sent(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Mark a notification as sent (employee only)"""
    
    if current_user.role != "employee":
        raise HTTPException(status_code=403, detail="Only employees can mark notifications as sent")
    
    service = ReferralRequestService(db)
    success = await service.mark_notification_sent(request_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Referral request not found")
    
    return {"message": "Notification marked as sent"}


@router.get("/{request_id}/resume", summary="Download resume")
async def download_resume(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Download the resume file for a referral request"""
    
    service = ReferralRequestService(db)
    file_path = await service.get_resume_file_path(request_id, current_user.id)
    
    if not file_path:
        raise HTTPException(status_code=404, detail="Resume file not found or access denied")
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on server")
    
    # Get the original filename
    request = await service.get_referral_request_by_id(request_id, current_user.id)
    filename = request.resume_filename if request else "resume.pdf"
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )


@router.post("/{request_id}/withdraw", response_model=ReferralRequestResponse, summary="Withdraw referral request")
async def withdraw_referral_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Withdraw a referral request (job seeker only)"""
    
    if current_user.role != "jobseeker":
        raise HTTPException(status_code=403, detail="Only job seekers can withdraw referral requests")
    
    service = ReferralRequestService(db)
    updated_request = await service.update_referral_request(
        request_id=request_id,
        user_id=current_user.id,
        update_data=ReferralRequestUpdate(status=ReferralRequestStatus.withdrawn)
    )
    
    if not updated_request:
        raise HTTPException(status_code=404, detail="Referral request not found or access denied")
    
    return updated_request
