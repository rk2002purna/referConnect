from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

class JobRecommendationResponse(BaseModel):
    id: int
    title: str
    company: str
    location: str
    match_score: float
    skills: List[str]
    salary: Optional[str] = None
    type: str
    posted_at: str
    description: str

class ActivityFeedResponse(BaseModel):
    id: int
    type: str
    title: str
    description: str
    timestamp: str
    status: str
    action_url: Optional[str] = None

class SavedSearchCreate(BaseModel):
    name: str
    query: str
    filters: Optional[Dict[str, Any]] = None

class SavedSearchResponse(BaseModel):
    id: int
    name: str
    query: str
    filters: Dict[str, Any]
    last_run: Optional[str] = None
    new_results: int

class ProfileCompletionResponse(BaseModel):
    completion_percentage: int
    completed_sections: List[str]
    missing_sections: List[str]

class DashboardStatsResponse(BaseModel):
    # Job Seeker Stats
    applications_total: Optional[int] = None
    applications_pending: Optional[int] = None
    referrals_total: Optional[int] = None
    referrals_pending: Optional[int] = None
    referrals_accepted: Optional[int] = None
    saved_jobs: Optional[int] = None
    
    # Employee Stats
    jobs_total: Optional[int] = None
    jobs_active: Optional[int] = None
    success_rate: Optional[float] = None
    
    # Admin Stats
    users_total: Optional[int] = None
    platform_health: Optional[float] = None
    
    # Common
    profile_completion: Optional[int] = None

class JobSeekerDashboardData(BaseModel):
    recommendations: List[JobRecommendationResponse]
    activity_feed: List[ActivityFeedResponse]
    saved_searches: List[SavedSearchResponse]
    stats: DashboardStatsResponse
    profile_completion: ProfileCompletionResponse

class EmployeeDashboardData(BaseModel):
    job_postings: List[Dict[str, Any]]
    referral_requests: List[Dict[str, Any]]
    activity_feed: List[ActivityFeedResponse]
    stats: DashboardStatsResponse

class AdminDashboardData(BaseModel):
    platform_stats: DashboardStatsResponse
    recent_activity: List[ActivityFeedResponse]
    system_health: Dict[str, Any]

class DashboardOverview(BaseModel):
    user_id: int
    user_role: str
    data: Dict[str, Any]
    last_updated: str
