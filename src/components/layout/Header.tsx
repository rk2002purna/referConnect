import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { NotificationBell } from '../NotificationBell'
import { 
  User, 
  LogOut, 
  Bell,
  Search, 
  Briefcase, 
  Users, 
  BarChart3,
  Shield,
  Settings,
  ChevronDown,
  Plus
} from 'lucide-react'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getNavigationItems = () => {
    if (!user) return []

    const baseItems = [
      { name: 'Search Jobs', href: '/search', icon: Search },
    ]

    if (user.role === 'employee') {
      return [
        { name: 'Post Job', href: '/post-job', icon: Plus },
        { name: 'My Jobs', href: '/my-jobs', icon: Briefcase },
        { name: 'My Referrals', href: '/referrals', icon: Users },
      ]
    }

    if (user.role === 'jobseeker') {
      return [
        ...baseItems,
        { name: 'My Applications', href: '/applications', icon: Briefcase },
        { name: 'My Referrals', href: '/referrals', icon: Users },
        { name: 'Notifications', href: '/notifications', icon: Bell },
      ]
    }

    if (user.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Trust & Safety', href: '/admin/trust', icon: Shield },
      ]
    }

    return baseItems
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ReferConnect</span>
            </Link>
          </div>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex space-x-8">
              {getNavigationItems().map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <NotificationBell />

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : user.email}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user.role}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <Link
                        to={user.role === 'employee' ? '/employee-profile' : '/profile'}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        Profile & Settings
                      </Link>
                      <Link
                        to={user.role === 'employee' ? '/employee-profile' : '/profile'}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Data & Privacy
                      </Link>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          handleLogout()
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
