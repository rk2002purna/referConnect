from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User, UserRole
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (
    JobRecommendationResponse, ActivityFeedResponse, SavedSearchCreate,
    SavedSearchResponse, ProfileCompletionResponse, DashboardStatsResponse,
    JobSeekerDashboardData, EmployeeDashboardData, AdminDashboardData
)

router = APIRouter()

@router.get("/overview", response_model=dict)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get complete dashboard overview based on user role"""
    dashboard_service = DashboardService(db)
    
    if current_user.role == UserRole.jobseeker:
        data = await dashboard_service.get_jobseeker_dashboard_data(current_user.id)
        return {
            "user_id": current_user.id,
            "user_role": current_user.role.value,
            "data": data.dict(),
            "last_updated": "2024-01-15T10:30:00Z"
        }
    elif current_user.role == UserRole.employee:
        data = await dashboard_service.get_employee_dashboard_data(current_user.id)
        return {
            "user_id": current_user.id,
            "user_role": current_user.role.value,
            "data": data.dict(),
            "last_updated": "2024-01-15T10:30:00Z"
        }
    else:  # admin
        data = await dashboard_service.get_admin_dashboard_data()
        return {
            "user_id": current_user.id,
            "user_role": current_user.role.value,
            "data": data.dict(),
            "last_updated": "2024-01-15T10:30:00Z"
        }

@router.get("/recommendations", response_model=List[JobRecommendationResponse])
async def get_job_recommendations(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get personalized job recommendations"""
    if current_user.role != UserRole.jobseeker:
        raise HTTPException(status_code=403, detail="Only job seekers can access recommendations")
    
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_job_recommendations(current_user.id, limit)

@router.get("/activity", response_model=List[ActivityFeedResponse])
async def get_activity_feed(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get user's activity feed"""
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_activity_feed(current_user.id, limit)

@router.post("/activity", response_model=ActivityFeedResponse)
async def create_activity(
    activity_type: str,
    title: str,
    description: str,
    status: str = "new",
    action_url: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new activity in the feed"""
    dashboard_service = DashboardService(db)
    activity = await dashboard_service.create_activity(
        current_user.id, activity_type, title, description, status, action_url
    )
    return ActivityFeedResponse(
        id=activity.id,
        type=activity.activity_type,
        title=activity.title,
        description=activity.description,
        timestamp=activity.created_at.isoformat(),
        status=activity.status,
        action_url=activity.action_url
    )

@router.get("/saved-searches", response_model=List[SavedSearchResponse])
async def get_saved_searches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get user's saved searches"""
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_saved_searches(current_user.id)

@router.post("/saved-searches", response_model=SavedSearchResponse)
async def create_saved_search(
    search_data: SavedSearchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new saved search"""
    dashboard_service = DashboardService(db)
    saved_search = await dashboard_service.create_saved_search(current_user.id, search_data)
    return SavedSearchResponse(
        id=saved_search.id,
        name=saved_search.name,
        query=saved_search.query,
        filters=saved_search.filters or {},
        last_run=saved_search.last_run.isoformat() if saved_search.last_run else None,
        new_results=saved_search.new_results_count
    )

@router.get("/profile-completion", response_model=ProfileCompletionResponse)
async def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get user's profile completion status"""
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_profile_completion(current_user.id)

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get dashboard statistics"""
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_dashboard_stats(current_user.id, current_user.role)

@router.get("/jobseeker", response_model=JobSeekerDashboardData)
async def get_jobseeker_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get job seeker dashboard data"""
    if current_user.role != UserRole.jobseeker:
        raise HTTPException(status_code=403, detail="Only job seekers can access this endpoint")
    
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_jobseeker_dashboard_data(current_user.id)

@router.get("/employee", response_model=EmployeeDashboardData)
async def get_employee_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get employee dashboard data"""
    if current_user.role != UserRole.employee:
        raise HTTPException(status_code=403, detail="Only employees can access this endpoint")
    
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_employee_dashboard_data(current_user.id)

@router.get("/admin", response_model=AdminDashboardData)
async def get_admin_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get admin dashboard data"""
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only admins can access this endpoint")
    
    dashboard_service = DashboardService(db)
    return await dashboard_service.get_admin_dashboard_data()

@router.post("/mark-activity-read/{activity_id}")
async def mark_activity_read(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Mark an activity as read"""
    # This would update the activity in the database
    # For now, return success
    return {"message": "Activity marked as read", "activity_id": activity_id}

@router.post("/mark-all-activities-read")
async def mark_all_activities_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Mark all activities as read"""
    # This would update all activities for the user
    # For now, return success
    return {"message": "All activities marked as read"}
