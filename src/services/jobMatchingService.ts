import { jobPostAPI } from '../lib/api'
import { NotificationService, JobMatchingNotification } from './notificationService'

export interface JobSeekerProfile {
  id: number
  skills: string[]
  experience_level: string
  preferred_job_types: string[]
  location: string
  salary_expectation_min?: number
  salary_expectation_max?: number
  industries: string[]
  willing_to_relocate: boolean
}

export interface JobPost {
  id: number
  title: string
  company: string
  location: string
  job_type: string
  skills_required: string[]
  experience_level: string
  salary_min?: number
  salary_max?: number
  description: string
  is_active: boolean
  created_at: string
}

export interface JobMatch {
  job: JobPost
  matchScore: number
  matchingSkills: string[]
  reasons: string[]
}

export class JobMatchingService {
  static calculateMatchScore(jobSeeker: JobSeekerProfile, job: JobPost): JobMatch {
    let score = 0
    const reasons: string[] = []
    const matchingSkills: string[] = []

    // Skills matching (40% weight)
    const skillMatches = this.calculateSkillMatch(jobSeeker.skills, job.skills_required)
    score += skillMatches.score * 0.4
    matchingSkills.push(...skillMatches.matchingSkills)
    if (skillMatches.score > 0.5) {
      reasons.push(`Strong skill match (${Math.round(skillMatches.score * 100)}%)`)
    }

    // Experience level matching (20% weight)
    const experienceMatch = this.calculateExperienceMatch(jobSeeker.experience_level, job.experience_level)
    score += experienceMatch * 0.2
    if (experienceMatch > 0.7) {
      reasons.push('Experience level matches well')
    }

    // Job type preference (15% weight)
    const jobTypeMatch = this.calculateJobTypeMatch(jobSeeker.preferred_job_types, job.job_type)
    score += jobTypeMatch * 0.15
    if (jobTypeMatch > 0.7) {
      reasons.push('Job type matches your preferences')
    }

    // Location matching (15% weight)
    const locationMatch = this.calculateLocationMatch(jobSeeker.location, job.location, jobSeeker.willing_to_relocate)
    score += locationMatch * 0.15
    if (locationMatch > 0.7) {
      reasons.push('Location is a good match')
    }

    // Salary expectations (10% weight)
    const salaryMatch = this.calculateSalaryMatch(
      jobSeeker.salary_expectation_min,
      jobSeeker.salary_expectation_max,
      job.salary_min,
      job.salary_max
    )
    score += salaryMatch * 0.1
    if (salaryMatch > 0.7) {
      reasons.push('Salary range aligns with expectations')
    }

    return {
      job,
      matchScore: Math.min(score, 1), // Cap at 1.0
      matchingSkills,
      reasons
    }
  }

  static calculateSkillMatch(jobSeekerSkills: string[], jobSkills: string[]): { score: number; matchingSkills: string[] } {
    if (jobSkills.length === 0) return { score: 0, matchingSkills: [] }
    
    const normalizedJobSeekerSkills = jobSeekerSkills.map(s => s.toLowerCase().trim())
    const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim())
    
    const matchingSkills = normalizedJobSkills.filter(skill => 
      normalizedJobSeekerSkills.some(seekerSkill => 
        seekerSkill.includes(skill) || skill.includes(seekerSkill)
      )
    )
    
    const score = matchingSkills.length / jobSkills.length
    return { score, matchingSkills }
  }

  static calculateExperienceMatch(jobSeekerLevel: string, jobLevel: string): number {
    const levels = ['entry', 'mid', 'senior', 'executive']
    const seekerIndex = levels.indexOf(jobSeekerLevel.toLowerCase())
    const jobIndex = levels.indexOf(jobLevel.toLowerCase())
    
    if (seekerIndex === -1 || jobIndex === -1) return 0.5 // Default if unknown
    
    // Perfect match
    if (seekerIndex === jobIndex) return 1.0
    
    // Job seeker has more experience than required (good)
    if (seekerIndex > jobIndex) return 0.8
    
    // Job seeker has less experience (partial match)
    const diff = jobIndex - seekerIndex
    return Math.max(0.3, 1.0 - (diff * 0.3))
  }

  static calculateJobTypeMatch(preferredTypes: string[], jobType: string): number {
    if (preferredTypes.length === 0) return 0.5 // Neutral if no preference
    
    const normalizedPreferred = preferredTypes.map(t => t.toLowerCase().trim())
    const normalizedJobType = jobType.toLowerCase().trim()
    
    return normalizedPreferred.includes(normalizedJobType) ? 1.0 : 0.2
  }

  static calculateLocationMatch(
    jobSeekerLocation: string, 
    jobLocation: string, 
    willingToRelocate: boolean
  ): number {
    const normalizedSeekerLocation = jobSeekerLocation.toLowerCase().trim()
    const normalizedJobLocation = jobLocation.toLowerCase().trim()
    
    // Exact match
    if (normalizedSeekerLocation === normalizedJobLocation) return 1.0
    
    // Remote work
    if (normalizedJobLocation.includes('remote')) return 0.9
    
    // Same city/region (simplified)
    if (normalizedSeekerLocation.includes(normalizedJobLocation) || 
        normalizedJobLocation.includes(normalizedSeekerLocation)) {
      return 0.8
    }
    
    // Willing to relocate
    if (willingToRelocate) return 0.6
    
    return 0.2
  }

  static calculateSalaryMatch(
    seekerMin?: number,
    seekerMax?: number,
    jobMin?: number,
    jobMax?: number
  ): number {
    if (!seekerMin || !jobMin) return 0.5 // Neutral if no data
    
    // Job salary range overlaps with seeker expectations
    if (seekerMax && jobMax) {
      const overlap = Math.min(seekerMax, jobMax) - Math.max(seekerMin, jobMin)
      if (overlap > 0) return 1.0
    }
    
    // Job minimum meets seeker minimum
    if (jobMin >= seekerMin) return 0.8
    
    // Job minimum is close to seeker minimum (within 20%)
    if (jobMin >= seekerMin * 0.8) return 0.6
    
    return 0.3
  }

  static async findMatchingJobs(jobSeeker: JobSeekerProfile, minMatchScore: number = 0.6): Promise<JobMatch[]> {
    try {
      // Fetch recent job posts
      const response = await jobPostAPI.getJobPosts({
        page: 1,
        per_page: 100,
        job_type: undefined,
        location: undefined,
        experience_level: undefined
      })
      
      const data = response.data as any
      const jobs = data.jobs as JobPost[]
      
      // Calculate matches
      const matches = jobs
        .map(job => this.calculateMatchScore(jobSeeker, job))
        .filter(match => match.matchScore >= minMatchScore)
        .sort((a, b) => b.matchScore - a.matchScore)
      
      return matches
    } catch (error) {
      console.error('Failed to find matching jobs:', error)
      return []
    }
  }

  static async sendJobMatchingNotifications(jobSeeker: JobSeekerProfile): Promise<void> {
    try {
      const matches = await this.findMatchingJobs(jobSeeker, 0.7) // Only high-quality matches
      
      // Send notifications for top 3 matches
      const topMatches = matches.slice(0, 3)
      
      for (const match of topMatches) {
        const notification: JobMatchingNotification = {
          jobId: match.job.id,
          jobTitle: match.job.title,
          company: match.job.company,
          matchScore: match.matchScore,
          matchingSkills: match.matchingSkills,
          userId: jobSeeker.id
        }
        
        await NotificationService.sendJobMatchingNotification(notification)
      }
    } catch (error) {
      console.error('Failed to send job matching notifications:', error)
    }
  }
}
