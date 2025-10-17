from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.user import (
    UserProfileResponse, UserProfileUpdate, UserListResponse, UserDetailResponse,
    EmployeeProfileCreate, EmployeeProfileUpdate, EmployeeProfileResponse,
    JobSeekerProfileCreate, JobSeekerProfileUpdate, JobSeekerProfileResponse,
    CompanyCreate, CompanyUpdate, CompanyResponse
)
from app.services.user_service import UserService

router = APIRouter()


@router.get("/me", response_model=UserDetailResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current user's detailed profile."""
    user_service = UserService(db)
    user = await user_service.get_user_detail(current_user.id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update current user's profile."""
    user_service = UserService(db)
    user = await user_service.update_user_profile(current_user.id, profile_data)
    return user


@router.get("/me/employee", response_model=EmployeeProfileResponse)
async def get_my_employee_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current user's employee profile."""
    user_service = UserService(db)
    profile = await user_service.get_employee_profile(current_user.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found"
        )
    
    return profile


@router.post("/me/employee", response_model=EmployeeProfileResponse)
async def create_my_employee_profile(
    profile_data: EmployeeProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create current user's employee profile."""
    if current_user.role != UserRole.employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be an employee to create employee profile"
        )
    
    user_service = UserService(db)
    profile = await user_service.create_employee_profile(current_user.id, profile_data)
    return profile


@router.put("/me/employee", response_model=EmployeeProfileResponse)
async def update_my_employee_profile(
    profile_data: EmployeeProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update current user's employee profile."""
    user_service = UserService(db)
    profile = await user_service.update_employee_profile(current_user.id, profile_data)
    return profile


@router.get("/me/jobseeker", response_model=JobSeekerProfileResponse)
async def get_my_jobseeker_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current user's job seeker profile."""
    user_service = UserService(db)
    profile = await user_service.get_job_seeker_profile(current_user.id)
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job seeker profile not found"
        )
    
    return profile


@router.post("/me/jobseeker", response_model=JobSeekerProfileResponse)
async def create_my_jobseeker_profile(
    profile_data: JobSeekerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create current user's job seeker profile."""
    if current_user.role != UserRole.jobseeker:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be a job seeker to create job seeker profile"
        )
    
    user_service = UserService(db)
    profile = await user_service.create_job_seeker_profile(current_user.id, profile_data)
    return profile


@router.put("/me/jobseeker", response_model=JobSeekerProfileResponse)
async def update_my_jobseeker_profile(
    profile_data: JobSeekerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update current user's job seeker profile."""
    user_service = UserService(db)
    profile = await user_service.update_job_seeker_profile(current_user.id, profile_data)
    return profile


@router.get("/", response_model=List[UserListResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: Optional[UserRole] = Query(None),
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """List all users (admin only)."""
    user_service = UserService(db)
    users = await user_service.list_users(skip=skip, limit=limit, role=role)
    return users


@router.get("/{user_id}", response_model=UserDetailResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get user by ID (admin only)."""
    user_service = UserService(db)
    user = await user_service.get_user_detail(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/companies/", response_model=List[CompanyResponse])
async def list_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """List all companies."""
    user_service = UserService(db)
    # This would need to be implemented in UserService
    # For now, return empty list
    return []


@router.post("/companies/", response_model=CompanyResponse)
async def create_company(
    company_data: CompanyCreate,
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new company (admin only)."""
    user_service = UserService(db)
    company = await user_service.get_or_create_company(company_data.domain)
    return company
