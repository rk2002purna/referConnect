import boto3
import os
from botocore.exceptions import ClientError
from fastapi import HTTPException, UploadFile
from datetime import datetime, timedelta
from typing import Optional
import uuid

class S3FileService:
    def __init__(self):
        self.bucket_name = os.getenv('AWS_S3_BUCKET_NAME', 'referconnect-resumes')
        self.region = os.getenv('AWS_S3_REGION', 'eu-north-1')
        
        # Initialize S3 client
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=self.region
        )
    
    def generate_file_key(self, user_id: str, file_name: str) -> str:
        """Generate unique file key for S3 storage"""
        timestamp = int(datetime.now().timestamp())
        sanitized_name = "".join(c for c in file_name if c.isalnum() or c in ('-', '_', '.')).rstrip()
        return f"resumes/{user_id}/{timestamp}_{sanitized_name}"
    
    def upload_file(self, file: UploadFile, user_id: str) -> dict:
        """Upload file to S3"""
        try:
            # Generate unique file key
            file_key = self.generate_file_key(user_id, file.filename)
            
            # Upload file to S3
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                file_key,
                ExtraArgs={
                    'ContentType': file.content_type,
                    'Metadata': {
                        'user_id': user_id,
                        'original_filename': file.filename,
                        'uploaded_at': datetime.now().isoformat()
                    }
                }
            )
            
            # Generate file URL
            file_url = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{file_key}"
            
            return {
                'file_key': file_key,
                'file_url': file_url,
                'file_name': file.filename,
                'file_size': file.size,
                'content_type': file.content_type,
                'uploaded_at': datetime.now().isoformat()
            }
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 upload error: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")
    
    def get_file_info(self, file_key: str) -> dict:
        """Get file information from S3"""
        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            
            return {
                'file_key': file_key,
                'file_name': response['Metadata'].get('original_filename', ''),
                'file_size': response['ContentLength'],
                'content_type': response['ContentType'],
                'uploaded_at': response['Metadata'].get('uploaded_at', ''),
                'file_url': f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{file_key}"
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                raise HTTPException(status_code=404, detail="File not found")
            raise HTTPException(status_code=500, detail=f"S3 error: {str(e)}")
    
    def delete_file(self, file_key: str) -> bool:
        """Delete file from S3"""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            return True
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 delete error: {str(e)}")
    
    def generate_presigned_url(self, file_key: str, expiration: int = 3600) -> str:
        """Generate presigned URL for file download"""
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            return response
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 presigned URL error: {str(e)}")
    
    def list_user_files(self, user_id: str, file_type: str = 'resume') -> list:
        """List all files for a user"""
        try:
            prefix = f"resumes/{user_id}/"
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            files = []
            if 'Contents' in response:
                for obj in response['Contents']:
                    # Get object metadata
                    head_response = self.s3_client.head_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    
                    files.append({
                        'file_key': obj['Key'],
                        'file_name': head_response['Metadata'].get('original_filename', ''),
                        'file_size': obj['Size'],
                        'content_type': head_response['ContentType'],
                        'uploaded_at': head_response['Metadata'].get('uploaded_at', ''),
                        'file_url': f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{obj['Key']}"
                    })
            
            return files
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"S3 list error: {str(e)}")

# Initialize S3 service
s3_service = S3FileService()
