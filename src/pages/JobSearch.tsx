import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { RequestReferralModal } from '../components/RequestReferralModal'
import { ProfileCompletionBanner } from '../components/ProfileCompletionBanner'
import { jobPostAPI, profileAPI } from '../lib/api'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  Building, 
  Filter,
  Users,
  Calendar,
  UserPlus,
  Loader2
} from 'lucide-react'
import { JobMatchingService, JobSeekerProfile, JobMatch } from '../services/jobMatchingService'
import { useAuth } from '../contexts/AuthContext'

interface Job {
  id: number
  title: string
  company: string
  location: string
  job_type: string
  skills_required: string[]
  experience_level: string
  description: string
  requirements?: string
  benefits?: string
  salary_min?: number
  salary_max?: number
  currency: string
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
  posted_by: number
}

interface JobPostListResponse {
  jobs: Job[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export function JobSearch() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [matches, setMatches] = useState<Record<number, JobMatch>>({})
  const [jobseekerProfile, setJobseekerProfile] = useState<JobSeekerProfile | null>(null)

  // Load jobseeker profile for accurate matching
  useEffect(() => {
    const loadJobseekerProfile = async () => {
      if (!user || user.role !== 'jobseeker') {
        setJobseekerProfile(null)
        return
      }

      try {
        const response = await profileAPI.getJobSeekerProfile()
        const profile = response.data as any
        
        // Convert API response to JobSeekerProfile format
        const jobSeeker: JobSeekerProfile = {
          id: user.id,
          skills: profile.skills ? profile.skills.split(',').map((s: string) => s.trim()) : [],
          experience_level: profile.years_experience ? 
            (profile.years_experience < 2 ? 'entry' : 
             profile.years_experience < 5 ? 'mid' : 
             profile.years_experience < 10 ? 'senior' : 'executive') : 'mid',
          preferred_job_types: profile.preferred_job_types ? 
            profile.preferred_job_types.split(',').map((s: string) => s.trim()) : [],
          location: profile.location || '',
          salary_expectation_min: profile.salary_expectation_min,
          salary_expectation_max: profile.salary_expectation_max,
          industries: profile.industries ? 
            profile.industries.split(',').map((s: string) => s.trim()) : [],
          willing_to_relocate: profile.willing_to_relocate ?? true,
        }
        setJobseekerProfile(jobSeeker)
      } catch (error) {
        console.error('Failed to load jobseeker profile:', error)
        setJobseekerProfile(null)
      }
    }

    loadJobseekerProfile()
  }, [user])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const response = await jobPostAPI.getJobPosts({
          page: 1,
          per_page: 50,
          job_type: employmentTypeFilter || undefined,
          location: locationFilter || undefined,
          experience_level: undefined
        })
        const data = response.data as JobPostListResponse
        setJobs(data.jobs)
        
        // Compute client-side matches when jobs load and profile is available
        if (jobseekerProfile) {
          try {
            const computed: Record<number, JobMatch> = {}
            for (const job of data.jobs) {
              const jobPost = {
                id: job.id,
                title: job.title,
                company: job.company,
                location: job.location,
                job_type: job.job_type,
                skills_required: job.skills_required || [],
                experience_level: job.experience_level,
                salary_min: job.salary_min,
                salary_max: job.salary_max,
                description: job.description,
                is_active: job.is_active,
                created_at: job.created_at,
              }
              const match = JobMatchingService.calculateMatchScore(jobseekerProfile, jobPost)
              computed[job.id] = match
            }
            setMatches(computed)
          } catch (e) {
            console.error('Failed to compute job matches:', e)
            setMatches({})
          }
        } else {
          setMatches({})
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
        // Fallback to empty array on error
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [employmentTypeFilter, locationFilter, jobseekerProfile])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills_required.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase())
    const matchesEmploymentType = !employmentTypeFilter || job.job_type === employmentTypeFilter

    return matchesSearch && matchesLocation && matchesEmploymentType
  })
  // Sort by match score descending when available
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const aScore = matches[a.id]?.matchScore ?? -1
    const bScore = matches[b.id]?.matchScore ?? -1
    return bScore - aScore
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would trigger an API call
  }

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full-time': return 'Full Time'
      case 'part-time': return 'Part Time'
      case 'contract': return 'Contract'
      case 'internship': return 'Internship'
      default: return type
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isJobAcceptingApplications = (job: Job) => {
    if (!job.max_applicants) return true // No limit set
    return job.applications_count < job.max_applicants
  }

  const getApplicantStatus = (job: Job) => {
    if (!job.max_applicants) return null
    const current = job.applications_count
    const max = job.max_applicants
    return { current, max, remaining: max - current }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Find Your Next Job</h1>
        <p className="text-gray-600 mt-2">
          Discover opportunities through employee referrals
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search jobs, companies, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="md:w-auto">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:w-auto"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="City, state, or remote"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={employmentTypeFilter}
                    onChange={(e) => setEmploymentTypeFilter(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">All Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {sortedJobs.length} job{sortedJobs.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {sortedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or check back later for new opportunities.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        {matches[job.id] && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {Math.round(matches[job.id].matchScore * 100)}% match
                          </span>
                        )}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {getEmploymentTypeLabel(job.job_type)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Building className="w-4 h-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{job.experience_level}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills_required.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Posted {formatDate(job.created_at)}</span>
                          </div>
                          {getApplicantStatus(job) && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>
                                {getApplicantStatus(job)!.current}/{getApplicantStatus(job)!.max} applicants
                                {getApplicantStatus(job)!.remaining > 0 && (
                                  <span className="text-green-600 ml-1">
                                    ({getApplicantStatus(job)!.remaining} spots left)
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job)
                              setShowReferralModal(true)
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Request Referral
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (job.job_link) {
                                window.open(job.job_link, '_blank', 'noopener,noreferrer')
                              } else {
                                alert('No application link available for this job')
                              }
                            }}
                            disabled={!job.job_link || !isJobAcceptingApplications(job)}
                          >
                            {!isJobAcceptingApplications(job) ? 'Applications Closed' : 'Apply Now'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Request Referral Modal */}
      {selectedJob && (
        <RequestReferralModal
          isOpen={showReferralModal}
          onClose={() => {
            setShowReferralModal(false)
            setSelectedJob(null)
          }}
          job={selectedJob}
          onSuccess={() => {
            // Optionally refresh the job list or show success message
            console.log('Referral request submitted successfully')
          }}
        />
      )}
    </div>
  )
}
