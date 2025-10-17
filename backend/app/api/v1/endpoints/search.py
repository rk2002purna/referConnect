from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.search import SearchRequest, SearchResponse, SearchSuggestion
from app.services.search_service import SearchService

router = APIRouter()


@router.post("/", response_model=SearchResponse)
async def search(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Perform comprehensive search across jobs, users, and referrals."""
    search_service = SearchService(db)
    return await search_service.search(search_request)


@router.get("/", response_model=SearchResponse)
async def search_get(
    query: str = Query(..., min_length=1, max_length=200),
    search_type: str = Query("all", description="jobs, users, referrals, all"),
    location: str = Query(None, description="Filter by location"),
    company_id: int = Query(None, description="Filter by company ID"),
    employment_type: str = Query(None, description="Filter by employment type"),
    min_experience: int = Query(None, ge=0, le=50, description="Minimum years of experience"),
    max_experience: int = Query(None, ge=0, le=50, description="Maximum years of experience"),
    skills: str = Query(None, description="Comma-separated skills"),
    role: str = Query(None, description="Filter by user role"),
    status: str = Query(None, description="Filter by referral status"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    sort_by: str = Query("relevance", description="relevance, date, title"),
    sort_order: str = Query("desc", description="asc, desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Perform search with query parameters."""
    # Parse skills if provided
    skills_list = None
    if skills:
        skills_list = [skill.strip() for skill in skills.split(",") if skill.strip()]

    from app.schemas.search import SearchFilters
    filters = SearchFilters(
        location=location,
        company_id=company_id,
        employment_type=employment_type,
        min_experience=min_experience,
        max_experience=max_experience,
        skills=skills_list,
        role=role,
        status=status
    )

    search_request = SearchRequest(
        query=query,
        search_type=search_type,
        filters=filters,
        page=page,
        size=size,
        sort_by=sort_by,
        sort_order=sort_order
    )

    search_service = SearchService(db)
    return await search_service.search(search_request)


@router.get("/suggestions", response_model=List[SearchSuggestion])
async def get_search_suggestions(
    query: str = Query(..., min_length=1, max_length=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get search suggestions based on query."""
    search_service = SearchService(db)
    
    # Create a minimal search request to get suggestions
    from app.schemas.search import SearchRequest
    search_request = SearchRequest(query=query, search_type="all")
    
    # Get suggestions from the search service
    suggestions = await search_service._generate_suggestions(query.lower())
    
    # Convert to SearchSuggestion objects
    suggestion_objects = []
    for suggestion in suggestions:
        suggestion_objects.append(SearchSuggestion(
            text=suggestion,
            type="suggestion",
            count=1  # Placeholder count
        ))
    
    return suggestion_objects


@router.get("/analytics")
async def get_search_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get search analytics and statistics."""
    search_service = SearchService(db)
    return await search_service.get_search_analytics()


@router.get("/popular")
async def get_popular_searches(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get popular search queries."""
    # This would typically come from analytics data
    # For now, return placeholder data
    return {
        "popular_queries": [
            {"query": "python developer", "count": 15},
            {"query": "remote jobs", "count": 12},
            {"query": "senior engineer", "count": 10},
            {"query": "full stack", "count": 8},
            {"query": "react developer", "count": 7}
        ]
    }

