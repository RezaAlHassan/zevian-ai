
import { Employee, EmployeePermissions } from '../types';

/**
 * Checks if a manager is the direct manager of an employee
 */
export const isDirectManager = (
  employee: Employee,
  managerId: string
): boolean => {
  return employee.managerId === managerId;
};

/**
 * Gets the permissions of an employee
 */
export const getEmployeePermissions = (employee: Employee): EmployeePermissions => {
  return employee.permissions || {};
};

/**
 * Checks if an employee has permission to set global frequency settings
 */
export const canSetGlobalFrequency = (employee: Employee): boolean => {
  if (employee.isAccountOwner) return true;
  return employee.permissions?.canSetGlobalFrequency === true;
};

/**
 * Checks if an employee has permission to view organization-wide data
 */
export const canViewOrganizationWide = (employee: Employee): boolean => {
  if (employee.isAccountOwner) return true;
  return employee.permissions?.canViewOrganizationWide === true;
};

/**
 * Checks if an employee has permission to manage settings
 */
export const canManageSettings = (employee: Employee): boolean => {
  if (employee.isAccountOwner) return true;
  return employee.permissions?.canManageSettings === true;
};

/**
 * Checks if an employee is the account owner
 */
export const isAccountOwner = (employee: Employee): boolean => {
  return employee.isAccountOwner === true;
};

