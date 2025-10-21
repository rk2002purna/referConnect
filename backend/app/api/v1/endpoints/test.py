from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db.session import get_db_session
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/test-simple")
def test_simple():
    """Simple test endpoint without authentication."""
    return {"message": "Simple test works"}

@router.get("/test-db", response_model=dict)
def test_database(db: Session = Depends(get_db_session)):
    """Test database connection."""
    try:
        from sqlmodel import select
        users = db.exec(select(User)).all()
        return {"message": "Database works", "user_count": len(users)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/test-user/{user_id}", response_model=UserResponse)
def test_user_lookup(user_id: int, db: Session = Depends(get_db_session)):
    """Test user lookup and response creation."""
    try:
        from sqlmodel import select
        user = db.exec(select(User).where(User.id == user_id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return UserResponse.model_validate(user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"User lookup error: {str(e)}")
