from fastapi import Depends, HTTPException, status, Request
from sqlmodel import Session, select
from app.db.session import get_db_session
from app.models.user import User
from app.security.jwt import decode_token
from jwt import ExpiredSignatureError, InvalidTokenError


def get_current_user(request: Request, db: Session = Depends(get_db_session)) -> User:
    """Get current authenticated user from JWT token."""
    try:
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        token = auth_header.split(" ")[1]
        print(f"Token: {token[:20]}...")
        
        # Decode the JWT token
        payload = decode_token(token)
        print(f"Payload: {payload}")
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        print(f"User ID: {user_id}")
        
        # Get user from database
        user = db.exec(select(User).where(User.id == int(user_id))).first()
        print(f"User found: {user is not None}")
        print(f"User role: {user.role if user else 'None'}")
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
        
    except HTTPException:
        # Re-raise explicit HTTP errors
        raise
    except ExpiredSignatureError:
        # Token has expired -> return 401 to trigger frontend refresh/logout
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Signature has expired"
        )
    except InvalidTokenError:
        # Token invalid -> return 401
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        # Fallback unexpected error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


def require_role(allowed_roles: list):
    """Require specific roles for access"""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker
