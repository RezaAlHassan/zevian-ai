-- Secure Acceptance Function (RPC)
-- This is stricter and more "production grade" than opening up generic UPDATE access via RLS.

CREATE OR REPLACE FUNCTION accept_invitation(token_input TEXT)
RETURNS SETOF invitations
SECURITY DEFINER -- Runs with privileges of the creator (bypass RLS for the update), but we enforce checks manually
SET search_path = public
AS $$
DECLARE
  current_email TEXT;
BEGIN
  -- 1. Get the authenticated user's email
  current_email := auth.jwt() ->> 'email';

  -- 2. Validate: Fail if not strictly matching
  IF current_email IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 3. Update ONLY if the token matches AND the email matches the logged-in user
  -- This prevents users from accepting *other people's* invites even if they guessed the token
  -- And prevents users from modifying other fields (like role or organization_id)
  RETURN QUERY
  UPDATE invitations
  SET 
    status = 'accepted', 
    accepted_at = NOW()
  WHERE 
    token = token_input 
    AND email = current_email
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
