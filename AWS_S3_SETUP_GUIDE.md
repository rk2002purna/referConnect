# AWS S3 Setup Guide for Resume File Management

## Prerequisites
1. AWS Account with appropriate permissions
2. AWS CLI installed (optional but recommended)
3. Access to create S3 buckets and IAM users

## Step 1: Create S3 Bucket

### Option A: Using AWS Console
1. Go to AWS S3 Console
2. Click "Create bucket"
3. Bucket name: `referconnect-resumes` (or your preferred name)
4. Region: Choose your preferred region (e.g., `us-east-1`)
5. Uncheck "Block all public access" (we'll use presigned URLs)
6. Create bucket

### Option B: Using AWS CLI
```bash
aws s3 mb s3://referconnect-resumes --region us-east-1
```

## Step 2: Create IAM User for S3 Access

1. Go to AWS IAM Console
2. Click "Users" → "Create user"
3. Username: `referconnect-s3-user`
4. Select "Programmatic access"
5. Attach policies: `AmazonS3FullAccess` (or create custom policy)
6. Create user and save credentials

## Step 3: Create Custom IAM Policy (Recommended)

For better security, create a custom policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:GetObjectVersion"
            ],
            "Resource": "arn:aws:s3:::referconnect-resumes/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetBucketLocation"
            ],
            "Resource": "arn:aws:s3:::referconnect-resumes"
        }
    ]
}
```

## Step 4: Configure Environment Variables

### Backend (.env file)
```env
AWS_S3_BUCKET_NAME=referconnect-resumes
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### Frontend (.env file)
```env
REACT_APP_S3_BUCKET_NAME=referconnect-resumes
REACT_APP_S3_REGION=us-east-1
REACT_APP_S3_ACCESS_KEY_ID=your-access-key-id
REACT_APP_S3_SECRET_ACCESS_KEY=your-secret-access-key
```

## Step 5: Install Dependencies

### Backend
```bash
pip install boto3 botocore
```

### Frontend
```bash
npm install aws-sdk
```

## Step 6: Test the Implementation

1. Start your backend server
2. Start your frontend application
3. Navigate to the Resume & Portfolio step in onboarding
4. Try uploading a resume file
5. Test viewing, downloading, and deleting files

## Security Considerations

1. **Never commit AWS credentials to version control**
2. **Use environment variables for all credentials**
3. **Implement proper access controls**
4. **Use presigned URLs for secure file access**
5. **Consider implementing file size and type restrictions**
6. **Enable S3 bucket logging for audit trails**

## File Organization Structure

Files will be stored in S3 with the following structure:
```
referconnect-resumes/
├── resumes/
│   ├── user_1/
│   │   ├── 1640995200_resume.pdf
│   │   └── 1640995800_updated_resume.docx
│   ├── user_2/
│   │   └── 1640996400_cv.pdf
│   └── ...
```

## Features Implemented

✅ **File Upload**: Upload resumes to S3 with validation
✅ **File View**: View uploaded files using presigned URLs
✅ **File Download**: Download files securely
✅ **File Delete**: Remove files from S3 and database
✅ **File Reupload**: Replace existing files
✅ **File Validation**: Type and size validation
✅ **User Isolation**: Users can only access their own files
✅ **Progress Tracking**: Upload progress indicators
✅ **Error Handling**: Comprehensive error handling

## Troubleshooting

### Common Issues

1. **Access Denied**: Check IAM permissions
2. **Bucket Not Found**: Verify bucket name and region
3. **Invalid Credentials**: Check AWS access keys
4. **CORS Issues**: Configure S3 bucket CORS policy if needed

### CORS Configuration (if needed)
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```

## Cost Optimization

1. **Use S3 Intelligent Tiering** for automatic cost optimization
2. **Set up lifecycle policies** to move old files to cheaper storage
3. **Monitor usage** with AWS CloudWatch
4. **Consider S3 pricing** for your region

## Next Steps

1. Set up AWS credentials
2. Create S3 bucket
3. Configure environment variables
4. Test file upload functionality
5. Implement additional file types if needed
6. Add file encryption if required
7. Set up monitoring and alerting
