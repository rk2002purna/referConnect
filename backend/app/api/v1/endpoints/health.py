from fastapi import APIRouter, Depends
from sqlmodel import Session, text
from app.core.database import get_session
from app.core.config import get_settings

router = APIRouter()

@router.get("/health")
async def health_check(session: Session = Depends(get_session)):
    """Health check endpoint for monitoring"""
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
