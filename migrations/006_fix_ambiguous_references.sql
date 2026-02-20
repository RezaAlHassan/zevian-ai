-- 006_fix_ambiguous_references.sql

-- 1. Fix "notify_goal_assignment" trigger variable shadowing
CREATE OR REPLACE FUNCTION notify_goal_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_goal_name TEXT;
    v_project_id TEXT;
BEGIN
    -- Use aliases and explicit qualification to avoid ambiguity
    SELECT g.name, g.project_id 
    INTO v_goal_name, v_project_id 
    FROM goals g 
    WHERE g.id = NEW.goal_id;
    
    INSERT INTO notifications (user_id, type, title, message, link_url)
    VALUES (
        NEW.assignee_id,
        'goal',
        'New Goal Assignment',
        'You have been explicitly assigned to goal: ' || v_goal_name,
        '/projects/' || v_project_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger (just to be sure)
DROP TRIGGER IF EXISTS on_goal_assignment ON goal_assignees;
CREATE TRIGGER on_goal_assignment
AFTER INSERT ON goal_assignees
FOR EACH ROW
EXECUTE FUNCTION notify_goal_assignment();


-- 2. Fix potential ambiguity in RLS policies for goal_assignees by using aliases
-- Drop existing policies first to be clean
DROP POLICY IF EXISTS "View organization goal assignees" ON goal_assignees;
DROP POLICY IF EXISTS "Manager manage goal assignees" ON goal_assignees;

CREATE POLICY "View organization goal assignees" ON goal_assignees FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM goals g
      JOIN projects p ON g.project_id = p.id
      WHERE g.id = goal_assignees.goal_id 
      AND p.organization_id = (SELECT e.organization_id FROM employees e WHERE e.auth_user_id = auth.uid() LIMIT 1)
    )
);

CREATE POLICY "Manager manage goal assignees" ON goal_assignees FOR ALL USING (
    is_manager() AND EXISTS (
      SELECT 1 FROM goals g
      JOIN projects p ON g.project_id = p.id
      WHERE g.id = goal_assignees.goal_id 
      AND p.organization_id = (SELECT e.organization_id FROM employees e WHERE e.auth_user_id = auth.uid() LIMIT 1)
    )
);

-- 3. Update "complete_invitation_flow" to be absolutely safe against shadowing
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
  v_current_user_id UUID;
  v_current_email TEXT;
  v_invite_record invitations%ROWTYPE;
  v_new_employee_id TEXT;
  v_pid TEXT;
  v_gid TEXT;
BEGIN
  v_current_user_id := COALESCE(auth_user_id_input, auth.uid());
  v_current_email := COALESCE(email_input, auth.jwt() ->> 'email');

  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User ID must be provided or user must be signed in';
  END IF;

  SELECT * INTO v_invite_record FROM invitations WHERE token = token_input;

  IF v_invite_record IS NULL THEN
    RAISE EXCEPTION 'Invalid invitation token';
  END IF;

  IF v_invite_record.status = 'accepted' THEN
    RAISE EXCEPTION 'Invitation already accepted';
  END IF;

  v_new_employee_id := 'emp-' || floor(extract(epoch from now()) * 1000)::text;

  INSERT INTO employees (
    id, organization_id, auth_user_id, name, email, role, manager_id, onboarding_completed, join_date
  ) VALUES (
    v_new_employee_id, v_invite_record.organization_id, v_current_user_id, user_name, v_invite_record.email, v_invite_record.role, v_invite_record.initial_manager_id, TRUE, NOW()
  );

  -- Assign Projects
  IF v_invite_record.initial_project_ids IS NOT NULL AND array_length(v_invite_record.initial_project_ids, 1) > 0 THEN
    FOREACH v_pid IN ARRAY v_invite_record.initial_project_ids
    LOOP
      INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
      VALUES (v_pid, v_new_employee_id, v_invite_record.role)
      ON CONFLICT (project_id, assignee_id) DO NOTHING;
    END LOOP;
  ELSIF v_invite_record.initial_project_id IS NOT NULL THEN
      INSERT INTO project_assignees (project_id, assignee_id, assignee_type)
      VALUES (v_invite_record.initial_project_id, v_new_employee_id, v_invite_record.role)
      ON CONFLICT (project_id, assignee_id) DO NOTHING;
  END IF;

  -- Assign Goals
  IF v_invite_record.initial_goal_ids IS NOT NULL AND array_length(v_invite_record.initial_goal_ids, 1) > 0 THEN
    FOREACH v_gid IN ARRAY v_invite_record.initial_goal_ids
    LOOP
      INSERT INTO goal_assignees (goal_id, assignee_id, assignee_type)
      VALUES (v_gid, v_new_employee_id, v_invite_record.role)
      ON CONFLICT (goal_id, assignee_id) DO NOTHING;
    END LOOP;
  END IF;

  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE token = token_input;

  RETURN jsonb_build_object('success', true, 'employee_id', v_new_employee_id);
END;
$$ LANGUAGE plpgsql;
