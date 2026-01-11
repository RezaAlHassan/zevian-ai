
// ============================================================================
// ORGANIZATION (Multi-Tenancy)
// ============================================================================
export interface Organization {
  id: string;
  name: string;
  planTier: 'free' | 'business' | 'enterprise';
  selectedMetrics?: string[];
  createdAt?: string;
}

// ============================================================================
// CRITERIA & PERMISSIONS
// ============================================================================
export type ScopeFilter = 'direct-reports' | 'organization' | 'reporting-chain';

export interface Criterion {
  id: string;
  name: string;
  weight: number; // Percentage (e.g., 40 for 40%)
}

export interface EmployeePermissions {
  canSetGlobalFrequency?: boolean; // Can set global frequency settings
  canViewOrganizationWide?: boolean; // Can view organization-wide data
  canManageSettings?: boolean; // Can manage settings
}

export type EmployeeRole = 'manager' | 'employee';

export interface Employee {
  id: string;
  organizationId: string; // Multi-tenancy: which organization this employee belongs to
  name: string;
  email: string;
  title?: string; // Job title entered during onboarding
  role: EmployeeRole; // 'manager' can read reports, 'employee' sends reports
  managerId?: string;
  permissions?: EmployeePermissions; // Permissions granted by account owner
  isAccountOwner?: boolean; // True if this user is the account creator/owner
  joinDate?: string; // ISO 8601 format date string
  authUserId?: string; // Link to Supabase Auth User
}

export interface Project {
  id: string;
  organizationId: string; // Multi-tenancy: which organization this project belongs to
  name: string;
  description?: string;
  category?: string;
  assignees?: Array<{
    type: 'employee' | 'manager';
    id: string;
  }>; // Multiple assignees - can be employees, managers, or empty array
  reportFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom';
  knowledgeBaseLink?: string;
  aiContext?: string; // Context for AI to keep track of project reports and updates
  createdBy?: string; // ID of the employee/manager who created this project
}

export interface Goal {
  id: string;
  name: string;
  projectId: string; // Parent project
  criteria: Criterion[];
  instructions: string; // Specific, objective instructions for AI evaluation
  deadline?: string; // ISO 8601 format date string
  managerId?: string; // ID of the manager who created this goal
  createdBy?: string; // ID of the employee/manager who created this goal (same as managerId for manager-created goals)
  createdAt?: string;
}

export interface ReportCriterionScore {
  criterionName: string; // Renamed from name to match DB schema
  score: number; // Score from 1-10
}

export interface Report {
  id: string;
  goalId: string;
  employeeId: string;
  reportText: string;
  submissionDate: string; // ISO 8601 format
  evaluationScore: number;
  managerOverallScore?: number;
  managerOverrideReasoning?: string; // Required justification when manager overrides score
  evaluationReasoning: string;
  criterionScores: ReportCriterionScore[]; // Renamed from evaluationCriteriaScores to match DB
}

export type Page = 'projects' | 'goals' | 'submit' | 'dashboard' | 'reports' | 'allReports' | 'employees' | 'employeeDetail' | 'goalDetail' | 'projectDetail' | 'settings';
export type ViewMode = 'manager' | 'employee'; // Deprecated - use Employee.role instead

export interface Invitation {
  id: string;
  token: string; // Unique token for invitation link
  email: string;
  role: EmployeeRole;
  organizationId: string; // Multi-tenancy: FK to organizations table
  invitedBy: string; // ID of the employee who sent the invitation
  invitedAt: string; // ISO 8601 format date string
  expiresAt?: string; // ISO 8601 format date string (optional expiration)
  acceptedAt?: string; // ISO 8601 format date string (when invitation was accepted)
  status: 'pending' | 'accepted' | 'expired';
  initialProjectId?: string;
  initialManagerId?: string;
}

export interface ManagerSettings {
  selectedDays?: string[]; // Selected days for reporting (e.g., ['Monday', 'Tuesday', 'Wednesday']) - reports repeat on these days every week
  globalFrequency: boolean; // If true, applies to all employees; if false, per-employee/project settings
  employeeFrequencies?: {
    [employeeId: string]: {
      selectedDays?: string[];
    }
  }; // Per-employee frequencies (highest precedence)
  projectFrequencies?: {
    [projectId: string]: {
      selectedDays?: string[];
    }
  }; // Per-project frequencies (takes precedence over global)
  // Precedence: Global < Project < Per-Employee
  allowLateSubmissions?: boolean; // If false, reports cannot be submitted after goal deadline
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy?: string;
  uploadedAt?: string;
}
