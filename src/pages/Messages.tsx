import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ReferralChatState, referralRequestAPI } from '../lib/api'
import {
  MessageSquare,
  Mail,
  Phone,
  Building,
  Calendar,
  Send,
  Users,
  User
} from 'lucide-react'

interface ReferralSummary {
  id: number
  job_title: string
  company_name: string
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
  created_at: string
  chat_enabled?: boolean
  chat_unread_count?: number
  last_message_at?: string
  last_message_preview?: string
}

interface ReferralDetail extends ReferralSummary {
  jobseeker_name: string
  jobseeker_email: string
  jobseeker_phone?: string
  personal_note?: string
  resume_filename?: string
  employee_name?: string
  employee_email?: string
}

export function Messages() {
  const { user } = useAuth()
  const [referrals, setReferrals] = useState<ReferralSummary[]>([])
  const [selectedReferralId, setSelectedReferralId] = useState<number | null>(null)
  const [selectedReferral, setSelectedReferral] = useState<ReferralDetail | null>(null)
  const [chatState, setChatState] = useState<ReferralChatState | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [messageDraft, setMessageDraft] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [timeTick, setTimeTick] = useState(0)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')

  const loadReferrals = useCallback(async () => {
    const response = await referralRequestAPI.getReferrals({ limit: 100, offset: 0 })
    setReferrals(response.data as ReferralSummary[])
  }, [])

  const loadChat = useCallback(async (referralId: number) => {
    setChatLoading(true)
    try {
      const response = await referralRequestAPI.getChat(referralId)
      setChatState(response.data as ReferralChatState)
      setReferrals(prev =>
        prev.map(ref => ref.id === referralId ? { ...ref, chat_unread_count: 0 } : ref)
      )
    } finally {
      setChatLoading(false)
    }
  }, [])

  const openReferralDetail = useCallback(async (referralId: number) => {
    const response = await referralRequestAPI.getReferralById(referralId)
    setSelectedReferral(response.data as ReferralDetail)
    await loadChat(referralId)
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
    const timer = setInterval(() => setTimeTick(prev => prev + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!selectedReferralId && referrals.length > 0) {
      setSelectedReferralId(referrals[0].id)
      openReferralDetail(referrals[0].id)
    }
  }, [referrals, selectedReferralId, openReferralDetail])

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
    } finally {
      setSendingMessage(false)
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

  const sortedReferrals = [...referrals].sort((a, b) => {
    const aDate = a.last_message_at || a.created_at
    const bDate = b.last_message_at || b.created_at
    return parseDate(bDate).getTime() - parseDate(aDate).getTime()
  })

  if (user?.role !== 'jobseeker') {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">Only jobseekers can access messages.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600 mt-2">Chat with employees about your referral requests</p>
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
                    <p className="text-sm font-semibold text-gray-900">{referral.job_title}</p>
                    <p className="text-xs text-gray-500">{referral.company_name}</p>
                  </div>
                  {referral.chat_unread_count && referral.chat_unread_count > 0 && (
                    <span className="mt-1 text-[10px] font-semibold bg-blue-600 text-white rounded-full px-2 py-0.5">
                      {referral.chat_unread_count}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">Requested {formatTimeAgo(referral.last_message_at || referral.created_at)}</div>
                {referral.last_message_preview && (
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">{referral.last_message_preview}</p>
                )}
              </button>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No referral requests yet.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className={`${mobileView === 'chat' ? 'block' : 'hidden'} lg:block`}>
          {selectedReferral ? (
            <Card>
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedReferral.job_title}</h2>
                    <p className="text-sm text-gray-600">{selectedReferral.company_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                  {selectedReferral.employee_name && (
                    <div className="flex items-start space-x-3">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{selectedReferral.employee_name}</span>
                    </div>
                  )}
                  {selectedReferral.employee_email && (
                    <div className="flex items-start space-x-3">
                      <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{selectedReferral.employee_email}</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-3">
                    <Building className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>{selectedReferral.company_name}</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span>Requested {formatTimeAgo(selectedReferral.created_at)}</span>
                  </div>
                  {selectedReferral.jobseeker_phone && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>{selectedReferral.jobseeker_phone}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">Chat</span>
                  </div>

                  <div className="h-64 overflow-y-auto space-y-3 border rounded-md p-3 bg-white">
                    {chatLoading && !chatState ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    ) : chatState?.messages?.length ? (
                      chatState.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_role === 'jobseeker' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            message.sender_role === 'jobseeker'
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
                        {chatState?.chat_enabled ? 'No messages yet.' : 'Waiting for employee to enable chat.'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageDraft}
                      onChange={(e) => setMessageDraft(e.target.value)}
                      placeholder={chatState?.chat_enabled ? 'Type a message...' : 'Chat not enabled'}
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Select a referral to view the conversation.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
