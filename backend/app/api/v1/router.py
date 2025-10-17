from fastapi import APIRouter

from .endpoints import auth, users, jobs, referrals, search, notifications, analytics, trust, dashboard, referral_requests, profile, job_posts, employee_profile, health
from .endpoints import verification_simple as verification, otp

api_router_v1 = APIRouter()

# Include routers
api_router_v1.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router_v1.include_router(users.router, prefix="/users", tags=["users"])
api_router_v1.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router_v1.include_router(referrals.router, prefix="/referrals", tags=["referrals"])
api_router_v1.include_router(search.router, prefix="/search", tags=["search"])
api_router_v1.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router_v1.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router_v1.include_router(trust.router, prefix="/trust", tags=["trust"])
api_router_v1.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router_v1.include_router(referral_requests.router, prefix="/referral-requests", tags=["referral-requests"])
api_router_v1.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router_v1.include_router(employee_profile.router, prefix="/employee-profile", tags=["employee-profile"])
api_router_v1.include_router(job_posts.router, prefix="/job-posts", tags=["job-posts"])
api_router_v1.include_router(verification.router, prefix="/verification", tags=["verification"])
api_router_v1.include_router(otp.router, prefix="/otp", tags=["otp"])
api_router_v1.include_router(health.router, tags=["health"])
