from typing import Optional, List, Tuple
from sqlmodel import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import Referral, Job, Employee, JobSeeker, User, Company
from app.schemas.referral import ReferralCreate, ReferralUpdate, ReferralSearchParams


class ReferralService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_referral(self, referral_data: ReferralCreate, employee_id: int) -> Referral:
        """Create a new referral."""
        # Get job
        job_result = await self.db.execute(select(Job).where(Job.id == referral_data.job_id))
        job = job_result.scalar_one_or_none()
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )

        if not job.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot refer to inactive job"
            )

        # Get or create job seeker
        seeker_result = await self.db.execute(
            select(User).where(User.email == referral_data.seeker_email)
        )
        seeker_user = seeker_result.scalar_one_or_none()
        
        if not seeker_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job seeker not found. They need to register first."
            )

        if seeker_user.role != "jobseeker":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is not a job seeker"
            )

        # Get job seeker profile
        seeker_profile_result = await self.db.execute(
            select(JobSeeker).where(JobSeeker.user_id == seeker_user.id)
        )
        seeker_profile = seeker_profile_result.scalar_one_or_none()
        
        if not seeker_profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job seeker profile not found"
            )

        # Check if referral already exists
        existing_referral = await self.db.execute(
            select(Referral).where(
                and_(
                    Referral.job_id == referral_data.job_id,
                    Referral.seeker_id == seeker_profile.id,
                    Referral.employee_id == employee_id
                )
            )
        )
        
        if existing_referral.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Referral already exists for this job seeker"
            )

        # Create referral
        referral = Referral(
            job_id=referral_data.job_id,
            seeker_id=seeker_profile.id,
            employee_id=employee_id,
            status="pending",
            notes=referral_data.notes
        )

        self.db.add(referral)
        await self.db.commit()
        await self.db.refresh(referral)
        return referral

    async def get_referral_by_id(self, referral_id: int) -> Optional[Referral]:
        """Get referral by ID."""
        result = await self.db.execute(select(Referral).where(Referral.id == referral_id))
        return result.scalar_one_or_none()

    async def update_referral(self, referral_id: int, referral_data: ReferralUpdate, employee_id: int) -> Referral:
        """Update referral status."""
        referral = await self.get_referral_by_id(referral_id)
        if not referral:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Referral not found"
            )

        # Check if employee can update this referral
        if referral.employee_id != employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this referral"
            )

        update_data = referral_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(referral, field, value)

        self.db.add(referral)
        await self.db.commit()
        await self.db.refresh(referral)
        return referral

    async def search_referrals(self, search_params: ReferralSearchParams) -> Tuple[List[Referral], int]:
        """Search referrals with filters."""
        query = select(Referral)
        
        # Apply filters
        if search_params.status:
            query = query.where(Referral.status == search_params.status)
        
        if search_params.job_id:
            query = query.where(Referral.job_id == search_params.job_id)
        
        if search_params.seeker_id:
            query = query.where(Referral.seeker_id == search_params.seeker_id)
        
        if search_params.employee_id:
            query = query.where(Referral.employee_id == search_params.employee_id)
        
        if search_params.company_id:
            # Join with Job and filter by company_id
            query = query.join(Job).where(Job.company_id == search_params.company_id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Apply pagination
        query = query.offset((search_params.page - 1) * search_params.size).limit(search_params.size)
        
        # Order by created_at desc
        query = query.order_by(Referral.created_at.desc())

        result = await self.db.execute(query)
        referrals = result.scalars().all()
        
        return referrals, total

    async def get_referral_with_details(self, referral_id: int) -> Optional[Referral]:
        """Get referral with job, seeker, and employee details."""
        referral = await self.get_referral_by_id(referral_id)
        if not referral:
            return None

        # Return referral as-is for now - we'll handle details in the response model
        return referral

    async def get_employee_referrals(self, employee_id: int, skip: int = 0, limit: int = 100) -> List[Referral]:
        """Get referrals made by a specific employee."""
        query = select(Referral).where(Referral.employee_id == employee_id).offset(skip).limit(limit).order_by(Referral.created_at.desc())

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_seeker_referrals(self, seeker_id: int, skip: int = 0, limit: int = 100) -> List[Referral]:
        """Get referrals for a specific job seeker."""
        query = select(Referral).where(Referral.seeker_id == seeker_id).offset(skip).limit(limit).order_by(Referral.created_at.desc())

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_referral_stats(self, employee_id: Optional[int] = None) -> dict:
        """Get referral statistics."""
        base_query = select(Referral)
        
        if employee_id:
            base_query = base_query.where(Referral.employee_id == employee_id)

        # Total referrals
        total_result = await self.db.execute(select(func.count()).select_from(base_query.subquery()))
        total_referrals = total_result.scalar()

        # Status counts
        status_counts = {}
        for status in ["pending", "submitted", "under_review", "interview_scheduled", "hired", "rejected", "withdrawn"]:
            count_query = base_query.where(Referral.status == status)
            count_result = await self.db.execute(select(func.count()).select_from(count_query.subquery()))
            status_counts[f"{status}_referrals"] = count_result.scalar()

        # Success rate
        success_rate = 0.0
        if total_referrals > 0:
            success_rate = (status_counts["hired_referrals"] / total_referrals) * 100

        # Recent referrals (last 5)
        recent_query = base_query.order_by(Referral.created_at.desc()).limit(5)
        recent_result = await self.db.execute(recent_query)
        recent_referrals = recent_result.scalars().all()

        return {
            "total_referrals": total_referrals,
            **status_counts,
            "success_rate": round(success_rate, 2),
            "recent_referrals": recent_referrals
        }
