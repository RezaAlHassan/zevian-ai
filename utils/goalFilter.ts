
import { Goal, Project, Employee } from '../types';

/**
 * Filters goals to show only those relevant to a specific manager.
 * A goal is relevant if:
 * 1. The manager created it (createdBy === managerId)
 * 2. The goal's project is assigned to an employee managed by the manager
 */
export const filterGoalsByManager = (
  goals: Goal[],
  projects: Project[],
  employees: Employee[],
  managerId: string
): Goal[] => {
  if (!managerId) return goals;

  // Get all employee IDs managed by this manager
  const managedEmployeeIds = new Set(
    employees
      .filter(emp => emp.managerId === managerId)
      .map(emp => emp.id)
  );

  // Get all project IDs that are assigned to managed employees
  const relevantProjectIds = new Set(
    projects
      .filter(project => {
        return project.assignees?.some(assignee => 
          assignee.type === 'employee' && managedEmployeeIds.has(assignee.id)
        ) || false;
      })
      .map(project => project.id)
  );

  // Filter goals based on:
  // 1. Created by the manager
  // 2. Belongs to a relevant project
  return goals.filter(goal => {
    // Manager created this goal
    if (goal.createdBy === managerId || goal.managerId === managerId) {
      return true;
    }

    // Goal belongs to a project assigned to managed employees
    return relevantProjectIds.has(goal.projectId);
  });
};

/**
 * Checks if a manager can edit a specific goal.
 * A manager can edit if they created the goal.
 */
export const canManagerEditGoal = (goal: Goal, managerId: string): boolean => {
  if (!managerId) return false;
  return goal.createdBy === managerId || goal.managerId === managerId;
};

