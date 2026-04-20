// Enhanced types for SyncRoom application

export interface User {
  id: string
  username: string
  access_code?: string
  name: string
  email?: string
  role: 'admin' | 'user'
  avatar_url?: string
  is_online: boolean
  last_active: string
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  theme?: 'dark' | 'light'
  notifications?: boolean
  auto_play?: boolean
  default_volume?: number
  chat_position?: 'left' | 'right'
  show_chat_overlay?: boolean
}

export interface Video {
  id: string
  title: string
  description?: string
  video_url: string
  thumbnail_url?: string
  duration?: number
  file_size?: number
  source_type: 'mega' | 'google_drive' | 'direct' | 'other'
  is_public: boolean
  requested_by?: string
  approved_by?: string
  approved_at?: string
  tags: string[]
  created_at: string
  updated_at: string
}

export interface VideoRequest {
  id: string
  title: string
  description?: string
  source_url?: string
  requested_by: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  name: string
  description?: string
  created_by: string
  video_id: string
  status: 'active' | 'ended' | 'scheduled' | 'archived' | 'missed'
  category: 'shared' | 'private' | 'public'
  is_locked: boolean
  lock_code?: string
  max_participants: number
  scheduled_for?: string
  auto_archive_after?: string
  settings: RoomSettings
  created_at: string
  updated_at: string
  
  // Joined fields
  video?: Video
  creator?: User
  members?: RoomMember[]
  member_count?: number
  online_count?: number
}

export interface RoomSettings {
  allow_chat?: boolean
  allow_video_control?: boolean
  auto_play?: boolean
  require_confirmation?: boolean
  show_participants?: boolean
  enable_queue?: boolean
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  role: 'creator' | 'admin' | 'member'
  joined_at: string
  invited_by?: string
  status: 'active' | 'declined' | 'left'
  
  // Joined fields
  user?: User
}

export interface RoomPresence {
  id: string
  room_id: string
  user_id: string
  online: boolean
  last_seen: string
  created_at: string
  
  // Joined fields
  user?: User
}

export interface RoomState {
  id: string
  room_id: string
  playing: boolean
  video_time: number
  playback_rate: number
  current_video_id?: string
  queue: string[] // Array of video IDs
  updated_by: string
  updated_at: string
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  message: string
  message_type: 'text' | 'system' | 'join' | 'leave'
  reply_to?: string
  edited_at?: string
  created_at: string
  
  // Joined fields
  user?: User
  reply_to_message?: Message
}

export interface Notification {
  id: string
  user_id: string
  type: 'room_invite' | 'room_message' | 'video_request_approved' | 'room_scheduled' | 'room_archived'
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  created_at: string
}

export interface CalendarEvent {
  id: string
  room_id: string
  user_id: string
  title: string
  description?: string
  start_time: string
  end_time?: string
  reminder_minutes: number
  calendar_url?: string
  created_at: string
  
  // Joined fields
  room?: Room
}

export interface RoomCategory {
  id: string
  name: string
  description: string
  status: Room['status'][]
  color: string
}

export const ROOM_CATEGORIES: RoomCategory[] = [
  {
    id: 'active',
    name: 'Active Rooms',
    description: 'Currently active watch rooms',
    status: ['active'],
    color: 'green'
  },
  {
    id: 'scheduled',
    name: 'Scheduled Rooms',
    description: 'Rooms scheduled for future viewing',
    status: ['scheduled'],
    color: 'blue'
  },
  {
    id: 'shared',
    name: 'Shared Rooms',
    description: 'Publicly accessible rooms',
    status: ['active'],
    color: 'purple'
  },
  {
    id: 'finished',
    name: 'Finished Rooms',
    description: 'Completed viewing sessions',
    status: ['ended'],
    color: 'gray'
  },
  {
    id: 'missed',
    name: 'Missed Rooms',
    description: 'Rooms that were missed',
    status: ['missed'],
    color: 'red'
  },
  {
    id: 'archived',
    name: 'Archived Rooms',
    description: 'Archived rooms for reference',
    status: ['archived'],
    color: 'orange'
  }
]

export interface MegaFile {
  id: string
  name: string
  size: number
  type: string
  download_url: string
  thumbnail_url?: string
}

export interface VideoPlayerState {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  buffered: TimeRanges
  loaded: boolean
  error?: string
}

export interface ChatState {
  isOpen: boolean
  messages: Message[]
  unreadCount: number
  overlayVisible: boolean
}

export interface AppState {
  user: User | null
  currentRoom: Room | null
  notifications: Notification[]
  chatState: ChatState
  videoPlayerState: VideoPlayerState
  roomState: RoomState | null
  onlineUsers: User[]
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface LoginForm {
  username: string
  accessCode: string
  rememberMe?: boolean
}

export interface CreateRoomForm {
  name: string
  description?: string
  video_id: string
  category: Room['category']
  is_locked?: boolean
  lock_code?: string
  max_participants?: number
  scheduled_for?: string
  settings: RoomSettings
}

export interface VideoRequestForm {
  title: string
  description?: string
  source_url?: string
}

export interface UpdateProfileForm {
  name: string
  email?: string
  avatar_url?: string
  preferences: UserPreferences
}
