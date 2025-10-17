from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse, NotificationListResponse, NotificationUpdate,
    NotificationPreferences, NotificationStats
)
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("/", response_model=NotificationListResponse)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    notification_type: Optional[str] = Query(None, description="Filter by notification type"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get notifications for current user."""
    # Simplified implementation for now
    return NotificationListResponse(
        notifications=[],
        total=0,
        unread_count=0,
        page=1,
        size=limit,
        pages=0
    )


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get specific notification by ID."""
    notification_service = NotificationService(db)
    
    # Get notification and check ownership
    result = await db.execute(
        text("SELECT * FROM notifications WHERE id = :id AND recipient_id = :user_id"),
        {"id": notification_id, "user_id": current_user.id}
    )
    notification = result.fetchone()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Mark as read if not already
    if not notification.is_read:
        await notification_service.mark_as_read(notification_id, current_user.id)
    
    return notification


@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int,
    notification_data: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update notification (mark as read/archived)."""
    notification_service = NotificationService(db)
    
    # Get notification and check ownership
    result = await db.execute(
        text("SELECT * FROM notifications WHERE id = :id AND recipient_id = :user_id"),
        {"id": notification_id, "user_id": current_user.id}
    )
    notification = result.fetchone()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Update notification
    if notification_data.is_read is not None:
        if notification_data.is_read:
            return await notification_service.mark_as_read(notification_id, current_user.id)
    
    if notification_data.is_archived is not None and notification_data.is_archived:
        return await notification_service.archive_notification(notification_id, current_user.id)
    
    # Return current notification
    return await notification_service.get_notifications(
        user_id=current_user.id,
        skip=0,
        limit=1
    )


@router.post("/mark-all-read")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Mark all notifications as read for current user."""
    notification_service = NotificationService(db)
    count = await notification_service.mark_all_as_read(current_user.id)
    return {"message": f"Marked {count} notifications as read"}


@router.get("/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get notification preferences for current user."""
    # Simplified implementation for now
    return NotificationPreferences(
        user_id=current_user.id,
        email_notifications=True,
        in_app_notifications=True,
        sms_notifications=False,
        push_notifications=True,
        referral_notifications=True,
        job_notifications=True,
        system_notifications=True
    )


@router.put("/preferences", response_model=NotificationPreferences)
async def update_notification_preferences(
    preferences_data: NotificationPreferences,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update notification preferences for current user."""
    # Simplified implementation for now
    return NotificationPreferences(
        user_id=current_user.id,
        email_notifications=preferences_data.email_notifications,
        in_app_notifications=preferences_data.in_app_notifications,
        sms_notifications=preferences_data.sms_notifications,
        push_notifications=preferences_data.push_notifications,
        referral_notifications=preferences_data.referral_notifications,
        job_notifications=preferences_data.job_notifications,
        system_notifications=preferences_data.system_notifications
    )


@router.get("/stats/overview", response_model=NotificationStats)
async def get_notification_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get notification statistics for current user."""
    # Simplified implementation for now
    return NotificationStats(
        total_notifications=0,
        unread_notifications=0,
        notifications_by_type={},
        notifications_by_priority={},
        recent_activity=[]
    )
