-- Allow users to accept their own invitations
-- Use this policy to allow the 'accept' step in SetPasswordPage to succeed

DROP POLICY IF EXISTS "Accept own invitation" ON invitations;

CREATE POLICY "Accept own invitation" ON invitations
  FOR UPDATE
  USING (
    -- Allow if the invitation email matches the current user's email
    email = (auth.jwt() ->> 'email')
  )
  WITH CHECK (
    -- Allow if the invitation email matches the current user's email
    email = (auth.jwt() ->> 'email')
  );

-- Ensure the public read policy is correct (it was "true", which is fine)
-- But just in case, explicitly allow authenticated users to read their own invites too
DROP POLICY IF EXISTS "Read own invitations" ON invitations;
CREATE POLICY "Read own invitations" ON invitations
  FOR SELECT
  USING (
    email = (auth.jwt() ->> 'email')
  );
