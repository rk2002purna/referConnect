import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { referralRequestAPI } from '../lib/api'
import { 
  Users, 
  Clock, 
  Building, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar,
  User,
  RefreshCw,
  X,
  FileText,
  Mail,
  Phone,
  Linkedin
} from 'lucide-react'

interface Referral {
  id: number
  job_id: number
  job_title: string
  company_name: string
  jobseeker_name: string
  jobseeker_email: string
  jobseeker_id?: number
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  created_at: string
  viewed_by_employee: boolean
  resume_filename?: string
  personal_note?: string
}

interface ReferralStats {
  total: number
  pending: number
  accepted: number
  declined: number
  withdrawn: number
}

interface ReferralDetail extends Referral {
  jobseeker_phone?: string
  linkedin_url?: string
}

export function MyReferrals() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<ReferralStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    withdrawn: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined' | 'withdrawn'>('all')
  const [selectedReferral, setSelectedReferral] = useState<ReferralDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [timeTick, setTimeTick] = useState(0)

  useEffect(() => {
    loadReferrals()
  }, [filter])

  useEffect(() => {
    const requestId = searchParams.get('request')
    if (requestId) {
      openReferralDetail(parseInt(requestId, 10))
    }
  }, [searchParams])

  useEffect(() => {
    const timer = setInterval(() => setTimeTick(prev => prev + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const loadReferrals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await referralRequestAPI.getReferrals({
        status: filter === 'all' ? undefined : filter,
        limit: 100,
        offset: 0
      })

      const data = response.data as Referral[]
      setReferrals(data || [])

      const total = data.length
      const pending = data.filter(r => r.status === 'pending').length
      const accepted = data.filter(r => r.status === 'accepted').length
      const declined = data.filter(r => r.status === 'declined').length
      const withdrawn = data.filter(r => r.status === 'withdrawn').length

      setStats({
        total,
        pending,
        accepted,
        declined,
        withdrawn
      })

    } catch (err: any) {
      console.error('Failed to load referrals:', err)
      setError('Failed to load referrals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const openReferralDetail = async (referralId: number) => {
    try {
      setDetailLoading(true)
      const response = await referralRequestAPI.getReferralById(referralId)
      setSelectedReferral(response.data as ReferralDetail)
    } catch (err) {
      console.error('Failed to load referral detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-blue-100 text-blue-800'
      case 'declined': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'declined': return <XCircle className="w-4 h-4" />
      case 'withdrawn': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const parseDate = (dateString: string) => {
    const hasTimezone = /Z|[+-]\d{2}:\d{2}$/.test(dateString)
    return new Date(hasTimezone ? dateString : `${dateString}Z`)
  }

  const formatTimeAgo = (dateString: string) => {
    void timeTick
    const date = parseDate(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
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

  if (user?.role !== 'employee') {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">Only employees can view referral requests.</p>
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
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                <p className="text-sm font-medium text-gray-500">Declined</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.declined}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Withdrawn</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.withdrawn}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-600" />
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
          { key: 'withdrawn', label: 'Withdrawn', count: stats.withdrawn },
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
                        {referral.jobseeker_name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                        {getStatusIcon(referral.status)}
                        <span className="ml-1 capitalize">{referral.status}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{referral.company_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Requested {formatTimeAgo(referral.created_at)}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{referral.job_title}</h4>
                      {referral.personal_note && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-3">
                          {referral.personal_note}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Priority: <span className="capitalize">{referral.priority}</span>
                      </p>
                      <div className="text-xs text-gray-500">
                        {referral.jobseeker_email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => openReferralDetail(referral.id)}>
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
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
                  ? "No referral requests yet." 
                  : `No referrals with status "${filter}" found.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Referral Details</h3>
                <p className="text-sm text-gray-600">{selectedReferral.job_title}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedReferral(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Candidate</p>
                        <p className="text-sm font-medium text-gray-900">{selectedReferral.jobseeker_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">{selectedReferral.jobseeker_email}</p>
                      </div>
                    </div>
                    {selectedReferral.jobseeker_phone && (
                      <div className="flex items-start space-x-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-sm font-medium text-gray-900">{selectedReferral.jobseeker_phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedReferral.linkedin_url && (
                      <div className="flex items-start space-x-3">
                        <Linkedin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">LinkedIn</p>
                          <a
                            href={selectedReferral.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            View Profile
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedReferral.personal_note && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Personal Note</p>
                      <div className="text-sm text-gray-700 bg-gray-50 border rounded-md p-3">
                        {selectedReferral.personal_note}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-gray-50 border rounded-md p-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {selectedReferral.resume_filename || 'No resume uploaded'}
                      </span>
                    </div>
                    {selectedReferral.resume_filename && (
                      <a
                        className="text-sm text-blue-600 hover:underline"
                        href={`/api/v1/referral-requests/${selectedReferral.id}/resume`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    )}
                  </div>

                  {selectedReferral.jobseeker_id && (
                    <div className="flex justify-end">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          to={`/jobseeker/${selectedReferral.jobseeker_id}`}
                          onClick={() => setSelectedReferral(null)}
                        >
                          View Jobseeker Profile
                        </Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
