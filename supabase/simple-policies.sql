-- Simple Essential Policies - Just the basics to get working

-- Users - Essential for authentication
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid()::text = (auth.jwt() ->> 'user_id')
  );

-- Videos - Essential for video library
CREATE POLICY "Users can view public videos" ON public.videos
  FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage videos" ON public.videos
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Video Requests - Essential for requests
CREATE POLICY "Users can manage own video requests" ON public.video_requests
  FOR ALL USING (
    requested_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can manage all video requests" ON public.video_requests
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Rooms - Essential for room functionality
CREATE POLICY "Users can view public and own rooms" ON public.rooms
  FOR SELECT USING (
    category = 'public' AND status = 'active' OR 
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Users can manage own rooms" ON public.rooms
  FOR ALL USING (
    created_by::text = (auth.jwt() ->> 'user_id')
  );

CREATE POLICY "Admins can manage all rooms" ON public.rooms
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Messages - Essential for chat
CREATE POLICY "Users can manage room messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE rooms.id = messages.room_id 
      AND (rooms.created_by::text = (auth.jwt() ->> 'user_id') OR rooms.category = 'public')
    )
  );

-- Notifications - Essential for notifications
CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (
    user_id::text = (auth.jwt() ->> 'user_id')
  );
