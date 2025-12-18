-- Fix RLS policy for organizations table to allow authenticated users to create organizations
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing policy if it exists (to avoid conflicts/errors if re-running)
DROP POLICY IF EXISTS "Create organization" ON organizations;

-- 2. Create the correct policy
-- This allows any authenticated user to INSERT a row into the organizations table.
-- Ideally, you might restrict this further (e.g., only if they don't have an org yet),
-- but for the onboarding flow, checking 'authenticated' is the standard baseline.
CREATE POLICY "Create organization" ON organizations
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Verify RLS is enabled
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
