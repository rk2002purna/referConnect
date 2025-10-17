from typing import List, Dict, Any, Tuple, Optional
from sqlmodel import select, and_, or_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
import re
from datetime import datetime, timedelta

from app.models.user import Job, User, Employee, JobSeeker, Company, Referral
from app.schemas.search import SearchRequest, SearchResponse, SearchResultItem, SearchFilters


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(self, search_request: SearchRequest) -> SearchResponse:
        """Perform comprehensive search across all entities."""
        query = search_request.query.lower().strip()
        
        if not query:
            return SearchResponse(
                query=search_request.query,
                search_type=search_request.search_type,
                results=[],
                total=0,
                page=search_request.page,
                size=search_request.size,
                pages=0
            )

        results = []
        total = 0

        # Search based on type
        if search_request.search_type in ["jobs", "all"]:
            job_results, job_total = await self._search_jobs(search_request)
            results.extend(job_results)
            total += job_total

        if search_request.search_type in ["users", "all"]:
            user_results, user_total = await self._search_users(search_request)
            results.extend(user_results)
            total += user_total

        if search_request.search_type in ["referrals", "all"]:
            referral_results, referral_total = await self._search_referrals(search_request)
            results.extend(referral_results)
            total += referral_total

        # Sort results by relevance score
        results.sort(key=lambda x: x.relevance_score, reverse=True)

        # Apply pagination
        start_idx = (search_request.page - 1) * search_request.size
        end_idx = start_idx + search_request.size
        paginated_results = results[start_idx:end_idx]

        # Calculate pages
        pages = (total + search_request.size - 1) // search_request.size

        # Generate suggestions
        suggestions = await self._generate_suggestions(query)

        # Generate facets
        facets = await self._generate_facets(search_request)

        return SearchResponse(
            query=search_request.query,
            search_type=search_request.search_type,
            results=paginated_results,
            total=total,
            page=search_request.page,
            size=search_request.size,
            pages=pages,
            suggestions=suggestions,
            facets=facets
        )

    async def _search_jobs(self, search_request: SearchRequest) -> Tuple[List[SearchResultItem], int]:
        """Search jobs with relevance scoring."""
        query = search_request.query.lower()
        filters = search_request.filters or SearchFilters()

        # Build base query
        base_query = select(Job).where(Job.is_active == True)

        # Apply filters
        if filters.location:
            base_query = base_query.where(Job.location.ilike(f"%{filters.location}%"))
        
        if filters.company_id:
            base_query = base_query.where(Job.company_id == filters.company_id)
        
        if filters.employment_type:
            base_query = base_query.where(Job.employment_type == filters.employment_type)
        
        if filters.min_experience is not None:
            base_query = base_query.where(Job.min_experience >= filters.min_experience)
        
        if filters.max_experience is not None:
            base_query = base_query.where(Job.min_experience <= filters.max_experience)
        
        if filters.skills:
            skill_conditions = []
            for skill in filters.skills:
                skill_conditions.append(Job.skills.ilike(f"%{skill}%"))
            if skill_conditions:
                base_query = base_query.where(or_(*skill_conditions))

        # Search conditions
        search_conditions = []
        search_conditions.append(Job.title.ilike(f"%{query}%"))
        search_conditions.append(Job.description.ilike(f"%{query}%"))
        search_conditions.append(Job.skills.ilike(f"%{query}%"))
        search_conditions.append(Job.location.ilike(f"%{query}%"))

        base_query = base_query.where(or_(*search_conditions))

        # Get total count
        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get results
        results_query = base_query.order_by(Job.created_at.desc())
        results = await self.db.execute(results_query)
        jobs = results.scalars().all()

        # Convert to search result items with relevance scoring
        search_results = []
        for job in jobs:
            relevance_score = self._calculate_job_relevance(job, query)
            
            search_results.append(SearchResultItem(
                id=job.id,
                type="job",
                title=job.title,
                description=job.description[:200] + "..." if len(job.description) > 200 else job.description,
                relevance_score=relevance_score,
                created_at=job.created_at.isoformat(),
                metadata={
                    "location": job.location,
                    "employment_type": job.employment_type,
                    "skills": job.skills,
                    "min_experience": job.min_experience,
                    "company_id": job.company_id
                }
            ))

        return search_results, total

    async def _search_users(self, search_request: SearchRequest) -> Tuple[List[SearchResultItem], int]:
        """Search users with relevance scoring."""
        query = search_request.query.lower()
        filters = search_request.filters or SearchFilters()

        # Build base query
        base_query = select(User).where(User.is_active == True)

        # Apply filters
        if filters.role:
            base_query = base_query.where(User.role == filters.role)

        # Search conditions
        search_conditions = []
        search_conditions.append(User.email.ilike(f"%{query}%"))

        base_query = base_query.where(or_(*search_conditions))

        # Get total count
        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get results
        results_query = base_query.order_by(User.created_at.desc())
        results = await self.db.execute(results_query)
        users = results.scalars().all()

        # Convert to search result items
        search_results = []
        for user in users:
            relevance_score = self._calculate_user_relevance(user, query)
            
            search_results.append(SearchResultItem(
                id=user.id,
                type="user",
                title=user.email,
                description=f"Role: {user.role}",
                relevance_score=relevance_score,
                created_at=user.created_at.isoformat(),
                metadata={
                    "role": user.role,
                    "is_email_verified": user.is_email_verified,
                    "is_active": user.is_active
                }
            ))

        return search_results, total

    async def _search_referrals(self, search_request: SearchRequest) -> Tuple[List[SearchResultItem], int]:
        """Search referrals with relevance scoring."""
        query = search_request.query.lower()
        filters = search_request.filters or SearchFilters()

        # Build base query
        base_query = select(Referral)

        # Apply filters
        if filters.status:
            base_query = base_query.where(Referral.status == filters.status)

        # Search conditions
        search_conditions = []
        search_conditions.append(Referral.notes.ilike(f"%{query}%"))

        base_query = base_query.where(or_(*search_conditions))

        # Get total count
        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Get results
        results_query = base_query.order_by(Referral.created_at.desc())
        results = await self.db.execute(results_query)
        referrals = results.scalars().all()

        # Convert to search result items
        search_results = []
        for referral in referrals:
            relevance_score = self._calculate_referral_relevance(referral, query)
            
            search_results.append(SearchResultItem(
                id=referral.id,
                type="referral",
                title=f"Referral #{referral.id}",
                description=referral.notes[:200] + "..." if referral.notes and len(referral.notes) > 200 else referral.notes or "",
                relevance_score=relevance_score,
                created_at=referral.created_at.isoformat(),
                metadata={
                    "status": referral.status,
                    "job_id": referral.job_id,
                    "seeker_id": referral.seeker_id,
                    "employee_id": referral.employee_id
                }
            ))

        return search_results, total

    def _calculate_job_relevance(self, job: Job, query: str) -> float:
        """Calculate relevance score for job search results."""
        score = 0.0
        query_lower = query.lower()

        # Title match (highest weight)
        if query_lower in job.title.lower():
            score += 10.0
            if job.title.lower().startswith(query_lower):
                score += 5.0

        # Description match
        if job.description and query_lower in job.description.lower():
            score += 3.0

        # Skills match
        if job.skills and query_lower in job.skills.lower():
            score += 5.0

        # Location match
        if job.location and query_lower in job.location.lower():
            score += 2.0

        # Recency boost
        days_old = (datetime.now() - job.created_at).days
        if days_old < 7:
            score += 2.0
        elif days_old < 30:
            score += 1.0

        return min(score, 20.0)  # Cap at 20

    def _calculate_user_relevance(self, user: User, query: str) -> float:
        """Calculate relevance score for user search results."""
        score = 0.0
        query_lower = query.lower()

        # Email match
        if query_lower in user.email.lower():
            score += 10.0
            if user.email.lower().startswith(query_lower):
                score += 5.0

        return min(score, 15.0)  # Cap at 15

    def _calculate_referral_relevance(self, referral: Referral, query: str) -> float:
        """Calculate relevance score for referral search results."""
        score = 0.0
        query_lower = query.lower()

        # Notes match
        if referral.notes and query_lower in referral.notes.lower():
            score += 8.0

        # Recency boost
        days_old = (datetime.now() - referral.created_at).days
        if days_old < 7:
            score += 2.0
        elif days_old < 30:
            score += 1.0

        return min(score, 10.0)  # Cap at 10

    async def _generate_suggestions(self, query: str) -> List[str]:
        """Generate search suggestions based on query."""
        suggestions = []
        
        # Get popular job titles
        job_titles_query = select(Job.title).where(
            and_(
                Job.is_active == True,
                Job.title.ilike(f"%{query}%")
            )
        ).limit(5)
        
        job_titles_result = await self.db.execute(job_titles_query)
        job_titles = [row[0] for row in job_titles_result.fetchall()]
        suggestions.extend(job_titles)

        # Get popular skills
        if len(query) >= 2:
            skills_query = select(Job.skills).where(
                and_(
                    Job.is_active == True,
                    Job.skills.ilike(f"%{query}%")
                )
            ).limit(3)
            
            skills_result = await self.db.execute(skills_query)
            skills = []
            for row in skills_result.fetchall():
                if row[0]:
                    skills.extend([s.strip() for s in row[0].split(',') if query.lower() in s.lower()])
            
            suggestions.extend(skills[:3])

        return list(set(suggestions))[:5]  # Remove duplicates and limit

    async def _generate_facets(self, search_request: SearchRequest) -> Dict[str, Any]:
        """Generate search facets for filtering."""
        facets = {}

        if search_request.search_type in ["jobs", "all"]:
            # Employment type facets
            emp_types_query = select(Job.employment_type, func.count(Job.id)).where(
                Job.is_active == True
            ).group_by(Job.employment_type)
            
            emp_types_result = await self.db.execute(emp_types_query)
            facets["employment_types"] = [{"value": row[0], "count": row[1]} for row in emp_types_result.fetchall() if row[0]]

            # Location facets
            locations_query = select(Job.location, func.count(Job.id)).where(
                and_(Job.is_active == True, Job.location.isnot(None))
            ).group_by(Job.location).limit(10)
            
            locations_result = await self.db.execute(locations_query)
            facets["locations"] = [{"value": row[0], "count": row[1]} for row in locations_result.fetchall()]

        return facets

    async def get_search_analytics(self) -> Dict[str, Any]:
        """Get search analytics and statistics."""
        # This would typically be stored in a separate analytics table
        # For now, return placeholder data
        return {
            "total_searches": 0,
            "popular_queries": [],
            "search_success_rate": 0.0,
            "average_results_per_search": 0.0,
            "top_filters": []
        }

