-- Fix RLS policies for project_assignees table

-- 1. Enable RLS (just in case)
ALTER TABLE project_assignees ENABLE ROW LEVEL SECURITY;

-- 2. Policy: View organization project assignees
-- Allow all employees in the organization to view assignees
CREATE POLICY "View organization project assignees" ON project_assignees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_assignees.project_id 
      AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );

-- 3. Policy: Manager manage project assignees
-- Allow managers to insert/update/delete assignees for projects in their organization
CREATE POLICY "Manager manage project assignees" ON project_assignees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('manager', 'admin')
    )
    AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_assignees.project_id 
      AND projects.organization_id = (SELECT organization_id FROM employees WHERE auth_user_id = auth.uid() LIMIT 1)
    )
  );
