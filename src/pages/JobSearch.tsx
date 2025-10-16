import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { RequestReferralModal } from '../components/RequestReferralModal'
import { ProfileCompletionBanner } from '../components/ProfileCompletionBanner'
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Clock, 
  Building, 
  Filter,
  Users,
  Calendar,
  UserPlus
} from 'lucide-react'

interface Job {
  id: number
  title: string
  company: string
  location: string
  employment_type: string
  skills: string[]
  min_experience: number
  description: string
  created_at: string
  is_active: boolean
  job_link?: string
  max_applicants?: number
  current_applicants?: number
}

export function JobSearch() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showReferralModal, setShowReferralModal] = useState(false)

  useEffect(() => {
    // Mock data - in a real app, this would be an API call
    const mockJobs: Job[] = [
      {
        id: 1,
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        employment_type: 'full_time',
        skills: ['Python', 'React', 'AWS', 'Docker'],
        min_experience: 5,
        description: 'We are looking for a senior software engineer to join our team...',
        created_at: '2024-01-15',
        is_active: true,
        job_link: 'https://techcorp.com/careers/senior-software-engineer',
        max_applicants: 50,
        current_applicants: 23
      },
      {
        id: 2,
        title: 'Product Manager',
        company: 'StartupXYZ',
        location: 'Remote',
        employment_type: 'full_time',
        skills: ['Product Management', 'Agile', 'Analytics'],
        min_experience: 3,
        description: 'Lead product development for our flagship application...',
        created_at: '2024-01-14',
        is_active: true,
        job_link: 'https://startupxyz.com/jobs/product-manager',
        max_applicants: 30,
        current_applicants: 15
      },
      {
        id: 3,
        title: 'Data Scientist',
        company: 'DataCorp',
        location: 'New York, NY',
        employment_type: 'full_time',
        skills: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
        min_experience: 4,
        description: 'Join our data science team to build ML models...',
        created_at: '2024-01-13',
        is_active: true,
        job_link: 'https://datacorp.com/careers/data-scientist',
        max_applicants: 25,
        current_applicants: 25
      },
      {
        id: 4,
        title: 'Frontend Developer',
        company: 'WebSolutions',
        location: 'Austin, TX',
        employment_type: 'contract',
        skills: ['React', 'TypeScript', 'CSS', 'JavaScript'],
        min_experience: 2,
        description: 'Build beautiful and responsive user interfaces...',
        created_at: '2024-01-12',
        is_active: true,
        job_link: 'https://websolutions.com/careers/frontend-developer',
        max_applicants: 40,
        current_applicants: 8
      }
    ]

    setTimeout(() => {
      setJobs(mockJobs)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase())
    const matchesEmploymentType = !employmentTypeFilter || job.employment_type === employmentTypeFilter

    return matchesSearch && matchesLocation && matchesEmploymentType
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would trigger an API call
  }

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'full_time': return 'Full Time'
      case 'part_time': return 'Part Time'
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
    return (job.current_applicants || 0) < job.max_applicants
  }

  const getApplicantStatus = (job: Job) => {
    if (!job.max_applicants) return null
    const current = job.current_applicants || 0
    const max = job.max_applicants
    return { current, max, remaining: max - current }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
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
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredJobs.length === 0 ? (
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
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {getEmploymentTypeLabel(job.employment_type)}
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
                          <span>{job.min_experience}+ years</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.skills.map((skill, index) => (
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
