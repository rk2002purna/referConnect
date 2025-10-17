from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date
from enum import Enum


class TimeRange(str, Enum):
    last_7_days = "last_7_days"
    last_30_days = "last_30_days"
    last_90_days = "last_90_days"
    last_year = "last_year"
    custom = "custom"


class AnalyticsRequest(BaseModel):
    time_range: TimeRange = TimeRange.last_30_days
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    company_id: Optional[int] = None
    user_id: Optional[int] = None


class ReferralAnalytics(BaseModel):
    total_referrals: int
    successful_referrals: int
    success_rate: float
    referrals_by_status: Dict[str, int]
    referrals_by_month: List[Dict[str, Any]]
    top_referrers: List[Dict[str, Any]]
    top_companies: List[Dict[str, Any]]
    average_time_to_hire: Optional[float] = None


class JobAnalytics(BaseModel):
    total_jobs: int
    active_jobs: int
    jobs_by_company: List[Dict[str, Any]]
    jobs_by_location: List[Dict[str, Any]]
    jobs_by_employment_type: List[Dict[str, Any]]
    average_applications_per_job: float
    most_popular_skills: List[Dict[str, Any]]


class UserAnalytics(BaseModel):
    total_users: int
    active_users: int
    users_by_role: Dict[str, int]
    new_users_by_month: List[Dict[str, Any]]
    user_engagement_score: float
    top_contributors: List[Dict[str, Any]]


class CompanyAnalytics(BaseModel):
    total_companies: int
    active_companies: int
    companies_by_size: Dict[str, int]
    top_performing_companies: List[Dict[str, Any]]
    average_jobs_per_company: float


class SystemAnalytics(BaseModel):
    total_searches: int
    popular_search_terms: List[Dict[str, Any]]
    api_usage_stats: Dict[str, Any]
    error_rates: Dict[str, float]
    response_times: Dict[str, float]


class DashboardData(BaseModel):
    referral_analytics: ReferralAnalytics
    job_analytics: JobAnalytics
    user_analytics: UserAnalytics
    company_analytics: CompanyAnalytics
    system_analytics: SystemAnalytics
    generated_at: datetime


class LeaderboardEntry(BaseModel):
    user_id: int
    user_name: str
    score: float
    rank: int
    metric: str


class Leaderboard(BaseModel):
    type: str
    entries: List[LeaderboardEntry]
    total_participants: int
    period: str


class TrendData(BaseModel):
    metric: str
    values: List[Dict[str, Any]]
    trend_direction: str  # "up", "down", "stable"
    percentage_change: float


class AnalyticsReport(BaseModel):
    report_id: str
    title: str
    description: str
    data: Dict[str, Any]
    generated_at: datetime
    generated_by: int
    report_type: str

