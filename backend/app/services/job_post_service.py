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
        # Get user's employee profile to get employee_id and company_id
        from ..models.user import Employee
        employee_result = self.db.execute(
            select(Employee).where(Employee.user_id == user_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            raise ValueError("User does not have an employee profile")
        
        if not employee.company_id:
            raise ValueError("Employee does not have a company_id")
        
        # Convert skills list to comma-separated string
        skills_str = ','.join(job_data.skills_required) if job_data.skills_required else ''
        
        job = Job(
            title=job_data.title,
            description=job_data.description,
            location=job_data.location,
            employment_type=job_data.job_type.value,
            skills=skills_str,
            min_experience=0,  # You can map this from experience_level if needed
            company_id=employee.company_id,
            employee_id=employee.id,
            is_active=True,
            job_link=job_data.job_link if hasattr(job_data, 'job_link') else None
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
        
        # Get user's employee_id first
        from ..models.user import Employee
        employee_result = self.db.execute(
            select(Employee).where(Employee.user_id == user_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            return JobPostListResponse(
                jobs=[],
                total=0,
                page=page,
                per_page=per_page,
                total_pages=0
            )
        
        # Get total count
        count_result = self.db.execute(
            select(func.count(Job.id)).where(Job.employee_id == employee.id)
        )
        total = count_result.scalar() or 0
        
        # Get jobs
        result = self.db.execute(
            select(Job)
            .where(Job.employee_id == employee.id)
            .order_by(Job.created_at.desc())
            .offset(offset)
            .limit(per_page)
        )
        jobs = result.scalars().all()
        
        job_responses = [self._job_to_response(job) for job in jobs]
        
        return JobPostListResponse(
            jobs=job_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page if total > 0 else 0
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
        # Parse skills from comma-separated string
        skills = job.skills.split(',') if job.skills else []
        skills = [s.strip() for s in skills if s.strip()]  # Remove empty strings and whitespace
        
        # Get company name from company_id
        from ..models.user import Company
        company_result = self.db.execute(
            select(Company).where(Company.id == job.company_id)
        )
        company = company_result.scalar_one_or_none()
        company_name = company.name if company else "Unknown Company"
        
        return JobPostResponse(
            id=job.id,
            title=job.title,
            company=company_name,
            location=job.location,
            job_type=job.employment_type,
            salary_min=None,  # Not in current schema
            salary_max=None,  # Not in current schema
            currency="USD",
            description=job.description,
            requirements=None,  # Not in current schema
            benefits=None,  # Not in current schema
            skills_required=skills,
            experience_level="mid",  # You can map from min_experience if needed
            remote_work=False,  # Not in current schema
            application_deadline=None,  # Not in current schema
            contact_email="",  # Not in current schema
            department=None,  # Not in current schema
            job_link=job.job_link,
            max_applicants=None,  # Not in current schema
            is_active=job.is_active,
            views=0,  # Not in current schema
            applications_count=0,  # Not in current schema
            created_at=job.created_at,
            updated_at=job.updated_at,
            posted_by=job.employee_id  # Using employee_id instead of user_id
        )

