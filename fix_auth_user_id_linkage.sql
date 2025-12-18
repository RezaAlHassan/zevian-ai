-- ============================================================================
-- FIX: Missing Projects/Goals After Account Switch
-- ============================================================================
-- PROBLEM: When switching from employee to owner/manager account, projects
-- and goals disappear because RLS policies can't find the employee record.
--
-- ROOT CAUSE: The `get_my_org_id()` function returns NULL if there's no
-- employee record with `auth_user_id = auth.uid()`. This causes all RLS
-- policies to fail, blocking access to projects, goals, and other data.
--
-- SOLUTION: Ensure all employee records have the correct auth_user_id linked.
-- ============================================================================

-- Step 1: Check current state - Find employees without auth_user_id
SELECT 
    id,
    name,
    email,
    role,
    is_account_owner,
    organization_id,
    auth_user_id,
    CASE 
        WHEN auth_user_id IS NULL THEN '❌ MISSING'
        ELSE '✅ LINKED'
    END as status
FROM employees
ORDER BY is_account_owner DESC, role, name;

-- Step 2: Find auth users that might need linking
-- (This requires access to auth.users which may not be available in client queries)
-- Run this in Supabase SQL Editor:
/*
SELECT 
    au.id as auth_user_id,
    au.email,
    e.id as employee_id,
    e.name as employee_name,
    e.auth_user_id as current_link
FROM auth.users au
LEFT JOIN employees e ON e.email = au.email
WHERE e.id IS NOT NULL
ORDER BY au.email;
*/

-- Step 3: MANUAL FIX - Update specific employee records
-- Replace the values below with actual data from your database

-- Example: Link reza@jayga.io to their auth user
-- First, get the auth user ID from Supabase Auth dashboard or by running:
-- SELECT id, email FROM auth.users WHERE email = 'reza@jayga.io';

-- Then update the employee record:
-- UPDATE employees 
-- SET auth_user_id = '<AUTH_USER_ID_FROM_SUPABASE_AUTH>'
-- WHERE email = 'reza@jayga.io';

-- Step 4: AUTOMATED FIX (if you have service role access)
-- This function can auto-link employees to auth users by email
CREATE OR REPLACE FUNCTION link_employees_to_auth()
RETURNS TABLE(employee_id TEXT, email TEXT, auth_user_id UUID, status TEXT) AS $$
BEGIN
    RETURN QUERY
    UPDATE employees e
    SET auth_user_id = au.id
    FROM auth.users au
    WHERE e.email = au.email 
      AND e.auth_user_id IS NULL
    RETURNING e.id, e.email, e.auth_user_id, 'LINKED'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the auto-link function:
-- SELECT * FROM link_employees_to_auth();

-- Step 5: Verify the fix
-- After linking, verify that get_my_org_id() works correctly
-- Log in as each user and run:
SELECT 
    auth.uid() as current_auth_user,
    get_my_org_id() as my_org_id,
    (SELECT email FROM employees WHERE auth_user_id = auth.uid()) as my_email,
    (SELECT role FROM employees WHERE auth_user_id = auth.uid()) as my_role;

-- If get_my_org_id() returns NULL, the auth_user_id is not linked correctly

-- Step 6: Test data visibility
-- After fixing auth_user_id linkage, test that projects are visible:
SELECT 
    p.id,
    p.name,
    p.organization_id,
    p.created_by,
    get_my_org_id() as my_org_id,
    CASE 
        WHEN p.organization_id = get_my_org_id() THEN '✅ VISIBLE'
        ELSE '❌ HIDDEN'
    END as visibility_status
FROM projects p
ORDER BY p.created_at DESC;

-- ============================================================================
-- ADDITIONAL DEBUGGING QUERIES
-- ============================================================================

-- Check if RLS is blocking queries
-- If this returns 0 rows but you know projects exist, RLS is blocking access
SELECT COUNT(*) as project_count FROM projects;

-- Check what organization the current user belongs to
SELECT 
    e.id,
    e.name,
    e.email,
    e.organization_id,
    e.auth_user_id,
    auth.uid() as current_auth_uid,
    CASE 
        WHEN e.auth_user_id = auth.uid() THEN '✅ MATCH'
        ELSE '❌ MISMATCH'
    END as auth_match
FROM employees e
WHERE e.auth_user_id = auth.uid()
   OR e.email = (SELECT email FROM auth.users WHERE id = auth.uid());

-- ============================================================================
-- PREVENTION: Ensure future employee records are created with auth_user_id
-- ============================================================================

-- Update the employee creation logic in your application to ALWAYS include
-- auth_user_id when creating employee records. See App.tsx line 422-431
-- and line 357-365 for examples.

-- Example from App.tsx (already correct):
/*
const ownerEmployee: Employee = {
  id: `emp-${Date.now()}`,
  organizationId: newOrgId,
  name: user.user_metadata.name || 'Organization Owner',
  email: user.email || '',
  role: 'manager',
  isAccountOwner: true,
  joinDate: new Date().toISOString(),
  authUserId: user.id  // ← CRITICAL: This must be set!
};
*/
