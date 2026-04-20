-- Targeted Cleanup - Remove the specific problematic policy first

-- Check what exists
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

-- Remove RLS temporarily from room_presence table
ALTER TABLE public.room_presence DISABLE ROW LEVEL SECURITY;

-- Now try to drop the specific policy
DROP POLICY IF EXISTS "Room members can update own presence" ON public.room_presence;

-- Also drop any other room_presence policies that might exist
DROP POLICY IF EXISTS "Room members can view presence" ON public.room_presence;
DROP POLICY IF EXISTS "Room members can delete own presence" ON public.room_presence;

-- Re-enable RLS
ALTER TABLE public.room_presence ENABLE ROW LEVEL SECURITY;

-- Verify the specific policy is gone
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
