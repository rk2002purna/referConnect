// AWS S3 Service for File Operations
import { FileUploadResponse, FileInfo, validateFile } from './s3Config'

export class S3FileService {
  private apiBaseUrl: string

  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'
  }

  /**
   * Upload file to S3 via backend API
   */
  async uploadFile(file: File, userId: string): Promise<FileUploadResponse> {
    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    // Create form data
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)
    formData.append('file_type', 'resume')

    try {
      const response = await fetch(`${this.apiBaseUrl}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Upload failed')
      }

      const result = await response.json()
      return {
        success: true,
        fileUrl: result.file_url,
        fileName: result.file_name,
        fileKey: result.file_key,
        fileSize: result.file_size,
        uploadedAt: result.uploaded_at
      }
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(fileKey: string): Promise<FileInfo> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/files/info/${encodeURIComponent(fileKey)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get file info')
      }

      return await response.json()
    } catch (error) {
      console.error('Get file info error:', error)
      throw error
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/files/delete/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      return true
    } catch (error) {
      console.error('File deletion error:', error)
      throw error
    }
  }

  /**
   * Get presigned URL for file download
   */
  async getDownloadUrl(fileKey: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/files/download/${encodeURIComponent(fileKey)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get download URL')
      }

      const result = await response.json()
      return result.download_url
    } catch (error) {
      console.error('Get download URL error:', error)
      throw error
    }
  }

  /**
   * List user's files
   */
  async listUserFiles(userId: string, fileType?: string): Promise<FileInfo[]> {
    try {
      let url = `${this.apiBaseUrl}/files/list/${userId}`
      if (fileType) {
        url += `?file_type=${fileType}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to list files')
      }

      const result = await response.json()
      return result.files
    } catch (error) {
      console.error('List files error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const s3FileService = new S3FileService()
