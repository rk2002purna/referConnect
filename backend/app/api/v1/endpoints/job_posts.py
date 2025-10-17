from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ....db.session import get_db_session
from ....models.user import User
from ....schemas.auth import UserResponse
from ....schemas.job_post import JobPostCreate, JobPostUpdate, JobPostResponse, JobPostListResponse
from ....services.job_post_service import JobPostService
from ....dependencies.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=JobPostResponse, status_code=201)
async def create_job_post(
    job_data: JobPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new job posting"""
    if current_user.role != 'employee':
        raise HTTPException(status_code=403, detail="Only employees can post jobs")
    
    service = JobPostService(db)
    return await service.create_job_post(current_user.id, job_data)

@router.get("/", response_model=JobPostListResponse)
async def get_job_posts(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    location: Optional[str] = Query(None, description="Filter by location"),
    experience_level: Optional[str] = Query(None, description="Filter by experience level"),
    db: AsyncSession = Depends(get_db_session)
):
    """Get active job posts with optional filters"""
    service = JobPostService(db)
    return await service.get_active_job_posts(
        page=page,
        per_page=per_page,
        job_type=job_type,
        location=location,
        experience_level=experience_level
    )

@router.get("/my-jobs", response_model=JobPostListResponse)
async def get_my_job_posts(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get job posts created by the current user"""
    if current_user.role != 'employee':
        raise HTTPException(status_code=403, detail="Only employees can access this endpoint")
    
    service = JobPostService(db)
    return await service.get_user_job_posts(current_user.id, page=page, per_page=per_page)

@router.get("/{job_id}", response_model=JobPostResponse)
async def get_job_post(
    job_id: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific job posting by ID"""
    service = JobPostService(db)
    job = await service.get_job_post(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
    
    # Increment view count
    await service.increment_job_views(job_id)
    
    return job

@router.put("/{job_id}", response_model=JobPostResponse)
async def update_job_post(
    job_id: int,
    job_data: JobPostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update a job posting"""
    if current_user.role != 'employee':
        raise HTTPException(status_code=403, detail="Only employees can update jobs")
    
    service = JobPostService(db)
    job = await service.update_job_post(job_id, current_user.id, job_data)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found or you don't have permission to update it")
    
    return job

@router.delete("/{job_id}", status_code=204)
async def delete_job_post(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a job posting (soft delete)"""
    if current_user.role != 'employee':
        raise HTTPException(status_code=403, detail="Only employees can delete jobs")
    
    service = JobPostService(db)
    success = await service.delete_job_post(job_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Job posting not found or you don't have permission to delete it")
    
    return None
