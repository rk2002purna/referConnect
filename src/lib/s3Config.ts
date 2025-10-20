// AWS S3 Configuration and File Management
export interface S3Config {
  bucketName: string
  region: string
  accessKeyId: string
  secretAccessKey: string
}

export interface FileUploadResponse {
  success: boolean
  fileUrl: string
  fileName: string
  fileKey: string
  fileSize: number
  uploadedAt: string
}

export interface FileInfo {
  fileName: string
  fileUrl: string
  fileKey: string
  fileSize: number
  uploadedAt: string
  contentType: string
}

// Default S3 configuration (should be moved to environment variables)
export const DEFAULT_S3_CONFIG: S3Config = {
  bucketName: process.env.REACT_APP_S3_BUCKET_NAME || 'referconnect-resumes',
  region: process.env.REACT_APP_S3_REGION || 'us-east-1',
  accessKeyId: process.env.REACT_APP_S3_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.REACT_APP_S3_SECRET_ACCESS_KEY || ''
}

// File validation utilities
export const ALLOWED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function validateFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a PDF or Word document (.pdf, .doc, .docx)'
    }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  return { isValid: true }
}

export function generateFileKey(userId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `resumes/${userId}/${timestamp}_${sanitizedFileName}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
      return '📄'
    case 'doc':
    case 'docx':
      return '📝'
    default:
      return '📎'
  }
}
