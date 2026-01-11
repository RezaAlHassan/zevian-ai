-- ==============================================================================
-- "SMART" INVITATION COMPLETION FUNCTION
-- Run this script in your Supabase Dashboard > SQL Editor
-- This replaces the fragile client-side chain with a robust server-side transaction.
-- ==============================================================================

DROP FUNCTION IF EXISTS complete_invitation_flow;

CREATE OR REPLACE FUNCTION complete_invitation_flow(
  token_input TEXT,
  user_name TEXT
)
RETURNS JSONB
SECURITY DEFINER -- Runs as database owner (bypasses RLS triggers)
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_email TEXT;
  invite_record invitations%ROWTYPE;
  new_employee_id TEXT;
BEGIN
  -- 1. Identify the user
  current_user_id := auth.uid();
  current_email := auth.jwt() ->> 'email';

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be signed in to accept invitation';
  END IF;

  -- 2. Validate Invitation
  SELECT * INTO invite_record FROM invitations WHERE token = token_input;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  IF invite_record.status = 'accepted' THEN
    RAISE EXCEPTION 'Invitation already accepted';
  END IF;

  -- 3. Create Employee Record (Server-side ID generation)
  -- Uses epoch to generate a unique-ish string ID compatible with your existing 'emp-' format
  new_employee_id := 'emp-' || floor(extract(epoch from now()) * 1000)::text;

  INSERT INTO employees (
    id, 
    organization_id, 
    auth_user_id, 
    name, 
    email, 
    role, 
    manager_id, 
    join_date
  ) VALUES (
    new_employee_id,
    invite_record.organization_id,
    current_user_id,
    user_name,
    invite_record.email,
    invite_record.role,
    invite_record.initial_manager_id,
    NOW()
  );

  -- 4. Assign Project (The Missing Piece!)
  IF invite_record.initial_project_id IS NOT NULL THEN
    INSERT INTO project_assignees (
      project_id, 
      assignee_id, 
      assignee_type
    ) VALUES (
      invite_record.initial_project_id,
      new_employee_id,
      invite_record.role -- 'employee' or 'manager'
    );
  END IF;

  -- 5. Mark Invitation Accepted
  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE token = token_input;

  -- 6. Return success details
  RETURN jsonb_build_object(
    'success', true, 
    'employee_id', new_employee_id,
    'project_assigned', invite_record.initial_project_id
  );
END;
$$ LANGUAGE plpgsql;
