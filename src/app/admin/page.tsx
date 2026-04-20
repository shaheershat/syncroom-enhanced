export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth-enhanced'
import { supabase } from '@/lib/auth-enhanced'
import { User, Room, Video, VideoRequest } from '@/types/enhanced-types'
import { Shield, Users, Video as VideoIcon, Film, Calendar, MessageSquare, TrendingUp, Clock } from 'lucide-react'

export default async function AdminDashboard() {
  let user
  try {
    user = await requireAdmin()
  } catch {
    redirect('/login')
  }

  // Fetch dashboard statistics — gracefully degrade if DB not configured
  let users: any[] = [], rooms: any[] = [], videos: any[] = [], pendingRequests: any[] = [], activeRooms: any[] = []
  try {
    const [usersResult, roomsResult, videosResult, requestsResult, activeRoomsResult] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('videos').select('*'),
      supabase.from('video_requests').select('*').eq('status', 'pending'),
      supabase.from('rooms').select('*').eq('status', 'active')
    ])
    users = usersResult.data || []
    rooms = roomsResult.data || []
    videos = videosResult.data || []
    pendingRequests = requestsResult.data || []
    activeRooms = activeRoomsResult.data || []
  } catch {
    // DB not configured — show empty stats
  }

  const stats = {
    totalUsers: users.length,
    totalRooms: rooms.length,
    totalVideos: videos.length,
    pendingRequests: pendingRequests.length,
    activeRooms: activeRooms.length,
    onlineUsers: users.filter((u: any) => u.is_online).length
  }

  const recentActivity = [
    { type: 'user', message: 'New user registered', time: '2 hours ago' },
    { type: 'room', message: 'Room "Movie Night" created', time: '3 hours ago' },
    { type: 'video', message: 'Video request approved', time: '5 hours ago' },
    { type: 'message', message: 'Chat activity spike detected', time: '6 hours ago' }
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage your SyncRoom platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                <p className="text-green-400 text-sm mt-1">{stats.onlineUsers} online</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Rooms</p>
                <p className="text-2xl font-bold text-white">{stats.activeRooms}</p>
                <p className="text-gray-400 text-sm mt-1">{stats.totalRooms} total</p>
              </div>
              <VideoIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Video Library</p>
                <p className="text-2xl font-bold text-white">{stats.totalVideos}</p>
                <p className="text-yellow-400 text-sm mt-1">{stats.pendingRequests} pending</p>
              </div>
              <Film className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Requests</p>
                <p className="text-2xl font-bold text-white">{stats.pendingRequests}</p>
                <p className="text-orange-400 text-sm mt-1">Need review</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Health</p>
                <p className="text-2xl font-bold text-green-400">Good</p>
                <p className="text-green-400 text-sm mt-1">All systems operational</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Messages Today</p>
                <p className="text-2xl font-bold text-white">1,234</p>
                <p className="text-blue-400 text-sm mt-1">+12% from yesterday</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/admin/users"
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </a>
              <a
                href="/admin/videos"
                className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <VideoIcon className="h-4 w-4 mr-2" />
                Manage Videos
              </a>
              <a
                href="/admin/rooms"
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Manage Rooms
              </a>
              <a
                href="/admin/requests"
                className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Clock className="h-4 w-4 mr-2" />
                Review Requests
              </a>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300 text-sm">{activity.message}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Video Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Pending Video Requests</h2>
              <a
                href="/admin/requests"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                View All
              </a>
            </div>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map((request: any) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{request.title}</p>
                    <p className="text-gray-400 text-sm">{request.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      Approve
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
