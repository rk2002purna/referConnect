import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  Shield, 
  Search,
  ArrowRight,
  Target
} from 'lucide-react'

export function Home() {
  const { user } = useAuth()

  const features = [
    {
      icon: Search,
      title: 'Smart Job Matching',
      description: 'AI-powered job recommendations based on your skills and preferences'
    },
    {
      icon: Users,
      title: 'Employee Referrals',
      description: 'Connect with employees at top companies for personalized referrals'
    },
    {
      icon: Shield,
      title: 'Trust & Safety',
      description: 'Verified profiles and secure communication for all interactions'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Track your progress and get insights to advance your career'
    }
  ]

  const stats = [
    { label: 'Active Users', value: '10,000+' },
    { label: 'Companies', value: '500+' },
    { label: 'Successful Referrals', value: '2,500+' },
    { label: 'Success Rate', value: '85%' }
  ]

  if (user) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user.email.split('@')[0]}!
          </h1>
          <p className="text-xl text-gray-600">
            Ready to find your next opportunity or help someone find theirs?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full justify-start">
                <Link to="/search">
                  <Search className="w-4 h-4 mr-2" />
                  Search Jobs
                </Link>
              </Button>
              {user.role === 'employee' && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/my-jobs">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Job Manager
                  </Link>
                </Button>
              )}
              {user.role === 'jobseeker' && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/my-applications">
                    <Target className="w-4 h-4 mr-2" />
                    My Applications
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Start by searching for jobs or creating referrals</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Connect. Refer. Succeed.
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          The platform that connects job seekers with employees at top companies 
          for personalized referrals and career opportunities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/register">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">
              Sign In
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              {stat.value}
            </div>
            <div className="text-gray-600">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose ReferConnect?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* How it Works */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
            <p className="text-gray-600">
              Sign up as a job seeker or employee and complete your profile
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect & Refer</h3>
            <p className="text-gray-600">
              Employees post jobs and refer candidates, job seekers apply
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Hired</h3>
            <p className="text-gray-600">
              Track your progress and land your dream job through referrals
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Start Your Journey?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of professionals who have found success through referrals
        </p>
        <Button asChild size="lg" variant="secondary">
          <Link to="/register">
            Get Started Today
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
