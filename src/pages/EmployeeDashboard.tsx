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
        <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your referrals and help job seekers find opportunities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successfulReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Jobs Posted</p>
                <p className="text-2xl font-bold text-gray-900">{stats.jobsPosted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/post-job">
              <Button className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Post a New Job
              </Button>
            </Link>
            <Link to="/referrals">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                View My Referrals
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'pending' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-green-600">
              {Math.round((stats.successfulReferrals / stats.totalReferrals) * 100)}%
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {stats.successfulReferrals} out of {stats.totalReferrals} referrals were successful
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Great job! Keep up the excellent work helping job seekers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}