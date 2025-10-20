import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { OnboardingStepProps } from '../../types/onboarding'
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Eye, Trash2, RefreshCw } from 'lucide-react'
import { s3FileService } from '../../lib/s3Service'
import { validateFile, formatFileSize, getFileIcon, FileInfo } from '../../lib/s3Config'
import { ResumeViewer } from '../ResumeViewer'

interface FileUploadState {
  isUploading: boolean
  uploadError: string
  uploadSuccess: boolean
  currentFile: FileInfo | null
}

export default function ResumeUploadStep({ data, updateData }: OnboardingStepProps) {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    uploadError: '',
    uploadSuccess: false,
    currentFile: null
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [userId, setUserId] = useState<string>('')
  const [showResumeViewer, setShowResumeViewer] = useState(false)

  // Get user ID from localStorage or API
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      // Decode JWT token to get user ID (simplified)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserId(payload.sub || payload.user_id)
      } catch (error) {
        console.error('Error decoding token:', error)
      }
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file
    const validation = validateFile(file)
    if (!validation.isValid) {
      setUploadState(prev => ({
        ...prev,
        uploadError: validation.error || 'Invalid file',
        uploadSuccess: false
      }))
      return
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      uploadError: '',
      uploadSuccess: false
    }))

    try {
      const response = await s3FileService.uploadFile(file, userId)
      
      const fileInfo: FileInfo = {
        fileName: response.fileName,
        fileUrl: response.fileUrl,
        fileKey: response.fileKey,
        fileSize: response.fileSize,
        uploadedAt: response.uploadedAt,
        contentType: file.type
      }

      updateData({
        jobseeker: {
          ...data.jobseeker,
          resume_filename: response.fileName,
          resume_url: response.fileUrl,
          resume_key: response.fileKey
        }
      })

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadSuccess: true,
        currentFile: fileInfo
      }))
    } catch (error: any) {
      console.error('Resume upload failed:', error)
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadError: error.message || 'Failed to upload resume. Please try again.'
      }))
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleRemoveFile = async () => {
    if (uploadState.currentFile) {
      try {
        await s3FileService.deleteFile(uploadState.currentFile.fileKey)
        
        updateData({
          jobseeker: {
            ...data.jobseeker,
            resume_filename: undefined,
            resume_url: undefined,
            resume_key: undefined
          }
        })

        setUploadState({
          isUploading: false,
          uploadError: '',
          uploadSuccess: false,
          currentFile: null
        })
      } catch (error) {
        console.error('Failed to delete file:', error)
        setUploadState(prev => ({
          ...prev,
          uploadError: 'Failed to delete file. Please try again.'
        }))
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDownloadFile = async () => {
    if (uploadState.currentFile) {
      try {
        const downloadUrl = await s3FileService.getDownloadUrl(uploadState.currentFile.fileKey)
        window.open(downloadUrl, '_blank')
      } catch (error) {
        console.error('Failed to get download URL:', error)
        setUploadState(prev => ({
          ...prev,
          uploadError: 'Failed to download file. Please try again.'
        }))
      }
    }
  }

  const handleViewFile = () => {
    if (uploadState.currentFile) {
      setShowResumeViewer(true)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleReupload = () => {
    setUploadState(prev => ({
      ...prev,
      uploadSuccess: false,
      uploadError: '',
      currentFile: null
    }))
    openFileDialog()
  }

  return (
    <div className="space-y-8">
      {/* Resume Upload */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Your Resume</h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload your resume to help employers and referrers better understand your background. 
          This will also improve your job recommendations.
        </p>

        <Card
          className={`border-2 border-dashed transition-colors ${
            uploadState.uploadSuccess
              ? 'border-green-300 bg-green-50'
              : uploadState.uploadError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <CardContent className="p-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="text-center"
            >
              {uploadState.uploadSuccess && uploadState.currentFile ? (
                <div className="space-y-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                  <div>
                    <h4 className="text-lg font-medium text-green-900">Resume Uploaded Successfully!</h4>
                    <div className="flex items-center justify-center space-x-2 mt-2">
                      <span className="text-2xl">{getFileIcon(uploadState.currentFile.fileName)}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-green-800">
                          {uploadState.currentFile.fileName}
                        </p>
                        <p className="text-xs text-green-600">
                          {formatFileSize(uploadState.currentFile.fileSize)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleViewFile}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadFile}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReupload}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reupload
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleRemoveFile}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {uploadState.isUploading ? 'Uploading...' : 'Upload your resume'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Drag and drop your resume here, or click to browse
                    </p>
                  </div>
                  
                  {uploadState.uploadError && (
                    <div className="flex items-center justify-center space-x-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{uploadState.uploadError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={openFileDialog}
                      disabled={uploadState.isUploading}
                      className="w-full sm:w-auto"
                    >
                      {uploadState.isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Supported formats: PDF, DOC, DOCX (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Portfolio Links Reminder */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-blue-700">
          Don't forget to add your LinkedIn profile, GitHub, and portfolio links in the previous step. 
          These help create a complete professional profile that employers love to see!
        </p>
      </div>

      {/* Benefits */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Why upload your resume?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-gray-900">Better Job Matches</h5>
              <p className="text-xs text-gray-600">Our AI analyzes your resume to find more relevant opportunities</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-gray-900">Faster Applications</h5>
              <p className="text-xs text-gray-600">Auto-fill application forms with your resume data</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-gray-900">Professional Credibility</h5>
              <p className="text-xs text-gray-600">Referrers can see your full background and experience</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-gray-900">Secure Storage</h5>
              <p className="text-xs text-gray-600">Your files are securely stored in AWS S3 with full control</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Viewer Modal */}
      <ResumeViewer
        resumeUrl={uploadState.currentFile?.fileUrl}
        resumeFilename={uploadState.currentFile?.fileName}
        isOpen={showResumeViewer}
        onClose={() => setShowResumeViewer(false)}
        onDownload={handleDownloadFile}
      />
    </div>
  )
}