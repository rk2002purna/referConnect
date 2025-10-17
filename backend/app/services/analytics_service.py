from typing import Dict, Any, List, Optional
from sqlmodel import select, and_, or_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from datetime import datetime, timedelta, date

from app.models.user import Job, User, Employee, JobSeeker, Company, Referral
from app.schemas.analytics import (
    AnalyticsRequest, ReferralAnalytics, JobAnalytics, UserAnalytics,
    CompanyAnalytics, SystemAnalytics, DashboardData, Leaderboard,
    LeaderboardEntry, TrendData
)


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_data(self, request: AnalyticsRequest) -> DashboardData:
        """Get comprehensive dashboard analytics."""
        date_filter = self._get_date_filter(request)
        
        referral_analytics = await self._get_referral_analytics(date_filter, request)
        job_analytics = await self._get_job_analytics(date_filter, request)
        user_analytics = await self._get_user_analytics(date_filter, request)
        company_analytics = await self._get_company_analytics(date_filter, request)
        system_analytics = await self._get_system_analytics(date_filter, request)
        
        return DashboardData(
            referral_analytics=referral_analytics,
            job_analytics=job_analytics,
            user_analytics=user_analytics,
            company_analytics=company_analytics,
            system_analytics=system_analytics,
            generated_at=datetime.utcnow()
        )

    async def _get_referral_analytics(self, date_filter: str, request: AnalyticsRequest) -> ReferralAnalytics:
        """Get referral analytics."""
        base_conditions = [date_filter]
        if request.company_id:
            base_conditions.append("r.company_id = :company_id")
        if request.user_id:
            base_conditions.append("r.employee_id = :user_id")
        
        where_clause = " AND ".join(base_conditions)
        
        # Total referrals
        total_query = f"""
            SELECT COUNT(*) 
            FROM referrals r 
            WHERE {where_clause}
        """
        total_result = await self.db.execute(text(total_query), self._get_query_params(request))
        total_referrals = total_result.scalar()
        
        # Successful referrals (hired)
        success_query = f"""
            SELECT COUNT(*) 
            FROM referrals r 
            WHERE {where_clause} AND r.status = 'hired'
        """
        success_result = await self.db.execute(text(success_query), self._get_query_params(request))
        successful_referrals = success_result.scalar()
        
        success_rate = (successful_referrals / total_referrals * 100) if total_referrals > 0 else 0.0
        
        # Referrals by status
        status_query = f"""
            SELECT r.status, COUNT(*) 
            FROM referrals r 
            WHERE {where_clause}
            GROUP BY r.status
        """
        status_result = await self.db.execute(text(status_query), self._get_query_params(request))
        referrals_by_status = {row[0]: row[1] for row in status_result.fetchall()}
        
        # Referrals by month
        monthly_query = f"""
            SELECT 
                strftime('%Y-%m', r.created_at) as month,
                COUNT(*) as count
            FROM referrals r 
            WHERE {where_clause}
            GROUP BY strftime('%Y-%m', r.created_at)
            ORDER BY month
        """
        monthly_result = await self.db.execute(text(monthly_query), self._get_query_params(request))
        referrals_by_month = [{"month": row[0], "count": row[1]} for row in monthly_result.fetchall()]
        
        # Top referrers
        top_referrers_query = f"""
            SELECT 
                u.email as user_name,
                COUNT(r.id) as referral_count,
                SUM(CASE WHEN r.status = 'hired' THEN 1 ELSE 0 END) as successful_count
            FROM referrals r
            JOIN employees e ON r.employee_id = e.id
            JOIN users u ON e.user_id = u.id
            WHERE {where_clause}
            GROUP BY u.id, u.email
            ORDER BY referral_count DESC
            LIMIT 10
        """
        top_referrers_result = await self.db.execute(text(top_referrers_query), self._get_query_params(request))
        top_referrers = [
            {
                "user_name": row[0],
                "referral_count": row[1],
                "successful_count": row[2],
                "success_rate": (row[2] / row[1] * 100) if row[1] > 0 else 0
            }
            for row in top_referrers_result.fetchall()
        ]
        
        return ReferralAnalytics(
            total_referrals=total_referrals,
            successful_referrals=successful_referrals,
            success_rate=success_rate,
            referrals_by_status=referrals_by_status,
            referrals_by_month=referrals_by_month,
            top_referrers=top_referrers,
            top_companies=[],  # Would need company join
            average_time_to_hire=None  # Would need hire date tracking
        )

    async def _get_job_analytics(self, date_filter: str, request: AnalyticsRequest) -> JobAnalytics:
        """Get job analytics."""
        base_conditions = [date_filter]
        if request.company_id:
            base_conditions.append("j.company_id = :company_id")
        
        where_clause = " AND ".join(base_conditions)
        
        # Total jobs
        total_query = f"""
            SELECT COUNT(*) 
            FROM jobs j 
            WHERE {where_clause}
        """
        total_result = await self.db.execute(text(total_query), self._get_query_params(request))
        total_jobs = total_result.scalar()
        
        # Active jobs
        active_query = f"""
            SELECT COUNT(*) 
            FROM jobs j 
            WHERE {where_clause} AND j.is_active = true
        """
        active_result = await self.db.execute(text(active_query), self._get_query_params(request))
        active_jobs = active_result.scalar()
        
        # Jobs by employment type
        type_query = f"""
            SELECT j.employment_type, COUNT(*) 
            FROM jobs j 
            WHERE {where_clause}
            GROUP BY j.employment_type
        """
        type_result = await self.db.execute(text(type_query), self._get_query_params(request))
        jobs_by_employment_type = [{"type": row[0], "count": row[1]} for row in type_result.fetchall()]
        
        # Most popular skills
        skills_query = f"""
            SELECT j.skills, COUNT(*) as count
            FROM jobs j 
            WHERE {where_clause} AND j.skills IS NOT NULL
            GROUP BY j.skills
            ORDER BY count DESC
            LIMIT 10
        """
        skills_result = await self.db.execute(text(skills_query), self._get_query_params(request))
        most_popular_skills = [
            {"skills": row[0], "count": row[1]}
            for row in skills_result.fetchall()
        ]
        
        return JobAnalytics(
            total_jobs=total_jobs,
            active_jobs=active_jobs,
            jobs_by_company=[],  # Would need company join
            jobs_by_location=[],  # Would need location aggregation
            jobs_by_employment_type=jobs_by_employment_type,
            average_applications_per_job=0.0,  # Would need application tracking
            most_popular_skills=most_popular_skills
        )

    async def _get_user_analytics(self, date_filter: str, request: AnalyticsRequest) -> UserAnalytics:
        """Get user analytics."""
        base_conditions = [date_filter]
        if request.user_id:
            base_conditions.append("u.id = :user_id")
        
        where_clause = " AND ".join(base_conditions)
        
        # Total users
        total_query = f"""
            SELECT COUNT(*) 
            FROM users u 
            WHERE {where_clause}
        """
        total_result = await self.db.execute(text(total_query), self._get_query_params(request))
        total_users = total_result.scalar()
        
        # Active users (logged in within last 30 days)
        active_query = f"""
            SELECT COUNT(*) 
            FROM users u 
            WHERE {where_clause} AND u.is_active = true
        """
        active_result = await self.db.execute(text(active_query), self._get_query_params(request))
        active_users = active_result.scalar()
        
        # Users by role
        role_query = f"""
            SELECT u.role, COUNT(*) 
            FROM users u 
            WHERE {where_clause}
            GROUP BY u.role
        """
        role_result = await self.db.execute(text(role_query), self._get_query_params(request))
        users_by_role = {row[0]: row[1] for row in role_result.fetchall()}
        
        # New users by month
        monthly_query = f"""
            SELECT 
                strftime('%Y-%m', u.created_at) as month,
                COUNT(*) as count
            FROM users u 
            WHERE {where_clause}
            GROUP BY strftime('%Y-%m', u.created_at)
            ORDER BY month
        """
        monthly_result = await self.db.execute(text(monthly_query), self._get_query_params(request))
        new_users_by_month = [{"month": row[0], "count": row[1]} for row in monthly_result.fetchall()]
        
        return UserAnalytics(
            total_users=total_users,
            active_users=active_users,
            users_by_role=users_by_role,
            new_users_by_month=new_users_by_month,
            user_engagement_score=0.0,  # Would need engagement metrics
            top_contributors=[]  # Would need contribution tracking
        )

    async def _get_company_analytics(self, date_filter: str, request: AnalyticsRequest) -> CompanyAnalytics:
        """Get company analytics."""
        base_conditions = [date_filter]
        if request.company_id:
            base_conditions.append("c.id = :company_id")
        
        where_clause = " AND ".join(base_conditions)
        
        # Total companies
        total_query = f"""
            SELECT COUNT(*) 
            FROM companies c 
            WHERE {where_clause}
        """
        total_result = await self.db.execute(text(total_query), self._get_query_params(request))
        total_companies = total_result.scalar()
        
        # Active companies (have active jobs)
        active_query = f"""
            SELECT COUNT(DISTINCT c.id) 
            FROM companies c 
            JOIN jobs j ON c.id = j.company_id 
            WHERE {where_clause} AND j.is_active = true
        """
        active_result = await self.db.execute(text(active_query), self._get_query_params(request))
        active_companies = active_result.scalar()
        
        return CompanyAnalytics(
            total_companies=total_companies,
            active_companies=active_companies,
            companies_by_size={},  # Would need employee count tracking
            top_performing_companies=[],  # Would need performance metrics
            average_jobs_per_company=0.0  # Would need job count calculation
        )

    async def _get_system_analytics(self, date_filter: str, request: AnalyticsRequest) -> SystemAnalytics:
        """Get system analytics."""
        # These would typically come from logging/monitoring systems
        return SystemAnalytics(
            total_searches=0,  # Would need search tracking
            popular_search_terms=[],  # Would need search analytics
            api_usage_stats={},  # Would need API usage tracking
            error_rates={},  # Would need error tracking
            response_times={}  # Would need performance monitoring
        )

    def _get_date_filter(self, request: AnalyticsRequest) -> str:
        """Get date filter based on time range."""
        if request.time_range == "last_7_days":
            return "created_at >= datetime('now', '-7 days')"
        elif request.time_range == "last_30_days":
            return "created_at >= datetime('now', '-30 days')"
        elif request.time_range == "last_90_days":
            return "created_at >= datetime('now', '-90 days')"
        elif request.time_range == "last_year":
            return "created_at >= datetime('now', '-1 year')"
        elif request.time_range == "custom" and request.start_date and request.end_date:
            return f"created_at >= '{request.start_date}' AND created_at <= '{request.end_date}'"
        else:
            return "created_at >= datetime('now', '-30 days')"  # Default to last 30 days

    def _get_query_params(self, request: AnalyticsRequest) -> Dict[str, Any]:
        """Get query parameters for SQL queries."""
        params = {}
        if request.company_id:
            params["company_id"] = request.company_id
        if request.user_id:
            params["user_id"] = request.user_id
        return params

    async def get_leaderboard(self, leaderboard_type: str, limit: int = 10) -> Leaderboard:
        """Get leaderboard data."""
        if leaderboard_type == "referrals":
            query = """
                SELECT 
                    u.id as user_id,
                    u.email as user_name,
                    COUNT(r.id) as score,
                    ROW_NUMBER() OVER (ORDER BY COUNT(r.id) DESC) as rank
                FROM users u
                JOIN employees e ON u.id = e.user_id
                JOIN referrals r ON e.id = r.employee_id
                WHERE u.is_active = true
                GROUP BY u.id, u.email
                ORDER BY score DESC
                LIMIT :limit
            """
            result = await self.db.execute(text(query), {"limit": limit})
            entries = [
                LeaderboardEntry(
                    user_id=row[0],
                    user_name=row[1],
                    score=float(row[2]),
                    rank=row[3],
                    metric="referrals"
                )
                for row in result.fetchall()
            ]
        else:
            entries = []
        
        return Leaderboard(
            type=leaderboard_type,
            entries=entries,
            total_participants=len(entries),
            period="all_time"
        )

