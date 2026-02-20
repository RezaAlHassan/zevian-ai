-- ============================================================================
-- 004_goal_assignment_and_invitations.sql
-- ============================================================================

-- 1. Create GOAL ASSIGNEES table
CREATE TABLE IF NOT EXISTS goal_assignees (
    id SERIAL PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    assignee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assignee_type TEXT NOT NULL CHECK (assignee_type IN ('employee', 'manager')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (goal_id, assignee_id)
);

CREATE INDEX IF NOT EXISTS idx_goal_assignees_goal_id ON goal_assignees(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_assignees_assignee_id ON goal_assignees(assignee_id);

-- RLS for goal_assignees
ALTER TABLE goal_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View organization goal assignees" ON goal_assignees FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM goals 
      JOIN projects ON goals.project_id = projects.id
      WHERE goals.id = goal_assignees.goal_id 
      AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
);

CREATE POLICY "Manager manage goal assignees" ON goal_assignees FOR ALL USING (
    is_manager() AND EXISTS (
      SELECT 1 FROM goals 
      JOIN projects ON goals.project_id = projects.id
      WHERE goals.id = goal_assignees.goal_id 
      AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
);


-- 2. Modify INVITATIONS table
-- Add array columns for multiple projects and goals
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS initial_project_ids TEXT[];
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS initial_goal_ids TEXT[];

-- Migrate existing data (optional, but good for safety if we had data)
-- UPDATE invitations SET initial_project_ids = ARRAY[initial_project_id] WHERE initial_project_id IS NOT NULL AND initial_project_ids IS NULL;

-- Drop old column (or keep it deprecated? Let's drop it to be clean as per request)
-- ALTER TABLE invitations DROP COLUMN IF EXISTS initial_project_id;
-- actually, let's keep it for now as "deprecated" to avoid breaking immediate running code before frontend updates, 
-- but we will use the new columns in the flow.


-- 3. Update complete_invitation_flow function to handle multiple assignments
CREATE OR REPLACE FUNCTION complete_invitation_flow(
  token_input TEXT,
  user_name TEXT,
  auth_user_id_input UUID DEFAULT NULL,
  email_input TEXT DEFAULT NULL
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_email TEXT;
  invite_record invitations%ROWTYPE;
  new_employee_id TEXT;
  pid TEXT;
  gid TEXT;
BEGIN
  -- 1. Identify the user
  current_user_id := COALESCE(auth_user_id_input, auth.uid());
  current_email := COALESCE(email_input, auth.jwt() ->> 'email');

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided or user must be signed in';
  END IF;

  -- 2. Validate Invitation
  SELECT * INTO invite_record FROM invitations WHERE token = token_input;

  IF invite_record IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  IF invite_record.status = 'accepted' THEN
    RAISE EXCEPTION 'Invitation already accepted';
  END IF;

  -- 3. Create Employee Record
  new_employee_id := 'emp-' || floor(extract(epoch from now()) * 1000)::text;

  INSERT INTO employees (
    id, 
    organization_id, 
    auth_user_id, 
    name, 
    email, 
    role, 
    manager_id, 
    onboarding_completed,
    join_date
  ) VALUES (
    new_employee_id,
    invite_record.organization_id,
    current_user_id,
    user_name,
    invite_record.email,
    invite_record.role,
    invite_record.initial_manager_id,
    TRUE,
    NOW()
  );

  -- 4. Assign Projects (Handle both single old field and new array field)
  -- Priority: array field > single field
  
  -- Handle Array
  IF invite_record.initial_project_ids IS NOT NULL AND array_length(invite_record.initial_project_ids, 1) > 0 THEN
    FOREACH pid IN ARRAY invite_record.initial_project_ids
    LOOP
      INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
      VALUES (pid, new_employee_id, invite_record.role)
      ON CONFLICT (project_id, assignee_id) DO NOTHING;
    END LOOP;
  -- Handle Single (Legacy)
  ELSIF invite_record.initial_project_id IS NOT NULL THEN
      INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
      VALUES (invite_record.initial_project_id, new_employee_id, invite_record.role)
      ON CONFLICT (project_id, assignee_id) DO NOTHING;
  END IF;

  -- 5. Assign Goals
  IF invite_record.initial_goal_ids IS NOT NULL AND array_length(invite_record.initial_goal_ids, 1) > 0 THEN
    FOREACH gid IN ARRAY invite_record.initial_goal_ids
    LOOP
      INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type)
      VALUES (gid, new_employee_id, invite_record.role)
      ON CONFLICT (goal_id, assignee_id) DO NOTHING;
    END LOOP;
  END IF;

  -- 6. Mark Invitation Accepted
  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE token = token_input;

  -- 7. Return success
  RETURN jsonb_build_object(
    'success', true, 
    'employee_id', new_employee_id
  );
END;
$$ LANGUAGE plpgsql;
