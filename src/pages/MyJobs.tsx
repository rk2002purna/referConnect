import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { jobPostAPI } from '../lib/api'
import { jobAPI } from '../lib/api'
import { Button } from '../components/ui/Button'
import { 
  Plus, 
  Edit, 
  Eye, 
  Users, 
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Trash2
} from 'lucide-react'

interface JobPost {
  id: number
  title: string
  company: string
  location: string
  job_type: string
  salary_min?: number
  salary_max?: number
  currency: string
  description: string
  requirements?: string
  benefits?: string
  skills_required: string[]
  experience_level: string
  remote_work: boolean
  application_deadline?: string
  contact_email: string
  department?: string
  job_link?: string
  max_applicants?: number
  is_active: boolean
  views: number
  applications_count: number
  created_at: string
  updated_at: string
  employee_id: number
}

export function MyJobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<JobPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const now = new Date()

  // Load jobs
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Try job posts API first (newer), fallback to jobs API
      let response;
      try {
        response = await jobPostAPI.getMyJobPosts({
          page: currentPage,
          per_page: 10
        } as any)
      } catch (apiError) {
        // Fallback to jobs API
        console.log('Job posts API failed, falling back to jobs API:', apiError)
        try {
          response = await jobAPI.getMyJobs({
            page: currentPage,
            size: 10
          } as any)
        } catch (jobsApiError) {
          console.log('Jobs API also failed:', jobsApiError)
          throw jobsApiError
        }
      }
      
      const data = (response.data || response) as any
      setJobs(data.jobs || [])
      setTotalPages(Math.ceil((data.total || 0) / 10))
    } catch (err: any) {
      console.error('Failed to load jobs:', err)
      setError(err.message || 'Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }, [currentPage])

  useEffect(() => {
    if (user?.role === 'employee') {
      loadJobs()
    }
  }, [user, loadJobs])

  // Filter jobs based on status and search term
  const filteredJobs = jobs.filter(job => {
    // Status filter
    let statusMatch = true
    if (filter === 'active') {
      statusMatch = job.is_active && (!job.application_deadline || new Date(job.application_deadline) > now)
    } else if (filter === 'inactive') {
      statusMatch = !job.is_active
    } else if (filter === 'expired') {
      statusMatch = job.is_active && !!job.application_deadline && new Date(job.application_deadline) <= now
    }
    
    // Search filter
    const searchMatch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    return statusMatch && searchMatch
  })

  const getStatusBadge = (job: JobPost) => {
    if (!job.is_active) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </span>
      )
    }
    
    if (job.application_deadline && new Date(job.application_deadline) <= now) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    )
  }

  const getSalaryDisplay = (job: JobPost) => {
    if (job.salary_min && job.salary_max) {
      return `${job.currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    } else if (job.salary_min) {
      return `${job.currency} ${job.salary_min.toLocaleString()}+`
    }
    return 'Not specified'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleEditJob = (jobId: number) => {
    navigate(`/edit-job/${jobId}`)
  }

  const handleViewApplications = (jobId: number) => {
    navigate(`/jobs/${jobId}/applications`)
  }

  const handleDeleteJob = async (jobId: number) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return
    }
    
    try {
      // Try job posts API first, fallback to jobs API
      try {
        await jobPostAPI.deleteJobPost(jobId)
      } catch (apiError) {
        console.log('Job posts delete failed, trying jobs API:', apiError)
        await jobAPI.delete(jobId)
      }
      
      // Refresh the job list
      loadJobs()
    } catch (err: any) {
      console.error('Failed to delete job:', err)
      setError(err.message || 'Failed to delete job')
    }
  }

  if (user?.role !== 'employee') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">Only employees can access this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Manager</h1>
            <p className="mt-1 text-sm text-gray-500">
              View, edit, and track all jobs you have posted
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => navigate('/post-job')} className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-700">
            {jobs.filter(job => job.is_active && (!job.application_deadline || new Date(job.application_deadline) > now)).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-orange-700">
            {jobs.filter(job => job.is_active && !!job.application_deadline && new Date(job.application_deadline) <= now).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Applications</p>
          <p className="text-2xl font-bold text-gray-900">
            {jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search jobs..."
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
              <option value="all">All Jobs</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {!loading && !error && (
        <div className="space-y-6">
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by posting your first job!'
                }
              </p>
              {!searchTerm && filter === 'all' && (
                <Button onClick={() => navigate('/post-job')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Your First Job
                </Button>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {getStatusBadge(job)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mb-3">
                            <span className="font-medium text-gray-700">{job.company}</span>
                            <span className="mx-2">•</span>
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location}
                            </div>
                            <span className="mx-2">•</span>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {job.job_type}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm">
                          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">{getSalaryDisplay(job)}</span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">
                            {job.experience_level.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        
                        {job.remote_work && (
                          <div className="flex items-center text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Remote
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills_required.slice(0, 5).map((skill, index) => (
                          <span 
                            key={index} 
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.skills_required.length > 5 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{job.skills_required.length - 5} more
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Posted on {formatDate(job.created_at)}</span>
                        {job.application_deadline && (
                          <>
                            <span className="mx-2">•</span>
                            <span>
                              Deadline: {formatDate(job.application_deadline)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 lg:ml-6 lg:w-48">
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900">{job.applications_count}</div>
                          <div className="text-sm text-gray-500">Applications</div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-center text-sm text-gray-500">{job.views} views</div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditJob(job.id)}
                          className="flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewApplications(job.id)}
                          className="flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Apps
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteJob(job.id)}
                          className="flex items-center justify-center text-red-600 hover:text-red-800 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredJobs.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <div className="text-sm text-gray-700">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
