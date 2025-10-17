import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfileCompletion } from '../contexts/ProfileCompletionContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export function Debug() {
  const { user } = useAuth()
  const { completionStatus, refreshCompletionStatus } = useProfileCompletion()

  const handleForceComplete = async () => {
    // Force completion by refreshing the status
    await refreshCompletionStatus()
    alert('Onboarding marked as complete! You can now access all pages.')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Debug Panel</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Completion Status</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(completionStatus, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>LocalStorage Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>onboarding_completed:</strong> {localStorage.getItem('onboarding_completed') || 'null'}</p>
            <p><strong>onboarding_completed_role:</strong> {localStorage.getItem('onboarding_completed_role') || 'null'}</p>
            <p><strong>access_token:</strong> {localStorage.getItem('access_token') ? 'Present' : 'Missing'}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleForceComplete} className="w-full">
            Force Complete Onboarding
          </Button>
          <Button 
            onClick={() => {
              localStorage.setItem('onboarding_completed', 'true')
              localStorage.setItem('onboarding_completed_role', user?.role || '')
              window.location.reload()
            }} 
            className="w-full"
            variant="outline"
          >
            Mark Onboarding Complete in localStorage
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/profile'}
            className="w-full"
          >
            Go to Profile
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/search'}
            className="w-full"
          >
            Go to Job Search
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
