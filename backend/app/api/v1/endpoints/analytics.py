from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.analytics import (
    AnalyticsRequest, DashboardData, Leaderboard, TrendData
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    time_range: str = Query("last_30_days", description="Time range for analytics"),
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get comprehensive dashboard analytics (admin only)."""
    request = AnalyticsRequest(
        time_range=time_range,
        company_id=company_id,
        user_id=user_id
    )
    
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_dashboard_data(request)


@router.get("/referrals")
async def get_referral_analytics(
    time_range: str = Query("last_30_days", description="Time range for analytics"),
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get referral analytics."""
    request = AnalyticsRequest(
        time_range=time_range,
        company_id=company_id
    )
    
    analytics_service = AnalyticsService(db)
    dashboard_data = await analytics_service.get_dashboard_data(request)
    return dashboard_data.referral_analytics


@router.get("/jobs")
async def get_job_analytics(
    time_range: str = Query("last_30_days", description="Time range for analytics"),
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get job analytics."""
    request = AnalyticsRequest(
        time_range=time_range,
        company_id=company_id
    )
    
    analytics_service = AnalyticsService(db)
    dashboard_data = await analytics_service.get_dashboard_data(request)
    return dashboard_data.job_analytics


@router.get("/users")
async def get_user_analytics(
    time_range: str = Query("last_30_days", description="Time range for analytics"),
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get user analytics (admin only)."""
    request = AnalyticsRequest(time_range=time_range)
    
    analytics_service = AnalyticsService(db)
    dashboard_data = await analytics_service.get_dashboard_data(request)
    return dashboard_data.user_analytics


@router.get("/companies")
async def get_company_analytics(
    time_range: str = Query("last_30_days", description="Time range for analytics"),
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get company analytics (admin only)."""
    request = AnalyticsRequest(time_range=time_range)
    
    analytics_service = AnalyticsService(db)
    dashboard_data = await analytics_service.get_dashboard_data(request)
    return dashboard_data.company_analytics


@router.get("/leaderboard/{leaderboard_type}", response_model=Leaderboard)
async def get_leaderboard(
    leaderboard_type: str,
    limit: int = Query(10, ge=1, le=100, description="Number of entries to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get leaderboard data."""
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_leaderboard(leaderboard_type, limit)


@router.get("/trends/{metric}")
async def get_trend_data(
    metric: str,
    time_range: str = Query("last_30_days", description="Time range for trend analysis"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get trend data for a specific metric."""
    # This would implement trend analysis for various metrics
    # For now, return placeholder data
    return {
        "metric": metric,
        "trend_direction": "up",
        "percentage_change": 15.5,
        "values": [
            {"date": "2025-01-01", "value": 100},
            {"date": "2025-01-02", "value": 105},
            {"date": "2025-01-03", "value": 110}
        ]
    }


@router.get("/my/stats")
async def get_my_analytics(
    time_range: str = Query("last_30_days", description="Time range for analytics"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get analytics for current user."""
    request = AnalyticsRequest(
        time_range=time_range,
        user_id=current_user.id
    )
    
    analytics_service = AnalyticsService(db)
    dashboard_data = await analytics_service.get_dashboard_data(request)
    
    return {
        "user_id": current_user.id,
        "referral_analytics": dashboard_data.referral_analytics,
        "job_analytics": dashboard_data.job_analytics
    }

