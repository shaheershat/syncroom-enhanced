-- SyncRoom Row Level Security Policies

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Videos table policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view videos" ON public.videos
  FOR SELECT USING (auth.role() = 'authenticated');

-- Rooms table policies - DISABLED for localStorage auth
-- ALTER TABLE public.rooms DISABLE ROW LEVEL SECURITY;

-- Room presence policies
CREATE POLICY "Users can view presence for rooms they are in" ON public.room_presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE id = room_id 
      AND (created_by = auth.uid() OR invited_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage their own presence" ON public.room_presence
  FOR ALL USING (user_id = auth.uid());

-- Room state policies
CREATE POLICY "Users can view state for rooms they are in" ON public.room_state
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE id = room_id 
      AND (created_by = auth.uid() OR invited_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update state for rooms they are in" ON public.room_state
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE id = room_id 
      AND (created_by = auth.uid() OR invited_user_id = auth.uid())
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages for rooms they are in" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE id = room_id 
      AND (created_by = auth.uid() OR invited_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages for rooms they are in" ON public.messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.rooms 
      WHERE id = room_id 
      AND (created_by = auth.uid() OR invited_user_id = auth.uid())
    )
  );

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_user_approved()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy to ensure only approved users can access anything
CREATE POLICY "Only approved users can access rooms" ON public.rooms
  FOR ALL USING (public.is_user_approved());

CREATE POLICY "Only approved users can access room_presence" ON public.room_presence
  FOR ALL USING (public.is_user_approved());

CREATE POLICY "Only approved users can access room_state" ON public.room_state
  FOR ALL USING (public.is_user_approved());

CREATE POLICY "Only approved users can access messages" ON public.messages
  FOR ALL USING (public.is_user_approved());
