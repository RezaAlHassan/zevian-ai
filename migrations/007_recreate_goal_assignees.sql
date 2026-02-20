-- 007_recreate_goal_assignees.sql

-- 1. Drop existing policies and triggers dependent on goal_assignees
DROP POLICY IF EXISTS "View organization goal assignees" ON goal_assignees;
DROP POLICY IF EXISTS "Manager manage goal assignees" ON goal_assignees;
DROP TRIGGER IF EXISTS on_goal_assignment ON goal_assignees;

-- 2. Drop the table if it exists (CASCADE will remove dependent objects)
DROP TABLE IF EXISTS goal_assignees CASCADE;

-- 3. Re-create the table with EXPLICIT foreign key naming to help PostgREST
CREATE TABLE goal_assignees (
    id SERIAL PRIMARY KEY,
    goal_id TEXT NOT NULL,
    assignee_id TEXT NOT NULL,
    assignee_type TEXT NOT NULL CHECK (assignee_type IN ('employee', 'manager')),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (goal_id, assignee_id),
    
    -- Explicit constraints
    CONSTRAINT fk_goal_assignees_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
    CONSTRAINT fk_goal_assignees_assignee FOREIGN KEY (assignee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 4. Create Indexes
CREATE INDEX idx_goal_assignees_goal_id ON goal_assignees(goal_id);
CREATE INDEX idx_goal_assignees_assignee_id ON goal_assignees(assignee_id);

-- 5. Re-enable RLS
ALTER TABLE goal_assignees ENABLE ROW LEVEL SECURITY;

-- 6. Re-apply RLS Policies (using the robust, disambiguated versions)
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

-- 7. Re-apply the notification trigger
-- (The function notify_goal_assignment should already exist from migration 006, 
--  but we need to re-attach the trigger since we dropped the table)
CREATE TRIGGER on_goal_assignment
AFTER INSERT ON goal_assignees
FOR EACH ROW
EXECUTE FUNCTION notify_goal_assignment();
