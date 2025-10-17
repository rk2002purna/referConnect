# Pydantic schemas for request/response models
from .auth import UserRegister, UserLogin, TokenResponse, TokenRefresh, UserResponse
from .user import (
    UserProfileResponse, UserProfileUpdate, UserListResponse, UserDetailResponse,
    EmployeeProfileCreate, EmployeeProfileUpdate, EmployeeProfileResponse,
    JobSeekerProfileCreate, JobSeekerProfileUpdate, JobSeekerProfileResponse,
    CompanyCreate, CompanyUpdate, CompanyResponse
)
from .job import (
    JobCreate, JobUpdate, JobResponse, JobDetailResponse, JobSearchParams, JobListResponse
)
from .referral import (
    ReferralCreate, ReferralUpdate, ReferralResponse, ReferralDetailResponse,
    ReferralSearchParams, ReferralListResponse, ReferralStatsResponse
)
from .search import (
    SearchRequest, SearchResponse, SearchResultItem, SearchFilters,
    SearchSuggestion, SearchAnalytics
)
from .notification import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    NotificationListResponse, NotificationPreferences, NotificationStats
)
from .analytics import (
    AnalyticsRequest, DashboardData, ReferralAnalytics, JobAnalytics,
    UserAnalytics, CompanyAnalytics, SystemAnalytics, Leaderboard,
    LeaderboardEntry, TrendData, AnalyticsReport
)
from .trust import (
    TrustScore, FraudAlert, TrustMetrics, TrustAnalysis,
    FraudDetectionRule, TrustScoreUpdate
)
from .dashboard import (
    JobRecommendationResponse, ActivityFeedResponse, SavedSearchCreate,
    SavedSearchResponse, ProfileCompletionResponse, DashboardStatsResponse,
    JobSeekerDashboardData, EmployeeDashboardData, AdminDashboardData
)
from .referral_request import (
    ReferralRequestCreate, ReferralRequestUpdate, ReferralRequestResponse,
    ReferralRequestList, ReferralRequestDetail, ReferralRequestStats,
    ReferralRequestStatus, ReferralRequestPriority, ReferralRequestOutcome,
    ReferralRequestNotification
)
from .profile import (
    ProfileUpdateRequest, JobSeekerProfileUpdateRequest, EmployeeProfileUpdateRequest,
    ProfileResponse, JobSeekerProfileResponse, EmployeeProfileResponse, ProfileCompletionResponse
)
from .job_post import (
    JobPostCreate, JobPostUpdate, JobPostResponse, JobPostListResponse,
    JobType, ExperienceLevel
)
