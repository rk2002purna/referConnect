import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { JobApplicationService, JobApplication } from '../services/jobApplicationService'
import { 
  Briefcase, 
  Clock, 
  MapPin, 
  Building, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  Calendar,
  User,
  Star,
  RefreshCw,
  Loader2
} from 'lucide-react'

interface Application extends JobApplication {
  location: string
  salary?: string
  jobType: string
  lastActivity: string
  matchScore?: number
}

interface RecentActivity {
  id: number
  type: 'application' | 'referral' | 'message' | 'interview'
  title: string
  description: string
  timestamp: string
  status: 'new' | 'read'
  actionUrl?: string
}

export function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'applied' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'accepted' | 'rejected'>('all')

  useEffect(() => {
    loadApplications()
  }, [filter])

  const loadApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await JobApplicationService.getMyApplications({
        page: 1,
        per_page: 50,
        status: filter === 'all' ? undefined : filter
      })
      
      // Transform the response data to match our interface
      const data = response as any
      const applicationsData = (data.applications || []).map((app: any) => ({
        ...app,
        jobTitle: app.job_title,
        appliedDate: app.applied_at,
        lastActivity: app.updated_at,
        location: app.location || 'Not specified',
        salary: app.salary || undefined,
        jobType: app.job_type || 'Full-time',
        matchScore: app.match_score || undefined
      }))
      
      setApplications(applicationsData)

      setRecentActivity([
        {
          id: 1,
          type: 'referral',
          title: 'Referral Accepted',
          description: 'Your referral request for Senior Frontend Developer at TechCorp was accepted',
          timestamp: '2 hours ago',
          status: 'new',
          actionUrl: '/referrals/1'
        },
        {
          id: 2,
          type: 'interview',
          title: 'Interview Scheduled',
          description: 'Interview scheduled for Product Manager at StartupXYZ for next Tuesday',
          timestamp: '1 day ago',
          status: 'read',
          actionUrl: '/applications/2'
        },
        {
          id: 3,
          type: 'application',
          title: 'Application Viewed',
          description: 'Your application for UX Designer at DesignStudio was viewed by the hiring manager',
          timestamp: '3 days ago',
          status: 'read'
        },
        {
          id: 4,
          type: 'message',
          title: 'Message from HR',
          description: 'HR team at DataCorp wants to discuss next steps for your Backend Engineer application',
          timestamp: '1 week ago',
          status: 'read',
          actionUrl: '/messages/1'
        }
      ])

    } catch (err: any) {
      console.error('Failed to load applications:', err)
      setError('Failed to load applications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    return JobApplicationService.getStatusColor(status)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <Clock className="w-4 h-4" />
      case 'under_review': return <Eye className="w-4 h-4" />
      case 'interview_scheduled': return <Calendar className="w-4 h-4" />
      case 'interviewed': return <MessageSquare className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    return JobApplicationService.getStatusLabel(status)
  }

  const handleRefresh = () => {
    loadApplications()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return <Briefcase className="w-5 h-5 text-blue-500" />
      case 'referral': return <User className="w-5 h-5 text-purple-500" />
      case 'interview': return <MessageSquare className="w-5 h-5 text-orange-500" />
      case 'message': return <MessageSquare className="w-5 h-5 text-green-500" />
      default: return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const filteredApplications = applications.filter(app => 
    filter === 'all' || app.status === filter
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-2">Track your job applications and their progress</p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadApplications}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: applications.length },
              { key: 'applied', label: 'Applied', count: applications.filter(a => a.status === 'applied').length },
              { key: 'under_review', label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length },
              { key: 'interview_scheduled', label: 'Interview Scheduled', count: applications.filter(a => a.status === 'interview_scheduled').length },
              { key: 'interviewed', label: 'Interviewed', count: applications.filter(a => a.status === 'interviewed').length },
              { key: 'accepted', label: 'Accepted', count: applications.filter(a => a.status === 'accepted').length },
              { key: 'rejected', label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Applications */}
          <div className="space-y-4">
            {filteredApplications.length > 0 ? (
              filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.job_title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            <span className="ml-1">{getStatusLabel(application.status)}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Building className="w-4 h-4" />
                            <span>{application.company}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{application.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Applied {application.applied_at}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          {application.salary && (
                            <span className="font-medium text-gray-700">{application.salary}</span>
                          )}
                          <span>{application.jobType}</span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{application.matchScore}% match</span>
                          </div>
                        </div>

                        {application.notes && (
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            {application.notes}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                          Last activity: {application.lastActivity}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {application.status === 'interviewed' && (
                          <Button size="sm">
                            Schedule Interview
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
                  <p className="text-gray-600 mb-4">
                    {filter === 'all' 
                      ? "You haven't applied to any jobs yet." 
                      : `No applications with status "${filter}" found.`
                    }
                  </p>
                  <Button>
                    Search Jobs
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                        {activity.status === 'new' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            New
                          </span>
                        )}
                        <p className="text-xs text-gray-600 mt-1">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 text-sm">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
