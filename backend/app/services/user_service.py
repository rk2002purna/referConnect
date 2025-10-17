from typing import Optional, List
from sqlmodel import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User, Employee, JobSeeker, Company
from app.schemas.user import (
    UserProfileUpdate, EmployeeProfileCreate, EmployeeProfileUpdate,
    JobSeekerProfileCreate, JobSeekerProfileUpdate, CompanyCreate, CompanyUpdate
)


class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def update_user_profile(self, user_id: int, profile_data: UserProfileUpdate) -> User:
        """Update user profile."""
        user = await self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_employee_profile(self, user_id: int) -> Optional[Employee]:
        """Get employee profile for user."""
        result = await self.db.execute(
            select(Employee).where(Employee.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_employee_profile(self, user_id: int, profile_data: EmployeeProfileCreate) -> Employee:
        """Create employee profile."""
        # Check if profile already exists
        existing = await self.get_employee_profile(user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee profile already exists"
            )

        # Get or create company
        company = await self.get_or_create_company(profile_data.company_domain)
        
        employee = Employee(
            user_id=user_id,
            company_id=company.id,
            title=profile_data.title,
            badges=profile_data.badges
        )

        self.db.add(employee)
        await self.db.commit()
        await self.db.refresh(employee)
        return employee

    async def update_employee_profile(self, user_id: int, profile_data: EmployeeProfileUpdate) -> Employee:
        """Update employee profile."""
        employee = await self.get_employee_profile(user_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee profile not found"
            )

        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(employee, field, value)

        self.db.add(employee)
        await self.db.commit()
        await self.db.refresh(employee)
        return employee

    async def get_job_seeker_profile(self, user_id: int) -> Optional[JobSeeker]:
        """Get job seeker profile for user."""
        result = await self.db.execute(
            select(JobSeeker).where(JobSeeker.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def create_job_seeker_profile(self, user_id: int, profile_data: JobSeekerProfileCreate) -> JobSeeker:
        """Create job seeker profile."""
        # Check if profile already exists
        existing = await self.get_job_seeker_profile(user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job seeker profile already exists"
            )

        job_seeker = JobSeeker(
            user_id=user_id,
            skills=profile_data.skills,
            years_experience=profile_data.years_experience,
            current_company=profile_data.current_company,
            privacy_excluded_companies=profile_data.privacy_excluded_companies,
            trust_score=100  # Default trust score
        )

        self.db.add(job_seeker)
        await self.db.commit()
        await self.db.refresh(job_seeker)
        return job_seeker

    async def update_job_seeker_profile(self, user_id: int, profile_data: JobSeekerProfileUpdate) -> JobSeeker:
        """Update job seeker profile."""
        job_seeker = await self.get_job_seeker_profile(user_id)
        if not job_seeker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker profile not found"
            )

        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(job_seeker, field, value)

        self.db.add(job_seeker)
        await self.db.commit()
        await self.db.refresh(job_seeker)
        return job_seeker

    async def get_or_create_company(self, domain: str) -> Company:
        """Get or create company by domain."""
        result = await self.db.execute(
            select(Company).where(Company.domain == domain)
        )
        company = result.scalar_one_or_none()
        
        if not company:
            # Extract company name from domain
            company_name = domain.split('.')[0].title()
            company = Company(name=company_name, domain=domain)
            self.db.add(company)
            await self.db.commit()
            await self.db.refresh(company)
        
        return company

    async def get_company_by_id(self, company_id: int) -> Optional[Company]:
        """Get company by ID."""
        result = await self.db.execute(select(Company).where(Company.id == company_id))
        return result.scalar_one_or_none()

    async def update_company(self, company_id: int, company_data: CompanyUpdate) -> Company:
        """Update company."""
        company = await self.get_company_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

        update_data = company_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(company, field, value)

        self.db.add(company)
        await self.db.commit()
        await self.db.refresh(company)
        return company

    async def list_users(self, skip: int = 0, limit: int = 100, role: Optional[str] = None) -> List[User]:
        """List users with optional role filter."""
        query = select(User)
        
        if role:
            query = query.where(User.role == role)
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_user_detail(self, user_id: int) -> Optional[User]:
        """Get user with all related profiles."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None

        # Load related profiles
        employee_profile = await self.get_employee_profile(user_id)
        job_seeker_profile = await self.get_job_seeker_profile(user_id)
        
        # Note: We'll handle company loading in the response model instead
        return user
