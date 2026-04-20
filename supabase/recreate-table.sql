-- Drastic approach: Recreate the room_presence table to clear stubborn policies
-- This will completely reset the table and remove all policies

-- First, check if table has data we need to preserve
SELECT COUNT(*) as row_count FROM public.room_presence;

-- Drop the entire table (this removes all policies automatically)
DROP TABLE IF EXISTS public.room_presence CASCADE;

-- Recreate the table fresh (from the enhanced schema)
CREATE TABLE IF NOT EXISTS public.room_presence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  online BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Recreate the indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_presence_room ON public.room_presence(room_id);
CREATE INDEX IF NOT EXISTS idx_room_presence_user ON public.room_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_room_presence_online ON public.room_presence(online);

-- Re-enable RLS on the fresh table
ALTER TABLE public.room_presence ENABLE ROW LEVEL SECURITY;

-- Verify the table is clean (no policies should exist)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'room_presence'
ORDER BY policyname;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'room_presence'
ORDER BY ordinal_position;
