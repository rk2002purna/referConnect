import React, { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ReferralChatState, referralRequestAPI } from '../lib/api'
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  User,
  RefreshCw,
  FileText,
  Mail,
  Phone,
  Linkedin,
  MessageSquare,
  Send,
  Ban
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
  chat_enabled?: boolean
  chat_unread_count?: number
  last_message_at?: string
  last_message_preview?: string
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
  employee_name?: string
  employee_email?: string
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
  const [selectedReferralId, setSelectedReferralId] = useState<number | null>(null)
  const [selectedReferral, setSelectedReferral] = useState<ReferralDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [timeTick, setTimeTick] = useState(0)
  const [chatState, setChatState] = useState<ReferralChatState | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [messageDraft, setMessageDraft] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  const loadReferrals = useCallback(async () => {
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
  }, [filter])

  const loadChat = useCallback(async (referralId: number) => {
    try {
      setChatLoading(true)
      setChatError(null)
      const response = await referralRequestAPI.getChat(referralId)
      setChatState(response.data as ReferralChatState)
      setReferrals(prev =>
        prev.map(ref => ref.id === referralId ? { ...ref, chat_unread_count: 0 } : ref)
      )
    } catch (err) {
      console.error('Failed to load chat state:', err)
      setChatError('Failed to load chat.')
    } finally {
      setChatLoading(false)
    }
  }, [])

  const openReferralDetail = useCallback(async (referralId: number) => {
    try {
      setDetailLoading(true)
      const response = await referralRequestAPI.getReferralById(referralId)
      setSelectedReferral(response.data as ReferralDetail)
      await loadChat(referralId)
    } catch (err) {
      console.error('Failed to load referral detail:', err)
    } finally {
      setDetailLoading(false)
    }
  }, [loadChat])

  useEffect(() => {
    loadReferrals()
  }, [loadReferrals])

  useEffect(() => {
    const interval = setInterval(() => {
      loadReferrals()
    }, 30000)
    return () => clearInterval(interval)
  }, [loadReferrals])

  useEffect(() => {
    const requestId = searchParams.get('request')
    if (requestId) {
      const parsedId = parseInt(requestId, 10)
      if (!Number.isNaN(parsedId)) {
        setSelectedReferralId(parsedId)
        openReferralDetail(parsedId)
      }
    }
  }, [searchParams, openReferralDetail])

  useEffect(() => {
    const timer = setInterval(() => setTimeTick(prev => prev + 1), 60000)
    return () => clearInterval(timer)
  }, [])

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

  const sortedReferrals = [...filteredReferrals].sort((a, b) => {
    const aDate = a.last_message_at || a.created_at
    const bDate = b.last_message_at || b.created_at
    return parseDate(bDate).getTime() - parseDate(aDate).getTime()
  })

  useEffect(() => {
    if (!selectedReferralId && filteredReferrals.length > 0) {
      setSelectedReferralId(filteredReferrals[0].id)
      openReferralDetail(filteredReferrals[0].id)
    }
  }, [filteredReferrals, selectedReferralId, openReferralDetail])

  useEffect(() => {
    if (!selectedReferralId) return
    loadChat(selectedReferralId)
    const interval = setInterval(() => {
      if (chatState?.chat_enabled) {
        loadChat(selectedReferralId)
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedReferralId, loadChat, chatState?.chat_enabled])

  const handleSelectReferral = (referralId: number) => {
    setSelectedReferralId(referralId)
    openReferralDetail(referralId)
    setMobileView('chat')
  }

  const handleEnableChat = async () => {
    if (!selectedReferral) return
    try {
      setChatLoading(true)
      setChatError(null)
      setChatState(prev => ({
        chat_enabled: true,
        messages: prev?.messages || []
      }))
      const response = await referralRequestAPI.enableChat(selectedReferral.id)
      setChatState(response.data as ReferralChatState)
      await loadChat(selectedReferral.id)
    } catch (err) {
      console.error('Failed to enable chat:', err)
      setChatError('Failed to enable chat.')
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedReferral || !messageDraft.trim()) return
    try {
      setSendingMessage(true)
      const response = await referralRequestAPI.sendChatMessage(selectedReferral.id, {
        content: messageDraft.trim()
      })
      const newMessage = response.data as any
      setChatState(prev => ({
        chat_enabled: true,
        messages: [...(prev?.messages || []), newMessage]
      }))
      setMessageDraft('')
    } catch (err) {
      console.error('Failed to send message:', err)
      setChatError('Failed to send message.')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleReject = async () => {
    if (!selectedReferral) return
    try {
      setStatusUpdating(true)
      await referralRequestAPI.updateReferral(selectedReferral.id, { status: 'declined' })
      await loadReferrals()
      await openReferralDetail(selectedReferral.id)
    } catch (err) {
      console.error('Failed to reject referral:', err)
      setError('Failed to reject referral.')
    } finally {
      setStatusUpdating(false)
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

      {/* Mobile View Toggle */}
      <div className="flex gap-2 lg:hidden">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mobileView === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Requests
        </button>
        <button
          onClick={() => setMobileView('chat')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mobileView === 'chat' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          Chat
        </button>
      </div>

      {/* Referrals List + Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        <div className={`space-y-3 ${mobileView === 'list' ? 'block' : 'hidden'} lg:block lg:sticky lg:top-24 lg:h-[calc(100vh-220px)] lg:overflow-y-auto`}>
          {sortedReferrals.length > 0 ? (
            sortedReferrals.map((referral) => (
              <button
                key={referral.id}
                onClick={() => handleSelectReferral(referral.id)}
                className={`w-full text-left border rounded-lg p-4 transition ${
                  selectedReferralId === referral.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{referral.jobseeker_name}</p>
                    <p className="text-xs text-gray-500">{referral.job_title}</p>
                    <p className="text-xs text-gray-400 mt-1">{referral.company_name}</p>
                  </div>
                  {referral.chat_unread_count && referral.chat_unread_count > 0 ? (
                    <span className="mt-1 text-[10px] font-semibold bg-blue-600 text-white rounded-full px-2 py-0.5">
                      {referral.chat_unread_count}
                    </span>
                  ) : !referral.viewed_by_employee ? (
                    <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  ) : null}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>{formatTimeAgo(referral.last_message_at || referral.created_at)}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${getStatusColor(referral.status)}`}>
                    {getStatusIcon(referral.status)}
                    <span className="ml-1 capitalize">{referral.status}</span>
                  </span>
                </div>
                {referral.last_message_preview && (
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">{referral.last_message_preview}</p>
                )}
              </button>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No referrals found</h3>
                <p className="text-xs text-gray-600">
                  {filter === 'all'
                    ? "No referral requests yet."
                    : `No referrals with status "${filter}" found.`}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className={`${mobileView === 'chat' ? 'block' : 'hidden'} lg:block`}>
          {selectedReferral ? (
            <Card>
              <CardContent className="p-6 space-y-5">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{selectedReferral.jobseeker_name}</h2>
                        <p className="text-sm text-gray-600">{selectedReferral.job_title} · {selectedReferral.company_name}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleReject} disabled={statusUpdating}>
                          <Ban className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        {selectedReferral.jobseeker_id && (
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/jobseeker/${selectedReferral.jobseeker_id}`}>
                              <User className="w-4 h-4 mr-1" />
                              Profile
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                      <div className="flex items-start space-x-3">
                        <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span>{selectedReferral.jobseeker_email}</span>
                      </div>
                      {selectedReferral.jobseeker_phone && (
                        <div className="flex items-start space-x-3">
                          <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                          <span>{selectedReferral.jobseeker_phone}</span>
                        </div>
                      )}
                      {selectedReferral.linkedin_url && (
                        <div className="flex items-start space-x-3">
                          <Linkedin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <a
                            href={selectedReferral.linkedin_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            LinkedIn profile
                          </a>
                        </div>
                      )}
                    </div>

                    {selectedReferral.personal_note && (
                      <div className="bg-gray-50 border rounded-md p-3 text-sm text-gray-700">
                        {selectedReferral.personal_note}
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

                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">Chat</span>
                        </div>
                        {!chatState?.chat_enabled && (
                          <Button variant="outline" size="sm" onClick={handleEnableChat} disabled={chatLoading}>
                            Enable Chat
                          </Button>
                        )}
                      </div>

                      {chatError && (
                        <div className="text-sm text-red-600">{chatError}</div>
                      )}

                      <div className="h-64 overflow-y-auto space-y-3 border rounded-md p-3 bg-white">
                        {chatLoading && !chatState ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                          </div>
                        ) : chatState?.messages?.length ? (
                          chatState.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender_role === 'employee' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                                message.sender_role === 'employee'
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}>
                                <p>{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">{formatTimeAgo(message.created_at)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 text-center mt-12">
                            {chatState?.chat_enabled ? 'No messages yet.' : 'Enable chat to start messaging.'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          placeholder={chatState?.chat_enabled ? 'Type a message...' : 'Chat is disabled'}
                          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                          disabled={!chatState?.chat_enabled || sendingMessage}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={!chatState?.chat_enabled || sendingMessage || !messageDraft.trim()}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Select a referral to view details and chat.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
