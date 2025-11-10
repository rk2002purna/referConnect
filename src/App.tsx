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

  const currentPath = window.location.pathname
  const justVerified = sessionStorage.getItem('just_verified') === 'true'
  
  console.log('ProtectedRoute - isOnboardingComplete:', isOnboardingComplete, 'currentPath:', currentPath, 'justVerified:', justVerified)
  
  // If user is on /onboarding but already completed, redirect them away
  if (currentPath === '/onboarding' && isOnboardingComplete && !justVerified) {
    console.log('User already completed onboarding, redirecting away from /onboarding')
    if (user.role === 'employee') {
      return <Navigate to="/post-job" replace />
    } else if (user.role === 'jobseeker') {
      return <Navigate to="/search" replace />
    }
  }
  
  // Always redirect to onboarding if not complete, except for specific allowed pages OR just verified
  const allowedPaths = ['/profile', '/onboarding', '/debug']
  if (!isOnboardingComplete && !allowedPaths.includes(currentPath) && !justVerified) {
    console.log('Redirecting to onboarding - completion status:', isOnboardingComplete)
    return <Navigate to="/onboarding" replace />
  }
  
  // Clear the just_verified flag after first successful load
  if (justVerified && currentPath === '/post-job') {
    sessionStorage.removeItem('just_verified')
  }

  return <>{children}</>
}

// Public Route component (redirect to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, verificationStatus } = useAuth()
  const { loading: completionLoading, isOnboardingComplete } = useProfileCompletion()

  console.log('=== PublicRoute Debug ===')
  console.log('Auth loading:', loading)
  console.log('Completion loading:', completionLoading)
  console.log('User:', user)
  console.log('User role:', user?.role)
  console.log('Verification Status:', verificationStatus)
  console.log('isOnboardingComplete:', isOnboardingComplete)
  console.log('========================')

  if (loading || completionLoading) {
    console.log('PublicRoute: Still loading, showing spinner')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    console.log('PublicRoute - User logged in')
    
    // CRITICAL FIX: For employees, ONLY check verification status
    if (user.role === 'employee') {
      console.log('Employee check:')
      console.log('  - Verification object:', verificationStatus)
      console.log('  - Verification status:', verificationStatus?.status)
      console.log('  - Company ID:', verificationStatus?.company_id)
      
      // REAL verification should have:
      // 1. status === 'verified'
      // 2. company_id (they selected a company)
      // Without company_id, it's a fake/incomplete verification
      const isVerified = verificationStatus?.status === 'verified' && verificationStatus?.company_id
      
      console.log('  - Is TRULY verified (with company)?', isVerified)
      
      if (isVerified) {
        console.log('  → Employee is TRULY verified (has company), redirecting to /post-job')
        return <Navigate to="/post-job" replace />
      } else {
        console.log('  → Employee NOT truly verified (missing company or not verified), redirecting to /onboarding')
        return <Navigate to="/onboarding" replace />
      }
    }
    
    // For job seekers, use completion status
    if (isOnboardingComplete) {
      const redirectPath = '/search'
      console.log('Job seeker - Onboarding complete, redirecting to:', redirectPath)
      return <Navigate to={redirectPath} replace />
    }
    
    // If onboarding is not completed, redirect to onboarding
    console.log('Job seeker - Onboarding NOT complete, redirecting to /onboarding')
    return <Navigate to="/onboarding" replace />
  }

  console.log('PublicRoute - No user, showing public content')
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
