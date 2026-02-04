import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { jobAPI } from '../lib/api'
import { Button } from '../components/ui/Button'
import { 
  ArrowLeft, 
  Users, 
  Calendar,
  Briefcase,
  FileText,
  Download,
  Search,
  Filter
} from 'lucide-react'

interface JobApplication {
  id: number
  job_id: number
  jobseeker_id: number
  jobseeker_name: string
  jobseeker_email: string
  jobseeker_phone?: string
  linkedin_url?: string
  resume_filename?: string
  resume_url?: string
  personal_note?: string
  status: 'pending' | 'reviewed' | 'interview_scheduled' | 'rejected' | 'accepted'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  updated_at: string
}

interface Job {
  id: number
  title: string
  company: string
  location: string
  description: string
  is_active: boolean
}

export function JobApplications() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [job, setJob] = useState<Job | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'interview_scheduled' | 'rejected' | 'accepted'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!jobId || user?.role !== 'employee') {
      navigate('/my-jobs')
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load job details
        const jobResponse = await jobAPI.getById(parseInt(jobId))
        setJob(jobResponse.data as Job)
        
        // TODO: Load applications for this job
        // This would require a new API endpoint to get applications for a specific job
        // For now, we'll simulate with mock data
        const mockApplications: JobApplication[] = [
          {
            id: 1,
            job_id: parseInt(jobId),
            jobseeker_id: 101,
            jobseeker_name: 'John Smith',
            jobseeker_email: 'john.smith@example.com',
            jobseeker_phone: '+1234567890',
            linkedin_url: 'https://linkedin.com/in/johnsmith',
            resume_filename: 'john_smith_resume.pdf',
            resume_url: '/resumes/john_smith_resume.pdf',
            personal_note: 'I am very excited about this opportunity and believe my experience in React development would be valuable.',
            status: 'pending',
            priority: 'normal',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            job_id: parseInt(jobId),
            jobseeker_id: 102,
            jobseeker_name: 'Sarah Johnson',
            jobseeker_email: 'sarah.j@example.com',
            jobseeker_phone: '+1987654321',
            linkedin_url: 'https://linkedin.com/in/sarahj',
            resume_filename: 'sarah_johnson_cv.pdf',
            resume_url: '/resumes/sarah_johnson_cv.pdf',
            personal_note: 'With 5+ years in full-stack development, I\'m confident I can contribute significantly to your team.',
            status: 'reviewed',
            priority: 'high',
            created_at: '2024-01-14T14:20:00Z',
            updated_at: '2024-01-15T09:15:00Z'
          }
        ]
        
        setApplications(mockApplications)
      } catch (err: any) {
        console.error('Failed to load data:', err)
        setError(err.message || 'Failed to load job applications')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [jobId, user, navigate])

  const filteredApplications = applications.filter(app => {
    const statusMatch = filter === 'all' || app.status === filter
    const searchMatch = searchTerm === '' || 
      app.jobseeker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobseeker_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return statusMatch && searchMatch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review'
      case 'reviewed':
        return 'Reviewed'
      case 'interview_scheduled':
        return 'Interview Scheduled'
      case 'accepted':
        return 'Accepted'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (user?.role !== 'employee') {
    return (
      <div className="text-center py-12">
        <div className="text-red-500">Access Denied. Only employees can view job applications.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/my-jobs')}
            className="flex items-center mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Manager
          </Button>
        </div>
        
        {job && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-gray-600 mt-1">{job.company} • {job.location}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  job.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {job.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(a => a.status === 'pending').length}
              </p>
              <p className="text-sm text-gray-500">Pending Review</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <Briefcase className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(a => a.status === 'interview_scheduled').length}
              </p>
              <p className="text-sm text-gray-500">Interviews Scheduled</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {applications.filter(a => a.resume_filename).length}
              </p>
              <p className="text-sm text-gray-500">Resumes Received</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applicants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="interview_scheduled">Interview Scheduled</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Job Applications ({filteredApplications.length})
          </h2>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No applications have been submitted for this job yet'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredApplications.map((application) => (
              <div key={application.id} className="p-6 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.jobseeker_name}
                        </h3>
                        <p className="text-gray-600">{application.jobseeker_email}</p>
                        {application.jobseeker_phone && (
                          <p className="text-gray-500 text-sm">{application.jobseeker_phone}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusLabel(application.status)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(application.priority)}`}>
                          {application.priority.charAt(0).toUpperCase() + application.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    {application.linkedin_url && (
                      <div className="mb-3">
                        <a 
                          href={application.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <span className="mr-1">LinkedIn Profile</span>
                        </a>
                      </div>
                    )}
                    
                    {application.personal_note && (
                      <div className="mb-4">
                        <p className="text-gray-700 text-sm">
                          <span className="font-medium">Note:</span> {application.personal_note}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Applied on {formatDate(application.created_at)}
                      <span className="mx-2">•</span>
                      Last updated {formatDate(application.updated_at)}
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <div className="flex flex-col space-y-2">
                      {application.resume_filename && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            // TODO: Implement resume download/view
                            console.log('Download resume:', application.resume_filename)
                          }}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download Resume
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // TODO: Implement application review/update
                          console.log('Review application:', application.id)
                        }}
                      >
                        Review Application
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
