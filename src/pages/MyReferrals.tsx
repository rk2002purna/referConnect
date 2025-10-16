import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { 
  Users, 
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
  AlertCircle,
  RefreshCw,
  Plus,
  Send
} from 'lucide-react'

interface Referral {
  id: number
  candidateName: string
  candidateEmail: string
  jobTitle: string
  company: string
  location: string
  requestedDate: string
  status: 'pending' | 'accepted' | 'declined' | 'interviewed' | 'hired' | 'rejected'
  matchScore: number
  notes?: string
  lastActivity: string
  referrerName: string
  referrerEmail: string
}

interface ReferralStats {
  total: number
  pending: number
  accepted: number
  declined: number
  interviewed: number
  hired: number
  successRate: number
}

export function MyReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    interviewed: 0,
    hired: 0,
    successRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'interviewed' | 'hired' | 'rejected'>('all')

  useEffect(() => {
    loadReferrals()
  }, [])

  const loadReferrals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Mock data - replace with API calls
      const mockReferrals: Referral[] = [
        {
          id: 1,
          candidateName: 'Alice Johnson',
          candidateEmail: 'alice@example.com',
          jobTitle: 'Senior Frontend Developer',
          company: 'TechCorp',
          location: 'San Francisco, CA',
          requestedDate: '2023-10-20',
          status: 'accepted',
          matchScore: 95,
          notes: 'Excellent React skills, 5 years experience',
          lastActivity: '2 hours ago',
          referrerName: 'John Doe',
          referrerEmail: 'john@techcorp.com'
        },
        {
          id: 2,
          candidateName: 'Bob Williams',
          candidateEmail: 'bob@example.com',
          jobTitle: 'Product Manager',
          company: 'StartupXYZ',
          location: 'Remote',
          requestedDate: '2023-10-18',
          status: 'interviewed',
          matchScore: 88,
          notes: 'Strong product background, MBA from Stanford',
          lastActivity: '1 day ago',
          referrerName: 'Sarah Smith',
          referrerEmail: 'sarah@startupxyz.com'
        },
        {
          id: 3,
          candidateName: 'Charlie Brown',
          candidateEmail: 'charlie@example.com',
          jobTitle: 'UX Designer',
          company: 'DesignStudio',
          location: 'New York, NY',
          requestedDate: '2023-10-15',
          status: 'pending',
          matchScore: 82,
          notes: 'Creative designer with 3 years experience',
          lastActivity: '3 days ago',
          referrerName: 'Mike Wilson',
          referrerEmail: 'mike@designstudio.com'
        },
        {
          id: 4,
          candidateName: 'Diana Prince',
          candidateEmail: 'diana@example.com',
          jobTitle: 'Backend Engineer',
          company: 'DataCorp',
          location: 'Austin, TX',
          requestedDate: '2023-10-10',
          status: 'hired',
          matchScore: 92,
          notes: 'Excellent Python and database skills',
          lastActivity: '1 week ago',
          referrerName: 'Alex Chen',
          referrerEmail: 'alex@datacorp.com'
        },
        {
          id: 5,
          candidateName: 'Eve Adams',
          candidateEmail: 'eve@example.com',
          jobTitle: 'Marketing Manager',
          company: 'GrowthCo',
          location: 'Chicago, IL',
          requestedDate: '2023-10-05',
          status: 'declined',
          matchScore: 75,
          notes: 'Not a good fit for the role',
          lastActivity: '2 weeks ago',
          referrerName: 'Lisa Garcia',
          referrerEmail: 'lisa@growthco.com'
        }
      ]

      setReferrals(mockReferrals)

      // Calculate stats
      const total = mockReferrals.length
      const pending = mockReferrals.filter(r => r.status === 'pending').length
      const accepted = mockReferrals.filter(r => r.status === 'accepted').length
      const declined = mockReferrals.filter(r => r.status === 'declined').length
      const interviewed = mockReferrals.filter(r => r.status === 'interviewed').length
      const hired = mockReferrals.filter(r => r.status === 'hired').length
      const successRate = total > 0 ? Math.round(((accepted + interviewed + hired) / total) * 100) : 0

      setStats({
        total,
        pending,
        accepted,
        declined,
        interviewed,
        hired,
        successRate
      })

    } catch (err: any) {
      console.error('Failed to load referrals:', err)
      setError('Failed to load referrals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'interviewed': return 'bg-orange-100 text-orange-800'
      case 'hired': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'declined': return <XCircle className="w-4 h-4" />
      case 'interviewed': return <MessageSquare className="w-4 h-4" />
      case 'hired': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const filteredReferrals = referrals.filter(referral => 
    filter === 'all' || referral.status === filter
  )

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
          <h1 className="text-3xl font-bold text-gray-900">My Referrals</h1>
          <p className="text-gray-600 mt-2">Manage your referral requests and track their progress</p>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={loadReferrals}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Request Referral
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Accepted</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.accepted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.successRate}%</p>
              </div>
              <Star className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: stats.total },
          { key: 'pending', label: 'Pending', count: stats.pending },
          { key: 'accepted', label: 'Accepted', count: stats.accepted },
          { key: 'declined', label: 'Declined', count: stats.declined },
          { key: 'interviewed', label: 'Interviewed', count: stats.interviewed },
          { key: 'hired', label: 'Hired', count: stats.hired },
          { key: 'rejected', label: 'Rejected', count: referrals.filter(r => r.status === 'rejected').length },
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

      {/* Referrals List */}
      <div className="space-y-4">
        {filteredReferrals.length > 0 ? (
          filteredReferrals.map((referral) => (
            <Card key={referral.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {referral.candidateName}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                        {getStatusIcon(referral.status)}
                        <span className="ml-1 capitalize">{referral.status}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{referral.company}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{referral.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Requested {referral.requestedDate}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{referral.jobTitle}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{referral.matchScore}% match</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>Referred by {referral.referrerName}</span>
                        </div>
                      </div>
                    </div>

                    {referral.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-3">
                        {referral.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Last activity: {referral.lastActivity}
                      </p>
                      <div className="text-xs text-gray-500">
                        {referral.candidateEmail}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {referral.status === 'pending' && (
                      <Button size="sm">
                        <Send className="w-4 h-4 mr-1" />
                        Follow Up
                      </Button>
                    )}
                    {referral.status === 'accepted' && (
                      <Button size="sm">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Message
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
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No referrals found</h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? "You haven't requested any referrals yet." 
                  : `No referrals with status "${filter}" found.`
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Request Referral
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
