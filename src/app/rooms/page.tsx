'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Video, 
  Calendar, 
  Clock, 
  Archive, 
  Eye, 
  Lock, 
  Plus,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react'
import { Room, User } from '@/types/enhanced-types'
import { getCurrentUser, supabase } from '@/lib/supabase'

const ROOM_CATEGORIES = [
  { id: 'active', name: 'Active Rooms', description: 'Currently active watch rooms', color: 'green' },
  { id: 'scheduled', name: 'Scheduled Rooms', description: 'Rooms scheduled for future viewing', color: 'blue' },
  { id: 'shared', name: 'Shared Rooms', description: 'Publicly accessible rooms', color: 'purple' },
  { id: 'finished', name: 'Finished Rooms', description: 'Completed viewing sessions', color: 'gray' },
  { id: 'missed', name: 'Missed Rooms', description: 'Rooms that were missed', color: 'red' },
  { id: 'archived', name: 'Archived Rooms', description: 'Archived rooms for reference', color: 'orange' }
]

export default function RoomsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedCategory, setSelectedCategory] = useState('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUserAndRooms = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        setUser(currentUser as User)

        // Fetch rooms based on user role and category
        let query = supabase
          .from('rooms')
          .select(`
            *,
            video:videos(*),
            creator:users(id, name, username, avatar_url),
            room_members!inner(
              user_id,
              role,
              status,
              user:users(id, name, username, avatar_url)
            )
          `)

        // Filter by category
        if (selectedCategory === 'active') {
          query = query.eq('status', 'active')
        } else if (selectedCategory === 'scheduled') {
          query = query.eq('status', 'scheduled')
        } else if (selectedCategory === 'finished') {
          query = query.eq('status', 'ended')
        } else if (selectedCategory === 'missed') {
          query = query.eq('status', 'missed')
        } else if (selectedCategory === 'archived') {
          query = query.eq('status', 'archived')
        } else if (selectedCategory === 'shared') {
          query = query.eq('category', 'public').eq('status', 'active')
        }

        // If not admin, only show rooms user is a member of or public rooms
        if (currentUser.role !== 'admin') {
          query = query.or(`created_by.eq.${currentUser.id},category.eq.public`)
        }

        const { data: roomsData, error } = await query.order('created_at', { ascending: false })

        if (error) throw error

        // Process rooms data
        const processedRooms = roomsData.map((room: any) => ({
          ...room,
          member_count: room.room_members?.length || 0,
          online_count: room.room_members?.filter((m: any) => m.user?.is_online).length || 0
        }))

        setRooms(processedRooms)
      } catch (error) {
        console.error('Error loading rooms:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserAndRooms()
  }, [selectedCategory, router])

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getCategoryColor = (category: string) => {
    const cat = ROOM_CATEGORIES.find(c => c.id === category)
    return cat?.color || 'gray'
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Rooms</h1>
            <p className="text-gray-400">Manage and join watch rooms</p>
          </div>
          <Link
            href="/rooms/create"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Room
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            >
              {ROOM_CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-1 mb-8 overflow-x-auto">
          {ROOM_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-gray-800 text-white border-t-2 border-l-2 border-r-2 border-gray-700'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div key={room.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
              {/* Room Header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{room.name}</h3>
                    {room.description && (
                      <p className="text-gray-400 text-sm mb-2">{room.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {room.is_locked && (
                      <Lock className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full bg-${getCategoryColor(room.status)}-500 bg-opacity-20 text-${getCategoryColor(room.status)}-400`}>
                      {room.status}
                    </span>
                  </div>
                </div>

                {/* Video Info */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-16 bg-gray-700 rounded flex items-center justify-center">
                    <Video className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{room.video?.title}</p>
                    {room.video?.duration && (
                      <p className="text-gray-400 text-xs">
                        {Math.floor(room.video.duration / 60)}m {room.video.duration % 60}s
                      </p>
                    )}
                  </div>
                </div>

                {/* Room Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{room.member_count}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4 text-green-500" />
                      <span>{room.online_count}</span>
                    </div>
                  </div>
                  {room.scheduled_for && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatTime(room.scheduled_for)}</span>
                    </div>
                  )}
                </div>

                {/* Creator Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 bg-gray-700 rounded-full flex items-center justify-center">
                      {room.creator?.avatar_url ? (
                        <img
                          src={room.creator.avatar_url}
                          alt={room.creator.name}
                          className="h-6 w-6 rounded-full"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">
                          {room.creator?.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{room.creator?.name}</span>
                  </div>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    <span>Join</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="h-24 w-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="h-12 w-12 text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No rooms found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery ? 'Try adjusting your search terms' : `No ${selectedCategory} rooms available`}
            </p>
            {!searchQuery && (
              <Link
                href="/rooms/create"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Room
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
