from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User, UserRole, Employee, JobSeeker
from app.schemas.referral import (
    ReferralCreate, ReferralUpdate, ReferralResponse, ReferralDetailResponse,
    ReferralSearchParams, ReferralListResponse, ReferralStatsResponse
)
from app.services.referral_service import ReferralService

router = APIRouter()


@router.post("/", response_model=ReferralResponse)
async def create_referral(
    referral_data: ReferralCreate,
    current_user: User = Depends(require_role([UserRole.employee])),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new referral."""
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
    
    referral_service = ReferralService(db)
    referral = await referral_service.create_referral(referral_data, employee[0])
    return referral


@router.get("/", response_model=ReferralListResponse)
async def search_referrals(
    status: str = Query(None, description="Filter by referral status"),
    job_id: int = Query(None, description="Filter by job ID"),
    seeker_id: int = Query(None, description="Filter by job seeker ID"),
    employee_id: int = Query(None, description="Filter by employee ID"),
    company_id: int = Query(None, description="Filter by company ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Search and filter referrals."""
    search_params = ReferralSearchParams(
        status=status,
        job_id=job_id,
        seeker_id=seeker_id,
        employee_id=employee_id,
        company_id=company_id,
        page=page,
        size=size
    )
    
    referral_service = ReferralService(db)
    referrals, total = await referral_service.search_referrals(search_params)
    
    # Convert to detail responses
    referral_details = []
    for referral in referrals:
        referral_detail = await referral_service.get_referral_with_details(referral.id)
        if referral_detail:
            referral_details.append(referral_detail)
    
    pages = (total + size - 1) // size
    
    return ReferralListResponse(
        referrals=referral_details,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{referral_id}", response_model=ReferralDetailResponse)
async def get_referral(
    referral_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get referral details by ID."""
    referral_service = ReferralService(db)
    referral = await referral_service.get_referral_with_details(referral_id)
    
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found"
        )
    
    return referral


@router.put("/{referral_id}", response_model=ReferralResponse)
async def update_referral(
    referral_id: int,
    referral_data: ReferralUpdate,
    current_user: User = Depends(require_role([UserRole.employee])),
    db: AsyncSession = Depends(get_db_session)
):
    """Update referral status."""
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
    
    referral_service = ReferralService(db)
    referral = await referral_service.update_referral(referral_id, referral_data, employee[0])
    return referral


@router.get("/my/referrals", response_model=List[ReferralResponse])
async def get_my_referrals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(require_role([UserRole.employee])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get referrals made by current user."""
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
    
    referral_service = ReferralService(db)
    referrals = await referral_service.get_employee_referrals(employee[0], skip=skip, limit=limit)
    return referrals


@router.get("/my/received", response_model=List[ReferralResponse])
async def get_my_received_referrals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(require_role([UserRole.jobseeker])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get referrals received by current user."""
    # Get job seeker profile
    seeker_result = await db.execute(
        text("SELECT id FROM job_seekers WHERE user_id = :user_id"),
        {"user_id": current_user.id}
    )
    seeker = seeker_result.fetchone()
    
    if not seeker:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job seeker profile not found"
        )
    
    referral_service = ReferralService(db)
    referrals = await referral_service.get_seeker_referrals(seeker[0], skip=skip, limit=limit)
    return referrals


@router.get("/stats/overview", response_model=ReferralStatsResponse)
async def get_referral_stats(
    current_user: User = Depends(require_role([UserRole.employee])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get referral statistics for current user."""
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
    
    referral_service = ReferralService(db)
    stats = await referral_service.get_referral_stats(employee[0])
    return stats


@router.get("/stats/global", response_model=ReferralStatsResponse)
async def get_global_referral_stats(
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get global referral statistics (admin only)."""
    referral_service = ReferralService(db)
    stats = await referral_service.get_referral_stats()
    return stats
