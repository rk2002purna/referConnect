from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, Column, JSON
from app.models.base import TimestampedModel

class JobRecommendation(TimestampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="users.id")
    job_id: int = Field(index=True, foreign_key="jobs.id")
    match_score: float = Field(ge=0, le=100)
    recommendation_reasons: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    is_viewed: bool = Field(default=False)
    is_applied: bool = Field(default=False)
    is_saved: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # user: "User" = Relationship(back_populates="job_recommendations")
    # job: "Job" = Relationship(back_populates="recommendations")

class ActivityFeed(TimestampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="users.id")
    activity_type: str = Field(max_length=50, index=True)  # application, referral, message, recommendation, profile
    title: str = Field(max_length=200)
    description: str = Field(max_length=1000)
    status: str = Field(default="new", max_length=20)  # new, read, action_required
    action_url: Optional[str] = Field(default=None, max_length=500)
    activity_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    is_read: bool = Field(default=False, index=True)
    read_at: Optional[datetime] = Field(default=None)

    # user: "User" = Relationship(back_populates="activity_feed")

class SavedSearch(TimestampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="users.id")
    name: str = Field(max_length=100)
    query: str = Field(max_length=500)
    filters: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    last_run: Optional[datetime] = Field(default=None)
    new_results_count: int = Field(default=0)
    is_active: bool = Field(default=True)

    # user: "User" = Relationship(back_populates="saved_searches")

class UserProfileCompletion(TimestampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="users.id", unique=True)
    completion_percentage: int = Field(ge=0, le=100)
    completed_sections: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    missing_sections: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    last_updated: datetime = Field(default_factory=datetime.utcnow)

    # user: "User" = Relationship(back_populates="profile_completion")

class DashboardStats(TimestampedModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="users.id")
    stats_type: str = Field(max_length=50)  # applications, referrals, jobs, etc.
    stats_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    period: str = Field(default="all_time", max_length=20)  # daily, weekly, monthly, all_time
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

    # user: "User" = Relationship(back_populates="dashboard_stats")
