-- Basic Essential Policies - Only the most critical ones
-- This will get your core functionality working

-- Users table policies - essential for authentication
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid()::text = (auth.jwt() ->> 'user_id')
  );

-- Videos table policies - essential for video library
CREATE POLICY "Users can view public videos" ON public.videos
  FOR SELECT USING (
    is_public = true
  );

CREATE POLICY "Admins can view all videos" ON public.videos
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Admins can insert videos" ON public.videos
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Video requests table policies - essential for video requests
CREATE POLICY "Users can view own video requests" ON public.video_requests
  FOR SELECT USING (
    requested_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can create video requests" ON public.video_requests
  FOR INSERT WITH CHECK (
    requested_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can view all video requests" ON public.video_requests
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Admins can update video requests" ON public.video_requests
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Rooms table policies - essential for room functionality
CREATE POLICY "Users can view public rooms" ON public.rooms
  FOR SELECT USING (
    category = 'public' AND status = 'active'
  );

CREATE POLICY "Users can view own rooms" ON public.rooms
  FOR SELECT USING (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can create rooms" ON public.rooms
  FOR INSERT WITH CHECK (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Room creators can update rooms" ON public.rooms
  FOR UPDATE USING (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Room creators can delete rooms" ON public.rooms
  FOR DELETE USING (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can view all rooms" ON public.rooms
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Admins can update all rooms" ON public.rooms
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "Admins can delete rooms" ON public.rooms
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Messages table policies - essential for chat
CREATE POLICY "Users can view messages in their rooms" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE rooms.id = messages.room_id 
      AND (rooms.created_by::text = (auth.jwt() ->> 'user_id') OR rooms.category = 'public')
    )
  );

CREATE POLICY "Users can send messages to their rooms" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE rooms.id = messages.room_id 
      AND (rooms.created_by::text = (auth.jwt() ->> 'user_id') OR rooms.category = 'public')
    )
  );

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Notifications table policies - essential for notifications
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
