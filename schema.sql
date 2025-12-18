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
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS organizations CASCADE; -- Added for multi-tenancy prep

-- ============================================================================
-- 1. ORGANIZATIONS (New - Critical for B2B SaaS/VC Funding)
-- ============================================================================
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan_tier TEXT DEFAULT 'free', -- monetization hook
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PROJECTS TABLE
-- ============================================================================
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id), -- Multi-tenancy hook
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
    organization_id TEXT REFERENCES organizations(id), -- Multi-tenancy hook
    auth_user_id UUID, -- Links to Supabase Auth User (auth.users)
    name TEXT NOT NULL,
    email TEXT NOT NULL, -- Removed UNIQUE global constraint for multi-tenancy safety later
    title TEXT,
    role TEXT NOT NULL CHECK (role IN ('manager', 'employee', 'admin')),
    manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL,
    is_account_owner BOOLEAN DEFAULT FALSE,
    join_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, organization_id) -- User can exist in different orgs
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
-- 6. GOALS TABLE
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
-- 7. CRITERIA TABLE
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
-- 8. REPORTS TABLE
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
    evaluation_reasoning TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_goal_id ON reports(goal_id);
CREATE INDEX idx_reports_employee_id ON reports(employee_id);
CREATE INDEX idx_reports_submission_date ON reports(submission_date);

-- ============================================================================
-- 9. REPORT CRITERION SCORES TABLE
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
-- 10. INVITATIONS TABLE
-- ============================================================================
CREATE TABLE invitations (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('manager', 'employee')),
    organization_id TEXT NOT NULL REFERENCES organizations(id), -- Linked to org
    invited_by TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    invited_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ============================================================================
-- 11. MANAGER SETTINGS TABLE
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

-- ============================================================================
-- 12. SELECTED DAYS & FREQUENCY OVERRIDES
-- ============================================================================
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

-- Apply triggers to relevant tables
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manager_settings_updated_at BEFORE UPDATE ON manager_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Enable RLS on all tables
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

-- Helper Function: Get Current User's Organization ID
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS TEXT AS $$
  SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper Function: Check if Current User is Manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('manager', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- POLICIES
-- ----------------------------------------------------------------------------

-- [Previous Policies...]

-- MANAGER SETTINGS
-- Managers can view/update their own settings
CREATE POLICY "Manage own settings" ON manager_settings
  FOR ALL USING (
    manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
  );
-- Employees might need to read their manager's global settings? 
-- For simplicity, let's allow read if in same org (to check allow_late_submissions etc)
CREATE POLICY "View org manager settings" ON manager_settings
  FOR SELECT USING (
    manager_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id())
  );


-- MANAGER SELECTED DAYS
CREATE POLICY "Manage own selected days" ON manager_selected_days
  FOR ALL USING (
    manager_settings_id IN (
      SELECT id FROM manager_settings 
      WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "View org selected days" ON manager_selected_days
  FOR SELECT USING (
    manager_settings_id IN (
        SELECT id FROM manager_settings 
        WHERE manager_id IN (SELECT id FROM employees WHERE organization_id = get_my_org_id())
    )
  );


-- EMPLOYEE FREQUENCY SETTINGS
CREATE POLICY "Manage emp freq settings" ON employee_frequency_settings
  FOR ALL USING (
    manager_settings_id IN (
      SELECT id FROM manager_settings 
      WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "View own freq settings" ON employee_frequency_settings
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
  );


-- EMPLOYEE FREQUENCY DAYS
CREATE POLICY "Manage emp freq days" ON employee_frequency_days
  FOR ALL USING (
    employee_frequency_id IN (
      SELECT efs.id FROM employee_frequency_settings efs
      JOIN manager_settings ms ON efs.manager_settings_id = ms.id
      WHERE ms.manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "View own freq days" ON employee_frequency_days
  FOR SELECT USING (
    employee_frequency_id IN (
      SELECT efs.id FROM employee_frequency_settings efs
      WHERE efs.employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
    )
  );


-- PROJECT FREQUENCY SETTINGS
CREATE POLICY "Manage proj freq settings" ON project_frequency_settings
  FOR ALL USING (
    manager_settings_id IN (
      SELECT id FROM manager_settings 
      WHERE manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
    )
  );
  
CREATE POLICY "View proj freq settings" ON project_frequency_settings
  FOR SELECT USING (
    project_id IN (
       SELECT id FROM projects WHERE organization_id = get_my_org_id()
    )
  );


-- PROJECT FREQUENCY DAYS
CREATE POLICY "Manage proj freq days" ON project_frequency_days
  FOR ALL USING (
    project_frequency_id IN (
      SELECT pfs.id FROM project_frequency_settings pfs
      JOIN manager_settings ms ON pfs.manager_settings_id = ms.id
      WHERE ms.manager_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "View proj freq days" ON project_frequency_days
  FOR SELECT USING (
    project_frequency_id IN (
       SELECT pfs.id FROM project_frequency_settings pfs
       JOIN projects p ON pfs.project_id = p.id
       WHERE p.organization_id = get_my_org_id()
    )
  );

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS TEXT AS $$
  SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper Function: Check if Current User is Manager
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('manager', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- POLICIES
-- ----------------------------------------------------------------------------

-- ORGANIZATIONS
-- Users can view their own organization
CREATE POLICY "View own organization" ON organizations
  FOR SELECT USING (
    id = get_my_org_id()
  );
-- Only new users (during registration) or admins can insert (Handled typically via function/trigger or public if open reg)
-- For now, allowing insert if authenticated (for onboarding flow)
CREATE POLICY "Create organization" ON organizations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- EMPLOYEES
-- Users can view their own profile
CREATE POLICY "View own profile" ON employees
  FOR SELECT USING (
    auth_user_id = auth.uid()
  );

-- Users can view other employees in the same organization
CREATE POLICY "View org employees" ON employees
  FOR SELECT USING (
    organization_id = get_my_org_id()
  );

-- Users can update their own profile (limited fields typically, but open for now)
CREATE POLICY "Update own profile" ON employees
  FOR UPDATE USING (
    auth_user_id = auth.uid()
  );

-- Managers can update their organization's employees
CREATE POLICY "Manager update employees" ON employees
  FOR UPDATE USING (
    is_manager() AND organization_id = get_my_org_id()
  );

-- Allow Insert during onboarding/invite acceptance (often needs to be open or handled by service role)
-- We'll allow authenticated users to insert if they are creating their own profile (Owner) or if they are a manager inviting someone
CREATE POLICY "Create employee" ON employees
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
  );


-- PROJECTS
-- Visible to organization members
CREATE POLICY "View organization projects" ON projects
  FOR SELECT USING (
    organization_id = get_my_org_id()
  );

-- Managers can insert/update/delete
CREATE POLICY "Manager manage projects" ON projects
  FOR ALL USING (
    is_manager() AND organization_id = get_my_org_id()
  );


-- GOALS
-- Visible to organization members
CREATE POLICY "View organization goals" ON goals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = goals.project_id AND projects.organization_id = get_my_org_id())
  );

-- Managers can manage goals
CREATE POLICY "Manager manage goals" ON goals
  FOR ALL USING (
    is_manager() AND EXISTS (SELECT 1 FROM projects WHERE projects.id = goals.project_id AND projects.organization_id = get_my_org_id())
  );


-- REPORTS
-- Employees can view their own reports
CREATE POLICY "View own reports" ON reports
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
  );

-- Managers can view reports from their organization
CREATE POLICY "Manager view org reports" ON reports
  FOR SELECT USING (
    is_manager() AND EXISTS (SELECT 1 FROM employees WHERE employees.id = reports.employee_id AND employees.organization_id = get_my_org_id())
  );

-- Employees can insert their own reports
CREATE POLICY "Create own reports" ON reports
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
  );

-- Employees can update their own reports (if not approved yet? - keeping simple for now)
CREATE POLICY "Update own reports" ON reports
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM employees WHERE auth_user_id = auth.uid())
  );


-- INVITATIONS
-- Managers can view/create invitations
CREATE POLICY "Manager manage invitations" ON invitations
  FOR ALL USING (
    is_manager() AND organization_id = get_my_org_id()
  );
-- Public (unauthenticated) read access might be needed for "Accept Invite" page to validate token?
-- Actually, strict RLS usually blocks this. We might need a secure function or allow "anon" select on token only.
-- For simplicity, allowing select on invitations for everyone (security by high entropy token)
CREATE POLICY "Read invitations by token" ON invitations
  FOR SELECT USING (true);


-- ============================================================================
-- 1. SETUP ORGANIZATION (Multi-Tenancy Root)
-- ============================================================================
INSERT INTO organizations (id, name, plan_tier) VALUES
('org-1', 'Acme Corp', 'business');

-- ============================================================================
-- 2. INSERT EMPLOYEES & MANAGERS
-- ============================================================================
-- HIERARCHY:
-- Sarah (VP/Owner) -> Manages -> Mike (Mid-level Manager)
-- Mike (Manager)   -> Manages -> Alice, Bob, Charlie (Employees)

INSERT INTO employees (id, organization_id, name, email, title, role, manager_id, is_account_owner, join_date) VALUES
-- MANAGER 1: The "Account Owner" / VP
('mgr-1', 'org-1', 'Sarah Connor', 'sarah@acme.com', 'VP of Engineering', 'manager', NULL, TRUE, '2023-01-01'),

-- MANAGER 2: The "Team Lead" (Reports to Sarah)
('mgr-2', 'org-1', 'Mike Ross', 'mike@acme.com', 'Engineering Lead', 'manager', 'mgr-1', FALSE, '2023-03-15'),

-- EMPLOYEE 1: Backend Dev (Weekly Reports)
('emp-1', 'org-1', 'Alice Wu', 'alice@acme.com', 'Senior Backend Engineer', 'employee', 'mgr-2', FALSE, '2023-04-01'),

-- EMPLOYEE 2: Frontend Dev (Daily Reports - High Frequency)
('emp-2', 'org-1', 'Bob Smith', 'bob@acme.com', 'Frontend Developer', 'employee', 'mgr-2', FALSE, '2023-04-10'),

-- EMPLOYEE 3: Designer (Bi-Weekly Reports)
('emp-3', 'org-1', 'Charlie Black', 'charlie@acme.com', 'Product Designer', 'employee', 'mgr-2', FALSE, '2023-05-20');

-- ============================================================================
-- 3. PERMISSIONS
-- ============================================================================
INSERT INTO employee_permissions (employee_id, can_set_global_frequency, can_view_organization_wide, can_manage_settings) VALUES
('mgr-1', TRUE, TRUE, TRUE),  -- VP has full access
('mgr-2', TRUE, FALSE, TRUE); -- Team Lead can manage settings but view only their team

-- ============================================================================
-- 4. MANAGER SETTINGS (The "Frequency" Feature)
-- ============================================================================
-- Mike (mgr-2) sets a default frequency, but overrides it for specific employees
INSERT INTO manager_settings (manager_id, global_frequency, allow_late_submissions) VALUES
('mgr-2', TRUE, TRUE);

-- Override: Bob does DAILY reports (e.g., Sprint crunch time)
INSERT INTO employee_frequency_settings (manager_settings_id, employee_id) 
SELECT id, 'emp-2' FROM manager_settings WHERE manager_id = 'mgr-2';

-- Set Bob's required days to Mon-Fri
INSERT INTO employee_frequency_days (employee_frequency_id, day_name)
SELECT efs.id, unnest(ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
FROM employee_frequency_settings efs
JOIN manager_settings ms ON efs.manager_settings_id = ms.id
WHERE ms.manager_id = 'mgr-2' AND efs.employee_id = 'emp-2';

-- ============================================================================
-- 5. PROJECTS & GOALS (To test AI Scoring)
-- ============================================================================
-- Project
INSERT INTO projects (id, organization_id, name, description, category, report_frequency, created_by) VALUES
('proj-1', 'org-1', 'Q4 Mobile App Launch', 'Launch the new iOS and Android apps before holidays.', 'Development', 'weekly', 'mgr-1');

-- Assign Team to Project
INSERT INTO project_assignees (project_id, assignee_id, assignee_type) VALUES
('proj-1', 'mgr-2', 'manager'),
('proj-1', 'emp-1', 'employee'),
('proj-1', 'emp-2', 'employee');

-- Goal
INSERT INTO goals (id, name, project_id, instructions, manager_id, created_by, deadline) VALUES
('goal-1', 'Deliver Core API', 'proj-1', 
 'Deliver robust API endpoints with >90% test coverage. Focus on performance and security.', 
 'mgr-2', 'mgr-2', '2025-12-31');

-- Scoring Criteria (Weighted)
INSERT INTO criteria (id, goal_id, name, weight, display_order) VALUES
('crit-1', 'goal-1', 'Code Quality', 40, 1),
('crit-2', 'goal-1', 'Test Coverage', 30, 2),
('crit-3', 'goal-1', 'Documentation', 30, 3);

-- ============================================================================
-- 6. SAMPLE REPORTS (With AI Scores)
-- ============================================================================
-- A high-performing report from Alice
INSERT INTO reports (id, goal_id, employee_id, report_text, submission_date, evaluation_score, manager_overall_score, evaluation_reasoning) VALUES
('rpt-1', 'goal-1', 'emp-1', 
 'Completed the User Auth endpoints. Achieved 95% test coverage using Jest. Updated Swagger docs to reflect new token format.', 
 NOW() - INTERVAL '2 days', 
 9.2, -- AI Score
 9.5, -- Manager slightly bumped it up
 'Strong work on the testing coverage. The documentation update was crucial for the frontend team.');

-- Detailed Breakdown for Alice's report
INSERT INTO report_criterion_scores (report_id, criterion_name, score) VALUES
('rpt-1', 'Code Quality', 9.0),
('rpt-1', 'Test Coverage', 9.5),
('rpt-1', 'Documentation', 9.0);


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
