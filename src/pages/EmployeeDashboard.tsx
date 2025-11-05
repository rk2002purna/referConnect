import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProfileCompletionBanner } from '../components/ProfileCompletionBanner'
import { 
  Plus, 
  Users, 
  Briefcase, 
  TrendingUp, 
  Clock,
  CheckCircle
} from 'lucide-react'

export function EmployeeDashboard() {
  // Mock data - in a real app, this would come from API
  const stats = {
    totalReferrals: 12,
    successfulReferrals: 8,
    pendingReferrals: 3,
    jobsPosted: 5
  }

  const recentActivity = [
    {
      id: 1,
      type: 'referral',
      message: 'John Smith applied for Software Engineer position',
      time: '2 hours ago',
      status: 'pending'
    },
    {
      id: 2,
      type: 'job',
      message: 'New job posted: Senior Product Manager',
      time: '1 day ago',
      status: 'active'
    },
    {
      id: 3,
      type: 'referral',
      message: 'Sarah Johnson was hired for Data Scientist role',
      time: '3 days ago',
      status: 'success'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Employee Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your referrals and job postings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalReferrals}
                </p>
                <p className="text-sm text-gray-500">
                  All time
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Successful Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.successfulReferrals}
                </p>
                <p className="text-sm text-gray-500">
                  {Math.round((stats.successfulReferrals / stats.totalReferrals) * 100)}% success rate
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Referrals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingReferrals}
                </p>
                <p className="text-sm text-gray-500">
                  Awaiting response
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Jobs Posted
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.jobsPosted}
                </p>
                <p className="text-sm text-gray-500">
                  Active listings
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button asChild className="h-auto p-4 flex flex-col items-start">
              <Link to="/post-job">
                <Plus className="w-5 h-5 mb-2" />
                <span className="font-medium">Post a Job</span>
                <span className="text-sm text-gray-500">Create new job listing</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Link to="/my-referrals">
                <Users className="w-5 h-5 mb-2" />
                <span className="font-medium">View Referrals</span>
                <span className="text-sm text-gray-500">Manage your referrals</span>
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-start">
              <Link to="/employee-profile">
                <TrendingUp className="w-5 h-5 mb-2" />
                <span className="font-medium">Update Profile</span>
                <span className="text-sm text-gray-500">Edit your profile</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
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
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
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
                  {activity.status === 'success' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Success
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
