import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { dashboardAPI, profileAPI } from '../lib/api'
import { 
  Search, 
  Filter, 
  MapPin,
  Clock, 
  Users, 
  Briefcase, 
  Star,
  MessageSquare,
  Bell,
  Settings,
  TrendingUp,
  Target,
  CheckCircle,
  Bookmark,
  User,
  Shield,
  BarChart3,
  HelpCircle,
  ChevronRight,
  Plus,
  Edit3,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { jobPostAPI } from '../lib/api'
import { JobMatchingService, JobSeekerProfile } from '../services/jobMatchingService'
import { useAuth } from '../contexts/AuthContext'

interface JobRecommendation {
  id: number
  title: string
  company: string
  location: string
  matchScore: number
  skills: string[]
  salary?: string
  type: string
  postedAt: string
}

interface ApplicationStatus {
  total: number
  pending: number
  viewed: number
  referred: number
  interviewed: number
  hired: number
}

interface ReferralStatus {
  total: number
  pending: number
  accepted: number
  declined: number
  feedback: number
}

interface ActivityItem {
  id: number
  type: 'application' | 'referral' | 'message' | 'recommendation' | 'profile'
  title: string
  description: string
  timestamp: string
  status?: 'new' | 'read' | 'action_required'
  actionUrl?: string
}


export function JobSeekerDashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for API data
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([])
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>({
    total: 0,
    pending: 0,
    viewed: 0,
    referred: 0,
    interviewed: 0,
    hired: 0
  })
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    feedback: 0
  })
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [profileCompletion, setProfileCompletion] = useState(0)
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

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [jobseekerProfile])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Only compute recommendations if we have jobseeker profile data
      if (jobseekerProfile) {
        // Fetch recent jobs
        const jobsRes = await jobPostAPI.getJobPosts({ page: 1, per_page: 50 })
        const data = jobsRes.data as any
        const jobs = data.jobs as Array<any>
        // Compute matches and map to dashboard recommendation shape
        const scored = jobs.map((job) => {
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
          return { job, score: Math.round(match.matchScore * 100) }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)

        const recs: JobRecommendation[] = scored.map(({ job, score }) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          matchScore: score,
          skills: Array.isArray(job.skills_required) ? job.skills_required : [],
          salary: job.salary_min && job.salary_max ? `$${job.salary_min} - $${job.salary_max}` : undefined,
          type: job.job_type,
          postedAt: new Date(job.created_at).toLocaleDateString(),
        }))
        setRecommendations(recs)
      } else {
        // No profile data, show empty recommendations
        setRecommendations([])
      }
      
      // Example status and activity (keep as mock for now)
      setApplicationStatus({
        total: 12,
        pending: 4,
        viewed: 3,
        referred: 2,
        interviewed: 2,
        hired: 1
      })
      setReferralStatus({ total: 5, pending: 2, accepted: 2, declined: 1, feedback: 0 })
      setRecentActivity([
        {
          id: 1,
          type: 'recommendation',
          title: 'New matched job posted',
          description: 'We found a role that matches your skills',
          timestamp: new Date().toISOString(),
          status: 'new'
        },
      ])
      setProfileCompletion(78)
    } catch (err: any) {
      console.error(err)
      setError('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'read': return 'bg-gray-100 text-gray-800'
      case 'action_required': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return <Briefcase className="w-4 h-4" />
      case 'referral': return <Users className="w-4 h-4" />
      case 'message': return <MessageSquare className="w-4 h-4" />
      case 'recommendation': return <Star className="w-4 h-4" />
      case 'profile': return <User className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  // Helper function to safely render data
  const safeRender = (data: any): string => {
    if (typeof data === 'string' || typeof data === 'number') {
      return String(data)
    }
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data)
    }
    return ''
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Seeker Dashboard</h1>
          <p className="text-gray-600 mt-2">Find your next opportunity through referrals</p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/search">
            <Search className="w-4 h-4 mr-2" />
            Search Jobs
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/search">
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters
          </Link>
        </Button>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Request Referral
        </Button>
      </div>

      {/* Status Overview Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applicationStatus.total}</p>
                <p className="text-xs text-gray-500">{applicationStatus.pending} pending</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{referralStatus.total}</p>
                <p className="text-xs text-gray-500">{referralStatus.pending} pending</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Completion</p>
                <p className="text-2xl font-bold text-gray-900">{profileCompletion}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
                <p className="text-xs text-gray-500">3 new this week</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Bookmark className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Job Recommendations & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personalized Job Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Recommended for You
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {job.matchScore}% match
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{job.postedAt}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {Array.isArray(job.skills) && job.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {safeRender(skill)}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          {job.salary && <span className="font-medium">{job.salary}</span>}
                          {job.salary && <span className="mx-2">•</span>}
                          <span>{job.type}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Bookmark className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button size="sm">
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${getStatusColor(activity.status || 'read')}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        {activity.status === 'new' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            New
                          </span>
                        )}
                        {activity.status === 'action_required' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Action Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {safeRender(activity.description)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {safeRender(activity.timestamp)}
                      </p>
                    </div>
                    {activity.actionUrl && (
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Request Referral
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Edit3 className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                View Messages
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bookmark className="w-4 h-4 mr-2" />
                Saved Jobs
              </Button>
            </CardContent>
          </Card>

          {/* Quick Search */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link to="/search">
                  <Search className="w-4 h-4 mr-2" />
                  Search All Jobs
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link to="/search">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filters
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bookmark className="w-4 h-4 mr-2" />
                Saved Jobs
              </Button>
            </CardContent>
          </Card>

          {/* Profile Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Profile Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Profile Visibility</span>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Public
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Hide from Companies</span>
                <Button variant="outline" size="sm">
                  <EyeOff className="w-4 h-4 mr-1" />
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tips & Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Tips & Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                How to Get Referrals
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Edit3 className="w-4 h-4 mr-2" />
                Resume Tips
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                Application Analytics
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help Center
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
