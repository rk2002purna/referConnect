from fastapi import APIRouter, Depends
from sqlmodel import Session, text
from app.db.session import get_db_session
from app.core.config import get_settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "message": "ReferConnect API is running",
        "version": "1.0.0"
    }

@router.get("/health/detailed")
async def detailed_health_check(session: Session = Depends(get_db_session)):
    """Detailed health check with database connectivity"""
    try:
        # Test database connection
        session.exec(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    settings = get_settings()
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status,
        "environment": settings.ENV,
        "version": "1.0.0"
    }
