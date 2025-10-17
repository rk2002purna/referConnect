from typing import Optional, Dict, Any, List
from sqlmodel import Session, select, update, and_
from sqlalchemy.orm import selectinload
import os
import uuid
from pathlib import Path
from datetime import datetime, timedelta

from app.models.user import User, Employee, Company, Referral
from app.models.verification import EmployeeVerification, VerifiedCompany, VerificationStatus
from app.schemas.profile import (
    EmployeeProfileResponse, EmployeeProfileUpdateRequest, ProfilePictureUploadResponse,
    EmailVerificationRequest, EmailVerificationResponse, ProfileMetrics,
    CompanyInfo, EmployeeCompanyDetails, ReferralPreference, PrivacySettings,
    ComplianceSettings
)
from app.services.otp_service import OTPService
from app.services.email_service import EmailService


class EmployeeProfileService:
    def __init__(self, db: Session):
        self.db = db
        self.upload_dir = Path("uploads/profile_pictures")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.otp_service = OTPService(db)
        self.email_service = EmailService()

    def get_employee_profile(self, user_id: int) -> EmployeeProfileResponse:
        """Get comprehensive employee profile information"""
        # Get user
        user_result = self.db.exec(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise ValueError("User not found")
        
        if user.role.value != 'employee':
            raise ValueError("User is not an employee")
        
        # Get employee profile
        employee_result = self.db.exec(
            select(Employee).where(Employee.user_id == user_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        # Get company details if employee has company
        company_details = None
        if employee and employee.company_id:
            company_result = self.db.exec(
                select(Company).where(Company.id == employee.company_id)
            )
            company = company_result.scalar_one_or_none()
            
            if company:
                company_details = EmployeeCompanyDetails(
                    company=CompanyInfo(
                        id=company.id,
                        name=company.name,
                        domain=company.domain,
                        industry=getattr(company, 'industry', None),
                        size=getattr(company, 'size', None),
                        logo_url=getattr(company, 'logo_url', None),
                        location=getattr(company, 'location', None)
                    ),
                    job_title=employee.title or "",
                    department=getattr(employee, 'department', None),
                    office_location=getattr(employee, 'office_location', None),
                    years_at_company=getattr(employee, 'years_at_company', None),
                    start_date=getattr(employee, 'start_date', None)
                )
        
        # Get verification status
        verification_status = "pending"
        last_verified = None
        if user.is_email_verified:
            verification_status = "verified"
            # Get last verification date
            verification_result = self.db.exec(
                select(EmployeeVerification)
                .where(EmployeeVerification.user_id == user_id)
                .order_by(EmployeeVerification.verified_at.desc())
            )
            verification = verification_result.first()
            if verification and verification.verified_at:
                last_verified = verification.verified_at
        
        # Get referral preferences (stored as JSON in employee table)
        referral_preferences = ReferralPreference()
        if employee and employee.badges:
            try:
                import json
                prefs_data = json.loads(employee.badges)
                if 'referral_preferences' in prefs_data:
                    prefs = prefs_data['referral_preferences']
                    referral_preferences = ReferralPreference(
                        roles=prefs.get('roles', []),
                        preferred_method=prefs.get('preferred_method', 'platform_portal'),
                        notification_preferences=prefs.get('notification_preferences', {
                            "new_referral_requests": True,
                            "referral_status_updates": True,
                            "weekly_activity_summary": False
                        })
                    )
            except:
                pass
        
        # Get privacy settings
        privacy_settings = PrivacySettings()
        if employee and employee.badges:
            try:
                import json
                prefs_data = json.loads(employee.badges)
                if 'privacy_settings' in prefs_data:
                    prefs = prefs_data['privacy_settings']
                    privacy_settings = PrivacySettings(
                        profile_visibility=prefs.get('profile_visibility', 'all_users'),
                        show_contact_info=prefs.get('show_contact_info', True),
                        show_referral_history=prefs.get('show_referral_history', True)
                    )
            except:
                pass
        
        # Get compliance settings
        compliance_settings = ComplianceSettings()
        if employee and employee.badges:
            try:
                import json
                prefs_data = json.loads(employee.badges)
                if 'compliance_settings' in prefs_data:
                    prefs = prefs_data['compliance_settings']
                    compliance_settings = ComplianceSettings(
                        referral_guidelines_acknowledged=prefs.get('referral_guidelines_acknowledged', False),
                        data_processing_consent=prefs.get('data_processing_consent', False),
                        marketing_consent=prefs.get('marketing_consent', False)
                    )
            except:
                pass
        
        # Get metrics
        metrics = self._get_profile_metrics(user_id, employee.id if employee else None)
        
        return EmployeeProfileResponse(
            user_id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            profile_picture=user.profile_picture,
            bio=user.bio,
            linkedin_url=user.linkedin_url,
            phone=user.phone,
            location=user.location,
            company_details=company_details,
            is_email_verified=user.is_email_verified,
            verification_status=verification_status,
            last_verified=last_verified,
            referral_preferences=referral_preferences,
            privacy_settings=privacy_settings,
            compliance_settings=compliance_settings,
            metrics=metrics,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    def update_employee_profile(self, user_id: int, profile_data: EmployeeProfileUpdateRequest) -> EmployeeProfileResponse:
        """Update employee profile with comprehensive data"""
        # Get user
        user_result = self.db.exec(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            raise ValueError("User not found")
        
        if user.role.value != 'employee':
            raise ValueError("User is not an employee")
        
        # Get or create employee profile
        employee_result = self.db.exec(
            select(Employee).where(Employee.user_id == user_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            employee = Employee(user_id=user_id)
            self.db.add(employee)
            self.db.commit()
            self.db.refresh(employee)
        
        # Handle email change (triggers re-verification)
        if profile_data.company_email and profile_data.company_email != user.email:
            self._handle_email_change(user_id, profile_data.company_email, employee)
        
        # Update basic user info
        user_update_data = {}
        if profile_data.first_name is not None:
            user_update_data['first_name'] = profile_data.first_name
        if profile_data.last_name is not None:
            user_update_data['last_name'] = profile_data.last_name
        if profile_data.bio is not None:
            user_update_data['bio'] = profile_data.bio
        if profile_data.linkedin_url is not None:
            user_update_data['linkedin_url'] = profile_data.linkedin_url
        if profile_data.phone is not None:
            user_update_data['phone'] = profile_data.phone
        if profile_data.location is not None:
            user_update_data['location'] = profile_data.location
        if profile_data.profile_picture is not None:
            user_update_data['profile_picture'] = profile_data.profile_picture
        
        if user_update_data:
            self.db.exec(
                update(User)
                .where(User.id == user_id)
                .values(**user_update_data)
            )
        
        # Update employee-specific info
        employee_update_data = {}
        if profile_data.job_title is not None:
            employee_update_data['title'] = profile_data.job_title
        if profile_data.department is not None:
            employee_update_data['department'] = profile_data.department
        if profile_data.office_location is not None:
            employee_update_data['office_location'] = profile_data.office_location
        if profile_data.years_at_company is not None:
            employee_update_data['years_at_company'] = profile_data.years_at_company
        
        # Update preferences in badges field (JSON)
        if any([
            profile_data.referral_roles is not None,
            profile_data.preferred_referral_method is not None,
            profile_data.notification_preferences is not None,
            profile_data.profile_visibility is not None,
            profile_data.show_contact_info is not None,
            profile_data.show_referral_history is not None,
            profile_data.referral_guidelines_acknowledged is not None,
            profile_data.data_processing_consent is not None,
            profile_data.marketing_consent is not None
        ]):
            self._update_employee_preferences(employee, profile_data)
        
        if employee_update_data:
            self.db.exec(
                update(Employee)
                .where(Employee.id == employee.id)
                .values(**employee_update_data)
            )
        
        self.db.commit()
        return self.get_employee_profile(user_id)

    def upload_profile_picture(self, user_id: int, file_content: bytes, filename: str) -> ProfilePictureUploadResponse:
        """Upload profile picture for employee"""
        # Generate unique filename
        file_extension = Path(filename).suffix
        unique_filename = f"{user_id}_{uuid.uuid4().hex}{file_extension}"
        file_path = self.upload_dir / unique_filename
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Update user profile with picture URL
        profile_picture_url = f"/uploads/profile_pictures/{unique_filename}"
        self.db.exec(
            update(User)
            .where(User.id == user_id)
            .values(profile_picture=profile_picture_url)
        )
        self.db.commit()
        
        return ProfilePictureUploadResponse(
            profile_picture_url=profile_picture_url,
            message="Profile picture uploaded successfully"
        )

    def initiate_email_verification(self, user_id: int, verification_request: EmailVerificationRequest) -> EmailVerificationResponse:
        """Initiate email verification process for company email change"""
        # Check if company exists
        company_result = self.db.exec(
            select(VerifiedCompany).where(VerifiedCompany.id == verification_request.company_id)
        )
        company = company_result.scalar_one_or_none()
        
        if not company:
            raise ValueError("Company not found")
        
        # Check if email domain matches company domain
        email_domain = verification_request.company_email.split('@')[1]
        if email_domain != company.domain:
            raise ValueError("Email domain does not match company domain")
        
        # Create or update verification record
        verification_result = self.db.exec(
            select(EmployeeVerification)
            .where(EmployeeVerification.user_id == user_id)
            .where(EmployeeVerification.company_id == verification_request.company_id)
        )
        verification = verification_result.scalar_one_or_none()
        
        if not verification:
            verification = EmployeeVerification(
                user_id=user_id,
                company_id=verification_request.company_id,
                verification_method="email",
                status=VerificationStatus.pending_email,
                company_email=verification_request.company_email,
                expires_at=datetime.utcnow() + timedelta(hours=24)
            )
            self.db.add(verification)
        else:
            verification.status = VerificationStatus.pending_email
            verification.company_email = verification_request.company_email
            verification.expires_at = datetime.utcnow() + timedelta(hours=24)
        
        self.db.commit()
        
        # Send OTP
        otp_sent = self.otp_service.send_otp(
            user_id=user_id,
            company_id=verification_request.company_id,
            company_email=verification_request.company_email
        )
        
        return EmailVerificationResponse(
            message="Verification email sent. Please check your inbox and enter the OTP.",
            verification_required=True,
            otp_sent=otp_sent
        )

    def _handle_email_change(self, user_id: int, new_email: str, employee: Employee):
        """Handle email change and trigger re-verification"""
        # Update user email
        self.db.exec(
            update(User)
            .where(User.id == user_id)
            .values(
                email=new_email,
                is_email_verified=False,
                email_domain=new_email.split('@')[1]
            )
        )
        
        # Reset verification status
        verification_result = self.db.exec(
            select(EmployeeVerification).where(EmployeeVerification.user_id == user_id)
        )
        verification = verification_result.scalar_one_or_none()
        
        if verification:
            verification.status = VerificationStatus.pending_email
            verification.company_email = new_email
            verification.verified_at = None
            verification.expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Lock company features until verified
        # This could be implemented by checking verification status in other services

    def _update_employee_preferences(self, employee: Employee, profile_data: EmployeeProfileUpdateRequest):
        """Update employee preferences stored in badges field as JSON"""
        import json
        
        # Parse existing preferences
        preferences = {}
        if employee.badges:
            try:
                preferences = json.loads(employee.badges)
            except:
                preferences = {}
        
        # Update referral preferences
        if any([profile_data.referral_roles is not None, 
                profile_data.preferred_referral_method is not None,
                profile_data.notification_preferences is not None]):
            if 'referral_preferences' not in preferences:
                preferences['referral_preferences'] = {}
            
            if profile_data.referral_roles is not None:
                preferences['referral_preferences']['roles'] = profile_data.referral_roles
            if profile_data.preferred_referral_method is not None:
                preferences['referral_preferences']['preferred_method'] = profile_data.preferred_referral_method
            if profile_data.notification_preferences is not None:
                preferences['referral_preferences']['notification_preferences'] = profile_data.notification_preferences
        
        # Update privacy settings
        if any([profile_data.profile_visibility is not None,
                profile_data.show_contact_info is not None,
                profile_data.show_referral_history is not None]):
            if 'privacy_settings' not in preferences:
                preferences['privacy_settings'] = {}
            
            if profile_data.profile_visibility is not None:
                preferences['privacy_settings']['profile_visibility'] = profile_data.profile_visibility
            if profile_data.show_contact_info is not None:
                preferences['privacy_settings']['show_contact_info'] = profile_data.show_contact_info
            if profile_data.show_referral_history is not None:
                preferences['privacy_settings']['show_referral_history'] = profile_data.show_referral_history
        
        # Update compliance settings
        if any([profile_data.referral_guidelines_acknowledged is not None,
                profile_data.data_processing_consent is not None,
                profile_data.marketing_consent is not None]):
            if 'compliance_settings' not in preferences:
                preferences['compliance_settings'] = {}
            
            if profile_data.referral_guidelines_acknowledged is not None:
                preferences['compliance_settings']['referral_guidelines_acknowledged'] = profile_data.referral_guidelines_acknowledged
            if profile_data.data_processing_consent is not None:
                preferences['compliance_settings']['data_processing_consent'] = profile_data.data_processing_consent
            if profile_data.marketing_consent is not None:
                preferences['compliance_settings']['marketing_consent'] = profile_data.marketing_consent
        
        # Update employee badges field
        employee.badges = json.dumps(preferences)

    def _get_profile_metrics(self, user_id: int, employee_id: Optional[int]) -> ProfileMetrics:
        """Calculate profile metrics for employee"""
        # Get referral stats
        total_referrals = 0
        successful_hires = 0
        success_rate = 0.0
        
        if employee_id:
            referrals_result = self.db.exec(
                select(Referral).where(Referral.employee_id == employee_id)
            )
            referrals = referrals_result.scalars().all()
            
            total_referrals = len(referrals)
            successful_hires = len([r for r in referrals if r.status == "hired"])
            if total_referrals > 0:
                success_rate = (successful_hires / total_referrals) * 100
        
        # Calculate profile completion
        profile_completion = self._calculate_profile_completion(user_id)
        
        # Calculate rewards (placeholder - would need rewards system)
        rewards_earned = successful_hires * 500.0  # $500 per successful hire
        
        return ProfileMetrics(
            total_referrals=total_referrals,
            successful_hires=successful_hires,
            success_rate=round(success_rate, 2),
            rewards_earned=rewards_earned,
            profile_completion=profile_completion,
            last_activity=datetime.utcnow()
        )

    def _calculate_profile_completion(self, user_id: int) -> int:
        """Calculate profile completion percentage"""
        # Get user
        user_result = self.db.exec(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            return 0
        
        # Basic fields
        basic_fields = ['first_name', 'last_name', 'phone', 'linkedin_url', 'bio', 'location', 'profile_picture']
        basic_completed = sum(1 for field in basic_fields if getattr(user, field) is not None)
        basic_completion = int((basic_completed / len(basic_fields)) * 100)
        
        # Employee-specific fields
        employee_result = self.db.exec(
            select(Employee).where(Employee.user_id == user_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        employee_completion = 0
        if employee:
            employee_fields = ['title', 'company_id']
            employee_completed = sum(1 for field in employee_fields if getattr(employee, field) is not None)
            employee_completion = int((employee_completed / len(employee_fields)) * 100)
        
        # Overall completion (weighted average)
        overall_completion = int((basic_completion * 0.7) + (employee_completion * 0.3))
        
        return min(overall_completion, 100)
