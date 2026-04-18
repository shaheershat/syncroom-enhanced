-- SyncRoom Database Schema
-- Simple username/code authentication system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Simple users table (username + access code)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  access_code TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table - External video hosting
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL, -- Google Drive URLs and other external URLs
  thumbnail_url TEXT, -- URL to thumbnail image (optional)
  duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES public.users(id) NOT NULL,
  invited_user_id UUID REFERENCES public.users(id) NOT NULL,
  video_id UUID REFERENCES public.videos(id) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  video_time DECIMAL(10,2) DEFAULT 0.00, -- in seconds
  playback_rate DECIMAL(3,1) DEFAULT 1.0 CHECK (playback_rate IN (0.5, 1.0, 1.5, 2.0, 3.0)),
  updated_by UUID REFERENCES public.users(id) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO public.users (id, username, access_code, name, role) VALUES
  ('00000000-0000-0000-000000001', 'admin', 'ADMIN123', 'Administrator', 'admin');

-- Insert sample free videos for testing
INSERT INTO public.videos (id, title, video_url, created_at)
        VALUES ('b58f93e9-525c-49c7-8909-c1294d4c2e5a', 'Your Movie', 'https://drive.google.com/uc?export=download&id=1CcV_FBdYeV93dBgcPrqhxRFkHgr2YHNJ', NOW())
        ON CONFLICT (id) DO NOTHING;

INSERT INTO public.videos (id, title, video_url, duration, created_by) VALUES
  ('00000000-0000-0000-000000002', 'Big Buck Bunny', 
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
   596, '00000000-0000-0000-000000001'),
   
  ('00000000-0000-0000-000000003', 'Elephant Dream', 
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 
   653, '00000000-0000-0000-000000001'),
   
  ('00000000-0000-0000-000000004', 'Sintel', 
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 
   888, '00000000-0000-0000-000000001');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON public.rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_invited_user ON public.rooms(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_room_presence_room ON public.room_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_room_presence_user ON public.room_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_room ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at);

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

DROP TRIGGER IF EXISTS handle_rooms_updated_at ON public.rooms;
CREATE TRIGGER handle_rooms_updated_at
  BEFORE UPDATE ON public.rooms
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

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
