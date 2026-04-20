-- Complete RLS Reset - Force clear all RLS policies and reset the system
-- This is the most aggressive approach to clear stubborn policies

-- First, disable RLS on ALL tables to break any policy dependencies
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

-- Show current policies before cleanup
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

-- Force drop all policies using system catalog approach
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Starting force policy cleanup...';
    
    FOR policy_record IN 
        SELECT 
            schemaname::text || '.' || tablename::text as table_name,
            policyname::text as policy_name
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            -- Execute the drop policy command
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policy_name || '" ON ' || policy_record.table_name;
            RAISE NOTICE 'Dropped policy: % on %', policy_record.policy_name, policy_record.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error dropping policy % on %: %', policy_record.policy_name, policy_record.table_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Force policy cleanup completed';
END $$;

-- Clear any remaining policy references from system catalogs
-- This is a system-level approach to ensure no orphaned policies
DELETE FROM pg_policy WHERE polname IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public'
);

-- Verify all policies are gone
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

-- Final verification - should show no policies
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

-- Show RLS status for all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
