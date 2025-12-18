# Project Visibility Documentation

This document describes what affects the visibility of projects from both an employee's perspective and a manager's perspective.

## Employee Perspective

### Projects Visible to Employees

An employee can see projects that meet the following criteria:

1. **Direct Assignment**: Projects where `project.assignee.type === 'employee'` AND `project.assignee.id === currentEmployeeId`
   - The project must be directly assigned to the employee
   - Projects are assigned to individual employees only (no team assignments)

### Implementation Details

- **Location**: `pages/ProjectsPage.tsx`
- **Filtering Logic**:
  ```typescript
  const visibleProjects = useMemo(() => {
    if (viewMode === 'employee' && currentEmployeeId) {
      return projects.filter(project => 
        project.assignee.type === 'employee' && 
        project.assignee.id === currentEmployeeId
      );
    }
    // ... other view modes
  }, [projects, currentEmployeeId, viewMode]);
  ```

### Key Points

- Employees **only** see projects assigned directly to them
- There is no team-based project assignment
- Projects are filtered by the employee's ID (`currentEmployeeId`)
- The visibility is enforced in the `ProjectsPage` component

---

## Manager Perspective

### Projects Visible to Managers

A manager can see projects based on their scope and permissions:

#### 1. **Direct Reports Scope** (Default)
Managers see projects assigned to their **direct reports** only:
- Projects where `project.assignee.type === 'employee'` AND the assignee's `managerId === currentManagerId`
- This is the default scope filter

#### 2. **Organization-Wide Scope** (Requires Permission)
Managers with `canViewOrganizationWide` permission can see:
- **All projects** in the organization
- This requires the `canViewOrganizationWide` permission to be granted by the account owner

### Implementation Details

- **Location**: `pages/ProjectsPage.tsx`
- **Filtering Logic**:
  ```typescript
  const visibleProjects = useMemo(() => {
    if (viewMode === 'manager' && currentManagerId) {
      // Get direct report IDs
      const directReportIds = new Set(
        employees.filter(emp => emp.managerId === currentManagerId)
          .map(emp => emp.id)
      );
      
      return projects.filter(project => 
        project.assignee.type === 'employee' && 
        directReportIds.has(project.assignee.id)
      );
    }
    // Default: show all projects (for admin/account owner)
    return projects;
  }, [projects, employees, currentManagerId, viewMode]);
  ```

### Scope Filtering

Managers can filter their view using scope filters (available in Dashboard, Employees, All Reports pages):
- **Direct Reports**: Shows only projects assigned to direct reports
- **Entire Organization**: Shows all projects (requires `canViewOrganizationWide` permission)

### Key Points

- Managers see projects based on their **hierarchical scope**
- Direct reports scope is the default (no special permission needed)
- Organization-wide view requires `canViewOrganizationWide` permission
- Projects are always assigned to individual employees (no team assignments)
- The visibility is enforced in the `ProjectsPage` component

---

## Project Assignment Model

### Current Implementation

- **Assignee Type**: Projects can only be assigned to `'employee'` type
- **No Team Assignments**: Teams feature has been removed; projects cannot be assigned to teams
- **Multiple Assignments**: A single project can be assigned to multiple employees (each assignment creates a separate project instance with the same name but different assignee)

### Project Creation

When creating a project:
1. Select one or more employees from the employee list
2. For each selected employee, a project is created with:
   - Same project name, description, category, frequency
   - Different `assignee.id` (the employee's ID)
   - Unique project ID

---

## Related Components

- **ProjectsPage**: Main component for viewing and creating projects
- **ProjectDetailPage**: Shows details of a specific project
- **GoalsPage**: Shows goals filtered by visible projects
- **SubmitReportPage**: Shows projects available for report submission (filtered by employee assignment)

---

## Permission-Based Visibility

### Account Owner
- Can see all projects organization-wide
- Has `canViewOrganizationWide: true` by default

### Managers with `canViewOrganizationWide` Permission
- Can toggle between "Direct Reports" and "Entire Organization" scope
- Can see all projects when "Entire Organization" is selected

### Managers without `canViewOrganizationWide` Permission
- Can only see projects assigned to their direct reports
- "Entire Organization" option is not available in scope filters

---

## Summary

| User Type | Visible Projects | Scope Filter Options |
|-----------|-----------------|---------------------|
| **Employee** | Projects assigned directly to them | N/A |
| **Manager (no org-wide permission)** | Projects assigned to direct reports | Direct Reports only |
| **Manager (with org-wide permission)** | All projects OR direct reports | Direct Reports, Entire Organization |
| **Account Owner** | All projects | Direct Reports, Entire Organization |

