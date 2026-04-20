-- Enhanced SyncRoom Database Schema
-- Supports all requested features including admin access, room categories, notifications, etc.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhanced users table with role-based access
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  is_online BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced videos table with request system
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL, -- Mega.nz URLs and other external URLs
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  file_size BIGINT, -- in bytes
  source_type TEXT DEFAULT 'mega' CHECK (source_type IN ('mega', 'google_drive', 'direct', 'other')),
  is_public BOOLEAN DEFAULT false,
  requested_by UUID REFERENCES public.users(id),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video requests table
CREATE TABLE IF NOT EXISTS public.video_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  requested_by UUID REFERENCES public.users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced rooms table with scheduling and categories
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  video_id UUID REFERENCES public.videos(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'scheduled', 'archived', 'missed')),
  category TEXT DEFAULT 'shared' CHECK (category IN ('shared', 'private', 'public')),
  is_locked BOOLEAN DEFAULT false,
  lock_code TEXT,
  max_participants INTEGER DEFAULT 10,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  auto_archive_after TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room members table (supports multiple users)
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'declined', 'left')),
  UNIQUE(room_id, user_id)
);

-- Room presence - track online users
CREATE TABLE IF NOT EXISTS public.room_presence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  online BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Room state - sync video player state
CREATE TABLE IF NOT EXISTS public.room_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL UNIQUE,
  playing BOOLEAN DEFAULT false,
  video_time DECIMAL(10,2) DEFAULT 0.00,
  playback_rate DECIMAL(3,1) DEFAULT 1.0 CHECK (playback_rate IN (0.5, 1.0, 1.5, 2.0, 3.0)),
  current_video_id UUID REFERENCES public.videos(id),
  queue JSONB DEFAULT '[]', -- Array of video IDs for playlist
  updated_by UUID REFERENCES public.users(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'join', 'leave')),
  reply_to UUID REFERENCES public.messages(id),
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('room_invite', 'room_message', 'video_request_approved', 'room_scheduled', 'room_archived')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  reminder_minutes INTEGER DEFAULT 15,
  calendar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (shaheer) - auto-generated ID
INSERT INTO public.users (username, access_code, name, role, email) VALUES
  ('shaheer', 'SHAHEER123', 'Shaheer Admin', 'admin', 'shaheer@syncroom.com')
  ON CONFLICT (username) DO NOTHING;

-- Insert sample videos for testing - auto-generated IDs
INSERT INTO public.videos (title, description, video_url, source_type, is_public, created_at)
VALUES 
  ('Mayanadhi', 'User requested movie', 'https://mega.nz/file/0mggla6b#1hjsZ_ul6gVH-9GeNJ8SoII4ACdoQTmk-FHeYCePdFo', 'mega', true, NOW()),
  ('Big Buck Bunny', 'Open source animated short film', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'direct', true, NOW()),
  ('Elephant Dream', 'Open source animated short film', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'direct', true, NOW()),
  ('Sintel', 'Open source animated short film', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 'direct', true, NOW())
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_videos_requested_by ON public.videos(requested_by);
CREATE INDEX IF NOT EXISTS idx_videos_is_public ON public.videos(is_public);
CREATE INDEX IF NOT EXISTS idx_video_requests_requested_by ON public.video_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_video_requests_status ON public.video_requests(status);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON public.rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_category ON public.rooms(category);
CREATE INDEX IF NOT EXISTS idx_rooms_scheduled_for ON public.rooms(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_role ON public.room_members(role);
CREATE INDEX IF NOT EXISTS idx_room_presence_room ON public.room_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_room_presence_user ON public.room_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_room_presence_online ON public.room_presence(online);
CREATE INDEX IF NOT EXISTS idx_messages_room ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_calendar_events_room ON public.calendar_events(room_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON public.calendar_events(start_time);

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_videos_updated_at ON public.videos;
CREATE TRIGGER handle_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_video_requests_updated_at ON public.video_requests;
CREATE TRIGGER handle_video_requests_updated_at
  BEFORE UPDATE ON public.video_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_rooms_updated_at ON public.rooms;
CREATE TRIGGER handle_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_room_members_updated_at ON public.room_members;
CREATE TRIGGER handle_room_members_updated_at
  BEFORE UPDATE ON public.room_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to update last_seen in room_presence
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_room_presence_updated_at ON public.room_presence;
CREATE TRIGGER handle_room_presence_updated_at
  BEFORE INSERT OR UPDATE ON public.room_presence
  FOR EACH ROW EXECUTE FUNCTION public.update_last_seen();

-- Function to automatically update room status based on schedule
CREATE OR REPLACE FUNCTION public.update_room_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If scheduled time has passed and room is still scheduled, mark as missed
  IF NEW.status = 'scheduled' AND NEW.scheduled_for < NOW() THEN
    NEW.status = 'missed';
  END IF;
  
  -- If auto_archive_after time has passed, archive the room
  IF NEW.auto_archive_after IS NOT NULL AND NEW.auto_archive_after < NOW() AND NEW.status != 'archived' THEN
    NEW.status = 'archived';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_room_status_update ON public.rooms;
CREATE TRIGGER handle_room_status_update
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_room_status();

-- Function to create notification when user is added to room
CREATE OR REPLACE FUNCTION public.create_room_invite_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for new room member
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.user_id,
    'room_invite',
    'Room Invitation',
    'You have been invited to join a room',
    jsonb_build_object('room_id', NEW.room_id, 'invited_by', NEW.invited_by)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_room_member_notification ON public.room_members;
CREATE TRIGGER handle_room_member_notification
  AFTER INSERT ON public.room_members
  FOR EACH ROW EXECUTE FUNCTION public.create_room_invite_notification();

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
