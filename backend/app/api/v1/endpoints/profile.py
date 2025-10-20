from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session
from typing import Optional, List

from app.db.session import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.profile import (
    ProfileUpdateRequest, JobSeekerProfileUpdateRequest, EmployeeProfileUpdateRequest,
    ProfileResponse, JobSeekerProfileResponse, EmployeeProfileResponse, ProfileCompletionResponse,
    ExperienceCreate, ExperienceUpdate, ExperienceResponse,
    EducationCreate, EducationUpdate, EducationResponse,
    CertificationCreate, CertificationUpdate, CertificationResponse
)
from app.services.profile_service import ProfileService

router = APIRouter()


@router.get("/me", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get current user's profile"""
    service = ProfileService(db)
    return service.get_profile(current_user.id)


@router.put("/me", response_model=ProfileResponse)
def update_profile(
    profile_data: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update current user's profile"""
    service = ProfileService(db)
    return service.update_profile(current_user.id, profile_data)


@router.get("/me/jobseeker", response_model=Optional[JobSeekerProfileResponse])
def get_jobseeker_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get current user's jobseeker profile"""
    if current_user.role.value != 'jobseeker':
        raise HTTPException(status_code=403, detail="Access denied. Jobseeker profile only.")
    
    service = ProfileService(db)
    profile = service.get_jobseeker_profile(current_user.id)
    
    if not profile:
        raise HTTPException(status_code=404, detail="Jobseeker profile not found")
    
    return profile


@router.put("/me/jobseeker", response_model=JobSeekerProfileResponse)
def update_jobseeker_profile(
    profile_data: JobSeekerProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update current user's jobseeker profile"""
    if current_user.role.value != 'jobseeker':
        raise HTTPException(status_code=403, detail="Access denied. Jobseeker profile only.")
    
    service = ProfileService(db)
    return service.update_jobseeker_profile(current_user.id, profile_data)


@router.get("/me/employee", response_model=Optional[EmployeeProfileResponse])
def get_employee_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get current user's employee profile"""
    if current_user.role.value != 'employee':
        raise HTTPException(status_code=403, detail="Access denied. Employee profile only.")
    
    service = ProfileService(db)
    return service.get_employee_profile(current_user.id)


@router.put("/me/employee", response_model=EmployeeProfileResponse)
def update_employee_profile(
    profile_data: EmployeeProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update current user's employee profile"""
    if current_user.role.value != 'employee':
        raise HTTPException(status_code=403, detail="Access denied. Employee profile only.")
    
    service = ProfileService(db)
    return service.update_employee_profile(current_user.id, profile_data)


@router.post("/me/resume")
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Upload resume for jobseeker"""
    if current_user.role.value != 'jobseeker':
        raise HTTPException(status_code=403, detail="Access denied. Resume upload for jobseekers only.")
    
    # Validate file type
    allowed_types = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and Word documents are allowed.")
    
    # Validate file size (5MB limit)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    service = ProfileService(db)
    file_content = file.file.read()
    
    try:
        result = service.upload_resume(current_user.id, file_content, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload resume: {str(e)}")


@router.get("/me/resume")
def get_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get current user's resume information"""
    if current_user.role.value != 'jobseeker':
        raise HTTPException(status_code=403, detail="Access denied. Resume access for jobseekers only.")
    
    service = ProfileService(db)
    try:
        result = service.get_resume_info(current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get resume info: {str(e)}")


@router.delete("/me/resume")
def delete_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Delete current user's resume"""
    if current_user.role.value != 'jobseeker':
        raise HTTPException(status_code=403, detail="Access denied. Resume deletion for jobseekers only.")
    
    service = ProfileService(db)
    try:
        result = service.delete_resume(current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete resume: {str(e)}")


@router.get("/me/completion", response_model=ProfileCompletionResponse)
def get_profile_completion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get profile completion percentage"""
    service = ProfileService(db)
    return service.get_profile_completion(current_user.id)


# Experience endpoints
@router.get("/me/experience", response_model=List[ExperienceResponse])
def get_experience(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get user's experience"""
    service = ProfileService(db)
    return service.get_experience(current_user.id)


@router.post("/me/experience", response_model=ExperienceResponse)
def create_experience(
    experience_data: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Create new experience entry"""
    service = ProfileService(db)
    return service.create_experience(current_user.id, experience_data)


@router.put("/me/experience/{experience_id}", response_model=ExperienceResponse)
def update_experience(
    experience_id: int,
    experience_data: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update experience entry"""
    service = ProfileService(db)
    return service.update_experience(current_user.id, experience_id, experience_data)


@router.delete("/me/experience/{experience_id}")
def delete_experience(
    experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Delete experience entry"""
    service = ProfileService(db)
    service.delete_experience(current_user.id, experience_id)
    return {"message": "Experience deleted successfully"}


# Education endpoints
@router.get("/me/education", response_model=List[EducationResponse])
def get_education(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get user's education"""
    service = ProfileService(db)
    return service.get_education(current_user.id)


@router.post("/me/education", response_model=EducationResponse)
def create_education(
    education_data: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Create new education entry"""
    service = ProfileService(db)
    return service.create_education(current_user.id, education_data)


@router.put("/me/education/{education_id}", response_model=EducationResponse)
def update_education(
    education_id: int,
    education_data: EducationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update education entry"""
    service = ProfileService(db)
    return service.update_education(current_user.id, education_id, education_data)


@router.delete("/me/education/{education_id}")
def delete_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Delete education entry"""
    service = ProfileService(db)
    service.delete_education(current_user.id, education_id)
    return {"message": "Education deleted successfully"}


# Certifications endpoints
@router.get("/me/certifications", response_model=List[CertificationResponse])
def get_certifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Get user's certifications"""
    service = ProfileService(db)
    return service.get_certifications(current_user.id)


@router.post("/me/certifications", response_model=CertificationResponse)
def create_certification(
    certification_data: CertificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Create new certification entry"""
    service = ProfileService(db)
    return service.create_certification(current_user.id, certification_data)


@router.put("/me/certifications/{certification_id}", response_model=CertificationResponse)
def update_certification(
    certification_id: int,
    certification_data: CertificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update certification entry"""
    service = ProfileService(db)
    return service.update_certification(current_user.id, certification_id, certification_data)


@router.delete("/me/certifications/{certification_id}")
def delete_certification(
    certification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Delete certification entry"""
    service = ProfileService(db)
    service.delete_certification(current_user.id, certification_id)
    return {"message": "Certification deleted successfully"}
