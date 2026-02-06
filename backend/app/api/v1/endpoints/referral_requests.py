from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse, RedirectResponse
from sqlmodel import Session, select
from sqlalchemy import update
import os
from datetime import datetime
import uuid
import json

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User, Job, Company
from app.models.referral_request import ReferralRequest
from app.schemas.referral_request import (
    ReferralRequestCreate, ReferralRequestUpdate, ReferralRequestResponse,
    ReferralRequestList, ReferralRequestDetail, ReferralRequestStats,
    ReferralRequestStatus, ReferralRequestPriority,
    ReferralChatState, ReferralChatMessage, ReferralChatMessageCreate
)
from app.services.referral_request_service import ReferralRequestService
from app.services.s3_service import S3FileService

router = APIRouter()


def _normalize_metadata(value):
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return {}
    return {}


def _ensure_chat_metadata(value):
    metadata = _normalize_metadata(value)
    metadata.setdefault("chat_enabled", False)
    metadata.setdefault("messages", [])
    metadata.setdefault("unread_by_employee", 0)
    metadata.setdefault("unread_by_jobseeker", 0)
    return metadata


def _last_message_info(metadata):
    last_message_at = metadata.get("last_message_at")
    last_message_preview = metadata.get("last_message_preview")
    if last_message_at and last_message_preview:
        return last_message_at, last_message_preview
    messages = metadata.get("messages") or []
    if messages:
        last = messages[-1]
        return last.get("created_at"), (last.get("content") or "")[:140]
    return None, None


def _unread_count(metadata, role_value: str) -> int:
    if role_value == "employee":
        return int(metadata.get("unread_by_employee") or 0)
    return int(metadata.get("unread_by_jobseeker") or 0)


@router.post("/", response_model=ReferralRequestResponse, summary="Create a referral request")
def create_referral_request(
    job_id: int = Form(...),
    jobseeker_name: str = Form(..., min_length=1, max_length=200),
    jobseeker_email: str = Form(...),
    jobseeker_phone: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    personal_note: Optional[str] = Form(None),
    priority: ReferralRequestPriority = Form(ReferralRequestPriority.normal),
    resume: Optional[UploadFile] = File(None),
    resume_filename: Optional[str] = Form(None),
    resume_key: Optional[str] = Form(None),
    resume_url: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
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
    resume_mime_type = None
    provided_resume_filename = resume_filename
    
    if resume:
        resume_file = resume.file.read()
        provided_resume_filename = resume.filename
        resume_mime_type = resume.content_type
    
    # Create referral request
    service = ReferralRequestService(db)
    try:
        referral_request = service.create_referral_request(
            request_data=request_data,
            jobseeker_id=current_user.id,
            resume_file=resume_file,
            resume_filename=provided_resume_filename,
            resume_mime_type=resume_mime_type,
            resume_key=resume_key,
            resume_url=resume_url
        )
        
        return referral_request
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create referral request: {str(e)}")


@router.get("/", response_model=List[ReferralRequestList], summary="Get referral requests")
def get_referral_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get referral requests for the current user"""
    
    service = ReferralRequestService(db)
    
    if current_user.role == "employee":
        requests = service.get_referral_requests_for_employee(
            employee_id=current_user.id,
            status=status,
            limit=limit,
            offset=offset
        )
    else:
        requests = service.get_referral_requests_for_jobseeker(
            jobseeker_id=current_user.id,
            limit=limit,
            offset=offset
        )

    job_ids = [r.job_id for r in requests]
    jobs_result = db.execute(select(Job).where(Job.id.in_(job_ids))) if job_ids else None
    jobs = jobs_result.scalars().all() if jobs_result else []
    jobs_by_id = {j.id: j for j in jobs}

    company_ids = [j.company_id for j in jobs if j.company_id]
    companies_result = db.execute(select(Company).where(Company.id.in_(company_ids))) if company_ids else None
    companies = companies_result.scalars().all() if companies_result else []
    companies_by_id = {c.id: c for c in companies}

    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    formatted = []
    for r in requests:
        job = jobs_by_id.get(r.job_id)
        company = companies_by_id.get(job.company_id) if job else None
        metadata = _ensure_chat_metadata(r.request_metadata)
        last_message_at, last_message_preview = _last_message_info(metadata)
        has_resume = bool(r.resume_filename) or bool(metadata.get("resume_key") or metadata.get("resume_url"))
        chat_unread_count = _unread_count(metadata, role_value)
        formatted.append({
            "id": r.id,
            "job_id": r.job_id,
            "job_title": job.title if job else "Unknown",
            "company_name": company.name if company else "Unknown",
            "jobseeker_name": r.jobseeker_name,
            "jobseeker_email": r.jobseeker_email,
            "status": r.status,
            "priority": r.priority,
            "created_at": r.created_at,
            "viewed_by_employee": r.viewed_by_employee,
            "resume_filename": r.resume_filename or ("Resume" if has_resume else None),
            "personal_note": r.personal_note,
            "chat_enabled": bool(metadata.get("chat_enabled")),
            "chat_unread_count": chat_unread_count,
            "last_message_at": last_message_at,
            "last_message_preview": last_message_preview
        })

    return formatted


@router.get("/{request_id}", response_model=ReferralRequestDetail, summary="Get referral request details")
def get_referral_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get detailed information about a specific referral request"""
    
    service = ReferralRequestService(db)
    request = service.get_referral_request_by_id(request_id, current_user.id)
    
    if not request:
        raise HTTPException(status_code=404, detail="Referral request not found")
    
    # Mark as viewed if user is the employee
    if current_user.role == "employee" and request.employee_id == current_user.id:
        service.mark_as_viewed(request_id, current_user.id)

    job = db.execute(select(Job).where(Job.id == request.job_id)).scalar_one_or_none()
    company = db.execute(select(Company).where(Company.id == job.company_id)).scalar_one_or_none() if job else None
    employee_user = db.execute(select(User).where(User.id == request.employee_id)).scalar_one_or_none()

    metadata = _ensure_chat_metadata(request.request_metadata)
    last_message_at, last_message_preview = _last_message_info(metadata)
    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    has_resume = bool(request.resume_filename) or bool(metadata.get("resume_key") or metadata.get("resume_url"))
    chat_unread_count = _unread_count(metadata, role_value)
    return {
        **request.model_dump(),
        "job_title": job.title if job else "Unknown",
        "company_name": company.name if company else "Unknown",
        "employee_name": f"{employee_user.first_name or ''} {employee_user.last_name or ''}".strip() if employee_user else "Unknown",
        "employee_email": employee_user.email if employee_user else "Unknown",
        "resume_filename": request.resume_filename or ("Resume" if has_resume else None),
        "chat_enabled": bool(metadata.get("chat_enabled")),
        "chat_unread_count": chat_unread_count,
        "last_message_at": last_message_at,
        "last_message_preview": last_message_preview,
    }


@router.put("/{request_id}", response_model=ReferralRequestResponse, summary="Update referral request")
def update_referral_request(
    request_id: int,
    update_data: ReferralRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update a referral request (employee can respond, job seeker can withdraw)"""
    
    service = ReferralRequestService(db)
    updated_request = service.update_referral_request(
        request_id=request_id,
        user_id=current_user.id,
        update_data=update_data
    )
    
    if not updated_request:
        raise HTTPException(status_code=404, detail="Referral request not found or access denied")
    
    return updated_request


@router.post("/{request_id}/chat/enable", response_model=ReferralChatState, summary="Enable chat for referral request")
def enable_chat(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Enable chat for a referral request (employee only)."""
    service = ReferralRequestService(db)
    request = service.get_referral_request_by_id(request_id, current_user.id)
    if not request:
        raise HTTPException(status_code=404, detail="Referral request not found or access denied")

    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    if role_value != "employee":
        raise HTTPException(status_code=403, detail="Only employees can enable chat")

    metadata = _ensure_chat_metadata(request.request_metadata)
    metadata["chat_enabled"] = True
    metadata.setdefault("messages", [])

    db.execute(
        update(ReferralRequest)
        .where(ReferralRequest.id == request.id)
        .values(request_metadata=metadata, last_activity=datetime.utcnow())
    )
    db.commit()

    return ReferralChatState(
        chat_enabled=True,
        messages=metadata.get("messages", [])
    )


@router.get("/{request_id}/chat", response_model=ReferralChatState, summary="Get referral chat state")
def get_chat_state(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get chat messages for a referral request."""
    service = ReferralRequestService(db)
    request = service.get_referral_request_by_id(request_id, current_user.id)
    if not request:
        raise HTTPException(status_code=404, detail="Referral request not found or access denied")

    metadata = _ensure_chat_metadata(request.request_metadata)
    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    unread_key = "unread_by_employee" if role_value == "employee" else "unread_by_jobseeker"

    if metadata.get(unread_key):
        metadata[unread_key] = 0
        db.execute(
            update(ReferralRequest)
            .where(ReferralRequest.id == request.id)
            .values(request_metadata=metadata)
        )
        db.commit()

    return ReferralChatState(
        chat_enabled=bool(metadata.get("chat_enabled", False)),
        messages=metadata.get("messages", [])
    )


@router.post("/{request_id}/chat/messages", response_model=ReferralChatMessage, summary="Send a referral chat message")
def send_chat_message(
    request_id: int,
    message_data: ReferralChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Send a chat message for a referral request."""
    service = ReferralRequestService(db)
    request = service.get_referral_request_by_id(request_id, current_user.id)
    if not request:
        raise HTTPException(status_code=404, detail="Referral request not found or access denied")

    metadata = _ensure_chat_metadata(request.request_metadata)
    if not metadata.get("chat_enabled"):
        raise HTTPException(status_code=400, detail="Chat is not enabled for this referral")

    role_value = current_user.role.value if hasattr(current_user.role, 'value') else current_user.role
    new_message = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user.id,
        "sender_role": role_value,
        "content": message_data.content,
        "created_at": datetime.utcnow().isoformat()
    }

    messages = list(metadata.get("messages") or [])
    messages.append(new_message)

    if len(messages) > 200:
        messages = messages[-200:]

    metadata["messages"] = messages
    metadata["last_message_at"] = new_message["created_at"]
    metadata["last_message_preview"] = new_message["content"][:140]

    if role_value == "employee":
        metadata["unread_by_jobseeker"] = int(metadata.get("unread_by_jobseeker") or 0) + 1
        metadata["unread_by_employee"] = 0
    else:
        metadata["unread_by_employee"] = int(metadata.get("unread_by_employee") or 0) + 1
        metadata["unread_by_jobseeker"] = 0
    db.execute(
        update(ReferralRequest)
        .where(ReferralRequest.id == request.id)
        .values(request_metadata=metadata, last_activity=datetime.utcnow())
    )
    db.commit()

    return new_message


@router.get("/stats/overview", response_model=ReferralRequestStats, summary="Get referral request statistics")
def get_referral_request_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get referral request statistics for the current user"""
    
    service = ReferralRequestService(db)
    stats = service.get_referral_request_stats(
        user_id=current_user.id,
        user_role=current_user.role
    )
    
    return stats


@router.get("/notifications/pending", response_model=List[ReferralRequestList], summary="Get pending notifications")
def get_pending_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get pending referral request notifications (employee only)"""
    
    if current_user.role != "employee":
        raise HTTPException(status_code=403, detail="Only employees can view pending notifications")
    
    service = ReferralRequestService(db)
    notifications = service.get_pending_notifications(current_user.id)
    
    return notifications


@router.post("/{request_id}/mark-notification-sent", summary="Mark notification as sent")
def mark_notification_sent(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Mark a notification as sent (employee only)"""
    
    if current_user.role != "employee":
        raise HTTPException(status_code=403, detail="Only employees can mark notifications as sent")
    
    service = ReferralRequestService(db)
    success = service.mark_notification_sent(request_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Referral request not found")
    
    return {"message": "Notification marked as sent"}


@router.get("/{request_id}/resume", summary="Download resume")
def download_resume(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Download the resume file for a referral request"""
    
    service = ReferralRequestService(db)
    request = service.get_referral_request_by_id(request_id, current_user.id)
    if not request:
        raise HTTPException(status_code=404, detail="Referral request not found or access denied")

    # If resume stored in metadata (S3), redirect to presigned URL
    if request.request_metadata:
        resume_key = request.request_metadata.get("resume_key")
        resume_url = request.request_metadata.get("resume_url")
        if resume_key:
            s3_service = S3FileService()
            download_url = s3_service.generate_presigned_url(resume_key)
            return RedirectResponse(download_url)
        if resume_url:
            return RedirectResponse(resume_url)

    # Otherwise use local file path
    file_path = service.get_resume_file_path(request_id, current_user.id)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file not found")

    filename = request.resume_filename if request else "resume.pdf"
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )


@router.post("/{request_id}/withdraw", response_model=ReferralRequestResponse, summary="Withdraw referral request")
def withdraw_referral_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Withdraw a referral request (job seeker only)"""
    
    if current_user.role != "jobseeker":
        raise HTTPException(status_code=403, detail="Only job seekers can withdraw referral requests")
    
    service = ReferralRequestService(db)
    updated_request = service.update_referral_request(
        request_id=request_id,
        user_id=current_user.id,
        update_data=ReferralRequestUpdate(status=ReferralRequestStatus.withdrawn)
    )
    
    if not updated_request:
        raise HTTPException(status_code=404, detail="Referral request not found or access denied")
    
    return updated_request
