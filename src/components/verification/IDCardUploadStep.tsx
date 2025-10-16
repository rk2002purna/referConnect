import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Upload, Camera, FileImage, X, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'

interface IDCardUploadStepProps {
  onUploadComplete: (files: { selfie: File; idCard: File }) => void
  onPrevious?: () => void
  onNext?: () => void
}

interface UploadedFile {
  file: File
  preview: string
  type: 'selfie' | 'id_card'
}

export function IDCardUploadStep({ onUploadComplete, onPrevious, onNext }: IDCardUploadStepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<{
    selfie?: UploadedFile
    idCard?: UploadedFile
  }>({})
  const [dragActive, setDragActive] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const idCardInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File, type: 'selfie' | 'id_card') => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB')
      return
    }

    const preview = URL.createObjectURL(file)
    setUploadedFiles(prev => ({
      ...prev,
      [type]: { file, preview, type }
    }))
    setError('')
  }

  const handleDrop = (e: React.DragEvent, type: 'selfie' | 'id_card') => {
    e.preventDefault()
    setDragActive(null)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0], type)
    }
  }

  const handleDragOver = (e: React.DragEvent, type: 'selfie' | 'id_card') => {
    e.preventDefault()
    setDragActive(type)
  }

  const handleDragLeave = () => {
    setDragActive(null)
  }

  const removeFile = (type: 'selfie' | 'id_card') => {
    const fileKey = type === 'id_card' ? 'idCard' : type
    if (uploadedFiles[fileKey as keyof typeof uploadedFiles]?.preview) {
      URL.revokeObjectURL(uploadedFiles[fileKey as keyof typeof uploadedFiles]!.preview)
    }
    setUploadedFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[fileKey as keyof typeof newFiles]
      return newFiles
    })
  }

  const handleSubmit = async () => {
    if (!uploadedFiles.selfie || !uploadedFiles.idCard) {
      setError('Please upload both a selfie and your company ID card')
      return
    }

    setUploading(true)
    setError('')

    try {
      // In a real app, this would upload files to the server
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onUploadComplete({
        selfie: uploadedFiles.selfie.file,
        idCard: uploadedFiles.idCard.file
      })
      
      if (onNext) onNext()
    } catch (err) {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const renderUploadArea = (type: 'selfie' | 'id_card', title: string, description: string) => {
    const fileKey = type === 'id_card' ? 'idCard' : type
    const file = uploadedFiles[fileKey as keyof typeof uploadedFiles]
    const isDragActive = dragActive === type

    return (
      <Card 
        className={`cursor-pointer transition-all ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : file 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => {
          if (type === 'selfie') {
            selfieInputRef.current?.click()
          } else {
            idCardInputRef.current?.click()
          }
        }}
        onDrop={(e) => handleDrop(e, type)}
        onDragOver={(e) => handleDragOver(e, type)}
        onDragLeave={handleDragLeave}
      >
        <CardContent className="p-6">
          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{title}</h4>
                    <p className="text-sm text-gray-500">{file.file.name}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFile(type)
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="relative">
                <img
                  src={file.preview}
                  alt={title}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <div className="absolute top-2 right-2">
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {type === 'selfie' ? (
                  <Camera className="w-8 h-8 text-gray-400" />
                ) : (
                  <FileImage className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
                <p className="text-sm text-gray-500 mb-3">{description}</p>
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <Upload className="w-4 h-4" />
                  <span>Click to upload or drag and drop</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Upload Verification Documents
        </h3>
        <p className="text-gray-600">
          Please upload a clear selfie and your company ID card for verification
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {/* Upload Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderUploadArea(
          'selfie',
          'Selfie Photo',
          'Take a clear selfie holding your company ID card'
        )}
        
        {renderUploadArea(
          'id_card',
          'Company ID Card',
          'Upload a clear photo of your company ID card'
        )}
      </div>

      {/* Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">Photo Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure good lighting and clear visibility</li>
            <li>• ID card should be fully visible and readable</li>
            <li>• File size must be less than 5MB</li>
            <li>• Supported formats: JPG, PNG, GIF</li>
            <li>• Verification typically takes 4-5 business days</li>
          </ul>
        </CardContent>
      </Card>

      {/* Hidden file inputs */}
      <input
        ref={selfieInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file, 'selfie')
        }}
        className="hidden"
      />
      <input
        ref={idCardInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file, 'id_card')
        }}
        className="hidden"
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onPrevious && (
          <Button variant="outline" onClick={onPrevious}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
        )}
        
        <div className="flex-1" />
        
        <Button 
          onClick={handleSubmit}
          disabled={!uploadedFiles.selfie || !uploadedFiles.idCard || uploading}
          className="flex items-center"
        >
          {uploading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-pulse" />
              Uploading...
            </>
          ) : (
            <>
              Submit for Review
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
