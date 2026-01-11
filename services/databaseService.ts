import { supabase } from './supabaseClient';
import type { Project, Goal, Report, Employee, Organization } from '../types';

// ============================================================================
// ORGANIZATIONS SERVICE (Multi-Tenancy)
// ============================================================================
export const organizationService = {
    async getById(id: string) {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            planTier: data.plan_tier,
            selectedMetrics: data.selected_metrics,
            createdAt: data.created_at
        } as Organization;
    },

    async create(organization: Omit<Organization, 'createdAt'>) {
        const { error } = await supabase
            .from('organizations')
            .insert({
                id: organization.id,
                name: organization.name,
                plan_tier: organization.planTier,
                selected_metrics: organization.selectedMetrics,
            });
        // Do NOT select() here because the user cannot "view" the organization 
        // until their employee record is created (which happens next).
        // RLS "View own organization" depends on get_my_org_id() -> employee table.

        if (error) throw error;
        return { ...organization, createdAt: new Date().toISOString() } as Organization;
    },

    async update(id: string, updates: Partial<Organization>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.planTier !== undefined) dbUpdates.plan_tier = updates.planTier;
        if (updates.selectedMetrics !== undefined) dbUpdates.selected_metrics = updates.selectedMetrics;

        const { data, error } = await supabase
            .from('organizations')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            planTier: data.plan_tier,
            selectedMetrics: data.selected_metrics,
            createdAt: data.created_at
        } as Organization;
    },
};

// ============================================================================
// PROJECTS SERVICE
// ============================================================================

// Helper function to convert database project to TypeScript Project
function dbProjectToProject(dbProject: any): Project {
    return {
        id: dbProject.id,
        organizationId: dbProject.organization_id,
        name: dbProject.name,
        description: dbProject.description,
        category: dbProject.category,
        reportFrequency: dbProject.report_frequency,
        knowledgeBaseLink: dbProject.knowledge_base_link,
        aiContext: dbProject.ai_context,
        createdBy: dbProject.created_by,
        assignees: [], // Assignees are loaded separately
    };
}

export const projectService = {
    async getAll() {
        const { data, error } = await supabase
            .from('projects')
            .select('*, project_assignees(assignee_id, assignee_type)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbProject => ({
            ...dbProjectToProject(dbProject),
            assignees: dbProject.project_assignees?.map((pa: any) => ({
                id: pa.assignee_id,
                type: pa.assignee_type
            })) || []
        })) : [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('projects')
            .select('*, project_assignees(assignee_id, assignee_type)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return {
            ...dbProjectToProject(data),
            assignees: data.project_assignees?.map((pa: any) => ({
                id: pa.assignee_id,
                type: pa.assignee_type
            })) || []
        };
    },

    async create(project: Omit<Project, 'createdAt' | 'updatedAt'>) {
        console.log("projectService.create called with:", project);
        const { error } = await supabase
            .from('projects')
            .insert({
                id: project.id,
                organization_id: project.organizationId,
                name: project.name,
                description: project.description,
                category: project.category,
                report_frequency: project.reportFrequency,
                knowledge_base_link: project.knowledgeBaseLink,
                ai_context: project.aiContext,
                created_by: project.createdBy,
            });
        // Removed .select() to avoid RLS 403 race condition

        if (error) {
            console.error("Supabase Project Insert Error:", error);
            throw error;
        }

        // Insert assignees
        if (project.assignees && project.assignees.length > 0) {
            const assigneesToInsert = project.assignees.map(a => ({
                project_id: project.id,
                assignee_id: a.id,
                assignee_type: a.type
            }));
            const { error: assigneesError } = await supabase
                .from('project_assignees')
                .insert(assigneesToInsert);

            if (assigneesError) throw assigneesError;
        }

        return {
            ...project,
            assignees: project.assignees || []
        } as Project;
    },

    async update(id: string, updates: Partial<Project>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.reportFrequency !== undefined) dbUpdates.report_frequency = updates.reportFrequency;
        if (updates.knowledgeBaseLink !== undefined) dbUpdates.knowledge_base_link = updates.knowledgeBaseLink;
        if (updates.aiContext !== undefined) dbUpdates.ai_context = updates.aiContext;

        const { data, error } = await supabase
            .from('projects')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // Update assignees if provided
        if (updates.assignees) {
            // Delete existing assignees
            const { error: deleteError } = await supabase
                .from('project_assignees')
                .delete()
                .eq('project_id', id);
            if (deleteError) throw deleteError;

            // Insert new assignees
            if (updates.assignees.length > 0) {
                const assigneesToInsert = updates.assignees.map(a => ({
                    project_id: id,
                    assignee_id: a.id,
                    assignee_type: a.type
                }));
                const { error: insertError } = await supabase
                    .from('project_assignees')
                    .insert(assigneesToInsert);
                if (insertError) throw insertError;
            }
        }

        // Return updated project with assignees
        return this.getById(id);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    async getAssignees(projectId: string) {
        const { data, error } = await supabase
            .from('project_assignees')
            .select('assignee_id, assignee_type, employees(*)')
            .eq('project_id', projectId);
        if (error) throw error;
        return data;
    },

    async assignEmployee(projectId: string, employeeId: string, assigneeType: 'employee' | 'manager') {
        const { data, error } = await supabase
            .from('project_assignees')
            .insert({
                project_id: projectId,
                assignee_id: employeeId,
                assignee_type: assigneeType,
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async unassignEmployee(projectId: string, employeeId: string) {
        const { error } = await supabase
            .from('project_assignees')
            .delete()
            .eq('project_id', projectId)
            .eq('assignee_id', employeeId);
        if (error) throw error;
    },
};

// ============================================================================
// GOALS SERVICE
// ============================================================================

// Helper function to convert database goal to TypeScript Goal
function dbGoalToGoal(dbGoal: any): Goal {
    return {
        id: dbGoal.id,
        name: dbGoal.name,
        projectId: dbGoal.project_id,
        criteria: dbGoal.criteria ? dbGoal.criteria.map((c: any) => ({
            id: c.id,
            name: c.name,
            weight: c.weight
        })) : [],
        instructions: dbGoal.instructions,
        deadline: dbGoal.deadline,
        managerId: dbGoal.manager_id,
        createdBy: dbGoal.created_by,
        createdAt: dbGoal.created_at,
    };
}

export const goalService = {
    async getAll() {
        const { data, error } = await supabase
            .from('goals')
            .select('*, projects(*), criteria(*)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbGoalToGoal) : [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('goals')
            .select('*, projects(*), criteria(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return dbGoalToGoal(data);
    },

    async getByProjectId(projectId: string) {
        const { data, error } = await supabase
            .from('goals')
            .select('*, criteria(*)')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbGoalToGoal) : [];
    },

    async create(goal: Omit<Goal, 'createdAt' | 'updatedAt'>) {
        // Insert goal
        const { error: goalError } = await supabase
            .from('goals')
            .insert({
                id: goal.id,
                name: goal.name,
                project_id: goal.projectId,
                instructions: goal.instructions,
                deadline: goal.deadline,
                manager_id: goal.managerId,
                created_by: goal.createdBy,
            });
        // Removed .select() to avoid RLS 403 race condition

        if (goalError) throw goalError;

        // Insert criteria
        if (goal.criteria && goal.criteria.length > 0) {
            const criteriaToInsert = goal.criteria.map((criterion, index) => ({
                id: criterion.id,
                goal_id: goal.id,
                name: criterion.name,
                weight: criterion.weight,
                display_order: index,
            }));

            const { error: criteriaError } = await supabase
                .from('criteria')
                .insert(criteriaToInsert);
            if (criteriaError) throw criteriaError;
        }

        return {
            ...goal,
            criteria: goal.criteria || []
        } as Goal;
    },

    async update(id: string, updates: Partial<Goal>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.instructions !== undefined) dbUpdates.instructions = updates.instructions;
        if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
        if (updates.managerId !== undefined) dbUpdates.manager_id = updates.managerId;

        const { data, error } = await supabase
            .from('goals')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // Update criteria if provided
        if (updates.criteria) {
            // Delete existing criteria
            await supabase.from('criteria').delete().eq('goal_id', id);

            // Insert new criteria
            if (updates.criteria.length > 0) {
                const criteriaToInsert = updates.criteria.map((criterion, index) => ({
                    id: criterion.id,
                    goal_id: id,
                    name: criterion.name,
                    weight: criterion.weight,
                    display_order: index,
                }));

                const { error: criteriaError } = await supabase
                    .from('criteria')
                    .insert(criteriaToInsert);
                if (criteriaError) throw criteriaError;
            }
        }

        return this.getById(id);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

// ============================================================================
// REPORTS SERVICE
// ============================================================================

// Helper function to convert database report to TypeScript Report
function dbReportToReport(dbReport: any): Report {
    return {
        id: dbReport.id,
        goalId: dbReport.goal_id,
        employeeId: dbReport.employee_id,
        reportText: dbReport.report_text,
        submissionDate: dbReport.submission_date,
        evaluationScore: dbReport.evaluation_score,
        managerOverallScore: dbReport.manager_overall_score,
        managerOverrideReasoning: dbReport.manager_override_reasoning,
        evaluationReasoning: dbReport.evaluation_reasoning,
        criterionScores: dbReport.report_criterion_scores ? dbReport.report_criterion_scores.map((s: any) => ({
            criterionName: s.criterion_name,
            score: s.score
        })) : [],
    };
}

export const reportService = {
    async getAll() {
        console.log('[Database] Fetching all reports...');
        const { data, error } = await supabase
            .from('reports')
            .select('*, goals(*), employees(*), report_criterion_scores(*)')
            .order('submission_date', { ascending: false });

        if (error) {
            console.error('[Database] Error fetching reports:', error);
            throw error;
        }

        console.log(`[Database] Fetched ${data?.length || 0} reports.`);
        // console.log('[Database] Sample report:', data?.[0]); // Debugging

        return data ? data.map(dbReportToReport) : [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, goals(*), employees(*), report_criterion_scores(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return dbReportToReport(data);
    },

    async getByEmployeeId(employeeId: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, goals(*), report_criterion_scores(*)')
            .eq('employee_id', employeeId)
            .order('submission_date', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },

    async getByGoalId(goalId: string) {
        const { data, error } = await supabase
            .from('reports')
            .select('*, employees(*), report_criterion_scores(*)')
            .eq('goal_id', goalId)
            .order('submission_date', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbReportToReport) : [];
    },

    async create(report: Omit<Report, 'createdAt' | 'updatedAt'>) {
        try {
            // Validation helper (keep for internal use if needed, but not for ID checks)

            // Prepare the report data
            const insertData: any = {
                goal_id: report.goalId,
                employee_id: report.employeeId,
                report_text: report.reportText,
                submission_date: report.submissionDate || new Date().toISOString(),
                evaluation_score: isNaN(report.evaluationScore) ? 0 : report.evaluationScore,
                evaluation_reasoning: report.evaluationReasoning || 'No reasoning provided.',
            };

            // Handle optional fields
            if (report.managerOverallScore !== undefined && report.managerOverallScore !== null) {
                insertData.manager_overall_score = report.managerOverallScore;
            }
            if (report.managerOverrideReasoning !== undefined && report.managerOverrideReasoning !== null) {
                insertData.manager_override_reasoning = report.managerOverrideReasoning;
            }

            // Ensure we have an ID for the report. If not provided, generate one.
            // Since the system uses custom string IDs (e.g. goal-..., emp-...), we follow that pattern.
            insertData.id = report.id || `report-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            console.log('[Database] Creating report...', insertData);

            // Insert report
            const { data: reportData, error: reportError } = await supabase
                .from('reports')
                .insert(insertData)
                .select()
                .single();

            if (reportError) {
                console.error('[Database] Failed to insert report:', {
                    error: reportError,
                    sentData: insertData
                });
                throw reportError;
            }

            if (!reportData) {
                throw new Error('Report insertion succeeded but no data was returned.');
            }

            const reportId = reportData.id;
            console.log('[Database] Report created successfully. ID:', reportId);

            // Insert criterion scores
            if (report.criterionScores && report.criterionScores.length > 0) {
                const scoresToInsert = report.criterionScores.map(score => ({
                    report_id: reportId,
                    criterion_name: score.criterionName,
                    score: score.score,
                }));

                console.log('[Database] Inserting criterion scores...', scoresToInsert);

                const { error: scoresError } = await supabase
                    .from('report_criterion_scores')
                    .insert(scoresToInsert);

                if (scoresError) {
                    console.error('[Database] Failed to insert criterion scores:', {
                        error: scoresError,
                        sentData: scoresToInsert
                    });
                    throw scoresError;
                }
            }

            const fullReport = dbReportToReport(reportData);
            fullReport.criterionScores = report.criterionScores || [];

            return fullReport;
        } catch (err) {
            console.error('[Database] Critical error in reportService.create:', err);
            throw err;
        }
    },

    async update(id: string, updates: Partial<Report>) {
        const dbUpdates: any = {};
        if (updates.reportText !== undefined) dbUpdates.report_text = updates.reportText;
        if (updates.evaluationScore !== undefined) dbUpdates.evaluation_score = updates.evaluationScore;
        if (updates.managerOverallScore !== undefined) dbUpdates.manager_overall_score = updates.managerOverallScore;
        if (updates.managerOverrideReasoning !== undefined) dbUpdates.manager_override_reasoning = updates.managerOverrideReasoning;
        if (updates.evaluationReasoning !== undefined) dbUpdates.evaluation_reasoning = updates.evaluationReasoning;

        const { data, error } = await supabase
            .from('reports')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return dbReportToReport(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

// ============================================================================
// EMPLOYEES SERVICE
// ============================================================================

// Helper function to convert database employee to TypeScript Employee
function dbEmployeeToEmployee(dbEmployee: any): Employee {
    return {
        id: dbEmployee.id,
        organizationId: dbEmployee.organization_id,
        name: dbEmployee.name,
        email: dbEmployee.email,
        title: dbEmployee.title,
        role: dbEmployee.role,
        managerId: dbEmployee.manager_id,
        isAccountOwner: dbEmployee.is_account_owner,
        joinDate: dbEmployee.join_date,
        authUserId: dbEmployee.auth_user_id,
        permissions: dbEmployee.employee_permissions ? {
            canSetGlobalFrequency: dbEmployee.employee_permissions.can_set_global_frequency,
            canViewOrganizationWide: dbEmployee.employee_permissions.can_view_organization_wide,
            canManageSettings: dbEmployee.employee_permissions.can_manage_settings,
        } : undefined,
    };
}

export const employeeService = {
    async getAll() {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee) : [];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('id', id)
            .single();
        if (error) throw error;
        return dbEmployeeToEmployee(data);
    },

    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('email', email)
            .single();
        if (error) throw error;
        return dbEmployeeToEmployee(data);
    },

    async getByAuthId(authUserId: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('auth_user_id', authUserId)
            .maybeSingle();
        if (error) throw error;
        return data ? dbEmployeeToEmployee(data) : null;
    },

    async getManagers() {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('role', 'manager')
            .order('name', { ascending: true });
        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee) : [];
    },

    async getTeamMembers(managerId: string) {
        const { data, error } = await supabase
            .from('employees')
            .select('*, employee_permissions(*)')
            .eq('manager_id', managerId)
            .order('name', { ascending: true });
        if (error) throw error;
        return data ? data.map(dbEmployeeToEmployee) : [];
    },

    async create(employee: Omit<Employee, 'createdAt' | 'updatedAt'>) {
        const { data, error } = await supabase
            .from('employees')
            .insert({
                id: employee.id,
                organization_id: employee.organizationId,
                name: employee.name,
                email: employee.email,
                title: employee.title,
                role: employee.role,
                manager_id: employee.managerId,
                is_account_owner: employee.isAccountOwner,
                join_date: employee.joinDate,
                auth_user_id: employee.authUserId,
            })
            .select()
            .single();
        if (error) throw error;

        // Insert permissions if provided
        if (employee.permissions) {
            const { error: permError } = await supabase
                .from('employee_permissions')
                .insert({
                    employee_id: employee.id,
                    can_set_global_frequency: employee.permissions.canSetGlobalFrequency,
                    can_view_organization_wide: employee.permissions.canViewOrganizationWide,
                    can_manage_settings: employee.permissions.canManageSettings,
                });
            if (permError) throw permError;
        }

        return dbEmployeeToEmployee(data);
    },

    async update(id: string, updates: Partial<Employee>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.email !== undefined) dbUpdates.email = updates.email;
        if (updates.organizationId !== undefined) dbUpdates.organization_id = updates.organizationId; // Critical fix: allow updating org ID
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.managerId !== undefined) dbUpdates.manager_id = updates.managerId;
        if (updates.isAccountOwner !== undefined) dbUpdates.is_account_owner = updates.isAccountOwner;
        if (updates.joinDate !== undefined) dbUpdates.join_date = updates.joinDate;
        if (updates.authUserId !== undefined) dbUpdates.auth_user_id = updates.authUserId;

        const { data, error } = await supabase
            .from('employees')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;

        // Update permissions if provided
        if (updates.permissions) {
            const { error: permError } = await supabase
                .from('employee_permissions')
                .upsert({
                    employee_id: id,
                    can_set_global_frequency: updates.permissions.canSetGlobalFrequency,
                    can_view_organization_wide: updates.permissions.canViewOrganizationWide,
                    can_manage_settings: updates.permissions.canManageSettings,
                });
            if (permError) throw permError;
        }

        return dbEmployeeToEmployee(data);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
export const dbUtils = {
    async testConnection() {
        try {
            const { data, error } = await supabase.from('employees').select('count');
            if (error) throw error;
            return { success: true, message: 'Connected to Supabase successfully!' };
        } catch (error) {
            return { success: false, message: `Connection failed: ${error}` };
        }
    },

    async getStats() {
        const [projects, goals, reports, employees] = await Promise.all([
            supabase.from('projects').select('count'),
            supabase.from('goals').select('count'),
            supabase.from('reports').select('count'),
            supabase.from('employees').select('count'),
        ]);

        return {
            projectsCount: projects.data?.[0]?.count || 0,
            goalsCount: goals.data?.[0]?.count || 0,
            reportsCount: reports.data?.[0]?.count || 0,
            employeesCount: employees.data?.[0]?.count || 0,
        };
    },
};
