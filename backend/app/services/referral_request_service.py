from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlmodel import Session
from sqlalchemy import select, func, and_, or_
import os
import uuid
from pathlib import Path

from app.models.referral_request import ReferralRequest
from app.models.user import Job
from app.models.user import User, Employee
from app.schemas.referral_request import (
    ReferralRequestCreate, ReferralRequestUpdate, ReferralRequestStats,
    ReferralRequestStatus, ReferralRequestPriority
)
from app.services.notification_service import NotificationService


class ReferralRequestService:
    def __init__(self, db: Session):
        self.db = db
        self.upload_dir = Path("uploads/resumes")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def create_referral_request(
        self, 
        request_data: ReferralRequestCreate, 
        jobseeker_id: int,
        resume_file: Optional[bytes] = None,
        resume_filename: Optional[str] = None,
        resume_mime_type: Optional[str] = None,
        resume_key: Optional[str] = None,
        resume_url: Optional[str] = None
    ) -> ReferralRequest:
        """Create a new referral request"""
        
        # Get job and employee info
        job_query = select(Job).where(Job.id == request_data.job_id)
        job_result = self.db.execute(job_query)
        job = job_result.scalar_one_or_none()
        
        if not job:
            raise ValueError("Job not found")
        
        if not job.employee_id:
            raise ValueError("Job has no assigned employee")

        # Resolve employee user_id from employee record
        employee_result = self.db.execute(select(Employee).where(Employee.id == job.employee_id))
        employee = employee_result.scalar_one_or_none()
        if not employee:
            raise ValueError("Employee profile not found for this job")
        
        # Handle resume upload
        resume_file_path = None
        request_metadata: Dict[str, Any] = {}
        if resume_file and resume_filename:
            file_extension = Path(resume_filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            resume_file_path = self.upload_dir / unique_filename
            
            with open(resume_file_path, 'wb') as f:
                f.write(resume_file)
        elif resume_key or resume_url:
            request_metadata = {
                "resume_key": resume_key,
                "resume_url": resume_url
            }
        
        # Create referral request
        referral_request = ReferralRequest(
            job_id=request_data.job_id,
            employee_id=employee.user_id,
            jobseeker_id=jobseeker_id,
            jobseeker_name=request_data.jobseeker_name,
            jobseeker_email=request_data.jobseeker_email,
            jobseeker_phone=request_data.jobseeker_phone,
            linkedin_url=request_data.linkedin_url,
            resume_filename=resume_filename,
            resume_file_path=str(resume_file_path) if resume_file_path else None,
            resume_file_size=len(resume_file) if resume_file else None,
            resume_mime_type=resume_mime_type,
            personal_note=request_data.personal_note,
            status=ReferralRequestStatus.pending,
            priority=request_data.priority,
            last_activity=datetime.utcnow()
        )
        if request_metadata:
            referral_request.request_metadata = request_metadata
        
        self.db.add(referral_request)
        self.db.commit()
        self.db.refresh(referral_request)

        # Send in-app notification to the employee (non-blocking)
        try:
            notification_service = NotificationService(self.db)
            notification_service.send_referral_notification(
                recipient_id=employee.user_id,
                sender_id=jobseeker_id,
                job_title=job.title,
                referral_id=referral_request.id
            )
        except Exception as e:
            print(f"Notification send failed: {e}")
        
        return referral_request

    def get_referral_requests_for_employee(
        self, 
        employee_id: int, 
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ReferralRequest]:
        """Get referral requests for an employee"""
        
        query = (
            select(ReferralRequest)
            .where(ReferralRequest.employee_id == employee_id)
            .order_by(ReferralRequest.created_at.desc())
        )
        
        if status:
            query = query.where(ReferralRequest.status == status)
        
        query = query.limit(limit).offset(offset)
        
        result = self.db.execute(query)
        return result.scalars().all()

    def get_referral_requests_for_jobseeker(
        self, 
        jobseeker_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[ReferralRequest]:
        """Get referral requests for a job seeker"""
        
        query = (
            select(ReferralRequest)
            .where(ReferralRequest.jobseeker_id == jobseeker_id)
            .order_by(ReferralRequest.created_at.desc())
        )
        
        query = query.limit(limit).offset(offset)
        
        result = self.db.execute(query)
        return result.scalars().all()

    def get_referral_request_by_id(
        self, 
        request_id: int, 
        user_id: int
    ) -> Optional[ReferralRequest]:
        """Get a specific referral request by ID"""
        
        query = (
            select(ReferralRequest)
            .where(
                and_(
                    ReferralRequest.id == request_id,
                    or_(
                        ReferralRequest.employee_id == user_id,
                        ReferralRequest.jobseeker_id == user_id
                    )
                )
            )
        )
        
        result = self.db.execute(query)
        return result.scalar_one_or_none()

    def update_referral_request(
        self, 
        request_id: int, 
        user_id: int,
        update_data: ReferralRequestUpdate
    ) -> Optional[ReferralRequest]:
        """Update a referral request"""
        
        # Get the request
        request = self.get_referral_request_by_id(request_id, user_id)
        if not request:
            return None
        
        # Check if user has permission to update
        if request.employee_id != user_id and request.jobseeker_id != user_id:
            return None
        
        # Update fields
        if update_data.status:
            request.status = update_data.status
            if update_data.status in [ReferralRequestStatus.accepted, ReferralRequestStatus.declined]:
                request.responded_at = datetime.utcnow()
        
        if update_data.employee_response:
            request.employee_response = update_data.employee_response
        
        if update_data.employee_notes:
            request.employee_notes = update_data.employee_notes
        
        if update_data.priority:
            request.priority = update_data.priority
        
        if update_data.outcome:
            request.outcome = update_data.outcome
        
        request.last_activity = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(request)
        
        return request

    def mark_as_viewed(
        self, 
        request_id: int, 
        user_id: int
    ) -> bool:
        """Mark a referral request as viewed by employee"""
        
        query = (
            select(ReferralRequest)
            .where(
                and_(
                    ReferralRequest.id == request_id,
                    ReferralRequest.employee_id == user_id
                )
            )
        )
        
        result = self.db.execute(query)
        request = result.scalar_one_or_none()
        
        if not request:
            return False
        
        if not request.viewed_by_employee:
            request.viewed_by_employee = True
            request.viewed_at = datetime.utcnow()
            request.last_activity = datetime.utcnow()
            
            self.db.commit()
        
        return True

    def get_referral_request_stats(
        self, 
        user_id: int, 
        user_role: str
    ) -> ReferralRequestStats:
        """Get referral request statistics for a user"""
        
        if user_role == "employee":
            base_query = select(ReferralRequest).where(ReferralRequest.employee_id == user_id)
        else:
            base_query = select(ReferralRequest).where(ReferralRequest.jobseeker_id == user_id)
        
        # Total requests
        total_result = self.db.execute(
            select(func.count(ReferralRequest.id)).select_from(base_query.subquery())
        )
        total_requests = total_result.scalar() or 0
        
        # Pending requests
        pending_result = self.db.execute(
            select(func.count(ReferralRequest.id))
            .select_from(base_query.subquery())
            .where(ReferralRequest.status == ReferralRequestStatus.pending)
        )
        pending_requests = pending_result.scalar() or 0
        
        # Accepted requests
        accepted_result = self.db.execute(
            select(func.count(ReferralRequest.id))
            .select_from(base_query.subquery())
            .where(ReferralRequest.status == ReferralRequestStatus.accepted)
        )
        accepted_requests = accepted_result.scalar() or 0
        
        # Declined requests
        declined_result = self.db.execute(
            select(func.count(ReferralRequest.id))
            .select_from(base_query.subquery())
            .where(ReferralRequest.status == ReferralRequestStatus.declined)
        )
        declined_requests = declined_result.scalar() or 0
        
        # Response rate
        response_rate = 0.0
        if total_requests > 0:
            responded = accepted_requests + declined_requests
            response_rate = (responded / total_requests) * 100
        
        # Average response time
        avg_response_time = None
        if user_role == "employee":
            response_time_result = self.db.execute(
                select(func.avg(
                    func.extract('epoch', ReferralRequest.responded_at - ReferralRequest.created_at) / 3600
                ))
                .select_from(base_query.subquery())
                .where(ReferralRequest.responded_at.isnot(None))
            )
            avg_response_time = response_time_result.scalar()
        
        # Success rate (for job seekers)
        success_rate = 0.0
        if user_role == "jobseeker" and total_requests > 0:
            success_result = self.db.execute(
                select(func.count(ReferralRequest.id))
                .select_from(base_query.subquery())
                .where(ReferralRequest.outcome.in_(["hired", "interviewed"]))
            )
            successful = success_result.scalar() or 0
            success_rate = (successful / total_requests) * 100
        
        return ReferralRequestStats(
            total_requests=total_requests,
            pending_requests=pending_requests,
            accepted_requests=accepted_requests,
            declined_requests=declined_requests,
            response_rate=response_rate,
            average_response_time_hours=avg_response_time,
            success_rate=success_rate
        )

    def get_pending_notifications(
        self, 
        employee_id: int
    ) -> List[ReferralRequest]:
        """Get pending referral request notifications for an employee"""
        
        query = (
            select(ReferralRequest)
            .where(
                and_(
                    ReferralRequest.employee_id == employee_id,
                    ReferralRequest.status == ReferralRequestStatus.pending,
                    ReferralRequest.notification_sent == False
                )
            )
            .options(
                selectinload(ReferralRequest.job),
                selectinload(ReferralRequest.jobseeker)
            )
            .order_by(ReferralRequest.created_at.desc())
        )
        
        result = self.db.execute(query)
        return result.scalars().all()

    def mark_notification_sent(
        self, 
        request_id: int
    ) -> bool:
        """Mark notification as sent for a referral request"""
        
        query = select(ReferralRequest).where(ReferralRequest.id == request_id)
        result = self.db.execute(query)
        request = result.scalar_one_or_none()
        
        if not request:
            return False
        
        request.notification_sent = True
        request.notification_sent_at = datetime.utcnow()
        
        self.db.commit()
        return True

    def get_resume_file_path(
        self, 
        request_id: int, 
        user_id: int
    ) -> Optional[str]:
        """Get resume file path for download"""
        
        query = (
            select(ReferralRequest)
            .where(
                and_(
                    ReferralRequest.id == request_id,
                    or_(
                        ReferralRequest.employee_id == user_id,
                        ReferralRequest.jobseeker_id == user_id
                    )
                )
            )
        )
        
        result = self.db.execute(query)
        request = result.scalar_one_or_none()
        
        if not request or not request.resume_file_path:
            return None
        
        # Check if file exists
        if not os.path.exists(request.resume_file_path):
            return None
        
        return request.resume_file_path
