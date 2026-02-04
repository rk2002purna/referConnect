from typing import Optional, List, Tuple
from sqlmodel import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import Job, Employee, Company, User
from app.schemas.job import JobCreate, JobUpdate, JobSearchParams


class JobService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_job(self, job_data: JobCreate, posted_by_employee_id: int) -> Job:
        """Create a new job posting."""
        # Get employee and company
        employee_result = await self.db.execute(
            select(Employee).where(Employee.id == posted_by_employee_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )

        # Get company
        company_result = await self.db.execute(
            select(Company).where(Company.id == employee.company_id)
        )
        company = company_result.scalar_one_or_none()
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

        job = Job(
            title=job_data.title,
            description=job_data.description,
            location=job_data.location,
            employment_type=job_data.employment_type,
            skills=job_data.skills,
            min_experience=job_data.min_experience,
            company_id=company.id,
            posted_by_employee_id=posted_by_employee_id,
            is_active=True
        )

        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def get_job_by_id(self, job_id: int) -> Optional[Job]:
        """Get job by ID."""
        result = await self.db.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    async def update_job(self, job_id: int, job_data: JobUpdate, employee_id: int) -> Job:
        """Update job posting."""
        job = await self.get_job_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )

        # Check if employee can update this job
        if job.posted_by_employee_id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this job"
            )

        update_data = job_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job, field, value)

        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job

    async def delete_job(self, job_id: int, employee_id: int) -> bool:
        """Delete job posting (soft delete)."""
        job = await self.get_job_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )

        # Check if employee can delete this job
        if job.posted_by_employee_id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this job"
            )

        # Soft delete
        job.is_active = False
        self.db.add(job)
        await self.db.commit()
        return True

    async def search_jobs(self, search_params: JobSearchParams) -> Tuple[List[Job], int]:
        """Search jobs with filters."""
        query = select(Job)
        
        # Apply filters
        if search_params.is_active is not None:
            query = query.where(Job.is_active == search_params.is_active)
        
        if search_params.location:
            query = query.where(Job.location.ilike(f"%{search_params.location}%"))
        
        if search_params.employment_type:
            query = query.where(Job.employment_type == search_params.employment_type)
        
        if search_params.min_experience is not None:
            query = query.where(Job.min_experience <= search_params.min_experience)
        
        if search_params.company_id:
            query = query.where(Job.company_id == search_params.company_id)
        
        if search_params.skills:
            skill_conditions = []
            for skill in search_params.skills:
                skill_conditions.append(Job.skills.ilike(f"%{skill}%"))
            if skill_conditions:
                query = query.where(or_(*skill_conditions))
        
        if search_params.query:
            search_term = f"%{search_params.query}%"
            query = query.where(
                or_(
                    Job.title.ilike(search_term),
                    Job.description.ilike(search_term),
                    Job.skills.ilike(search_term)
                )
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        query = query.offset((search_params.page - 1) * search_params.size).limit(search_params.size)
        
        # Order by created_at desc
        query = query.order_by(Job.created_at.desc())

        result = await self.db.execute(query)
        jobs = result.scalars().all()
        
        return jobs, total

    async def get_job_with_details(self, job_id: int) -> Optional[Job]:
        """Get job with company and employee details."""
        job = await self.get_job_by_id(job_id)
        if not job:
            return None

        # Return job as-is for now - we'll handle details in the response model
        return job

    async def get_company_jobs(self, company_id: int, skip: int = 0, limit: int = 100) -> List[Job]:
        """Get jobs for a specific company."""
        query = select(Job).where(
            and_(Job.company_id == company_id, Job.is_active == True)
        ).offset(skip).limit(limit).order_by(Job.created_at.desc())

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_employee_jobs(self, employee_id: int, skip: int = 0, limit: int = 100) -> List[Job]:
        """Get jobs posted by a specific employee."""
        query = select(Job).where(Job.employee_id == employee_id).offset(skip).limit(limit).order_by(Job.created_at.desc())

        result = await self.db.execute(query)
        return result.scalars().all()
