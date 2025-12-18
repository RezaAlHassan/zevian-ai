
import { Employee } from '../types';

/**
 * Filters employees to show only those in a manager's scope.
 * A manager's scope includes:
 * 1. Direct reports (employees where managerId === managerId)
 * 2. Skip-level reports (employees managed by junior managers who report to the senior manager)
 * 
 * @param employees - All employees
 * @param managerId - The ID of the manager
 * @returns Filtered list of employees in the manager's scope
 */
export const filterEmployeesByManager = (
  employees: Employee[],
  managerId: string
): Employee[] => {
  if (!managerId) return employees;

  // Get direct reports (employees directly managed by this manager)
  const directReports = employees.filter(emp => emp.managerId === managerId);
  const directReportIds = new Set(directReports.map(emp => emp.id));

  // Get skip-level reports (employees managed by junior managers)
  // First, find all employees who are managers (they have direct reports)
  const juniorManagers = directReports.filter(emp => 
    employees.some(otherEmp => otherEmp.managerId === emp.id)
  );

  // Get all employees managed by these junior managers (skip-level reports)
  const skipLevelReports: Employee[] = [];
  juniorManagers.forEach(juniorManager => {
    const reports = employees.filter(emp => emp.managerId === juniorManager.id);
    skipLevelReports.push(...reports);
  });

  // Combine direct reports and skip-level reports
  const allScopedEmployees = [...directReports, ...skipLevelReports];
  
  // Remove duplicates (in case an employee appears in both lists, though unlikely)
  const uniqueEmployeeIds = new Set(allScopedEmployees.map(emp => emp.id));
  
  return employees.filter(emp => uniqueEmployeeIds.has(emp.id));
};

/**
 * Gets all employee IDs in a manager's scope (direct + skip-level)
 */
export const getScopedEmployeeIds = (
  employees: Employee[],
  managerId: string
): Set<string> => {
  const scopedEmployees = filterEmployeesByManager(employees, managerId);
  return new Set(scopedEmployees.map(emp => emp.id));
};

/**
 * Checks if an employee is in a manager's scope
 */
export const isEmployeeInManagerScope = (
  employee: Employee,
  employees: Employee[],
  managerId: string
): boolean => {
  if (!managerId) return true;
  
  // Direct report
  if (employee.managerId === managerId) {
    return true;
  }
  
  // Check if employee is managed by a junior manager who reports to this manager
  if (employee.managerId) {
    const juniorManager = employees.find(emp => emp.id === employee.managerId);
    if (juniorManager && juniorManager.managerId === managerId) {
      return true;
    }
  }
  
  return false;
};

/**
 * Gets direct reports only (not skip-level)
 */
export const getDirectReports = (
  employees: Employee[],
  managerId: string
): Employee[] => {
  if (!managerId) return [];
  return employees.filter(emp => emp.managerId === managerId);
};

/**
 * Gets direct report IDs only
 */
export const getDirectReportIds = (
  employees: Employee[],
  managerId: string
): Set<string> => {
  const directReports = getDirectReports(employees, managerId);
  return new Set(directReports.map(emp => emp.id));
};

