from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.db.session import get_db_session
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, TokenRefresh, UserResponse
from app.services.auth_service import AuthService
from app.security.jwt import create_access_token, create_refresh_token, decode_token
from app.dependencies.auth import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db_session)
):
    """Register a new user (employee or job seeker)."""
    auth_service = AuthService(db)
    user = auth_service.register_user(user_data)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db_session)
):
    """Login user and return JWT tokens."""
    auth_service = AuthService(db)
    user = auth_service.authenticate_user(login_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    token_data: TokenRefresh,
    db: Session = Depends(get_db_session)
):
    """Refresh access token using refresh token."""
    try:
        payload = decode_token(token_data.refresh_token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if not user_id or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Verify user still exists and is active
        from sqlalchemy import text
        result = db.exec(
            text("SELECT id FROM users WHERE id = :user_id AND is_active = true"),
            {"user_id": int(user_id)}
        )
        if not result.first():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        access_token = create_access_token(str(user_id))
        refresh_token = create_refresh_token(str(user_id))
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me-simple")
def get_current_user_info_simple(
    current_user: User = Depends(get_current_user)
):
    """Get current user information - simplified version."""
    try:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
            "is_email_verified": current_user.is_email_verified,
            "is_active": current_user.is_active
        }
    except Exception as e:
        print(f"Error in me-simple: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/test-no-auth")
def test_no_auth():
    """Test endpoint without authentication."""
    return {"message": "No auth test works"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information."""
    try:
        print(f"DEBUG: User object: {current_user}")
        print(f"DEBUG: User ID: {current_user.id}")
        print(f"DEBUG: User email: {current_user.email}")
        print(f"DEBUG: User role: {current_user.role}")
        
        response = UserResponse.model_validate(current_user)
        print(f"DEBUG: Response created successfully")
        return response
        
    except Exception as e:
        print(f"DEBUG: Error in /me endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
