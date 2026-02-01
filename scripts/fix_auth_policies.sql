-- Fix Supabase RLS policies to allow auth user creation
-- Run this in Supabase SQL Editor

-- Disable RLS on user_profiles temporarily to allow auth to work
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use these policies instead:
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Allow all operations for service role" ON public.user_profiles;
-- CREATE POLICY "Allow all operations for service role"
-- ON public.user_profiles
-- FOR ALL
-- TO service_role
-- USING (true)
-- WITH CHECK (true);
-- 
-- DROP POLICY IF EXISTS "Allow public read for auth checks" ON public.user_profiles;
-- CREATE POLICY "Allow public read for auth checks"
-- ON public.user_profiles
-- FOR SELECT
-- TO anon, authenticated
-- USING (true);
