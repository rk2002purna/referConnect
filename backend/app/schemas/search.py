from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class SearchType(str, Enum):
    jobs = "jobs"
    users = "users"
    referrals = "referrals"
    all = "all"


class SearchFilters(BaseModel):
    location: Optional[str] = None
    company_id: Optional[int] = None
    employment_type: Optional[str] = None
    min_experience: Optional[int] = Field(None, ge=0, le=50)
    max_experience: Optional[int] = Field(None, ge=0, le=50)
    skills: Optional[List[str]] = None
    role: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)
    search_type: SearchType = SearchType.all
    filters: Optional[SearchFilters] = None
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)
    sort_by: Optional[str] = Field("relevance", description="relevance, date, title")
    sort_order: Optional[str] = Field("desc", description="asc, desc")


class SearchResultItem(BaseModel):
    id: int
    type: str
    title: str
    description: str
    relevance_score: float
    created_at: str
    metadata: Dict[str, Any] = {}


class SearchResponse(BaseModel):
    query: str
    search_type: str
    results: List[SearchResultItem]
    total: int
    page: int
    size: int
    pages: int
    facets: Dict[str, Any] = {}
    suggestions: List[str] = []


class SearchSuggestion(BaseModel):
    text: str
    type: str
    count: int


class SearchAnalytics(BaseModel):
    total_searches: int
    popular_queries: List[Dict[str, Any]]
    search_success_rate: float
    average_results_per_search: float
    top_filters: List[Dict[str, Any]]

