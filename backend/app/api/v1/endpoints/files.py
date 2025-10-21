from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from sqlmodel import Session
from typing import Optional, List
import os

from app.dependencies.auth import get_current_user
from app.db.session import get_db_session
from app.models.user import User
from app.services.s3_service import S3FileService

# Create S3 service instance
s3_service = S3FileService()

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form(default="resume"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Upload file to S3"""
    try:
        # Validate file type
        allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only PDF, DOC, and DOCX files are allowed."
            )
        
        # Validate file size (5MB limit)
        if file.size > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size must be less than 5MB"
            )
        
        # Upload to S3 using current user's ID
        upload_result = s3_service.upload_file(file, str(current_user.id))
        
        # Update user profile with resume info (if it's a resume)
        if file_type == "resume":
            current_user.resume_filename = upload_result['file_name']
            current_user.resume_url = upload_result['file_url']
            current_user.resume_key = upload_result['file_key']
            db.commit()
        
        return {
            "success": True,
            "message": "File uploaded successfully",
            "file_url": upload_result['file_url'],
            "file_name": upload_result['file_name'],
            "file_key": upload_result['file_key'],
            "file_size": upload_result['file_size'],
            "uploaded_at": upload_result['uploaded_at']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/info/{file_key}")
async def get_file_info(
    file_key: str,
    current_user: User = Depends(get_current_user)
):
    """Get file information"""
    try:
        file_info = s3_service.get_file_info(file_key)
        return file_info
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get file info: {str(e)}")

@router.delete("/delete/{file_key}")
async def delete_file(
    file_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Delete file from S3"""
    try:
        # Check if user owns this file (basic validation)
        if not file_key.startswith(f"resumes/{current_user.id}/"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete from S3
        success = s3_service.delete_file(file_key)
        
        if success:
            # Update user profile if it was a resume
            if current_user.resume_key == file_key:
                current_user.resume_filename = None
                current_user.resume_url = None
                current_user.resume_key = None
                db.commit()
            
            return {"success": True, "message": "File deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete file")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/download/{file_key}")
async def get_download_url(
    file_key: str,
    current_user: User = Depends(get_current_user)
):
    """Get presigned download URL"""
    try:
        # Check if user owns this file (basic validation)
        if not file_key.startswith(f"resumes/{current_user.id}/"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        download_url = s3_service.generate_presigned_url(file_key)
        return {"download_url": download_url}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")

@router.get("/download")
async def download_file(
    file_path: str = Query(..., description="File path to download"),
    current_user: User = Depends(get_current_user)
):
    """Download file by path (for local files)"""
    try:
        # Check if file exists and is accessible
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Basic security check - ensure file is in uploads directory
        if not file_path.startswith("uploads/"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Check if it's a resume file for the current user
        if "resumes" in file_path and not file_path.startswith(f"uploads/resumes/{current_user.id}_"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Return file as streaming response
        def iterfile():
            with open(file_path, mode="rb") as file_like:
                yield from file_like
        
        # Determine content type based on file extension
        file_extension = os.path.splitext(file_path)[1].lower()
        content_type_map = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        content_type = content_type_map.get(file_extension, 'application/octet-stream')
        
        return StreamingResponse(
            iterfile(), 
            media_type=content_type,
            headers={"Content-Disposition": f"inline; filename={os.path.basename(file_path)}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@router.get("/list/{user_id}")
async def list_user_files(
    user_id: str,
    file_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List user's files"""
    try:
        # Only allow users to list their own files
        if str(current_user.id) != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        files = s3_service.list_user_files(user_id, file_type)
        return {"files": files}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")
