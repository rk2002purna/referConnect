import React, { useState } from 'react'
import { authAPI } from '../lib/api'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'

const TokenDebug = () => {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const checkTokens = () => {
    const accessToken = localStorage.getItem('access_token')
    const refreshToken = localStorage.getItem('refresh_token')
    
    setStatus(`
Access Token: ${accessToken ? 'Exists' : 'Missing'}
Refresh Token: ${refreshToken ? 'Exists' : 'Missing'}
Access Token Length: ${accessToken?.length || 0}
Refresh Token Length: ${refreshToken?.length || 0}
    `)
  }

  const refreshToken = async () => {
    try {
      setLoading(true)
      setStatus('Refreshing token...')
      
      const result = await authAPI.refreshToken()
      setStatus(`Token refresh successful!
New Access Token Length: ${result.access_token.length}
New Refresh Token Length: ${result.refresh_token.length}
      `)
    } catch (error: any) {
      setStatus(`Token refresh failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearTokens = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setStatus('Tokens cleared from localStorage')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Token Debug Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-x-2">
              <Button onClick={checkTokens}>Check Tokens</Button>
              <Button onClick={refreshToken} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh Token'}
              </Button>
              <Button onClick={clearTokens} variant="outline">Clear Tokens</Button>
            </div>
            
            {status && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{status}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TokenDebug




