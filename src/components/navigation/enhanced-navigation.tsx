'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Users, 
  Video, 
  Calendar, 
  Settings, 
  LogOut, 
  Bell, 
  Menu, 
  X,
  Film,
  Archive,
  Clock,
  User,
  Shield,
  MessageSquare,
  ChevronDown,
  Search
} from 'lucide-react'
import { User as UserType, Notification } from '@/types/enhanced-types'
import { getCurrentUser, logoutUser } from '@/lib/auth-enhanced'

interface NavigationProps {
  user: UserType | null
  notifications: Notification[]
  onLogout?: () => void
}

export default function EnhancedNavigation({ user, notifications, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = async () => {
    await logoutUser()
    onLogout?.()
    router.push('/login')
  }

  const mainNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      current: pathname === '/dashboard'
    },
    {
      name: 'Rooms',
      href: '/rooms',
      icon: Users,
      current: pathname.startsWith('/rooms'),
      subItems: [
        { name: 'Active Rooms', href: '/rooms/active' },
        { name: 'Scheduled Rooms', href: '/rooms/scheduled' },
        { name: 'Shared Rooms', href: '/rooms/shared' },
        { name: 'Finished Rooms', href: '/rooms/finished' },
        { name: 'Missed Rooms', href: '/rooms/missed' },
        { name: 'Archived Rooms', href: '/rooms/archived' }
      ]
    },
    {
      name: 'Videos',
      href: '/videos',
      icon: Video,
      current: pathname.startsWith('/videos'),
      subItems: [
        { name: 'Browse Videos', href: '/videos' },
        { name: 'Request Video', href: '/videos/request' },
        { name: 'My Requests', href: '/videos/requests' }
      ]
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: Calendar,
      current: pathname.startsWith('/calendar')
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      current: pathname.startsWith('/messages')
    }
  ]

  const adminNavigation = [
    {
      name: 'Admin Dashboard',
      href: '/admin',
      icon: Shield,
      current: pathname.startsWith('/admin'),
      subItems: [
        { name: 'Overview', href: '/admin' },
        { name: 'User Management', href: '/admin/users' },
        { name: 'Video Management', href: '/admin/videos' },
        { name: 'Room Management', href: '/admin/rooms' },
        { name: 'Video Requests', href: '/admin/requests' },
        { name: 'System Settings', href: '/admin/settings' }
      ]
    }
  ]

  const navigation = user?.role === 'admin' 
    ? [...adminNavigation, ...mainNavigation]
    : mainNavigation

  const isActive = (href: string) => {
    if (href === pathname) return true
    if (href !== '/dashboard' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Film className="h-8 w-8 text-blue-500" />
                <span className="text-white font-bold text-xl">SyncRoom</span>
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <div key={item.name} className="relative group">
                  <Link
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive(item.href)
                        ? 'border-blue-500 text-gray-100'
                        : 'border-transparent text-gray-300 hover:border-gray-600 hover:text-gray-100'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                    {item.subItems && (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </Link>
                  
                  {/* Dropdown for sub-items */}
                  {item.subItems && (
                    <div className="absolute left-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`block px-4 py-2 text-sm ${
                              pathname === subItem.href
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search rooms, videos..."
                  className="w-64 px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-gray-300 hover:text-white"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                  <div className="p-4 border-b border-gray-700">
                    <h3 className="text-white font-medium">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-700 ${
                            !notification.read ? 'bg-gray-700' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">{notification.title}</p>
                              <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {new Date(notification.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-sm">
                        No notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile menu */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white"
              >
                <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <User className="inline h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Settings className="inline h-4 w-4 mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <LogOut className="inline h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-300 hover:text-white"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-gray-900 border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-gray-800 text-white border-l-4 border-blue-500'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon className="inline h-5 w-5 mr-3" />
                  {item.name}
                </Link>
                
                {/* Mobile sub-items */}
                {item.subItems && isActive(item.href) && (
                  <div className="pl-8 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`block px-3 py-2 rounded-md text-sm ${
                          pathname === subItem.href
                            ? 'bg-gray-800 text-white border-l-2 border-blue-500'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
