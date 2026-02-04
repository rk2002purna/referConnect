from typing import List, Optional, Dict, Any
from sqlmodel import select, and_, or_, func
from sqlmodel import Session
from fastapi import HTTPException, status
import json
from datetime import datetime

from app.models.notification import Notification, NotificationPreferences
from app.schemas.notification import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    NotificationListResponse, NotificationPreferences as NotificationPreferencesSchema,
    NotificationType, NotificationChannel, NotificationPriority
)


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create_notification(self, notification_data: NotificationCreate) -> NotificationResponse:
        """Create a new notification."""
        # Convert channels list to JSON string
        channels_json = json.dumps(notification_data.channels)
        
        notification = Notification(
            recipient_id=notification_data.recipient_id,
            sender_id=notification_data.sender_id,
            title=notification_data.title,
            message=notification_data.message,
            notification_type=notification_data.notification_type,
            priority=notification_data.priority,
            channels=channels_json,
            notification_metadata=notification_data.metadata or {}
        )

        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)

        return self._convert_to_response(notification)

    def get_notifications(
        self, 
        user_id: int, 
        skip: int = 0, 
        limit: int = 100,
        unread_only: bool = False,
        notification_type: Optional[str] = None
    ) -> NotificationListResponse:
        """Get notifications for a user."""
        query = select(Notification).where(Notification.recipient_id == user_id)
        
        if unread_only:
            query = query.where(Notification.is_read == False)
        
        if notification_type:
            query = query.where(Notification.notification_type == notification_type)
        
        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get unread count
        unread_query = select(func.count()).where(
            and_(
                Notification.recipient_id == user_id,
                Notification.is_read == False
            )
        )
        unread_result = self.db.execute(unread_query)
        unread_count = unread_result.scalar()
        
        # Apply pagination and ordering
        query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
        
        result = self.db.execute(query)
        notifications = result.scalars().all()
        
        # Convert to response objects
        notification_responses = [self._convert_to_response(n) for n in notifications]
        
        pages = (total + limit - 1) // limit
        
        return NotificationListResponse(
            notifications=notification_responses,
            total=total,
            unread_count=unread_count,
            page=(skip // limit) + 1,
            size=limit,
            pages=pages
        )

    def mark_as_read(self, notification_id: int, user_id: int) -> NotificationResponse:
        """Mark a notification as read."""
        result = self.db.execute(
            select(Notification).where(
                and_(
                    Notification.id == notification_id,
                    Notification.recipient_id == user_id
                )
            )
        )
        notification = result.scalar_one_or_none()
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        return self._convert_to_response(notification)

    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user."""
        result = self.db.execute(
            select(Notification).where(
                and_(
                    Notification.recipient_id == user_id,
                    Notification.is_read == False
                )
            )
        )
        notifications = result.scalars().all()
        
        count = 0
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            self.db.add(notification)
            count += 1
        
        self.db.commit()
        return count

    def archive_notification(self, notification_id: int, user_id: int) -> NotificationResponse:
        """Archive a notification."""
        result = self.db.execute(
            select(Notification).where(
                and_(
                    Notification.id == notification_id,
                    Notification.recipient_id == user_id
                )
            )
        )
        notification = result.scalar_one_or_none()
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        notification.is_archived = True
        
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        
        return self._convert_to_response(notification)

    def get_notification_preferences(self, user_id: int) -> NotificationPreferencesSchema:
        """Get notification preferences for a user."""
        result = self.db.execute(
            select(NotificationPreferences).where(NotificationPreferences.user_id == user_id)
        )
        preferences = result.scalar_one_or_none()
        
        if not preferences:
            # Create default preferences
            preferences = NotificationPreferences(user_id=user_id)
            self.db.add(preferences)
            self.db.commit()
            self.db.refresh(preferences)
        
        return NotificationPreferencesSchema(
            user_id=preferences.user_id,
            email_notifications=preferences.email_notifications,
            in_app_notifications=preferences.in_app_notifications,
            sms_notifications=preferences.sms_notifications,
            push_notifications=preferences.push_notifications,
            referral_notifications=preferences.referral_notifications,
            job_notifications=preferences.job_notifications,
            system_notifications=preferences.system_notifications
        )

    def update_notification_preferences(
        self, 
        user_id: int, 
        preferences_data: NotificationPreferencesSchema
    ) -> NotificationPreferencesSchema:
        """Update notification preferences for a user."""
        result = self.db.execute(
            select(NotificationPreferences).where(NotificationPreferences.user_id == user_id)
        )
        preferences = result.scalar_one_or_none()
        
        if not preferences:
            preferences = NotificationPreferences(user_id=user_id)
            self.db.add(preferences)
        
        # Update preferences
        preferences.email_notifications = preferences_data.email_notifications
        preferences.in_app_notifications = preferences_data.in_app_notifications
        preferences.sms_notifications = preferences_data.sms_notifications
        preferences.push_notifications = preferences_data.push_notifications
        preferences.referral_notifications = preferences_data.referral_notifications
        preferences.job_notifications = preferences_data.job_notifications
        preferences.system_notifications = preferences_data.system_notifications
        preferences.updated_at = datetime.utcnow()
        
        self.db.add(preferences)
        self.db.commit()
        self.db.refresh(preferences)
        
        return NotificationPreferencesSchema(
            user_id=preferences.user_id,
            email_notifications=preferences.email_notifications,
            in_app_notifications=preferences.in_app_notifications,
            sms_notifications=preferences.sms_notifications,
            push_notifications=preferences.push_notifications,
            referral_notifications=preferences.referral_notifications,
            job_notifications=preferences.job_notifications,
            system_notifications=preferences.system_notifications
        )

    def send_referral_notification(
        self, 
        recipient_id: int, 
        sender_id: int, 
        job_title: str,
        referral_id: int
    ) -> NotificationResponse:
        """Send notification for new referral."""
        notification_data = NotificationCreate(
            recipient_id=recipient_id,
            sender_id=sender_id,
            title="New Referral Received",
            message=f"You have been referred for the position: {job_title}",
            notification_type=NotificationType.referral_received,
            priority=NotificationPriority.medium,
            channels=[NotificationChannel.in_app, NotificationChannel.email],
            metadata={"referral_id": referral_id, "job_title": job_title}
        )
        
        return self.create_notification(notification_data)

    def send_referral_status_notification(
        self, 
        recipient_id: int, 
        sender_id: int, 
        job_title: str,
        status: str,
        referral_id: int
    ) -> NotificationResponse:
        """Send notification for referral status update."""
        status_messages = {
            "submitted": "Your referral has been submitted for review",
            "under_review": "Your referral is under review",
            "interview_scheduled": "Interview has been scheduled for your referral",
            "hired": "Congratulations! Your referral has been hired",
            "rejected": "Your referral was not selected for this position"
        }
        
        message = status_messages.get(status, f"Your referral status has been updated to: {status}")
        
        notification_data = NotificationCreate(
            recipient_id=recipient_id,
            sender_id=sender_id,
            title="Referral Status Update",
            message=f"{message} for position: {job_title}",
            notification_type=NotificationType.referral_status_update,
            priority=NotificationPriority.medium,
            channels=[NotificationChannel.in_app, NotificationChannel.email],
            metadata={"referral_id": referral_id, "job_title": job_title, "status": status}
        )
        
        return self.create_notification(notification_data)

    def _convert_to_response(self, notification: Notification) -> NotificationResponse:
        """Convert Notification model to NotificationResponse."""
        # Parse channels from JSON string
        try:
            channels = json.loads(notification.channels) if notification.channels else []
        except (json.JSONDecodeError, TypeError):
            channels = [NotificationChannel.in_app]
        
        return NotificationResponse(
            id=notification.id,
            recipient_id=notification.recipient_id,
            sender_id=notification.sender_id,
            title=notification.title,
            message=notification.message,
            notification_type=notification.notification_type,
            priority=notification.priority,
            channels=channels,
            metadata=notification.notification_metadata or {},
            is_read=notification.is_read,
            is_archived=notification.is_archived,
            sent_at=notification.sent_at,
            read_at=notification.read_at,
            created_at=notification.created_at,
            updated_at=notification.updated_at
        )
