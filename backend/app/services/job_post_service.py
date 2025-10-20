import json
from typing import List, Optional
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload
from sqlmodel import Session

from ..models.user import Job, User
from ..schemas.job_post import JobPostCreate, JobPostUpdate, JobPostResponse, JobPostListResponse


class JobPostService:
    def __init__(self, db: Session):
        self.db = db

    def create_job_post(self, user_id: int, job_data: JobPostCreate) -> JobPostResponse:
        """Create a new job posting"""
        # Convert skills list to JSON string
        skills_json = json.dumps(job_data.skills_required) if job_data.skills_required else None
        
        job = Job(
            title=job_data.title,
            company=job_data.company,
            location=job_data.location,
            job_type=job_data.job_type.value,
            salary_min=job_data.salary_min,
            salary_max=job_data.salary_max,
            currency=job_data.currency,
            description=job_data.description,
            requirements=job_data.requirements,
            benefits=job_data.benefits,
            skills_required=skills_json,
            experience_level=job_data.experience_level.value,
            remote_work=job_data.remote_work,
            application_deadline=job_data.application_deadline,
            contact_email=job_data.contact_email,
            department=job_data.department,
            posted_by=user_id,
            views=0,
            applications_count=0
        )
        
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        
        return self._job_to_response(job)

    def get_job_post(self, job_id: int) -> Optional[JobPostResponse]:
        """Get a specific job posting by ID"""
        result = self.db.execute(
            select(Job).where(Job.id == job_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            return None
            
        return self._job_to_response(job)

    def get_user_job_posts(self, user_id: int, page: int = 1, per_page: int = 10) -> JobPostListResponse:
        """Get job posts created by a specific user"""
        offset = (page - 1) * per_page
        
        # Get total count
        count_result =  self.db.execute(
            select(func.count(Job.id)).where(Job.posted_by == user_id)
        )
        total = count_result.scalar()
        
        # Get jobs
        result = self.db.execute(
            select(Job)
            .where(Job.posted_by == user_id)
            .order_by(Job.created_at.desc())
            .offset(offset)
            .limit(per_page)
        )
        jobs = result.scalars().all()
        
        job_responses = [ self._job_to_response(job) for job in jobs]
        
        return JobPostListResponse(
            jobs=job_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page
        )

    def get_active_job_posts(self, page: int = 1, per_page: int = 10, 
                                 job_type: Optional[str] = None,
                                 location: Optional[str] = None,
                                 experience_level: Optional[str] = None) -> JobPostListResponse:
        """Get active job posts with optional filters"""
        offset = (page - 1) * per_page
        
        # Build query
        query = select(Job).where(Job.is_active == True)
        
        if job_type:
            query = query.where(Job.job_type == job_type)
        if location:
            query = query.where(Job.location.ilike(f"%{location}%"))
        if experience_level:
            query = query.where(Job.experience_level == experience_level)
        
        # Get total count
        count_query = select(func.count(Job.id)).where(Job.is_active == True)
        
        if job_type:
            count_query = count_query.where(Job.job_type == job_type)
        if location:
            count_query = count_query.where(Job.location.ilike(f"%{location}%"))
        if experience_level:
            count_query = count_query.where(Job.experience_level == experience_level)
        
        count_result =  self.db.execute(count_query)
        total = count_result.scalar()
        
        # Get jobs
        result = self.db.execute(
            query.order_by(Job.created_at.desc())
            .offset(offset)
            .limit(per_page)
        )
        jobs = result.scalars().all()
        
        job_responses = [ self._job_to_response(job) for job in jobs]
        
        return JobPostListResponse(
            jobs=job_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page
        )

    def update_job_post(self, job_id: int, user_id: int, job_data: JobPostUpdate) -> Optional[JobPostResponse]:
        """Update a job posting (only by the user who created it)"""
        # First check if the job exists and belongs to the user
        result = self.db.execute(
            select(Job).where(Job.id == job_id, Job.posted_by == user_id)
        )
        job = result.scalar_one_or_none()
        
        if not job:
            return None
        
        # Prepare update data
        update_data = job_data.dict(exclude_unset=True)
        
        # Convert skills list to JSON string if provided
        if 'skills_required' in update_data and update_data['skills_required'] is not None:
            update_data['skills_required'] = json.dumps(update_data['skills_required'])
        
        # Convert enum values to strings
        if 'job_type' in update_data and update_data['job_type'] is not None:
            update_data['job_type'] = update_data['job_type'].value
        if 'experience_level' in update_data and update_data['experience_level'] is not None:
            update_data['experience_level'] = update_data['experience_level'].value
        
        # Update the job
        self.db.execute(
            update(Job)
            .where(Job.id == job_id, Job.posted_by == user_id)
            .values(**update_data)
        )
        
        self.db.commit()
        
        # Return updated job
        return self.get_job_post(job_id)

    def delete_job_post(self, job_id: int, user_id: int) -> bool:
        """Soft delete a job posting (only by the user who created it)"""
        result = self.db.execute(
            update(Job)
            .where(Job.id == job_id, Job.posted_by == user_id)
            .values(is_active=False)
        )
        
        if result.rowcount == 0:
            return False
            
        self.db.commit()
        return True

    def increment_job_views(self, job_id: int) -> None:
        """Increment the view count for a job posting"""
        self.db.execute(
            update(Job)
            .where(Job.id == job_id)
            .values(views=Job.views + 1)
        )
        self.db.commit()

    def _job_to_response(self, job: Job) -> JobPostResponse:
        """Convert Job model to JobPostResponse"""
        # Parse skills from JSON string
        skills = []
        if job.skills_required:
            try:
                skills = json.loads(job.skills_required)
            except (json.JSONDecodeError, TypeError):
                skills = []
        
        return JobPostResponse(
            id=job.id,
            title=job.title,
            company=job.company,
            location=job.location,
            job_type=job.job_type,
            salary_min=job.salary_min,
            salary_max=job.salary_max,
            currency=job.currency,
            description=job.description,
            requirements=job.requirements,
            benefits=job.benefits,
            skills_required=skills,
            experience_level=job.experience_level,
            remote_work=job.remote_work,
            application_deadline=job.application_deadline,
            contact_email=job.contact_email,
            department=job.department,
            job_link=job.job_link,
            max_applicants=job.max_applicants,
            is_active=job.is_active,
            views=job.views,
            applications_count=job.applications_count,
            created_at=job.created_at,
            updated_at=job.updated_at,
            posted_by=job.posted_by
        )

