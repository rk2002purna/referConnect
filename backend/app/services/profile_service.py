from typing import Optional, Dict, Any, List
from sqlmodel import Session
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
import os
import uuid
from pathlib import Path
from datetime import datetime

from app.models.user import User, JobSeeker, Employee
from app.schemas.profile import (
    ProfileUpdateRequest, JobSeekerProfileUpdateRequest, EmployeeProfileUpdateRequest,
    ProfileResponse, JobSeekerProfileResponse, EmployeeProfileResponse, ProfileCompletionResponse,
    ExperienceCreate, ExperienceUpdate, ExperienceResponse,
    EducationCreate, EducationUpdate, EducationResponse,
    CertificationCreate, CertificationUpdate, CertificationResponse
)


class ProfileService:
    def __init__(self, db: Session):
        self.db = db
        self.upload_dir = Path("uploads/resumes")
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def get_profile(self, user_id: int) -> ProfileResponse:
        """Get user profile information"""
        user = self.db.get(User, user_id)
        
        if not user:
            raise ValueError("User not found")
        
        return ProfileResponse(
            id=user.id,
            email=user.email,
            role=user.role.value if hasattr(user.role, 'value') else str(user.role),
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            linkedin_url=user.linkedin_url,
            profile_picture=user.profile_picture,
            bio=user.bio,
            location=user.location,
            website=user.website,
            is_email_verified=user.is_email_verified,
            is_active=user.is_active
        )

    def update_profile(self, user_id: int, profile_data: ProfileUpdateRequest) -> ProfileResponse:
        """Update user profile information"""
        # Get current user
        user = self.db.get(User, user_id)
        
        if not user:
            raise ValueError("User not found")
        
        # Update fields
        update_data = profile_data.dict(exclude_unset=True)
        if update_data:
            for key, value in update_data.items():
                setattr(user, key, value)
            self.db.commit()
        
        # Return updated profile
        return self.get_profile(user_id)

    def get_jobseeker_profile(self, user_id: int) -> Optional[JobSeekerProfileResponse]:
        """Get jobseeker profile information"""
        result = self.db.exec(
            select(JobSeeker).where(JobSeeker.user_id == user_id)
        )
        jobseeker = result.scalar_one_or_none()
        
        if not jobseeker:
            return None
        
        return JobSeekerProfileResponse(
            user_id=jobseeker.user_id,
            skills=jobseeker.skills,
            years_experience=jobseeker.years_experience,
            current_company=jobseeker.current_company,
            privacy_excluded_companies=jobseeker.privacy_excluded_companies,
            trust_score=jobseeker.trust_score,
            resume_filename=jobseeker.resume_filename
        )

    def update_jobseeker_profile(self, user_id: int, profile_data: JobSeekerProfileUpdateRequest) -> JobSeekerProfileResponse:
        """Update jobseeker profile information"""
        # Get current jobseeker profile
        result = self.db.exec(
            select(JobSeeker).where(JobSeeker.user_id == user_id)
        )
        jobseeker = result.scalar_one_or_none()
        
        if not jobseeker:
            # Create new jobseeker profile
            jobseeker = JobSeeker(
                user_id=user_id,
                skills=profile_data.skills,
                years_experience=profile_data.years_experience,
                current_company=profile_data.current_company,
                privacy_excluded_companies=profile_data.privacy_excluded_companies,
                trust_score=0
            )
            self.db.add(jobseeker)
        else:
            # Update existing profile
            update_data = profile_data.dict(exclude_unset=True)
            if update_data:
                for key, value in update_data.items():
                    setattr(jobseeker, key, value)
        
        self.db.commit()
        return self.get_jobseeker_profile(user_id)

    def get_employee_profile(self, user_id: int) -> Optional[EmployeeProfileResponse]:
        """Get employee profile information"""
        result = self.db.exec(
            select(Employee).where(Employee.user_id == user_id)
        )
        employee = result.scalar_one_or_none()
        
        if not employee:
            return None
        
        # Get user information
        user_result = self.db.exec(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()
        
        if not user:
            return None
        
        return EmployeeProfileResponse(
            user_id=employee.user_id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            profile_picture=user.profile_picture,
            bio=user.bio,
            linkedin_url=user.linkedin_url,
            phone=user.phone,
            location=user.location,
            is_email_verified=user.is_email_verified,
            verification_status="pending",  # Default status
            last_verified=None,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    def update_employee_profile(self, user_id: int, profile_data: EmployeeProfileUpdateRequest) -> EmployeeProfileResponse:
        """Update employee profile information"""
        # Get current employee profile
        result = self.db.exec(
            select(Employee).where(Employee.user_id == user_id)
        )
        employee = result.scalar_one_or_none()
        
        if not employee:
            # Create new employee profile
            employee = Employee(
                user_id=user_id,
                title=profile_data.title,
                badges=profile_data.badges,
                company_id=profile_data.company_id
            )
            self.db.add(employee)
        else:
            # Update existing profile
            update_data = profile_data.dict(exclude_unset=True)
            if update_data:
                for key, value in update_data.items():
                    setattr(employee, key, value)
        
        self.db.commit()
        return self.get_employee_profile(user_id)

    def upload_resume(self, user_id: int, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Upload resume for jobseeker"""
        # Generate unique filename
        file_extension = Path(filename).suffix
        unique_filename = f"{user_id}_{uuid.uuid4().hex}{file_extension}"
        file_path = self.upload_dir / unique_filename
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        # Update jobseeker profile with resume info
        result = self.db.exec(
            select(JobSeeker).where(JobSeeker.user_id == user_id)
        )
        jobseeker = result.first()
        
        if not jobseeker:
            # Create new jobseeker profile
            jobseeker = JobSeeker(
                user_id=user_id,
                resume_filename=filename,
                resume_path=str(file_path),
                trust_score=0
            )
            self.db.add(jobseeker)
        else:
            # Update existing profile
            self.db.exec(
                update(JobSeeker)
                .where(JobSeeker.user_id == user_id)
                .values(
                    resume_filename=filename,
                    resume_path=str(file_path)
                )
            )
        
        self.db.commit()
        
        return {
            "filename": filename,
            "path": str(file_path),
            "size": len(file_content),
            "uploaded_at": datetime.utcnow().isoformat()
        }

    def get_profile_completion(self, user_id: int) -> ProfileCompletionResponse:
        """Calculate profile completion percentage"""
        # Get user profile
        result = self.db.exec(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError("User not found")
        
        # Calculate basic info completion
        basic_fields = ['first_name', 'last_name', 'phone', 'linkedin_url', 'bio', 'location']
        basic_completed = sum(1 for field in basic_fields if getattr(user, field) is not None)
        basic_completion = int((basic_completed / len(basic_fields)) * 100)
        
        # Calculate role-specific completion
        jobseeker_completion = 0
        employee_completion = 0
        
        # Check experience, education, and certifications for all users
        from app.models.user import Experience, Education, Certification
        
        exp_result = self.db.exec(
            select(Experience).where(Experience.user_id == user_id)
        )
        has_experience = exp_result.scalar_one_or_none() is not None
        
        edu_result = self.db.exec(
            select(Education).where(Education.user_id == user_id)
        )
        has_education = edu_result.scalar_one_or_none() is not None
        
        cert_result = self.db.exec(
            select(Certification).where(Certification.user_id == user_id)
        )
        has_certifications = cert_result.scalar_one_or_none() is not None
        
        if user.role.value == 'jobseeker':
            result = self.db.exec(
                select(JobSeeker).where(JobSeeker.user_id == user_id)
            )
            jobseeker = result.scalar_one_or_none()
            
            if jobseeker:
                jobseeker_fields = ['skills', 'years_experience', 'current_company', 'resume_filename']
                jobseeker_completed = sum(1 for field in jobseeker_fields if getattr(jobseeker, field) is not None)
                
                # Add experience, education, and certifications completion
                additional_fields = [has_experience, has_education, has_certifications]
                additional_completed = sum(1 for field in additional_fields if field)
                
                total_fields = len(jobseeker_fields) + len(additional_fields)
                total_completed = jobseeker_completed + additional_completed
                jobseeker_completion = int((total_completed / total_fields) * 100)
        
        elif user.role.value == 'employee':
            result = self.db.exec(
                select(Employee).where(Employee.user_id == user_id)
            )
            employee = result.scalar_one_or_none()
            
            if employee:
                employee_fields = ['title', 'company_id']
                employee_completed = sum(1 for field in employee_fields if getattr(employee, field) is not None)
                
                # Add experience, education, and certifications completion for employees too
                additional_fields = [has_experience, has_education, has_certifications]
                additional_completed = sum(1 for field in additional_fields if field)
                
                total_fields = len(employee_fields) + len(additional_fields)
                total_completed = employee_completed + additional_completed
                employee_completion = int((total_completed / total_fields) * 100)
        
        # Calculate overall completion
        overall_completion = (basic_completion + jobseeker_completion + employee_completion) // 3
        
        # Determine missing fields
        missing_fields = []
        if not user.first_name:
            missing_fields.append("First Name")
        if not user.last_name:
            missing_fields.append("Last Name")
        if not user.phone:
            missing_fields.append("Phone")
        if not user.linkedin_url:
            missing_fields.append("LinkedIn URL")
        if not user.bio:
            missing_fields.append("Bio")
        if not user.location:
            missing_fields.append("Location")
        
        # Check for missing experience, education, and certifications for all users
        if not has_experience:
            missing_fields.append("Experience")
        if not has_education:
            missing_fields.append("Education")
        if not has_certifications:
            missing_fields.append("Certifications")
        
        if user.role.value == 'jobseeker':
            result = self.db.exec(
                select(JobSeeker).where(JobSeeker.user_id == user_id)
            )
            jobseeker = result.scalar_one_or_none()
            
            if jobseeker:
                if not jobseeker.skills:
                    missing_fields.append("Skills")
                if not jobseeker.years_experience:
                    missing_fields.append("Years of Experience")
                if not jobseeker.resume_filename:
                    missing_fields.append("Resume")
        
        # Determine if onboarding is complete (overall completion >= 70% for employees, 80% for jobseekers)
        if user.role.value == 'employee':
            is_complete = overall_completion >= 70
        else:
            is_complete = overall_completion >= 80

        return ProfileCompletionResponse(
            basic_info_completion=basic_completion,
            jobseeker_completion=jobseeker_completion,
            employee_completion=employee_completion,
            overall_completion=overall_completion,
            missing_fields=missing_fields,
            is_complete=is_complete
        )

    # Experience methods
    def get_experience(self, user_id: int) -> List[ExperienceResponse]:
        """Get user's experience entries"""
        from app.models.user import Experience
        result = self.db.exec(
            select(Experience).where(Experience.user_id == user_id).order_by(Experience.start_date.desc())
        )
        experiences = result.scalars().all()
        
        return [
            ExperienceResponse(
                id=exp.id,
                user_id=exp.user_id,
                title=exp.title,
                company=exp.company,
                start_date=exp.start_date,
                end_date=exp.end_date,
                description=exp.description,
                current=exp.current,
                created_at=exp.created_at.isoformat(),
                updated_at=exp.updated_at.isoformat()
            )
            for exp in experiences
        ]

    def create_experience(self, user_id: int, experience_data: ExperienceCreate) -> ExperienceResponse:
        """Create new experience entry"""
        from app.models.user import Experience
        experience = Experience(
            user_id=user_id,
            title=experience_data.title,
            company=experience_data.company,
            start_date=experience_data.start_date,
            end_date=experience_data.end_date,
            description=experience_data.description,
            current=experience_data.current
        )
        self.db.add(experience)
        self.db.commit()
        self.db.refresh(experience)
        
        return ExperienceResponse(
            id=experience.id,
            user_id=experience.user_id,
            title=experience.title,
            company=experience.company,
            start_date=experience.start_date,
            end_date=experience.end_date,
            description=experience.description,
            current=experience.current,
            created_at=experience.created_at.isoformat(),
            updated_at=experience.updated_at.isoformat()
        )

    def update_experience(self, user_id: int, experience_id: int, experience_data: ExperienceUpdate) -> ExperienceResponse:
        """Update experience entry"""
        from app.models.user import Experience
        result = self.db.exec(
            select(Experience).where(Experience.id == experience_id, Experience.user_id == user_id)
        )
        experience = result.first()
        
        if not experience:
            raise ValueError("Experience not found")
        
        update_data = experience_data.dict(exclude_unset=True)
        if update_data:
            for field, value in update_data.items():
                setattr(experience, field, value)
            self.db.commit()
            self.db.refresh(experience)
        
        return ExperienceResponse(
            id=experience.id,
            user_id=experience.user_id,
            title=experience.title,
            company=experience.company,
            start_date=experience.start_date,
            end_date=experience.end_date,
            description=experience.description,
            current=experience.current,
            created_at=experience.created_at.isoformat(),
            updated_at=experience.updated_at.isoformat()
        )

    def delete_experience(self, user_id: int, experience_id: int):
        """Delete experience entry"""
        from app.models.user import Experience
        result = self.db.exec(
            select(Experience).where(Experience.id == experience_id, Experience.user_id == user_id)
        )
        experience = result.first()
        
        if not experience:
            raise ValueError("Experience not found")
        
        self.db.delete(experience)
        self.db.commit()

    # Education methods
    def get_education(self, user_id: int) -> List[EducationResponse]:
        """Get user's education entries"""
        from app.models.user import Education
        result = self.db.exec(
            select(Education).where(Education.user_id == user_id).order_by(Education.start_date.desc())
        )
        educations = result.scalars().all()
        
        return [
            EducationResponse(
                id=edu.id,
                user_id=edu.user_id,
                degree=edu.degree,
                school=edu.school,
                start_date=edu.start_date,
                end_date=edu.end_date,
                description=edu.description,
                created_at=edu.created_at.isoformat(),
                updated_at=edu.updated_at.isoformat()
            )
            for edu in educations
        ]

    def create_education(self, user_id: int, education_data: EducationCreate) -> EducationResponse:
        """Create new education entry"""
        from app.models.user import Education
        education = Education(
            user_id=user_id,
            degree=education_data.degree,
            school=education_data.school,
            start_date=education_data.start_date,
            end_date=education_data.end_date,
            description=education_data.description
        )
        self.db.add(education)
        self.db.commit()
        self.db.refresh(education)
        
        return EducationResponse(
            id=education.id,
            user_id=education.user_id,
            degree=education.degree,
            school=education.school,
            start_date=education.start_date,
            end_date=education.end_date,
            description=education.description,
            created_at=education.created_at.isoformat(),
            updated_at=education.updated_at.isoformat()
        )

    def update_education(self, user_id: int, education_id: int, education_data: EducationUpdate) -> EducationResponse:
        """Update education entry"""
        from app.models.user import Education
        result = self.db.exec(
            select(Education).where(Education.id == education_id, Education.user_id == user_id)
        )
        education = result.first()
        
        if not education:
            raise ValueError("Education not found")
        
        update_data = education_data.dict(exclude_unset=True)
        if update_data:
            for field, value in update_data.items():
                setattr(education, field, value)
            self.db.commit()
            self.db.refresh(education)
        
        return EducationResponse(
            id=education.id,
            user_id=education.user_id,
            degree=education.degree,
            school=education.school,
            start_date=education.start_date,
            end_date=education.end_date,
            description=education.description,
            created_at=education.created_at.isoformat(),
            updated_at=education.updated_at.isoformat()
        )

    def delete_education(self, user_id: int, education_id: int):
        """Delete education entry"""
        from app.models.user import Education
        result = self.db.exec(
            select(Education).where(Education.id == education_id, Education.user_id == user_id)
        )
        education = result.first()
        
        if not education:
            raise ValueError("Education not found")
        
        self.db.delete(education)
        self.db.commit()

    # Certification methods
    def get_certifications(self, user_id: int) -> List[CertificationResponse]:
        """Get user's certifications"""
        from app.models.user import Certification
        result = self.db.exec(
            select(Certification).where(Certification.user_id == user_id).order_by(Certification.date.desc())
        )
        certifications = result.scalars().all()
        
        return [
            CertificationResponse(
                id=cert.id,
                user_id=cert.user_id,
                name=cert.name,
                issuer=cert.issuer,
                date=cert.date,
                credential_id=cert.credential_id,
                created_at=cert.created_at.isoformat(),
                updated_at=cert.updated_at.isoformat()
            )
            for cert in certifications
        ]

    def create_certification(self, user_id: int, certification_data: CertificationCreate) -> CertificationResponse:
        """Create new certification entry"""
        from app.models.user import Certification
        certification = Certification(
            user_id=user_id,
            name=certification_data.name,
            issuer=certification_data.issuer,
            date=certification_data.date,
            credential_id=certification_data.credential_id
        )
        self.db.add(certification)
        self.db.commit()
        self.db.refresh(certification)
        
        return CertificationResponse(
            id=certification.id,
            user_id=certification.user_id,
            name=certification.name,
            issuer=certification.issuer,
            date=certification.date,
            credential_id=certification.credential_id,
            created_at=certification.created_at.isoformat(),
            updated_at=certification.updated_at.isoformat()
        )

    def update_certification(self, user_id: int, certification_id: int, certification_data: CertificationUpdate) -> CertificationResponse:
        """Update certification entry"""
        from app.models.user import Certification
        result = self.db.exec(
            select(Certification).where(Certification.id == certification_id, Certification.user_id == user_id)
        )
        certification = result.first()
        
        if not certification:
            raise ValueError("Certification not found")
        
        update_data = certification_data.dict(exclude_unset=True)
        if update_data:
            for field, value in update_data.items():
                setattr(certification, field, value)
            self.db.commit()
            self.db.refresh(certification)
        
        return CertificationResponse(
            id=certification.id,
            user_id=certification.user_id,
            name=certification.name,
            issuer=certification.issuer,
            date=certification.date,
            credential_id=certification.credential_id,
            created_at=certification.created_at.isoformat(),
            updated_at=certification.updated_at.isoformat()
        )

    def delete_certification(self, user_id: int, certification_id: int):
        """Delete certification entry"""
        from app.models.user import Certification
        result = self.db.exec(
            select(Certification).where(Certification.id == certification_id, Certification.user_id == user_id)
        )
        certification = result.first()
        
        if not certification:
            raise ValueError("Certification not found")
        
        self.db.delete(certification)
        self.db.commit()

