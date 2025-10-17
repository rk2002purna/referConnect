from __future__ import annotations

from datetime import datetime
from typing import Optional, Dict, Any
from sqlmodel import SQLModel, Field, Column, JSON

from .base import TimestampedModel


class Notification(TimestampedModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    recipient_id: int = Field(index=True)
    sender_id: Optional[int] = Field(default=None, index=True)
    title: str = Field(max_length=200)
    message: str = Field(max_length=1000)
    notification_type: str = Field(max_length=50, index=True)
    priority: str = Field(default="medium", max_length=20)
    channels: str = Field(default="in_app", max_length=100)  # JSON string
    notification_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    is_read: bool = Field(default=False, index=True)
    is_archived: bool = Field(default=False, index=True)
    sent_at: Optional[datetime] = Field(default=None)
    read_at: Optional[datetime] = Field(default=None)


class NotificationPreferences(SQLModel, table=True):
    __tablename__ = "notification_preferences"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(unique=True, index=True)
    email_notifications: bool = Field(default=True)
    in_app_notifications: bool = Field(default=True)
    sms_notifications: bool = Field(default=False)
    push_notifications: bool = Field(default=True)
    referral_notifications: bool = Field(default=True)
    job_notifications: bool = Field(default=True)
    system_notifications: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
