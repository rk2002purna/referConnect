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
from pydantic import BaseModel
from typing import Optional

from app.services.job_service import JobService
from app.services.notification_service import NotificationService

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

    # Fire-and-forget: find top matches and create notifications (simplified)
    try:
        notif_service = NotificationService(db)
        # Find recent jobseeker profiles to consider (simplified to last 100 users)
        seekers_res = await db.execute(
            text(
                """
                SELECT user_id, skills
                FROM jobseeker_profiles
                ORDER BY updated_at DESC NULLS LAST
                LIMIT 100
                """
            )
        )
        seekers = seekers_res.fetchall()
        # Compute naive skill overlap and notify top few
        scored = []
        for s in seekers:
            skills = [t.strip().lower() for t in (s.skills or '').split(',') if t.strip()]
            job_skills = [t.strip().lower() for t in (job.skills or '').split(',') if t.strip()]
            overlap = len([t for t in job_skills if any(ts in t or t in ts for ts in skills)])
            score = overlap / (len(job_skills) or 1)
            if score > 0:
                scored.append((s.user_id, score))
        scored.sort(key=lambda x: x[1], reverse=True)
        top = scored[:10]
        for user_id, score in top:
            await notif_service.create_notification(
                notification_data=
                    # inline object to avoid importing schema; fields match create_notification usage
                    type('Obj', (), {
                        'recipient_id': user_id,
                        'sender_id': current_user.id,
                        'title': f"New Job Match: {job.title}",
                        'message': f"We found a job that matches your skills! Match score: {round(score*100)}%",
                        'notification_type': 'job_posted',
                        'priority': 'high' if score > 0.8 else 'medium',
                        'channels': ['in_app', 'email'],
                        'metadata': { 'job_id': job.id, 'company_id': job.company_id, 'match_score': score }
                    })
            )
    except Exception:
        # Non-blocking best-effort; do not fail job creation
        pass
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

class JobMatchItem(BaseModel):
    job: JobDetailResponse
    match_score: float
    matching_skills: List[str]
    reasons: List[str]

class JobMatchesResponse(BaseModel):
    matches: List[JobMatchItem]
    total: int
    page: int
    size: int
    pages: int

def _calc_skill_match(seeker_skills: List[str], job_skills_csv: Optional[str]):
    if not job_skills_csv:
        return 0.0, []
    job_skills = [s.strip().lower() for s in job_skills_csv.split(',') if s.strip()]
    seeker = [s.strip().lower() for s in seeker_skills]
    matches = [s for s in job_skills if any(ss in s or s in ss for ss in seeker)]
    return (len(matches) / len(job_skills) if job_skills else 0.0), matches

def _calc_experience_match(seeker_years: Optional[int], job_min_years: Optional[int]):
    if seeker_years is None and job_min_years is None:
        return 0.5
    if seeker_years is None:
        return 0.5
    if job_min_years is None:
        return 0.8
    if seeker_years >= job_min_years:
        # better if exceeds requirement slightly
        diff = seeker_years - job_min_years
        return 1.0 if diff >= 0 else max(0.3, 1.0 + diff * 0.1)
    # below requirement
    deficit = job_min_years - seeker_years
    return max(0.3, 1.0 - deficit * 0.15)

@router.get("/matches", response_model=JobMatchesResponse)
async def get_job_matches(
    min_score: float = Query(0.6, ge=0.0, le=1.0),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Return ranked job matches for the current jobseeker."""
    # Basic guard: only jobseekers for now
    if current_user.role != UserRole.jobseeker:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only jobseekers can fetch matches")

    # Fetch jobseeker profile minimal fields
    # Using raw SQL to avoid adding new services; adapt if a profile service is available
    seeker_res = await db.execute(
        text(
            """
            SELECT skills, years_experience, preferred_job_types, location, industries, willing_to_relocate
            FROM jobseeker_profiles
            WHERE user_id = :uid
            """
        ),
        {"uid": current_user.id},
    )
    seeker_row = seeker_res.fetchone()
    seeker_skills = []
    seeker_years = None
    seeker_location = ""
    seeker_pref_types: List[str] = []
    seeker_industries: List[str] = []
    seeker_reloc = True
    if seeker_row:
        seeker_skills = [s.strip() for s in (seeker_row.skills or "").split(',') if s.strip()]
        seeker_years = seeker_row.years_experience
        seeker_location = seeker_row.location or ""
        seeker_pref_types = [s.strip() for s in (seeker_row.preferred_job_types or "").split(',') if s.strip()]
        seeker_industries = [s.strip() for s in (seeker_row.industries or "").split(',') if s.strip()]
        seeker_reloc = bool(seeker_row.willing_to_relocate) if seeker_row.willing_to_relocate is not None else True

    job_service = JobService(db)
    jobs, total = await job_service.search_jobs(
        JobSearchParams(page=page, size=size, is_active=True)
    )

    matches: List[JobMatchItem] = []
    for job in jobs:
        # Convert job to detail response shape
        detail = await job_service.get_job_with_details(job.id)
        if not detail:
            continue
        # Scoring
        reasons: List[str] = []
        skill_score, matching_skills = _calc_skill_match(seeker_skills, job.skills)
        if skill_score > 0.5:
            reasons.append(f"Strong skill match ({round(skill_score*100)}%)")
        exp_score = _calc_experience_match(seeker_years, job.min_experience)
        if exp_score > 0.7:
            reasons.append("Experience matches requirement")
        # Job type preference (simple contains)
        jt_score = 1.0 if (detail.employment_type and str(detail.employment_type) in seeker_pref_types) else (0.5 if seeker_pref_types == [] else 0.2)
        if jt_score > 0.7:
            reasons.append("Job type matches preference")
        # Location (simplified)
        loc_score = 0.2
        if not detail.location:
            loc_score = 0.5
        else:
            dl = detail.location.lower()
            sl = (seeker_location or "").lower()
            if sl and (sl in dl or dl in sl):
                loc_score = 1.0
            elif 'remote' in dl:
                loc_score = 0.9
            elif seeker_reloc:
                loc_score = 0.6
        if loc_score > 0.7:
            reasons.append("Location is a good match")

        # Salary not modeled in current schema; give neutral 0.5
        sal_score = 0.5

        total_score = min(1.0, skill_score*0.4 + exp_score*0.2 + jt_score*0.15 + loc_score*0.15 + sal_score*0.1)
        if total_score >= min_score:
            matches.append(JobMatchItem(
                job=detail,
                match_score=total_score,
                matching_skills=matching_skills,
                reasons=reasons,
            ))

    # Sort by score
    matches.sort(key=lambda m: m.match_score, reverse=True)
    pages = (total + size - 1) // size
    return JobMatchesResponse(matches=matches, total=total, page=page, size=size, pages=pages)
