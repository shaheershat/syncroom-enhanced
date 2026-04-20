'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Video, 
  MessageSquare, 
  Settings, 
  Lock, 
  Eye, 
  Send,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Maximize,
  ChevronLeft,
  UserPlus,
  MoreVertical
} from 'lucide-react'
import { Room, User, RoomMember, Message, RoomState } from '@/types/enhanced-types'
import { getCurrentUser, supabase } from '@/lib/supabase'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<RoomMember[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        setUser(currentUser as User)

        // Fetch room details
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select(`
            *,
            video:videos(*),
            creator:users(id, name, username, avatar_url)
          `)
          .eq('id', roomId)
          .single()

        if (roomError) throw roomError
        if (!roomData) {
          setError('Room not found')
          return
        }

        setRoom(roomData)

        // Fetch room members
        const { data: membersData, error: membersError } = await supabase
          .from('room_members')
          .select(`
            *,
            user:users(id, name, username, avatar_url, is_online)
          `)
          .eq('room_id', roomId)
          .eq('status', 'active')

        if (membersError) throw membersError
        setMembers(membersData || [])

        // Fetch room messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            user:users(id, name, username, avatar_url)
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })

        if (messagesError) throw messagesError
        setMessages(messagesData || [])

        // Fetch room state
        const { data: stateData, error: stateError } = await supabase
          .from('room_state')
          .select('*')
          .eq('room_id', roomId)
          .single()

        if (stateError && stateError.code !== 'PGRST116') {
          throw stateError
        }

        if (stateData) {
          setRoomState(stateData)
          setIsPlaying(stateData.playing)
          setCurrentTime(Number(stateData.video_time))
        }

        // Set up real-time subscriptions
        const roomSubscription = supabase
          .channel(`room-${roomId}`)
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'room_state', filter: `room_id=eq.${roomId}` },
            (payload) => {
              if (payload.new) {
                const newState = payload.new as RoomState
                setRoomState(newState)
                setIsPlaying(newState.playing)
                setCurrentTime(Number(newState.video_time))
              }
            }
          )
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setMessages(prev => [payload.new as Message, ...prev])
              }
            }
          )
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                setMembers(prev => {
                  const updated = prev.filter(m => m.user_id !== payload.new.user_id)
                  return [...updated, payload.new as RoomMember]
                })
              } else if (payload.eventType === 'DELETE') {
                setMembers(prev => prev.filter(m => m.user_id !== payload.old.user_id))
              }
            }
          )
          .subscribe()

        return () => {
          roomSubscription.unsubscribe()
        }
      } catch (error) {
        console.error('Error loading room:', error)
        setError('Failed to load room')
      } finally {
        setLoading(false)
      }
    }

    loadRoomData()
  }, [roomId, router])

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message: newMessage.trim()
        })

      if (error) throw error
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const updateRoomState = async (updates: Partial<RoomState>) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('room_state')
        .upsert({
          room_id: roomId,
          ...updates,
          updated_by: user.id
        })

      if (error) throw error
    } catch (error) {
      console.error('Error updating room state:', error)
    }
  }

  const handlePlayPause = () => {
    const newPlayingState = !isPlaying
    setIsPlaying(newPlayingState)
    updateRoomState({ playing: newPlayingState })
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
    updateRoomState({ video_time: time })
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const onlineMembers = members.filter(m => m.user?.is_online)
  const isCreator = room?.created_by === user?.id
  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Room Not Found</h2>
          <p className="text-gray-400 mb-4">{error || 'This room does not exist or you don\'t have access to it.'}</p>
          <Link href="/rooms" className="text-blue-400 hover:text-blue-300">
            Back to Rooms
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/rooms" className="text-gray-400 hover:text-white">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-white">{room.name}</h1>
                <p className="text-sm text-gray-400">{room.video?.title}</p>
              </div>
              {room.is_locked && (
                <Lock className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Users className="h-4 w-4" />
                <span>{onlineMembers.length} online</span>
              </div>
              {(isCreator || isAdmin) && (
                <button className="p-2 text-gray-400 hover:text-white">
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Main Content */}
        <div className={`flex-1 ${isChatOpen ? 'mr-80' : ''} transition-all duration-300`}>
          {/* Video Player */}
          <div className="relative bg-black aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Video player would be here</p>
                <p className="text-gray-500 text-sm mt-2">Mega.nz integration coming soon</p>
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </button>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded">
                  <SkipBack className="h-5 w-5" />
                </button>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded">
                  <SkipForward className="h-5 w-5" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm">{formatTime(currentTime)}</span>
                    <div className="flex-1 h-1 bg-gray-600 rounded-full">
                      <div 
                        className="h-1 bg-blue-500 rounded-full"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-white text-sm">{formatTime(duration)}</span>
                  </div>
                </div>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded">
                  <Volume2 className="h-5 w-5" />
                </button>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded">
                  <Maximize className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Room Members */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Room Members</h2>
              <span className="text-sm text-gray-400">{members.length} total, {onlineMembers.length} online</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div key={member.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                        {member.user?.avatar_url ? (
                          <img
                            src={member.user.avatar_url}
                            alt={member.user.name}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <span className="text-sm text-gray-400">
                            {member.user?.name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-gray-800 ${
                        member.user?.is_online ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{member.user?.name}</p>
                      <p className="text-gray-400 text-sm">@{member.user?.username}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {member.role === 'creator' && (
                        <span className="px-2 py-1 text-xs bg-blue-500 bg-opacity-20 text-blue-400 rounded">
                          Creator
                        </span>
                      )}
                      {member.role === 'admin' && (
                        <span className="px-2 py-1 text-xs bg-purple-500 bg-opacity-20 text-purple-400 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className={`fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 bg-gray-800 border-l border-gray-700 transition-transform duration-300 ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                <h3 className="text-white font-medium">Chat</h3>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3">
                  <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    {message.user?.avatar_url ? (
                      <img
                        src={message.user.avatar_url}
                        alt={message.user.name}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">
                        {message.user?.name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-medium text-sm">{message.user?.name}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Toggle Button */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="fixed right-4 bottom-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}
