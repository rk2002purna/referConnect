from typing import Optional
from sqlmodel import Session, select
from fastapi import HTTPException, status

from app.models.user import User, UserRole, Company, Employee, JobSeeker
from app.security.passwords import hash_password, verify_password
from app.security.email_domain import extract_domain, is_corporate_email, validate_email_format
from app.schemas.auth import UserRegister, UserLogin


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register_user(self, user_data: UserRegister) -> User:
        """Register a new user with email domain validation."""
        # Validate email format
        if not validate_email_format(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email format"
            )

        # Check if user already exists
        existing_user = self.db.exec(
            select(User).where(User.email == user_data.email)
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Extract and validate domain
        domain = extract_domain(user_data.email)
        
        # For employees, create a basic company entry (verification will happen during onboarding)
        company = None
        if user_data.role == UserRole.employee:
            if user_data.verification:
                # Use verification data for company (if provided)
                company = self._get_company_by_id(user_data.verification.company_id)
                if not company:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Invalid company selected for verification"
                    )
            else:
                # Create a basic company entry for the domain (verification will happen during onboarding)
                company = self._get_or_create_company(domain)

        # Create user
        hashed_password = hash_password(user_data.password)
        user = User(
            email=user_data.email,
            email_domain=domain,
            hashed_password=hashed_password,
            role=user_data.role,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_email_verified=False  # Will be verified via email
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        # Create role-specific profile only for employees
        if user_data.role == UserRole.employee:
            employee = Employee(
                user_id=user.id,
                company_id=company.id
            )
            self.db.add(employee)
        # JobSeeker profile will be created when user first accesses profile features

        self.db.commit()
        return user

    def authenticate_user(self, login_data: UserLogin) -> Optional[User]:
        """Authenticate user with email and password."""
        result = self.db.exec(
            select(User).where(User.email == login_data.email)
        )
        user = result.first()
        
        if not user or not verify_password(login_data.password, user.hashed_password):
            return None
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is deactivated"
            )
        
        return user

    def _get_or_create_company(self, domain: str) -> Company:
        """Get existing company or create new one."""
        result = self.db.exec(
            select(Company).where(Company.domain == domain)
        )
        company = result.first()
        
        if not company:
            company = Company(
                name=domain.split('.')[0].title(),  # Simple name from domain
                domain=domain
            )
            self.db.add(company)
            self.db.commit()
            self.db.refresh(company)
        
        return company

    def _get_company_by_id(self, company_id: int) -> Optional[Company]:
        """Get company by ID from verified companies table."""
        # For now, we'll use a simple approach since we're using SQLite
        # In a real app, this would query the verified_companies table
        result = self.db.exec(
            select(Company).where(Company.id == company_id)
        )
        return result.first()
