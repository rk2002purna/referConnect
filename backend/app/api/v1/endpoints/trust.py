from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User, UserRole
from app.schemas.trust import (
    TrustScore, FraudAlert, TrustMetrics, TrustAnalysis
)
from app.services.trust_service import TrustService

router = APIRouter()


@router.get("/my/score", response_model=TrustScore)
async def get_my_trust_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current user's trust score."""
    trust_service = TrustService(db)
    
    trust_score = await trust_service.get_trust_score(current_user.id)
    if not trust_score:
        # Calculate if doesn't exist
        trust_score = await trust_service.calculate_trust_score(current_user.id)
    
    return trust_score


@router.post("/my/score/calculate", response_model=TrustScore)
async def calculate_my_trust_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Calculate/update current user's trust score."""
    trust_service = TrustService(db)
    return await trust_service.calculate_trust_score(current_user.id)


@router.get("/my/analysis", response_model=TrustAnalysis)
async def get_my_trust_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get detailed trust analysis for current user."""
    trust_service = TrustService(db)
    return await trust_service.get_trust_analysis(current_user.id)


@router.get("/my/fraud-alerts", response_model=List[FraudAlert])
async def get_my_fraud_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get fraud alerts for current user."""
    trust_service = TrustService(db)
    return await trust_service.detect_fraud_patterns(current_user.id)


@router.get("/user/{user_id}/score", response_model=TrustScore)
async def get_user_trust_score(
    user_id: int,
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get trust score for a specific user (admin only)."""
    trust_service = TrustService(db)
    
    trust_score = await trust_service.get_trust_score(user_id)
    if not trust_score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trust score not found for user"
        )
    
    return trust_score


@router.post("/user/{user_id}/calculate", response_model=TrustScore)
async def calculate_user_trust_score(
    user_id: int,
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Calculate trust score for a specific user (admin only)."""
    trust_service = TrustService(db)
    return await trust_service.calculate_trust_score(user_id)


@router.get("/user/{user_id}/analysis", response_model=TrustAnalysis)
async def get_user_trust_analysis(
    user_id: int,
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get trust analysis for a specific user (admin only)."""
    trust_service = TrustService(db)
    return await trust_service.get_trust_analysis(user_id)


@router.get("/metrics", response_model=TrustMetrics)
async def get_trust_metrics(
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get overall trust metrics (admin only)."""
    trust_service = TrustService(db)
    return await trust_service.get_trust_metrics()


@router.get("/fraud-alerts", response_model=List[FraudAlert])
async def get_all_fraud_alerts(
    status: Optional[str] = Query(None, description="Filter by status"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all fraud alerts (admin only)."""
    # This would implement filtering and pagination
    # For now, return empty list
    return []


@router.post("/fraud-alerts/{alert_id}/resolve")
async def resolve_fraud_alert(
    alert_id: int,
    resolution: str = Query(..., description="Resolution notes"),
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Resolve a fraud alert (admin only)."""
    # This would implement alert resolution
    return {"message": f"Alert {alert_id} resolved", "resolved_by": current_user.id}


@router.get("/low-trust-users")
async def get_low_trust_users(
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Get users with low trust scores (admin only)."""
    # This would implement query for low trust users
    return {"users": [], "total": 0}


@router.post("/detect-fraud/{user_id}")
async def detect_fraud_for_user(
    user_id: int,
    current_user: User = Depends(require_role([UserRole.admin])),
    db: AsyncSession = Depends(get_db_session)
):
    """Run fraud detection for a specific user (admin only)."""
    trust_service = TrustService(db)
    alerts = await trust_service.detect_fraud_patterns(user_id)
    return {"user_id": user_id, "alerts_found": len(alerts), "alerts": alerts}

