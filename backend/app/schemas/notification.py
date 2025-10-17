from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class NotificationType(str, Enum):
    referral_received = "referral_received"
    referral_status_update = "referral_status_update"
    job_posted = "job_posted"
    job_application = "job_application"
    system_announcement = "system_announcement"
    profile_update = "profile_update"
    referral_accepted = "referral_accepted"
    referral_rejected = "referral_rejected"


class NotificationPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class NotificationChannel(str, Enum):
    email = "email"
    in_app = "in_app"
    sms = "sms"
    push = "push"


class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=1000)
    notification_type: NotificationType
    priority: NotificationPriority = NotificationPriority.medium
    channels: List[NotificationChannel] = [NotificationChannel.in_app]
    metadata: Dict[str, Any] = {}


class NotificationCreate(NotificationBase):
    recipient_id: int
    sender_id: Optional[int] = None


class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_archived: Optional[bool] = None


class NotificationResponse(NotificationBase):
    id: int
    recipient_id: int
    sender_id: Optional[int]
    is_read: bool = False
    is_archived: bool = False
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    size: int
    pages: int


class EmailTemplate(BaseModel):
    template_id: str
    subject: str
    html_content: str
    text_content: str
    variables: Dict[str, str] = {}


class NotificationPreferences(BaseModel):
    user_id: int
    email_notifications: bool = True
    in_app_notifications: bool = True
    sms_notifications: bool = False
    push_notifications: bool = True
    referral_notifications: bool = True
    job_notifications: bool = True
    system_notifications: bool = True


class NotificationStats(BaseModel):
    total_notifications: int
    unread_notifications: int
    notifications_by_type: Dict[str, int]
    notifications_by_priority: Dict[str, int]
    recent_activity: List[NotificationResponse]

