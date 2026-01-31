# Access Control & RBAC System

This document outlines the Role-Based Access Control (RBAC) system implemented in Zevian. The system is designed around multi-tenancy, ensuring data isolation between organizations while providing granular control within each organization.

## User Roles

There are two primary roles in the system, defined by the `role` property on the `Employee` record:

| Role | Primary Purpose |
| :--- | :--- |
| **Employee** | Focuses on submitting performance reports and tracking personal goals. |
| **Manager** | Focuses on team leadership, project management, and evaluating reports. |

---

## Account Owner (Superuser)

The **Account Owner** is the user who initially created the organization. This role is identified by the `isAccountOwner: true` flag.

- **Status**: The Account Owner has permanent "Senior" status.
- **Access**: Full, unrestricted access to all organization data, settings, and hierarchy management.
- **Uniqueness**: There is exactly one Account Owner per organization.

---

## Manager Permission Levels

Managers can be granted granular permissions by the Account Owner. These permissions are managed in the **Organization > Hierarchy** tab.

### 1. Standard Manager
A manager with no additional permission flags.
- **Visibility**: Can only see data (projects, goals, reports) for their **Direct Reports**.
- **Actions**: Can create projects and goals, but cannot modify organization-wide settings.

### 2. Senior Manager
A manager with all permission flags enabled.
- **Visibility**: Can toggle between "Direct Reports" and "Organization" visibility in the header.
- **Actions**: Can access organization settings, modify global reporting frequencies, and manage the hierarchy.

---

## Granular Permissions Reference

Permissions are defined in `utils/managerPermissions.ts` and stored in the `permissions` object on the `Employee` record:

| Permission | Functionality |
| :--- | :--- |
| `canViewOrganizationWide` | Allows viewing all reports and projects across the entire organization. |
| `canManageSettings` | Allows access to the Organization Management page and its general settings. |
| `canSetGlobalFrequency` | Allows modifying the "Global" reporting frequency in the Reporting tab. |

---

## Interface Adaptations

The UI dynamically adjusts based on the active role and permissions:

### Sidebar & Navigation
- **Managers**: See "Employees", "Reports" (all filtered), and "Organization" links.
- **Employees**: See "My Reports" and personal "Dashboard".

### Visibility Scopes (Header)
Managers with `canViewOrganizationWide` see a dropdown in the header to switch visibility between:
- **Direct Reports**: Only employees reporting directly to them.
- **My Reporting Chain**: (If applicable) The full hierarchy below them.
- **Organization**: Every employee in the organization.

### Route Protection
- **Employee-only routes**: `/submit`, `/reports`.
- **Manager-only routes**: `/employees`, `/all-reports`, `/organization`.
- **Owner/Senior-only features**: Found within the `/organization` sub-tabs (Hierarchy, Advanced).

---

## Database Security (RLS)
Access control is enforced at the database level using Supabase Row Level Security (RLS). Users can only query data that belongs to their `organization_id`, and further filtered by their role's scope where applicable.
