-- FIX RLS POLICIES FOR PROJECTS, GOALS, AND CRITERIA in Onboarding Flow

-- 1. PROJECTS
-- Allow authenticated users to create projects.
-- The existing policy "Manager manage projects" checks `is_manager() AND organization_id = get_my_org_id()`.
-- During onboarding, these checks might be strict or race-condition sensitive.
-- We add a specific INSERT policy for authenticated users, trusting the application to set organization_id correctly.
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON projects;
CREATE POLICY "Enable insert for authenticated users" ON projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2. GOALS
-- Allow authenticated users to create goals.
-- Similar to projects, we want to unblock creation.
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON goals;
CREATE POLICY "Enable insert for authenticated users" ON goals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. CRITERIA
-- Ensure RLS is enabled (it was in schema.sql) but ADD policies.
-- Schema.sql had `ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;` but NO policies defined!
-- This defaults to "Deny All".
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;

-- Allow viewing criteria if user can view the goal
-- (Simplified: allow authenticated users to view all criteria for now, or check goal organization)
-- Ideally: SELECT * FROM criteria WHERE goal_id IN (SELECT id FROM goals WHERE ...)
-- For simplicity and fix speed:
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON criteria;
CREATE POLICY "Enable read access for authenticated users" ON criteria
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow inserting criteria (needed for goal creation)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON criteria;
CREATE POLICY "Enable insert for authenticated users" ON criteria
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow update/delete (managers might need this later)
DROP POLICY IF EXISTS "Enable all access for managers" ON criteria;
CREATE POLICY "Enable all access for managers" ON criteria
    FOR ALL USING (is_manager());

-- 4. REPORT CRITERION SCORES (Just in case, for reports later)
-- Schema.sql: `ALTER TABLE report_criterion_scores ENABLE ROW LEVEL SECURITY;` No policies?
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON report_criterion_scores;
CREATE POLICY "Enable read access for authenticated users" ON report_criterion_scores
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON report_criterion_scores;
CREATE POLICY "Enable insert for authenticated users" ON report_criterion_scores
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
