-- FORCE CLEANUP - Remove all policies aggressively
-- Use this if regular cleanup doesn't work

-- First, let's see what policies currently exist
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

-- Force drop policies by disabling constraints and RLS
-- This approach bypasses normal dependency checks

-- Drop all policies with force approach
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT 
            schemaname::text || '.' || tablename::text as table_name,
            policyname::text as policy_name
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policy_name || '" ON ' || policy_record.table_name;
            RAISE NOTICE 'Dropped policy: % on %', policy_record.policy_name, policy_record.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy % on %: %', policy_record.policy_name, policy_record.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Alternative approach: Truncate policy system table (DANGEROUS - last resort)
-- ONLY use this if the above doesn't work
-- TRUNCATE TABLE pg_policies CASCADE;

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

-- Show table status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;
