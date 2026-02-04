import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ResumeViewer } from '../components/ResumeViewer'
import {
  Briefcase,
  Building,
  Calendar,
  Globe,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Star,
  FileText,
  Github
} from 'lucide-react'
import {
  getApiBaseUrl,
  profileAPI,
  PublicJobSeekerProfileResponse
} from '../lib/api'

const splitCsv = (value?: string) => {
  if (!value) return []
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

export function JobSeekerProfile() {
  const { user } = useAuth()
  const { userId } = useParams<{ userId: string }>()
  const [data, setData] = useState<PublicJobSeekerProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showResume, setShowResume] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setError('Missing jobseeker id.')
        setLoading(false)
        return
      }

      const parsedId = Number(userId)
      if (!Number.isFinite(parsedId)) {
        setError('Invalid jobseeker id.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await profileAPI.getJobSeekerProfileById(parsedId)
        setData(response.data as PublicJobSeekerProfileResponse)
      } catch (err: any) {
        console.error('Failed to load jobseeker profile:', err)
        setError(err?.response?.data?.detail || 'Failed to load jobseeker profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  const profile = data?.profile
  const jobseeker = data?.jobseeker_profile || null

  const fullName = useMemo(() => {
    if (!profile) return 'Job Seeker'
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Job Seeker'
  }, [profile])

  const resumeFilename = jobseeker?.resume_filename || profile?.resume_filename
  const resumeUrl = jobseeker?.resume_url || profile?.resume_url
  const resumeKey = jobseeker?.resume_key || profile?.resume_key
  const derivedResumeUrl = resumeUrl || (resumeKey ? `${getApiBaseUrl()}/files/download?file_path=uploads/resumes/${resumeKey}` : undefined)
  const linkedinUrl = jobseeker?.linkedin_url || profile?.linkedin_url

  const skills = splitCsv(jobseeker?.skills)
  const industries = splitCsv(jobseeker?.industries)
  const preferredJobTypes = splitCsv(jobseeker?.preferred_job_types)
  const certifications = splitCsv(jobseeker?.certifications)

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
        <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500">Only employees can view jobseeker profiles.</p>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Profile unavailable</h2>
          <p className="text-gray-500">{error || 'User profile not found.'}</p>
        </div>
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/referrals">Back to Referrals</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{fullName}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-2">
            {jobseeker?.current_job_title && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {jobseeker?.current_job_title}
              </span>
            )}
            {jobseeker?.current_company && (
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {jobseeker?.current_company}
              </span>
            )}
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </span>
            )}
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/referrals">Back to Referrals</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {profile.bio && (
            <Card>
              <CardContent className="p-6 space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">About</h2>
                <p className="text-sm text-gray-700">{profile.bio}</p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {linkedinUrl && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-gray-400" />
                    <a className="text-blue-600 hover:underline" href={linkedinUrl} target="_blank" rel="noreferrer">
                      LinkedIn
                    </a>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a className="text-blue-600 hover:underline" href={profile.website} target="_blank" rel="noreferrer">
                      Portfolio
                    </a>
                  </div>
                )}
                {jobseeker?.portfolio_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a className="text-blue-600 hover:underline" href={jobseeker?.portfolio_url} target="_blank" rel="noreferrer">
                      Portfolio
                    </a>
                  </div>
                )}
                {jobseeker?.github_url && (
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4 text-gray-400" />
                    <a className="text-blue-600 hover:underline" href={jobseeker?.github_url} target="_blank" rel="noreferrer">
                      GitHub
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Profile Highlights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>
                    {jobseeker?.years_experience !== undefined && jobseeker?.years_experience !== null
                      ? `${jobseeker?.years_experience} years experience`
                      : 'Experience not specified'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gray-400" />
                  <span>Trust score: {jobseeker?.trust_score ?? 0}</span>
                </div>
                {jobseeker?.availability && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Availability: {jobseeker?.availability}</span>
                  </div>
                )}
                {jobseeker?.work_authorization && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span>Work authorization: {jobseeker?.work_authorization}</span>
                  </div>
                )}
                {jobseeker?.willing_to_relocate !== undefined && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{jobseeker?.willing_to_relocate ? 'Open to relocate' : 'Not open to relocate'}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(skills.length > 0 || industries.length > 0 || preferredJobTypes.length > 0) && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Skills & Preferences</h2>
                {skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {industries.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Industries</p>
                    <div className="flex flex-wrap gap-2">
                      {industries.map((industry) => (
                        <Badge key={industry} variant="secondary">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preferredJobTypes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Preferred Job Types</p>
                    <div className="flex flex-wrap gap-2">
                      {preferredJobTypes.map((type) => (
                        <Badge key={type} variant="secondary">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(jobseeker?.education || certifications.length > 0) && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Education & Certifications</h2>
                {jobseeker?.education && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Education</p>
                    <p className="text-sm text-gray-600">{jobseeker?.education}</p>
                  </div>
                )}
                {certifications.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {certifications.map((certification) => (
                        <Badge key={certification} variant="secondary">
                          {certification}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Compensation</h2>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Expected salary</span>
                  <span>
                    {jobseeker?.salary_expectation_min && jobseeker?.salary_expectation_max
                      ? `${jobseeker?.salary_expectation_min} - ${jobseeker?.salary_expectation_max} ${jobseeker?.salary_currency || ''}`
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Notice period</span>
                  <span>
                    {jobseeker?.notice_period !== undefined && jobseeker?.notice_period !== null
                      ? `${jobseeker?.notice_period} days`
                      : 'Not specified'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Resume</h2>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FileText className="w-4 h-4 text-gray-400" />
                <span>{resumeFilename || 'No resume uploaded'}</span>
              </div>
              {derivedResumeUrl && resumeFilename && (
                <Button variant="outline" size="sm" onClick={() => setShowResume(true)}>
                  View Resume
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ResumeViewer
        isOpen={showResume}
        onClose={() => setShowResume(false)}
        resumeUrl={derivedResumeUrl}
        resumeFilename={resumeFilename}
      />
    </div>
  )
}
