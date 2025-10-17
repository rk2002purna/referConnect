from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, text
from sqlmodel import col

from app.models.user import User, Job, Referral, UserRole, Employee, JobSeeker, Company
from app.models.dashboard import JobRecommendation, ActivityFeed, SavedSearch, UserProfileCompletion, DashboardStats
from app.schemas.dashboard import (
    DashboardOverview, JobRecommendationResponse, ActivityFeedResponse,
    SavedSearchCreate, SavedSearchResponse, ProfileCompletionResponse,
    DashboardStatsResponse, JobSeekerDashboardData, EmployeeDashboardData,
    AdminDashboardData
)

class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_job_recommendations(self, user_id: int, limit: int = 10) -> List[JobRecommendationResponse]:
        """Get personalized job recommendations for a user"""
        # Get user's skills and preferences
        user_result = await self.db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            return []

        # Get user's job seeker profile for skills
        jobseeker_result = await self.db.execute(
            select(JobSeeker).where(JobSeeker.user_id == user_id)
        )
        jobseeker = jobseeker_result.scalar_one_or_none()
        
        user_skills = []
        if jobseeker and jobseeker.skills:
            user_skills = jobseeker.skills.split(',') if isinstance(jobseeker.skills, str) else jobseeker.skills

        # Get active jobs
        jobs_result = await self.db.execute(
            select(Job).where(Job.is_active == True).order_by(desc(Job.created_at)).limit(limit * 3)
        )
        jobs = jobs_result.scalars().all()

        recommendations = []
        for job in jobs:
            # Calculate match score based on skills
            match_score = self._calculate_match_score(job, user_skills)
            
            if match_score >= 50:  # Only recommend jobs with 50%+ match
                recommendation = JobRecommendationResponse(
                    id=job.id,
                    title=job.title,
                    company=job.company_name or "Unknown Company",
                    location=job.location or "Not specified",
                    match_score=match_score,
                    skills=job.skills.split(',') if job.skills else [],
                    salary=job.salary_range,
                    type=job.employment_type or "Full-time",
                    posted_at=job.created_at.isoformat(),
                    description=job.description or ""
                )
                recommendations.append(recommendation)

        # Sort by match score and return top recommendations
        recommendations.sort(key=lambda x: x.match_score, reverse=True)
        return recommendations[:limit]

    def _calculate_match_score(self, job: Job, user_skills: List[str]) -> float:
        """Calculate match score between job and user skills"""
        if not user_skills or not job.skills:
            return 50.0  # Default score

        job_skills = job.skills.split(',') if isinstance(job.skills, str) else job.skills
        job_skills = [skill.strip().lower() for skill in job_skills]
        user_skills = [skill.strip().lower() for skill in user_skills]

        # Calculate skill overlap
        common_skills = set(job_skills) & set(user_skills)
        if not job_skills:
            return 50.0

        skill_match = len(common_skills) / len(job_skills) * 100
        
        # Add bonus for exact matches
        exact_matches = sum(1 for skill in user_skills if skill in job_skills)
        bonus = min(exact_matches * 10, 30)  # Max 30% bonus
        
        return min(skill_match + bonus, 100.0)

    async def get_activity_feed(self, user_id: int, limit: int = 20) -> List[ActivityFeedResponse]:
        """Get user's activity feed"""
        result = await self.db.execute(
            select(ActivityFeed)
            .where(ActivityFeed.user_id == user_id)
            .order_by(desc(ActivityFeed.created_at))
            .limit(limit)
        )
        activities = result.scalars().all()

        return [
            ActivityFeedResponse(
                id=activity.id,
                type=activity.activity_type,
                title=activity.title,
                description=activity.description,
                timestamp=activity.created_at.isoformat(),
                status=activity.status,
                action_url=activity.action_url
            )
            for activity in activities
        ]

    async def create_activity(self, user_id: int, activity_type: str, title: str, 
                            description: str, status: str = "new", action_url: Optional[str] = None,
                            metadata: Optional[Dict[str, Any]] = None) -> ActivityFeed:
        """Create a new activity in the feed"""
        activity = ActivityFeed(
            user_id=user_id,
            activity_type=activity_type,
            title=title,
            description=description,
            status=status,
            action_url=action_url,
            activity_metadata=metadata or {}
        )
        self.db.add(activity)
        await self.db.commit()
        await self.db.refresh(activity)
        return activity

    async def get_saved_searches(self, user_id: int) -> List[SavedSearchResponse]:
        """Get user's saved searches"""
        result = await self.db.execute(
            select(SavedSearch)
            .where(and_(SavedSearch.user_id == user_id, SavedSearch.is_active == True))
            .order_by(desc(SavedSearch.last_run))
        )
        searches = result.scalars().all()

        return [
            SavedSearchResponse(
                id=search.id,
                name=search.name,
                query=search.query,
                filters=search.filters or {},
                last_run=search.last_run.isoformat() if search.last_run else None,
                new_results=search.new_results_count
            )
            for search in searches
        ]

    async def create_saved_search(self, user_id: int, search_data: SavedSearchCreate) -> SavedSearch:
        """Create a new saved search"""
        saved_search = SavedSearch(
            user_id=user_id,
            name=search_data.name,
            query=search_data.query,
            filters=search_data.filters or {},
            last_run=datetime.utcnow()
        )
        self.db.add(saved_search)
        await self.db.commit()
        await self.db.refresh(saved_search)
        return saved_search

    async def get_profile_completion(self, user_id: int) -> ProfileCompletionResponse:
        """Get user's profile completion status"""
        result = await self.db.execute(
            select(UserProfileCompletion).where(UserProfileCompletion.user_id == user_id)
        )
        completion = result.scalar_one_or_none()

        if not completion:
            # Calculate completion for new user
            completion = await self._calculate_profile_completion(user_id)

        return ProfileCompletionResponse(
            completion_percentage=completion.completion_percentage,
            completed_sections=completion.completed_sections or [],
            missing_sections=completion.missing_sections or []
        )

    async def _calculate_profile_completion(self, user_id: int) -> UserProfileCompletion:
        """Calculate profile completion percentage"""
        user_result = await self.db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            return UserProfileCompletion(user_id=user_id, completion_percentage=0)

        completed_sections = []
        missing_sections = []
        total_sections = 0

        # Check basic profile info
        total_sections += 1
        if user.email and user.is_email_verified:
            completed_sections.append("email_verification")
        else:
            missing_sections.append("email_verification")

        # Check role-specific profile
        if user.role == UserRole.jobseeker:
            jobseeker_result = await self.db.execute(
                select(JobSeeker).where(JobSeeker.user_id == user_id)
            )
            jobseeker = jobseeker_result.scalar_one_or_none()
            
            if jobseeker:
                total_sections += 4
                if jobseeker.skills:
                    completed_sections.append("skills")
                else:
                    missing_sections.append("skills")
                
                if jobseeker.years_experience:
                    completed_sections.append("experience")
                else:
                    missing_sections.append("experience")
                
                if jobseeker.current_company:
                    completed_sections.append("current_company")
                else:
                    missing_sections.append("current_company")
                
                completed_sections.append("jobseeker_profile")
            else:
                missing_sections.extend(["skills", "experience", "current_company", "jobseeker_profile"])
                total_sections += 4

        elif user.role == UserRole.employee:
            employee_result = await self.db.execute(
                select(Employee).where(Employee.user_id == user_id)
            )
            employee = employee_result.scalar_one_or_none()
            
            if employee:
                total_sections += 2
                if employee.title:
                    completed_sections.append("job_title")
                else:
                    missing_sections.append("job_title")
                
                completed_sections.append("employee_profile")
            else:
                missing_sections.extend(["job_title", "employee_profile"])
                total_sections += 2

        completion_percentage = int((len(completed_sections) / total_sections) * 100) if total_sections > 0 else 0

        completion = UserProfileCompletion(
            user_id=user_id,
            completion_percentage=completion_percentage,
            completed_sections=completed_sections,
            missing_sections=missing_sections
        )
        
        self.db.add(completion)
        await self.db.commit()
        await self.db.refresh(completion)
        return completion

    async def get_dashboard_stats(self, user_id: int, user_role: UserRole) -> DashboardStatsResponse:
        """Get dashboard statistics based on user role"""
        if user_role == UserRole.jobseeker:
            return await self._get_jobseeker_stats(user_id)
        elif user_role == UserRole.employee:
            return await self._get_employee_stats(user_id)
        else:
            return await self._get_admin_stats()

    async def _get_jobseeker_stats(self, user_id: int) -> DashboardStatsResponse:
        """Get job seeker specific statistics"""
        # Applications count
        applications_result = await self.db.execute(
            select(func.count()).select_from(Referral).where(Referral.seeker_id == user_id)
        )
        total_applications = applications_result.scalar_one() or 0

        # Pending applications
        pending_result = await self.db.execute(
            select(func.count()).select_from(Referral).where(
                and_(Referral.seeker_id == user_id, Referral.status == "pending")
            )
        )
        pending_applications = pending_result.scalar_one() or 0

        # Accepted referrals
        accepted_result = await self.db.execute(
            select(func.count()).select_from(Referral).where(
                and_(Referral.seeker_id == user_id, Referral.status == "accepted")
            )
        )
        accepted_referrals = accepted_result.scalar_one() or 0

        # Saved jobs count (mock for now)
        saved_jobs = 8  # This would come from a saved_jobs table

        return DashboardStatsResponse(
            applications_total=total_applications,
            applications_pending=pending_applications,
            referrals_total=total_applications,
            referrals_pending=pending_applications,
            referrals_accepted=accepted_referrals,
            saved_jobs=saved_jobs,
            profile_completion=await self._get_profile_completion_percentage(user_id)
        )

    async def _get_employee_stats(self, user_id: int) -> DashboardStatsResponse:
        """Get employee specific statistics"""
        # Jobs posted
        jobs_result = await self.db.execute(
            select(func.count()).select_from(Job).where(Job.posted_by == user_id)
        )
        total_jobs = jobs_result.scalar_one() or 0

        # Active jobs
        active_jobs_result = await self.db.execute(
            select(func.count()).select_from(Job).where(
                and_(Job.posted_by == user_id, Job.is_active == True)
            )
        )
        active_jobs = active_jobs_result.scalar_one() or 0

        # Referrals made
        referrals_result = await self.db.execute(
            select(func.count()).select_from(Referral).where(Referral.employee_id == user_id)
        )
        total_referrals = referrals_result.scalar_one() or 0

        # Pending referrals
        pending_referrals_result = await self.db.execute(
            select(func.count()).select_from(Referral).where(
                and_(Referral.employee_id == user_id, Referral.status == "pending")
            )
        )
        pending_referrals = pending_referrals_result.scalar_one() or 0

        # Accepted referrals
        accepted_referrals_result = await self.db.execute(
            select(func.count()).select_from(Referral).where(
                and_(Referral.employee_id == user_id, Referral.status == "accepted")
            )
        )
        accepted_referrals = accepted_referrals_result.scalar_one() or 0

        # Success rate
        success_rate = (accepted_referrals / total_referrals * 100) if total_referrals > 0 else 0

        return DashboardStatsResponse(
            jobs_total=total_jobs,
            jobs_active=active_jobs,
            referrals_total=total_referrals,
            referrals_pending=pending_referrals,
            referrals_accepted=accepted_referrals,
            success_rate=round(success_rate, 1),
            profile_completion=await self._get_profile_completion_percentage(user_id)
        )

    async def _get_admin_stats(self) -> DashboardStatsResponse:
        """Get admin platform statistics"""
        # Total users
        users_result = await self.db.execute(select(func.count()).select_from(User))
        total_users = users_result.scalar_one() or 0

        # Total jobs
        jobs_result = await self.db.execute(select(func.count()).select_from(Job))
        total_jobs = jobs_result.scalar_one() or 0

        # Active jobs
        active_jobs_result = await self.db.execute(
            select(func.count()).select_from(Job).where(Job.is_active == True)
        )
        active_jobs = active_jobs_result.scalar_one() or 0

        # Total referrals
        referrals_result = await self.db.execute(select(func.count()).select_from(Referral))
        total_referrals = referrals_result.scalar_one() or 0

        # Pending referrals
        pending_referrals_result = await self.db.execute(
            select(func.count()).select_from(Referral).where(Referral.status == "pending")
        )
        pending_referrals = pending_referrals_result.scalar_one() or 0

        return DashboardStatsResponse(
            users_total=total_users,
            jobs_total=total_jobs,
            jobs_active=active_jobs,
            referrals_total=total_referrals,
            referrals_pending=pending_referrals,
            platform_health=98.5  # Mock platform health
        )

    async def _get_profile_completion_percentage(self, user_id: int) -> int:
        """Get profile completion percentage"""
        completion = await self.get_profile_completion(user_id)
        return completion.completion_percentage

    async def get_jobseeker_dashboard_data(self, user_id: int) -> JobSeekerDashboardData:
        """Get complete job seeker dashboard data"""
        recommendations = await self.get_job_recommendations(user_id, 5)
        activity_feed = await self.get_activity_feed(user_id, 10)
        saved_searches = await self.get_saved_searches(user_id)
        stats = await self.get_dashboard_stats(user_id, UserRole.jobseeker)
        profile_completion = await self.get_profile_completion(user_id)

        return JobSeekerDashboardData(
            recommendations=recommendations,
            activity_feed=activity_feed,
            saved_searches=saved_searches,
            stats=stats,
            profile_completion=profile_completion
        )

    async def get_employee_dashboard_data(self, user_id: int) -> EmployeeDashboardData:
        """Get complete employee dashboard data"""
        # Get user's job postings
        jobs_result = await self.db.execute(
            select(Job).where(Job.posted_by == user_id).order_by(desc(Job.created_at)).limit(10)
        )
        job_postings = jobs_result.scalars().all()

        # Get referral requests
        referrals_result = await self.db.execute(
            select(Referral).where(Referral.employee_id == user_id).order_by(desc(Referral.created_at)).limit(10)
        )
        referral_requests = referrals_result.scalars().all()

        activity_feed = await self.get_activity_feed(user_id, 10)
        stats = await self.get_dashboard_stats(user_id, UserRole.employee)

        return EmployeeDashboardData(
            job_postings=[self._format_job_posting(job) for job in job_postings],
            referral_requests=[self._format_referral_request(ref) for ref in referral_requests],
            activity_feed=activity_feed,
            stats=stats
        )

    def _format_job_posting(self, job: Job) -> Dict[str, Any]:
        """Format job posting for dashboard"""
        return {
            "id": job.id,
            "title": job.title,
            "company": job.company_name or "Unknown",
            "location": job.location or "Not specified",
            "status": "active" if job.is_active else "inactive",
            "applications": 0,  # Would need to count from applications table
            "referrals": 0,     # Would need to count from referrals table
            "views": 0,         # Would need to track views
            "posted_at": job.created_at.isoformat()
        }

    def _format_referral_request(self, referral: Referral) -> Dict[str, Any]:
        """Format referral request for dashboard"""
        return {
            "id": referral.id,
            "job_title": "Job Title",  # Would need to join with Job table
            "candidate_name": "Candidate Name",  # Would need to join with User table
            "candidate_email": "candidate@email.com",  # Would need to join with User table
            "status": referral.status,
            "requested_at": referral.created_at.isoformat(),
            "notes": referral.notes,
            "match_score": 85  # Would need to calculate
        }
