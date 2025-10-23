// AWS S3 Service for File Operations
import { FileUploadResponse, FileInfo, validateFile } from './s3Config'
import { api } from './api'

export class S3FileService {
  constructor() {
    // No need to set apiBaseUrl since we're using the configured axios instance
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
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const result = response.data as {
        file_url: string
        file_name: string
        file_key: string
        file_size: number
        uploaded_at: string
      }
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
      const response = await api.get(`/files/info/${encodeURIComponent(fileKey)}`)
      return response.data as FileInfo
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
      await api.delete(`/files/delete/${encodeURIComponent(fileKey)}`)
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
      const response = await api.get(`/files/download/${encodeURIComponent(fileKey)}`)
      return (response.data as { download_url: string }).download_url
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
      const params = fileType ? { file_type: fileType } : {}
      const response = await api.get(`/files/list/${userId}`, { params })
      return (response.data as { files: FileInfo[] }).files
    } catch (error) {
      console.error('List files error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const s3FileService = new S3FileService()
