-- Enhanced Row Level Security Policies for SyncRoom
-- Supports admin access, user permissions, and new features

-- Drop ALL existing policies to avoid conflicts
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

DROP POLICY IF EXISTS "Admins can view all room members" ON public.room_members;
DROP POLICY IF EXISTS "Users can view room members for their rooms" ON public.room_members;
DROP POLICY IF EXISTS "Room creators can manage members" ON public.room_members;
DROP POLICY IF EXISTS "Room admins can manage members" ON public.room_members;
DROP POLICY IF EXISTS "Admins can manage all room members" ON public.room_members;

DROP POLICY IF EXISTS "Room members can view presence" ON public.room_presence;
DROP POLICY IF EXISTS "Room members can update own presence" ON public.room_presence;
DROP POLICY IF EXISTS "Room members can delete own presence" ON public.room_presence;

DROP POLICY IF EXISTS "Room members can view room state" ON public.room_state;
DROP POLICY IF EXISTS "Room members can update room state" ON public.room_state;

DROP POLICY IF EXISTS "Room members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Room members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete all messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Users can view own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can create calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete own calendar events" ON public.calendar_events;

-- Also drop any old policies that might exist
DROP POLICY IF EXISTS "Videos are viewable by all authenticated users" ON public.videos;
DROP POLICY IF EXISTS "Users can insert videos" ON public.videos;
DROP POLICY IF EXISTS "Room access for invited users only" ON public.rooms;
DROP POLICY IF EXISTS "Users can create rooms" ON public.rooms;
DROP POLICY IF EXISTS "Room presence for room members" ON public.room_presence;
DROP POLICY IF EXISTS "Room state for room members" ON public.room_state;
DROP POLICY IF EXISTS "Messages for room members" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

-- Users table policies
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid()::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Admins can update all users" ON public.users
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (
    auth.uid()::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Videos table policies
CREATE POLICY "Admins can view all videos" ON public.videos
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can view public videos" ON public.videos
  FOR SELECT USING (
    is_public = true
  );

CREATE POLICY "Users can view own requested videos" ON public.videos
  FOR SELECT USING (
    requested_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can insert videos" ON public.videos
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can request videos" ON public.videos
  FOR INSERT WITH CHECK (
    requested_by::text = (auth.jwt() ->> 'user_id') AND
    is_public = false
  );

CREATE POLICY "Admins can update all videos" ON public.videos
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can update own requested videos" ON public.videos
  FOR UPDATE USING (
    requested_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can delete videos" ON public.videos
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Video requests table policies
CREATE POLICY "Admins can view all video requests" ON public.video_requests
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can view own video requests" ON public.video_requests
  FOR SELECT USING (
    requested_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can create video requests" ON public.video_requests
  FOR INSERT WITH CHECK (
    requested_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can update video requests" ON public.video_requests
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can update own video requests" ON public.video_requests
  FOR UPDATE USING (
    requested_by::text = (auth.jwt() ->> 'user_id') AND
    status = 'pending'
  );

CREATE POLICY "Admins can delete video requests" ON public.video_requests
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Rooms table policies
CREATE POLICY "Admins can view all rooms" ON public.rooms
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can view own rooms" ON public.rooms
  FOR SELECT USING (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can view rooms they are members of" ON public.rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_members.room_id = rooms.id 
      AND room_members.user_id::text = (auth.jwt() ->> 'user_id')
      AND room_members.status = 'active'
    )
  );

CREATE POLICY "Users can view public rooms" ON public.rooms
  FOR SELECT USING (
    category = 'public' AND status = 'active'
  );

CREATE POLICY "Users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Room creators can update rooms" ON public.rooms
  FOR UPDATE USING (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Room admins can update rooms" ON public.rooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_members.room_id = rooms.id 
      AND room_members.user_id::text = (auth.jwt() ->> 'user_id')
      AND room_members.role IN ('creator', 'admin')
      AND room_members.status = 'active'
    )
  );

CREATE POLICY "Admins can update all rooms" ON public.rooms
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Room creators can delete rooms" ON public.rooms
  FOR DELETE USING (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can delete rooms" ON public.rooms
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Room members table policies
CREATE POLICY "Admins can view all room members" ON public.room_members
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can view room members for their rooms" ON public.room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members rm2
      WHERE rm2.room_id = room_members.room_id 
      AND rm2.user_id::text = (auth.jwt() ->> 'user_id')
      AND rm2.status = 'active'
    )
  );

CREATE POLICY "Room creators can manage members" ON public.room_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE rooms.id = room_members.room_id 
      AND rooms.created_by::text = (auth.jwt() ->> 'user_id')
    )
  );

CREATE POLICY "Room admins can manage members" ON public.room_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.room_members rm2
      WHERE rm2.room_id = room_members.room_id 
      AND rm2.user_id::text = (auth.jwt() ->> 'user_id')
      AND rm2.role IN ('creator', 'admin')
      AND rm2.status = 'active'
    )
  );

CREATE POLICY "Admins can manage all room members" ON public.room_members
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Room presence table policies
CREATE POLICY "Room members can view presence" ON public.room_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_members.room_id = room_presence.room_id 
      AND room_members.user_id::text = (auth.jwt() ->> 'user_id')
      AND room_members.status = 'active'
    )
  );

CREATE POLICY "Room members can update own presence" ON public.room_presence
  FOR INSERT WITH CHECK (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Room members can update own presence" ON public.room_presence
  FOR UPDATE USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Room members can delete own presence" ON public.room_presence
  FOR DELETE USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

-- Room state table policies
CREATE POLICY "Room members can view room state" ON public.room_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_members.room_id = room_state.room_id 
      AND room_members.user_id::text = (auth.jwt() ->> 'user_id')
      AND room_members.status = 'active'
    )
  );

CREATE POLICY "Room members can update room state" ON public.room_state
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_members.room_id = room_state.room_id 
      AND room_members.user_id::text = (auth.jwt() ->> 'user_id')
      AND room_members.status = 'active'
    )
  );

CREATE POLICY "Room members can update room state" ON public.room_state
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_members.room_id = room_state.room_id 
      AND room_members.user_id::text = (auth.jwt() ->> 'user_id')
      AND room_members.status = 'active'
    )
  );

-- Messages table policies
CREATE POLICY "Room members can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_members.room_id = messages.room_id 
      AND room_members.user_id::text = (auth.jwt() ->> 'user_id')
      AND room_members.status = 'active'
    )
  );

CREATE POLICY "Room members can send messages" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_members 
      WHERE room_members.room_id = messages.room_id 
      AND room_members.user_id::text = (auth.jwt() ->> 'user_id')
      AND room_members.status = 'active'
    )
  );

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can delete all messages" ON public.messages
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Notifications table policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

-- Calendar events table policies
CREATE POLICY "Users can view own calendar events" ON public.calendar_events
  FOR SELECT USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can create calendar events" ON public.calendar_events
  FOR INSERT WITH CHECK (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can update own calendar events" ON public.calendar_events
  FOR UPDATE USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can delete own calendar events" ON public.calendar_events
  FOR DELETE USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );
