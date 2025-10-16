import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { Progress } from './ui/Progress'
import { useProfileCompletion } from '../contexts/ProfileCompletionContext'
import { AlertCircle, ArrowRight } from 'lucide-react'

export function ProfileCompletionBanner() {
  const { completionStatus, loading } = useProfileCompletion()

  if (loading || !completionStatus || completionStatus.is_complete) {
    return null
  }

  const completionPercentage = Math.round(completionStatus.overall_completion)
  const missingFields = completionStatus.missing_fields

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-orange-800">
                  Complete your profile for better matches!
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Your profile is {completionPercentage}% complete. Add more details to get personalized job recommendations.
                </p>
              </div>
              <Link to="/onboarding">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Complete Profile
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-orange-700 mb-1">
                <span>Profile completion</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            {missingFields.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-orange-700 mb-2">Missing information:</p>
                <div className="flex flex-wrap gap-1">
                  {missingFields.slice(0, 5).map((field, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                    >
                      {field}
                    </span>
                  ))}
                  {missingFields.length > 5 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      +{missingFields.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
