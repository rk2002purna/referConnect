import { notificationAPI } from '../lib/api'

export interface JobMatchingNotification {
  jobId: number
  jobTitle: string
  company: string
  matchScore: number
  matchingSkills: string[]
  userId: number
}

export class NotificationService {
  static async sendJobMatchingNotification(notification: JobMatchingNotification) {
    try {
      const response = await notificationAPI.create({
        recipient_id: notification.userId,
        title: `New Job Match: ${notification.jobTitle}`,
        message: `We found a job at ${notification.company} that matches your skills! Match score: ${Math.round(notification.matchScore * 100)}%`,
        notification_type: 'job_posted',
        priority: notification.matchScore > 0.8 ? 'high' : 'medium',
        channels: ['in_app', 'email'],
        metadata: {
          job_id: notification.jobId,
          job_title: notification.jobTitle,
          company: notification.company,
          match_score: notification.matchScore,
          matching_skills: notification.matchingSkills
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to send job matching notification:', error)
      throw error
    }
  }

  static async sendReferralNotification(
    recipientId: number,
    senderId: number,
    jobTitle: string,
    referralId: number
  ) {
    try {
      const response = await notificationAPI.create({
        recipient_id: recipientId,
        sender_id: senderId,
        title: 'New Referral Received',
        message: `You have been referred for the position: ${jobTitle}`,
        notification_type: 'referral_received',
        priority: 'medium',
        channels: ['in_app', 'email'],
        metadata: {
          referral_id: referralId,
          job_title: jobTitle
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to send referral notification:', error)
      throw error
    }
  }

  static async sendReferralStatusUpdate(
    recipientId: number,
    senderId: number,
    jobTitle: string,
    status: string,
    referralId: number
  ) {
    try {
      const statusMessages = {
        'submitted': 'Your referral has been submitted for review',
        'under_review': 'Your referral is under review',
        'interview_scheduled': 'Interview has been scheduled for your referral',
        'hired': 'Congratulations! Your referral has been hired',
        'rejected': 'Your referral was not selected for this position'
      }
      
      const message = statusMessages[status as keyof typeof statusMessages] || 
                    `Your referral status has been updated to: ${status}`
      
      const response = await notificationAPI.create({
        recipient_id: recipientId,
        sender_id: senderId,
        title: 'Referral Status Update',
        message: `${message} for position: ${jobTitle}`,
        notification_type: 'referral_status_update',
        priority: 'medium',
        channels: ['in_app', 'email'],
        metadata: {
          referral_id: referralId,
          job_title: jobTitle,
          status: status
        }
      })
      
      return response.data
    } catch (error) {
      console.error('Failed to send referral status update:', error)
      throw error
    }
  }
}
