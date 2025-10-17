from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlmodel import Session, select
from fastapi import HTTPException, UploadFile
import aiofiles
import os

from app.models.verification import (
    VerifiedCompany, 
    EmployeeVerification, 
    IDCardVerification,
    VerificationMethod,
    VerificationStatus
)
from app.schemas.verification import (
    VerifiedCompanyCreate,
    UploadIDCardRequest,
    UpdateVerificationStatusRequest,
    ApproveVerificationRequest,
    RejectVerificationRequest
)


class VerificationService:
    def __init__(self, db: Session):
        self.db = db

    # Company Management
    def get_verified_companies(self, query: Optional[str] = None) -> List[VerifiedCompany]:
        """Get verified companies with optional search query"""
        statement = select(VerifiedCompany).where(VerifiedCompany.verified == True)
        
        if query:
            search_term = f"%{query.lower()}%"
            statement = statement.where(
                (VerifiedCompany.name.ilike(search_term)) |
                (VerifiedCompany.domain.ilike(search_term)) |
                (VerifiedCompany.industry.ilike(search_term))
            )
        
        statement = statement.order_by(VerifiedCompany.name)
        return self.db.exec(statement).all()

    def create_verified_company(self, company_data: VerifiedCompanyCreate) -> VerifiedCompany:
        """Create a new verified company"""
        company = VerifiedCompany(**company_data.dict())
        self.db.add(company)
        self.db.commit()
        self.db.refresh(company)
        return company


    # ID Card Verification
    async def upload_id_card(
        self, 
        request: UploadIDCardRequest, 
        user_id: int,
        selfie_file: UploadFile,
        id_card_file: UploadFile
    ) -> dict:
        """Upload ID card for manual verification"""
        # Check if company exists
        company = self.db.get(VerifiedCompany, request.company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        # Create uploads directory if it doesn't exist
        upload_dir = "uploads/verification"
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique filenames
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        selfie_filename = f"{user_id}_{timestamp}_selfie.{selfie_file.filename.split('.')[-1]}"
        id_card_filename = f"{user_id}_{timestamp}_idcard.{id_card_file.filename.split('.')[-1]}"

        # Save files
        selfie_path = os.path.join(upload_dir, selfie_filename)
        id_card_path = os.path.join(upload_dir, id_card_filename)

        async with aiofiles.open(selfie_path, 'wb') as f:
            content = await selfie_file.read()
            await f.write(content)

        async with aiofiles.open(id_card_path, 'wb') as f:
            content = await id_card_file.read()
            await f.write(content)

        # Create ID card verification record
        id_card_verification = IDCardVerification(
            user_id=user_id,
            company_id=request.company_id,
            selfie_url=f"/uploads/verification/{selfie_filename}",
            id_card_url=f"/uploads/verification/{id_card_filename}",
            status="pending"
        )
        self.db.add(id_card_verification)
        self.db.commit()
        self.db.refresh(id_card_verification)

        # Create or update employee verification
        verification = self.db.exec(
            select(EmployeeVerification).where(
                EmployeeVerification.user_id == user_id,
                EmployeeVerification.company_id == request.company_id
            )
        ).first()

        if verification:
            verification.status = VerificationStatus.pending_id_card
            verification.verification_method = VerificationMethod.id_card
        else:
            verification = EmployeeVerification(
                user_id=user_id,
                company_id=request.company_id,
                verification_method=VerificationMethod.id_card,
                status=VerificationStatus.pending_id_card
            )
            self.db.add(verification)

        self.db.commit()

        return {
            "success": True,
            "message": "ID card uploaded successfully",
            "verification_id": id_card_verification.id
        }

    # Verification Status
    def get_verification_status(self, user_id: int) -> Optional[EmployeeVerification]:
        """Get user's verification status"""
        return self.db.exec(
            select(EmployeeVerification).where(EmployeeVerification.user_id == user_id)
        ).first()

    def update_verification_status(self, user_id: int, request: UpdateVerificationStatusRequest) -> dict:
        """Update verification status"""
        verification = self.db.exec(
            select(EmployeeVerification).where(EmployeeVerification.user_id == user_id)
        ).first()

        if not verification:
            raise HTTPException(status_code=404, detail="Verification not found")

        verification.status = request.status
        if request.company_id:
            verification.company_id = request.company_id
        if request.method:
            verification.verification_method = request.method

        self.db.commit()

        return {"message": "Verification status updated successfully"}

    # Admin Functions
    def get_pending_verifications(self, skip: int = 0, limit: int = 100) -> List[dict]:
        """Get pending ID card verifications for admin review"""
        statement = select(IDCardVerification).where(
            IDCardVerification.status == "pending"
        ).offset(skip).limit(limit)

        verifications = self.db.exec(statement).all()
        
        result = []
        for verification in verifications:
            # Get user info
            from app.models.user import User
            user = self.db.get(User, verification.user_id)
            company = self.db.get(VerifiedCompany, verification.company_id)
            
            result.append({
                "id": verification.id,
                "user_id": verification.user_id,
                "user_name": f"{user.first_name} {user.last_name}" if user else "Unknown",
                "user_email": user.email if user else "Unknown",
                "method": "id_card",
                "status": verification.status,
                "selfie_url": verification.selfie_url,
                "id_card_url": verification.id_card_url,
                "notes": verification.admin_notes,
                "submitted_at": verification.created_at,
                "company_name": company.name if company else "Unknown"
            })

        return result

    def approve_verification(self, verification_id: int, request: ApproveVerificationRequest, admin_user_id: int) -> dict:
        """Approve ID card verification"""
        verification = self.db.get(IDCardVerification, verification_id)
        if not verification:
            raise HTTPException(status_code=404, detail="Verification not found")

        verification.status = "approved"
        verification.reviewed_by = admin_user_id
        verification.reviewed_at = datetime.utcnow()
        verification.admin_notes = request.notes

        # Update employee verification status
        emp_verification = self.db.exec(
            select(EmployeeVerification).where(
                EmployeeVerification.user_id == verification.user_id,
                EmployeeVerification.company_id == verification.company_id
            )
        ).first()

        if emp_verification:
            emp_verification.status = VerificationStatus.verified
            emp_verification.verified_at = datetime.utcnow()

        self.db.commit()

        return {"message": "Verification approved successfully"}

    def reject_verification(self, verification_id: int, request: RejectVerificationRequest, admin_user_id: int) -> dict:
        """Reject ID card verification"""
        verification = self.db.get(IDCardVerification, verification_id)
        if not verification:
            raise HTTPException(status_code=404, detail="Verification not found")

        verification.status = "rejected"
        verification.reviewed_by = admin_user_id
        verification.reviewed_at = datetime.utcnow()
        verification.rejection_reason = request.reason
        verification.admin_notes = request.notes

        # Update employee verification status
        emp_verification = self.db.exec(
            select(EmployeeVerification).where(
                EmployeeVerification.user_id == verification.user_id,
                EmployeeVerification.company_id == verification.company_id
            )
        ).first()

        if emp_verification:
            emp_verification.status = VerificationStatus.rejected
            emp_verification.rejection_reason = request.reason

        self.db.commit()

        return {"message": "Verification rejected successfully"}
