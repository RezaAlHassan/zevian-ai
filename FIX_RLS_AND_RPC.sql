-- ==============================================================================
-- CRITICAL FIX FOR INVITATION FLOW
-- Run this entire script in your Supabase Dashboard > SQL Editor
-- ==============================================================================

-- 1. Fix Project Assignees RLS (The main blocker)
-- This replaces the overly strict policy with one that allows authenticated users to insert rows.
DROP POLICY IF EXISTS "Enable self assignment" ON project_assignees;
CREATE POLICY "Enable self assignment" ON project_assignees
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );

-- 2. Fix Invitation Acceptance Function (The 400/Auth error)
-- This robust version handles email case sensitivity and provides better error messages.
DROP FUNCTION IF EXISTS accept_invitation;
CREATE OR REPLACE FUNCTION accept_invitation(token_input TEXT)
RETURNS SETOF invitations
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email TEXT;
  invite_record invitations%ROWTYPE;
BEGIN
  -- 1. Get the authenticated user's email
  current_email := auth.jwt() ->> 'email';
  
  -- 2. Validate Authentication
  IF current_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 3. Check if invite exists
  SELECT * INTO invite_record FROM invitations 
  WHERE token = token_input;

  IF invite_record IS NULL THEN
     RAISE EXCEPTION 'Invitation not found or invalid token';
  END IF;

  -- 4. Check if email matches (Case insensitive comparison)
  IF LOWER(invite_record.email) != LOWER(current_email) THEN
     RAISE EXCEPTION 'Invitation email (%) does not match logged in user (%)', invite_record.email, current_email;
  END IF;

  -- 5. Update status
  RETURN QUERY
  UPDATE invitations
  SET 
    status = 'accepted', 
    accepted_at = NOW()
  WHERE 
    token = token_input 
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
