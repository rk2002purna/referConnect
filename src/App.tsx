import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProfileCompletionProvider, useProfileCompletion } from './contexts/ProfileCompletionContext'
import { Layout } from './components/layout/Layout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Onboarding } from './pages/Onboarding'
import { JobSearch } from './pages/JobSearch'
import { MyApplications } from './pages/MyApplications'
import { MyReferrals } from './pages/MyReferrals'
import { Profile } from './pages/Profile'
import { EmployeeProfile } from './pages/EmployeeProfile'
import PostJob from './pages/PostJob'
import { Notifications } from './pages/Notifications'
import { Debug } from './pages/Debug'
import TokenDebug from './pages/TokenDebug'
import { ErrorBoundary } from './components/ErrorBoundary'

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { loading: completionLoading, isOnboardingComplete } = useProfileCompletion()

  if (loading || completionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Allow access to profile page, debug page, and post-job page even if onboarding is incomplete
  const currentPath = window.location.pathname
  
  // Use server-side completion status only - no localStorage fallback
  console.log('ProtectedRoute - isOnboardingComplete:', isOnboardingComplete, 'currentPath:', currentPath)
  
  // Always redirect to onboarding if not complete, except for specific allowed pages
  const allowedPaths = ['/profile', '/onboarding', '/debug']
  if (!isOnboardingComplete && !allowedPaths.includes(currentPath)) {
    console.log('Redirecting to onboarding - completion status:', isOnboardingComplete)
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

// Public Route component (redirect to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { loading: completionLoading, isOnboardingComplete } = useProfileCompletion()

  if (loading || completionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    // Use server-side completion status only - no localStorage fallback
    console.log('PublicRoute - isOnboardingComplete:', isOnboardingComplete, 'user role:', user.role)
    
    if (isOnboardingComplete) {
      // Redirect based on user role
      const redirectPath = user.role === 'jobseeker' ? '/search' : '/post-job'
      console.log('Redirecting to:', redirectPath)
      return <Navigate to={redirectPath} replace />
    }
    
    // If onboarding is not completed, redirect to onboarding
    console.log('Redirecting to onboarding because completion is false')
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProfileCompletionProvider>
          <Router>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <ErrorBoundary>
                    <Login />
                  </ErrorBoundary>
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <ErrorBoundary>
                    <Register />
                  </ErrorBoundary>
                </PublicRoute>
              } 
            />

                {/* Protected routes */}
                <Route 
                  path="/onboarding" 
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/search" 
                  element={
                    <ProtectedRoute>
                      <Layout><JobSearch /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/applications" 
                  element={
                    <ProtectedRoute>
                      <Layout><MyApplications /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/referrals" 
                  element={
                    <ProtectedRoute>
                      <Layout><MyReferrals /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <ProtectedRoute>
                      <Layout><Notifications /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Layout><Profile /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/employee-profile" 
                  element={
                    <ProtectedRoute>
                      <Layout><EmployeeProfile /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/post-job" 
                  element={
                    <ProtectedRoute>
                      <Layout><PostJob /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/debug" 
                  element={
                    <ProtectedRoute>
                      <Layout><Debug /></Layout>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/token-debug" 
                  element={
                    <ProtectedRoute>
                      <TokenDebug />
                    </ProtectedRoute>
                  } 
                />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ProfileCompletionProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
