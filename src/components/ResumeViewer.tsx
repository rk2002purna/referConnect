import React, { useState, useEffect } from 'react'
import { X, Download, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface ResumeViewerProps {
  resumeUrl?: string
  resumeFilename?: string
  isOpen: boolean
  onClose: () => void
  onDownload?: () => void
}

export function ResumeViewer({ 
  resumeUrl, 
  resumeFilename, 
  isOpen, 
  onClose, 
  onDownload 
}: ResumeViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && resumeUrl) {
      setLoading(true)
      setError(null)
      
      // Check if it's an S3 URL
      if (resumeUrl.includes('amazonaws.com') || resumeUrl.includes('s3')) {
        // For S3 URLs, open in new tab instead of displaying in iframe
        window.open(resumeUrl, '_blank')
        setLoading(false)
        onClose() // Close the modal since we opened in new tab
        return
      }
      
      // For local file paths, we need to create a blob URL
      if (resumeUrl.startsWith('uploads/') || resumeUrl.includes('\\')) {
        // This is a local file path, we'll need to fetch it from the backend
        fetchResumeFile(resumeUrl)
      } else {
        // This is already a URL (like other cloud storage)
        setPdfUrl(resumeUrl)
        setLoading(false)
      }
    }
  }, [isOpen, resumeUrl, onClose])

  const fetchResumeFile = async (filePath: string) => {
    try {
      const response = await fetch(`/api/v1/files/download?file_path=${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch resume file')
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err) {
      console.error('Error fetching resume file:', err)
      setError('Failed to load resume file')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = resumeFilename || 'resume.pdf'
      link.click()
    }
  }

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank')
    }
  }

  // Clean up blob URL when component unmounts or URL changes
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <CardTitle className="text-lg font-semibold text-gray-900">
            {resumeFilename || 'Resume Viewer'}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex items-center space-x-1"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in New Tab</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Loading resume...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
          
          {pdfUrl && !loading && !error && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Resume Viewer"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
