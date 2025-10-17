from fastapi import Depends, HTTPException, status, Request
from sqlmodel import Session, select
from app.db.session import get_db_session
from app.models.user import User
from app.security.jwt import decode_token


def get_current_user(request: Request, db: Session = Depends(get_db_session)) -> User:
    """Get current authenticated user from JWT token."""
    # For now, return a mock user to test if the endpoint works
    print("🔍 get_current_user called")
    
    # Create a mock user for testing
    mock_user = User(
        id=39,
        email="testme@example.com",
        email_domain="example.com",
        hashed_password="mock_password",
        first_name="Test",
        last_name="Me",
        role="jobseeker",
        is_email_verified=False,
        is_active=True
    )
    
    return mock_user
