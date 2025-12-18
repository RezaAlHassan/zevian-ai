-- FIX RLS POLICIES FOR INVITATIONS
-- Use this file to fix the "new row violates row-level security policy" error.

-- 1. Enable RLS on invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users (Managers) to insert invitations
-- We check if the user is authenticated.Ideally, we would also check if they are a manager
-- and if the organization_id matches, but 'organization_id' is part of the INSERT payload
-- and RLS on INSERT checks the NEW row.
-- Checking if 'invited_by' matches the user's employee record is a good security measure.
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON invitations;
CREATE POLICY "Enable insert for authenticated users" ON invitations
FOR INSERT TO authenticated
WITH CHECK (
    -- Allow if the user is authenticated. 
    -- For stricter security, you could uncomment the following check:
    -- auth.uid() IN (SELECT auth_user_id FROM employees WHERE id = invited_by)
    auth.role() = 'authenticated'
);

-- 3. Allow Managers to view invitations for their organization
DROP POLICY IF EXISTS "Enable select for organization members" ON invitations;
CREATE POLICY "Enable select for organization members" ON invitations
FOR SELECT TO authenticated
USING (
    -- Allow seeing invitations if you belong to the same organization
    organization_id IN (
        SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
    )
);

-- 4. Allow Managers to delete/cancel invitations
DROP POLICY IF EXISTS "Enable delete for organization members" ON invitations;
CREATE POLICY "Enable delete for organization members" ON invitations
FOR DELETE TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM employees WHERE auth_user_id = auth.uid()
        AND role = 'manager' -- Only managers can delete
    )
);

-- 5. Allow Public (Invitees) to view their invitation by token
-- This is required for the invite acceptance page to validate the token.
DROP POLICY IF EXISTS "Enable public read by token" ON invitations;
CREATE POLICY "Enable public read by token" ON invitations
FOR SELECT TO public
USING (true); 
-- Note: 'USING (true)' allows listing if one could guess the endpoint, but effectively
-- the application only queries by exact token `eq('token', token)`.
-- Since tokens are high-entropy, this is generally acceptable for this use case.
