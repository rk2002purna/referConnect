import React, { useState, useRef } from 'react'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { OnboardingStepProps } from '../../types/onboarding'
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react'
import { profileAPI } from '../../lib/api'

export default function ResumeUploadStep({ data, updateData }: OnboardingStepProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a PDF or Word document')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setUploadError('')
    setUploadSuccess(false)

    try {
      const response = await profileAPI.uploadResume(file)
      updateData({
        jobseeker: {
          ...data.jobseeker,
          resume_filename: (response.data as any).filename
        }
      })
      setUploadSuccess(true)
    } catch (error: any) {
      console.error('Resume upload failed:', error)
      setUploadError(error.response?.data?.detail || 'Failed to upload resume. Please try again.')
    } finally {
      setIsUploading(false)
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

  const handleRemoveFile = () => {
    updateData({
      jobseeker: {
        ...data.jobseeker,
        resume_filename: undefined
      }
    })
    setUploadSuccess(false)
    setUploadError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
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
            uploadSuccess
              ? 'border-green-300 bg-green-50'
              : uploadError
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
              {uploadSuccess ? (
                <div className="space-y-4">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                  <div>
                    <h4 className="text-lg font-medium text-green-900">Resume Uploaded Successfully!</h4>
                    <p className="text-sm text-green-700">
                      {data.jobseeker?.resume_filename}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleRemoveFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Resume
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">
                      {isUploading ? 'Uploading...' : 'Upload your resume'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Drag and drop your resume here, or click to browse
                    </p>
                  </div>
                  
                  {uploadError && (
                    <div className="flex items-center justify-center space-x-2 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{uploadError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      onClick={openFileDialog}
                      disabled={isUploading}
                      className="w-full sm:w-auto"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Choose File'}
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
              <h5 className="text-sm font-medium text-gray-900">Privacy Protected</h5>
              <p className="text-xs text-gray-600">You control who can see your resume and personal information</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
