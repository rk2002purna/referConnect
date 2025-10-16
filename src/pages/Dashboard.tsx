import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { JobSeekerDashboard } from './JobSeekerDashboard'
import { EmployeeDashboard } from './EmployeeDashboard'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { VerificationStatusBanner } from '../components/verification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  Briefcase, 
  Users, 
  TrendingUp, 
  Target,
  Search,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  Shield,
  Settings
} from 'lucide-react'

interface DashboardStats {
  totalJobs: number
  activeJobs: number
  totalReferrals: number
  pendingReferrals: number
  acceptedReferrals: number
  rejectedReferrals: number
}

export function Dashboard() {
  const { user, verificationStatus } = useAuth()

  // Route to appropriate dashboard based on user role
  if (user?.role === 'jobseeker') {
    return (
      <ErrorBoundary>
        <JobSeekerDashboard />
      </ErrorBoundary>
    )
  }

  if (user?.role === 'employee') {
    return (
      <ErrorBoundary>
        <EmployeeDashboardWithVerification 
          verificationStatus={verificationStatus}
        />
      </ErrorBoundary>
    )
  }

  // Admin or fallback dashboard
  return (
    <ErrorBoundary>
      <AdminDashboard />
    </ErrorBoundary>
  )
}

function EmployeeDashboardWithVerification({ verificationStatus }: { verificationStatus: any }) {
  return (
    <div className="space-y-6">
      {/* Verification Status Banner */}
      {verificationStatus && verificationStatus.status !== 'verified' && (
        <VerificationStatusBanner
          status={verificationStatus.status}
          verificationMethod={verificationStatus.method}
          onRetry={() => {
            // Navigate to verification flow
            window.location.href = '/onboarding'
          }}
          onResendOTP={async () => {
            // Handle OTP resend
            console.log('Resending OTP...')
          }}
        />
      )}
      
      {/* Regular Employee Dashboard */}
      <EmployeeDashboard />
    </div>
  )
}

function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalReferrals: 0,
    pendingReferrals: 0,
    acceptedReferrals: 0,
    rejectedReferrals: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // In a real app, you would fetch this data from the API
    // For now, we'll use mock data
    setTimeout(() => {
      setStats({
        totalJobs: 50,
        activeJobs: 35,
        totalReferrals: 150,
        pendingReferrals: 25,
        acceptedReferrals: 100,
        rejectedReferrals: 25
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getAdminStats = () => {
    return [
      {
        title: 'Total Jobs',
        value: stats.totalJobs,
        subtitle: `${stats.activeJobs} active`,
        icon: Briefcase,
        color: 'text-blue-600'
      },
      {
        title: 'Total Referrals',
        value: stats.totalReferrals,
        subtitle: `${stats.pendingReferrals} pending`,
        icon: Users,
        color: 'text-green-600'
      },
      {
        title: 'Success Rate',
        value: `${Math.round((stats.acceptedReferrals / Math.max(stats.totalReferrals, 1)) * 100)}%`,
        subtitle: 'Overall success',
        icon: TrendingUp,
        color: 'text-purple-600'
      },
      {
        title: 'Platform Health',
        value: '98%',
        subtitle: 'Uptime',
        icon: CheckCircle,
        color: 'text-green-600'
      }
    ]
  }

  const getRecentActivity = () => {
    // Mock recent activity data for admin
    return [
      {
        id: 1,
        type: 'referral',
        title: 'New referral request received',
        time: '2 hours ago',
        status: 'pending'
      },
      {
        id: 2,
        type: 'job',
        title: 'New job posted: Senior Developer',
        time: '1 day ago',
        status: 'active'
      },
      {
        id: 3,
        type: 'user',
        title: 'New user registered: Employee',
        time: '3 days ago',
        status: 'completed'
      },
      {
        id: 4,
        type: 'system',
        title: 'System maintenance completed',
        time: '1 week ago',
        status: 'completed'
      }
    ]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Platform overview and management
        </p>
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getAdminStats().map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-500">
                      {stat.subtitle}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>
            Platform management and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild className="h-auto p-4 flex flex-col items-start">
              <a href="/admin/users">
                <Users className="w-5 h-5 mb-2" />
                <span className="font-medium">Manage Users</span>
                <span className="text-sm text-gray-500">User administration</span>
              </a>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start">
              <a href="/admin/analytics">
                <TrendingUp className="w-5 h-5 mb-2" />
                <span className="font-medium">Analytics</span>
                <span className="text-sm text-gray-500">Platform metrics</span>
              </a>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start">
              <a href="/admin/trust">
                <Shield className="w-5 h-5 mb-2" />
                <span className="font-medium">Trust & Safety</span>
                <span className="text-sm text-gray-500">Fraud monitoring</span>
              </a>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start">
              <a href="/admin/settings">
                <Settings className="w-5 h-5 mb-2" />
                <span className="font-medium">Settings</span>
                <span className="text-sm text-gray-500">Platform config</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Platform activity and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getRecentActivity().map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  {activity.type === 'referral' && (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  {activity.type === 'job' && (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                  {activity.type === 'application' && (
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {activity.time}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {activity.status === 'pending' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  )}
                  {activity.status === 'accepted' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Accepted
                    </span>
                  )}
                  {activity.status === 'active' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
