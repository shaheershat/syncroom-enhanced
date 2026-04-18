export interface User {
  id: string;
  email: string;
  name: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  created_at: string;
}

export interface Room {
  id: string;
  created_by: string;
  invited_user_id: string;
  video_id: string;
  status: 'active' | 'ended';
  created_at: string;
  updated_at: string;
}

export interface RoomWithDetails extends Room {
  creator: User;
  invited_user: User;
  video: Video;
}

export interface RoomPresence {
  id: string;
  room_id: string;
  user_id: string;
  online: boolean;
  last_seen: string;
  created_at: string;
}

export interface RoomState {
  id: string;
  room_id: string;
  playing: boolean;
  video_time: number;
  playback_rate: 0.5 | 1.0 | 1.5 | 2.0 | 3.0;
  updated_by: string;
  updated_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export interface MessageWithUser extends Message {
  user: User;
}

export interface VideoPlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  playbackRate: 0.5 | 1.0 | 1.5 | 2.0 | 3.0;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  loading: boolean;
}

export interface SyncAction {
  type: 'play' | 'pause' | 'seek' | 'skip_forward' | 'skip_backward' | 'speed_change';
  payload?: any;
  timestamp: number;
  userId: string;
}

export interface ConfirmationModal {
  isOpen: boolean;
  action: SyncAction | null;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ChatState {
  messages: MessageWithUser[];
  isOpen: boolean;
  overlayMode: boolean;
  typingUsers: string[];
}

export interface RoomStore {
  room: RoomWithDetails | null;
  presence: RoomPresence[];
  state: RoomState | null;
  messages: MessageWithUser[];
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  pollingInterval: NodeJS.Timeout | null;
  setRoom: (room: RoomWithDetails | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadRoom: (roomId: string) => Promise<void>;
  setupRealtime: (roomId: string) => Promise<(() => void) | undefined>;
  updateRoomState: (updates: Partial<RoomState>) => Promise<void>;
  sendMessage: (message: string) => Promise<MessageWithUser>;
  leaveRoom: () => Promise<void>;
  clearError: () => void;
  startMessagePolling: (roomId: string) => void;
  stopMessagePolling: () => void;
}

export interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
}

export interface VideoLibraryStore {
  videos: Video[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedVideo: Video | null;
  setVideos: (videos: Video[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedVideo: (video: Video | null) => void;
}

export type PlaybackRate = 0.5 | 1.0 | 1.5 | 2.0 | 3.0;

export interface MobileOrientation {
  isLandscape: boolean;
  isFullscreen: boolean;
}

export interface RealtimeEvent {
  type: 'presence_update' | 'state_update' | 'new_message' | 'user_joined' | 'user_left';
  payload: any;
  timestamp: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface CreateRoomData {
  invited_user_id: string;
  video_id: string;
}

export interface UpdateRoomStateData {
  playing: boolean;
  current_time: number;
  playback_rate: PlaybackRate;
}
