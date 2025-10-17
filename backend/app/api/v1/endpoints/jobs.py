from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User, UserRole, Employee
from app.schemas.job import (
    JobCreate, JobUpdate, JobResponse, JobDetailResponse, JobSearchParams, JobListResponse
)
from app.services.job_service import JobService

router = APIRouter()


@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(require_role([UserRole.employee])),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new job posting."""
    # Get employee profile
    employee_result = await db.execute(
        text("SELECT id FROM employees WHERE user_id = :user_id"),
        {"user_id": current_user.id}
    )
    employee = employee_result.fetchone()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee profile not found. Please create your employee profile first."
        )
    
    job_service = JobService(db)
    job = await job_service.create_job(job_data, employee[0])
    return job


@router.get("/", response_model=JobListResponse)
async def search_jobs(
    query: str = Query(None, description="Search term for title, description, or skills"),
    location: str = Query(None, description="Job location filter"),
    employment_type: str = Query(None, description="Employment type filter"),
    min_experience: int = Query(None, ge=0, le=50, description="Minimum years of experience"),
    skills: str = Query(None, description="Comma-separated skills to filter by"),
    company_id: int = Query(None, description="Filter by company ID"),
    is_active: bool = Query(True, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Search and filter jobs."""
    # Parse skills if provided
    skills_list = None
    if skills:
        skills_list = [skill.strip() for skill in skills.split(",") if skill.strip()]
    
    search_params = JobSearchParams(
        query=query,
        location=location,
        employment_type=employment_type,
        min_experience=min_experience,
        skills=skills_list,
        company_id=company_id,
        is_active=is_active,
        page=page,
        size=size
    )
    
    job_service = JobService(db)
    jobs, total = await job_service.search_jobs(search_params)
    
    # Convert to detail responses
    job_details = []
    for job in jobs:
        job_detail = await job_service.get_job_with_details(job.id)
        if job_detail:
            job_details.append(job_detail)
    
    pages = (total + size - 1) // size
    
    return JobListResponse(
        jobs=job_details,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{job_id}", response_model=JobDetailResponse)
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get job details by ID."""
    job_service = JobService(db)
    job = await job_service.get_job_with_details(job_id)
    
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return job


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(require_role([UserRole.employee])),
    db: AsyncSession = Depends(get_db_session)
):
    """Update job posting."""
    # Get employee profile
    employee_result = await db.execute(
        text("SELECT id FROM employees WHERE user_id = :user_id"),
        {"user_id": current_user.id}
    )
    employee = employee_result.fetchone()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee profile not found"
        )
    
    job_service = JobService(db)
    job = await job_service.update_job(job_id, job_data, employee[0])
    return job


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    current_user: User = Depends(require_role([UserRole.employee])),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete job posting (soft delete)."""
    # Get employee profile
    employee_result = await db.execute(
        text("SELECT id FROM employees WHERE user_id = :user_id"),
        {"user_id": current_user.id}
    )
    employee = employee_result.fetchone()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee profile not found"
        )
    
    job_service = JobService(db)
    await job_service.delete_job(job_id, employee[0])
    return {"message": "Job deleted successfully"}


@router.get("/my/jobs", response_model=List[JobResponse])
async def get_my_jobs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(require_role([UserRole.employee])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get jobs posted by current user."""
    # Get employee profile
    employee_result = await db.execute(
        text("SELECT id FROM employees WHERE user_id = :user_id"),
        {"user_id": current_user.id}
    )
    employee = employee_result.fetchone()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee profile not found"
        )
    
    job_service = JobService(db)
    jobs = await job_service.get_employee_jobs(employee[0], skip=skip, limit=limit)
    return jobs


@router.get("/company/{company_id}", response_model=List[JobResponse])
async def get_company_jobs(
    company_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get jobs for a specific company."""
    job_service = JobService(db)
    jobs = await job_service.get_company_jobs(company_id, skip=skip, limit=limit)
    return jobs
