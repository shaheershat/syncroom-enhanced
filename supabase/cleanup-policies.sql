-- Complete Policy Cleanup Script
-- This will remove ALL existing policies from all tables

-- Disable RLS temporarily to drop all policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_presence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events DISABLE ROW LEVEL SECURITY;

-- Drop all policies from all tables
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view public videos" ON public.videos;
DROP POLICY IF EXISTS "Users can view own requested videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Users can request videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update all videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update own requested videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can delete videos" ON public.videos;
DROP POLICY IF EXISTS "Videos are viewable by all authenticated users" ON public.videos;
DROP POLICY IF EXISTS "Users can insert videos" ON public.videos;

DROP POLICY IF EXISTS "Admins can view all video requests" ON public.video_requests;
DROP POLICY IF EXISTS "Users can view own video requests" ON public.video_requests;
DROP POLICY IF EXISTS "Users can create video requests" ON public.video_requests;
DROP POLICY IF EXISTS "Admins can update video requests" ON public.video_requests;
DROP POLICY IF EXISTS "Users can update own video requests" ON public.video_requests;
DROP POLICY IF EXISTS "Admins can delete video requests" ON public.video_requests;

DROP POLICY IF EXISTS "Admins can view all rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can view own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can view rooms they are members of" ON public.rooms;
DROP POLICY IF EXISTS "Users can view public rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room creators can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room admins can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can update all rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room creators can delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "Admins can delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room access for invited users only" ON public.rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;

DROP POLICY IF EXISTS "Admins can view all room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can view room members for their rooms" ON public.room_members;
DROP POLICY IF EXISTS "Room creators can manage members" ON public.room_members;
DROP POLICY IF EXISTS "Room admins can manage members" ON public.room_members;
DROP POLICY IF EXISTS "Admins can manage all room members" ON public.room_members;

DROP POLICY IF EXISTS "Room members can view presence" ON public.room_presence;
DROP POLICY IF EXISTS "Room members can update own presence" ON public.room_presence;
DROP POLICY IF EXISTS "Room members can delete own presence" ON public.room_presence;
DROP POLICY IF EXISTS "Room presence for room members" ON public.room_presence;

DROP POLICY IF EXISTS "Room members can view room state" ON public.room_state;
DROP POLICY IF EXISTS "Room members can update room state" ON public.room_state;
DROP POLICY IF EXISTS "Room state for room members" ON public.room_state;

DROP POLICY IF EXISTS "Room members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON public.messages;
DROP POLICY IF EXISTS "Messages for room members" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can create calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;

-- Re-enable RLS on all tables
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

-- Verify all policies are dropped
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
