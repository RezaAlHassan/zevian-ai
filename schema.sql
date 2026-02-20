-- ============================================================================
-- 0. TEAR DOWN (RESET)
-- ============================================================================
-- WARNING: This deletes all existing data. Use only for development/reset.
DROP TABLE IF EXISTS project_frequency_days CASCADE;
DROP TABLE IF EXISTS project_frequency_settings CASCADE;
DROP TABLE IF EXISTS employee_frequency_days CASCADE;
DROP TABLE IF EXISTS employee_frequency_settings CASCADE;
DROP TABLE IF EXISTS manager_selected_days CASCADE;
DROP TABLE IF EXISTS manager_settings CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS report_criterion_scores CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS criteria CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS project_assignees CASCADE;
DROP TABLE IF EXISTS employee_permissions CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS project_documents CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- ============================================================================
-- 1. ORGANIZATIONS
-- ============================================================================
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan_tier TEXT DEFAULT 'free',
    selected_metrics TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PROJECTS TABLE
-- ============================================================================
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    report_frequency TEXT NOT NULL CHECK (report_frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
    knowledge_base_link TEXT,
    ai_context TEXT,
    created_by TEXT, 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_category ON projects(category);

-- ============================================================================
-- 3. EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id),
    auth_user_id UUID, 
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    title TEXT,
    role TEXT NOT NULL CHECK (role IN ('manager', 'employee', 'admin')),
    manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    is_account_owner BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    join_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, organization_id)
);

CREATE INDEX idx_employees_auth_user_id ON employees(auth_user_id);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_email ON employees(email);

-- ============================================================================
-- 4. EMPLOYEE PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE employee_permissions (
    employee_id TEXT PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
    can_set_global_frequency BOOLEAN DEFAULT FALSE,
    can_view_organization_wide BOOLEAN DEFAULT FALSE,
    can_manage_settings BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 5. PROJECT ASSIGNEES TABLE
-- ============================================================================
CREATE TABLE project_assignees (
    id SERIAL PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    assignee_type TEXT NOT NULL CHECK (assignee_type IN ('employee', 'manager')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (project_id, assignee_id)
);

CREATE INDEX idx_project_assignees_project_id ON project_assignees(project_id);
CREATE INDEX idx_project_assignees_assignee_id ON project_assignees(assignee_id);

-- ============================================================================
-- 6. PROJECT DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE project_documents (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by TEXT REFERENCES employees(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. GOALS TABLE
-- ============================================================================
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    instructions TEXT NOT NULL,
    deadline DATE,
    manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_project_id ON goals(project_id);
CREATE INDEX idx_goals_manager_id ON goals(manager_id);
CREATE INDEX idx_goals_deadline ON goals(deadline);

-- ============================================================================
-- 8. CRITERIA TABLE
-- ============================================================================
CREATE TABLE criteria (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_criteria_goal_id ON criteria(goal_id);

-- ============================================================================
-- 9. REPORTS TABLE
-- ============================================================================
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    report_text TEXT NOT NULL,
    submission_date TIMESTAMPTZ NOT NULL,
    evaluation_score NUMERIC(4,2) NOT NULL CHECK (evaluation_score >= 0 AND evaluation_score <= 10),
    manager_overall_score NUMERIC(4,2) CHECK (manager_overall_score >= 0 AND manager_overall_score <= 10),
    manager_override_reasoning TEXT,
    manager_feedback TEXT,
    evaluation_reasoning TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_goal_id ON reports(goal_id);
CREATE INDEX idx_reports_employee_id ON reports(employee_id);
CREATE INDEX idx_reports_submission_date ON reports(submission_date);

-- ============================================================================
-- 10. REPORT CRITERION SCORES TABLE
-- ============================================================================
CREATE TABLE report_criterion_scores (
    id SERIAL PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    criterion_name TEXT NOT NULL,
    score NUMERIC(4,2) NOT NULL CHECK (score >= 0 AND score <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_criterion_scores_report_id ON report_criterion_scores(report_id);

-- ============================================================================
-- 11. INVITATIONS TABLE
-- ============================================================================
CREATE TABLE invitations (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
    organization_id TEXT NOT NULL REFERENCES organizations(id),
    invited_by TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    invited_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')),
    initial_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    initial_manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ============================================================================
-- 12. SETTINGS TABLES
-- ============================================================================
CREATE TABLE manager_settings (
    id SERIAL PRIMARY KEY,
    manager_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    global_frequency BOOLEAN DEFAULT TRUE,
    allow_late_submissions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (manager_id)
);

CREATE TABLE manager_selected_days (
    id SERIAL PRIMARY KEY,
    manager_settings_id INTEGER NOT NULL REFERENCES manager_settings(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL CHECK (day_name IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    UNIQUE (manager_settings_id, day_name)
);

CREATE TABLE employee_frequency_settings (
    id SERIAL PRIMARY KEY,
    manager_settings_id INTEGER NOT NULL REFERENCES manager_settings(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE (manager_settings_id, employee_id)
);

CREATE TABLE employee_frequency_days (
    id SERIAL PRIMARY KEY,
    employee_frequency_id INTEGER NOT NULL REFERENCES employee_frequency_settings(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL CHECK (day_name IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    UNIQUE (employee_frequency_id, day_name)
);

CREATE TABLE project_frequency_settings (
    id SERIAL PRIMARY KEY,
    manager_settings_id INTEGER NOT NULL REFERENCES manager_settings(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE (manager_settings_id, project_id)
);

CREATE TABLE project_frequency_days (
    id SERIAL PRIMARY KEY,
    project_frequency_id INTEGER NOT NULL REFERENCES project_frequency_settings(id) ON DELETE CASCADE,
    day_name TEXT NOT NULL CHECK (day_name IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    UNIQUE (project_frequency_id, day_name)
);

-- ============================================================================
-- 13. TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manager_settings_updated_at BEFORE UPDATE ON manager_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. INVITATION FLOW (SMART FUNCTION)
-- ============================================================================
-- This functionality replaces complex client-side flows for accepting invitations.
-- It handles: Authentication check, Employee Creation, Project Assignment, and Invite Status Update atomically.

CREATE OR REPLACE FUNCTION complete_invitation_flow(
  token_input TEXT,
  user_name TEXT
)
RETURNS JSONB
SECURITY DEFINER -- Runs as database owner (bypasses RLS)
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

  -- 4. Assign Project (The Missing Piece!)
  IF invite_record.initial_project_id IS NOT NULL THEN
    INSERT INTO project_assignees (
      project_id, 
      assignee_id, 
      assignee_type
    ) VALUES (
      invite_record.initial_project_id,
      new_employee_id,
      invite_record.role
    );
  END IF;

  -- 5. Mark Invitation Accepted
  UPDATE invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE token = token_input;

  -- 6. Return success
  RETURN jsonb_build_object(
    'success', true, 
    'employee_id', new_employee_id,
    'project_assigned', invite_record.initial_project_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 15. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_criterion_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_selected_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_frequency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_frequency_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_frequency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_frequency_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS TEXT AS $$
  SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('manager', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- POLICIES

-- ORGANIZATIONS
CREATE POLICY "View own organization" ON organizations FOR SELECT USING (id = get_my_org_id());
CREATE POLICY "Create organization" ON organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Manager update organization" ON organizations FOR UPDATE USING (is_manager() AND id = get_my_org_id());

-- EMPLOYEES
CREATE POLICY "View own profile" ON employees FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY "View org employees" ON employees FOR SELECT USING (organization_id = get_my_org_id());
CREATE POLICY "Update own profile" ON employees FOR UPDATE USING (auth_user_id = auth.uid());
CREATE POLICY "Manager update employees" ON employees FOR UPDATE USING (is_manager() AND organization_id = get_my_org_id());
CREATE POLICY "Create employee" ON employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PROJECTS
CREATE POLICY "View organization projects" ON projects FOR SELECT USING (organization_id = get_my_org_id());
CREATE POLICY "Manager manage projects" ON projects FOR ALL USING (is_manager() AND organization_id = get_my_org_id());
CREATE POLICY "Enable insert for authenticated users" ON projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- GOALS
CREATE POLICY "View organization goals" ON goals FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = goals.project_id AND projects.organization_id = get_my_org_id()));
CREATE POLICY "Manager manage goals" ON goals FOR ALL USING (is_manager() AND EXISTS (SELECT 1 FROM projects WHERE projects.id = goals.project_id AND projects.organization_id = get_my_org_id()));
CREATE POLICY "Enable insert for authenticated users" ON goals FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- CRITERIA
CREATE POLICY "Enable read access for authenticated users" ON criteria FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON criteria FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for managers" ON criteria FOR ALL USING (is_manager());

-- REPORTS
CREATE POLICY "View own reports" ON reports FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Manager view org reports" ON reports FOR SELECT USING (is_manager() AND EXISTS (SELECT 1 FROM employees WHERE employees.id = reports.employee_id AND employees.organization_id = get_my_org_id()));
CREATE POLICY "Create own reports" ON reports FOR INSERT WITH CHECK (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Update own reports" ON reports FOR UPDATE USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- REPORT CRITERION SCORES
CREATE POLICY "Enable read access for authenticated users" ON report_criterion_scores FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON report_criterion_scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- INVITATIONS
CREATE POLICY "Manager manage invitations" ON invitations FOR ALL USING (is_manager() AND organization_id = get_my_org_id());
CREATE POLICY "Read invitations by token" ON invitations FOR SELECT USING (true);

-- PROJECT DOCUMENTS
CREATE POLICY "View project documents" ON project_documents FOR SELECT USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_documents.project_id AND projects.organization_id = get_my_org_id()));
CREATE POLICY "Upload project documents" ON project_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PROJECT ASSIGNEES
CREATE POLICY "View organization project assignees" ON project_assignees FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_assignees.project_id 
      AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
);
CREATE POLICY "Manager manage project assignees" ON project_assignees FOR ALL USING (
    is_manager() AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_assignees.project_id 
      AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
);
-- Note: "Enable self assignment" policy removed as it's replaced by complete_invitation_flow

-- MANAGER SETTINGS & RELATED TABLES
CREATE POLICY "Manage own settings" ON manager_settings FOR ALL USING (manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "View org manager settings" ON manager_settings FOR SELECT USING (manager_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id()));
CREATE POLICY "Manage own selected days" ON manager_selected_days FOR ALL USING (manager_settings_id IN (SELECT id FROM manager_settings WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View org selected days" ON manager_selected_days FOR SELECT USING (manager_settings_id IN (SELECT id FROM manager_settings WHERE manager_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id())));
CREATE POLICY "Manage emp freq settings" ON employee_frequency_settings FOR ALL USING (manager_settings_id IN (SELECT id FROM manager_settings WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View own freq settings" ON employee_frequency_settings FOR SELECT USING (employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));
CREATE POLICY "Manage emp freq days" ON employee_frequency_days FOR ALL USING (employee_frequency_id IN (SELECT efs.id FROM employee_frequency_settings efs JOIN manager_settings ms ON efs.manager_settings_id = ms.id WHERE ms.manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View own freq days" ON employee_frequency_days FOR SELECT USING (employee_frequency_id IN (SELECT efs.id FROM employee_frequency_settings efs WHERE efs.employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "Manage proj freq settings" ON project_frequency_settings FOR ALL USING (manager_settings_id IN (SELECT id FROM manager_settings WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View proj freq settings" ON project_frequency_settings FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE organization_id = get_my_org_id()));
CREATE POLICY "Manage proj freq days" ON project_frequency_days FOR ALL USING (project_frequency_id IN (SELECT pfs.id FROM project_frequency_settings pfs JOIN manager_settings ms ON pfs.manager_settings_id = ms.id WHERE ms.manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())));
CREATE POLICY "View proj freq days" ON project_frequency_days FOR SELECT USING (project_frequency_id IN (SELECT pfs.id FROM project_frequency_settings pfs JOIN projects p ON pfs.project_id = p.id WHERE p.organization_id = get_my_org_id()));

-- ============================================================================
-- 16. SEED DATA (Minimal Setup)
-- ============================================================================
INSERT INTO organizations (id, name, plan_tier) VALUES ('org-1', 'Acme Corp', 'business');
INSERT INTO employees (id, organization_id, name, email, title, role, manager_id, is_account_owner, join_date) VALUES
('mgr-1', 'org-1', 'Sarah Connor', 'sarah@acme.com', 'VP of Engineering', 'manager', NULL, TRUE, '2023-01-01'),
('mgr-2', 'org-1', 'Mike Ross', 'mike@acme.com', 'Engineering Lead', 'manager', 'mgr-1', FALSE, '2023-03-15'),
('emp-1', 'org-1', 'Alice Wu', 'alice@acme.com', 'Senior Backend Engineer', 'employee', 'mgr-2', FALSE, '2023-04-01'),
('emp-2', 'org-1', 'Bob Smith', 'bob@acme.com', 'Frontend Developer', 'employee', 'mgr-2', FALSE, '2023-04-10'),
('emp-3', 'org-1', 'Charlie Black', 'charlie@acme.com', 'Product Designer', 'employee', 'mgr-2', FALSE, '2023-05-20');
INSERT INTO employee_permissions (employee_id, can_set_global_frequency, can_view_organization_wide, can_manage_settings) VALUES
('mgr-1', TRUE, TRUE, TRUE), ('mgr-2', TRUE, FALSE, TRUE);
INSERT INTO manager_settings (manager_id, global_frequency, allow_late_submissions) VALUES ('mgr-2', TRUE, TRUE);
INSERT INTO projects (id, organization_id, name, description, category, report_frequency, created_by) VALUES
('proj-1', 'org-1', 'Q4 Mobile App Launch', 'Launch the new iOS and Android apps before holidays.', 'Development', 'weekly', 'mgr-1');
INSERT INTO project_assignees (project_id, assignee_id, assignee_type) VALUES ('proj-1', 'mgr-2', 'manager'), ('proj-1', 'emp-1', 'employee'), ('proj-1', 'emp-2', 'employee');
INSERT INTO goals (id, name, project_id, instructions, manager_id, created_by, deadline) VALUES ('goal-1', 'Deliver Core API', 'proj-1', 'Deliver robust API endpoints.', 'mgr-2', 'mgr-2', '2025-12-31');
INSERT INTO criteria (id, goal_id, name, weight, display_order) VALUES ('crit-1', 'goal-1', 'Code Quality', 40, 1), ('crit-2', 'goal-1', 'Test Coverage', 30, 2), ('crit-3', 'goal-1', 'Documentation', 30, 3);


-- Add status column to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed'));

-- Add index for status
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- ============================================================================
-- 17. NOTIFICATIONS SYSTEM
-- ============================================================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('assignment', 'team_update', 'goal', 'performance', 'alert', 'info')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- RLS for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own notifications" ON notifications
    FOR SELECT USING (user_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

CREATE POLICY "Update own notifications" ON notifications
    FOR UPDATE USING (user_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid()));

-- ============================================================================
-- 18. NOTIFICATION TRIGGERS
-- ============================================================================

-- 1. Trigger: New Project Assignment
CREATE OR REPLACE FUNCTION notify_project_assignment()
RETURNS TRIGGER AS $$
DECLARE
    project_name TEXT;
BEGIN
    SELECT name INTO project_name FROM projects WHERE id = NEW.project_id;
    
    INSERT INTO notifications (user_id, type, title, message, link_url)
    VALUES (
        NEW.assignee_id,
        'assignment',
        'New Project Assignment',
        'You have been assigned to project: ' || project_name,
        '/projects/' || NEW.project_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_assignment
AFTER INSERT ON project_assignees
FOR EACH ROW
EXECUTE FUNCTION notify_project_assignment();

-- 2. Trigger: New Team Member (Notifies Manager)
CREATE OR REPLACE FUNCTION notify_new_team_member()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.manager_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, link_url)
        VALUES (
            NEW.manager_id,
            'team_update',
            'New Team Member',
            NEW.name || ' has joined your team.',
            '/employees/' || NEW.id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_team_member
AFTER INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION notify_new_team_member();

-- 3. Trigger: New Goal (Notifies Project Assignees)
CREATE OR REPLACE FUNCTION notify_new_goal()
RETURNS TRIGGER AS $$
DECLARE
    assignee_rec RECORD;
    project_name TEXT;
BEGIN
    SELECT name INTO project_name FROM projects WHERE id = NEW.project_id;

    FOR assignee_rec IN 
        SELECT assignee_id FROM project_assignees WHERE project_id = NEW.project_id
    LOOP
        -- Don't notify the person who created the goal (if they are an assignee)
        -- Assuming created_by matches assignee_id (both are employee IDs)
        IF assignee_rec.assignee_id != NEW.created_by THEN
            INSERT INTO notifications (user_id, type, title, message, link_url)
            VALUES (
                assignee_rec.assignee_id,
                'goal',
                'New Goal Added',
                'A new goal "' || NEW.name || '" has been added to project: ' || project_name,
                '/projects/' || NEW.project_id
            );
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_goal
AFTER INSERT ON goals
FOR EACH ROW
EXECUTE FUNCTION notify_new_goal();

-- 4. Trigger: Manager Feedback (Notifies Employee)
CREATE OR REPLACE FUNCTION notify_manager_feedback()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if manager feedback or score has changed (and it was done by a manager, implicit by who updates it usually, but simpler to just check change)
    -- We want to avoid notifying when the report is first created by the employee or AI
    -- This trigger runs on UPDATE.
    
    IF (OLD.manager_feedback IS DISTINCT FROM NEW.manager_feedback) OR 
       (OLD.manager_overall_score IS DISTINCT FROM NEW.manager_overall_score) THEN
       
       INSERT INTO notifications (user_id, type, title, message, link_url)
       VALUES (
           NEW.employee_id,
           'performance',
           'Report Feedback',
           'Your manager has updated feedback or scoring on your report.',
           '/dashboard' 
       );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_manager_feedback
AFTER UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION notify_manager_feedback();

CREATE POLICY "Manager update org reports" ON reports 
FOR UPDATE USING (
    is_manager() AND 
    EXISTS (
        SELECT 1 FROM employees 
        WHERE employees.id = reports.employee_id 
        AND employees.organization_id = get_my_org_id()
    )
);


-- Create knowledge_pins table
CREATE TABLE IF NOT EXISTS knowledge_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    section TEXT NOT NULL CHECK (section IN ('lexicon', 'priorities', 'benchmarks', 'constraints', 'general')),
    content TEXT NOT NULL,
    created_by TEXT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_pins_project_id ON knowledge_pins(project_id);

-- Add knowledge_base_cache to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS knowledge_base_cache JSONB;

-- Enable RLS
ALTER TABLE knowledge_pins ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- View: All members of the organization (aligned with project visibility)
CREATE POLICY "View project pins" ON knowledge_pins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = knowledge_pins.project_id
            AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
        )
    );

-- Manage: Only Managers
CREATE POLICY "Manager manage pins" ON knowledge_pins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE auth_user_id = auth.uid()
            AND role IN ('manager', 'admin')
            AND organization_id = (SELECT organization_id FROM projects WHERE projects.id = knowledge_pins.project_id)
        )
    );



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


-- 1. Add trigger to notify employee when explicitly assigned to a goal
-- 1. Add trigger to notify employee when explicitly assigned to a goal
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

DROP TRIGGER IF EXISTS on_goal_assignment ON goal_assignees;
CREATE TRIGGER on_goal_assignment
AFTER INSERT ON goal_assignees
FOR EACH ROW
EXECUTE FUNCTION notify_goal_assignment();
-- 2. Update the invitation flow to ensure all assignments are processed correctly
-- 2. Update the invitation flow to ensure all assignments are processed correctly
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