import { api } from '../lib/api'

export interface JobApplication {
  id: number
  job_id: number
  job_title: string
  company: string
  status: 'applied' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'rejected' | 'accepted'
  applied_at: string
  updated_at: string
  notes?: string
  interview_date?: string
  referral_id?: number
}

export interface CreateJobApplicationData {
  job_id: number
  notes?: string
  referral_id?: number
}

export interface UpdateJobApplicationData {
  status?: string
  notes?: string
  interview_date?: string
}

export class JobApplicationService {
  static async createApplication(data: CreateJobApplicationData) {
    try {
      const response = await api.post('/job-applications/', data)
      return response.data
    } catch (error) {
      console.error('Failed to create job application:', error)
      throw error
    }
  }

  static async getMyApplications(params?: { page?: number; per_page?: number; status?: string }) {
    try {
      const response = await api.get('/job-applications/my-applications', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch job applications:', error)
      throw error
    }
  }

  static async updateApplication(id: number, data: UpdateJobApplicationData) {
    try {
      const response = await api.put(`/job-applications/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Failed to update job application:', error)
      throw error
    }
  }

  static async deleteApplication(id: number) {
    try {
      const response = await api.delete(`/job-applications/${id}`)
      return response.data
    } catch (error) {
      console.error('Failed to delete job application:', error)
      throw error
    }
  }

  static getStatusColor(status: string) {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-800'
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'interview_scheduled':
        return 'bg-purple-100 text-purple-800'
      case 'interviewed':
        return 'bg-indigo-100 text-indigo-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  static getStatusLabel(status: string) {
    switch (status) {
      case 'applied':
        return 'Applied'
      case 'under_review':
        return 'Under Review'
      case 'interview_scheduled':
        return 'Interview Scheduled'
      case 'interviewed':
        return 'Interviewed'
      case 'accepted':
        return 'Accepted'
      case 'rejected':
        return 'Rejected'
      default:
        return status
    }
  }
}
