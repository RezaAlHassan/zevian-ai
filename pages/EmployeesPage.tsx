
import React, { useState, useMemo } from 'react';
import { Employee, Report, EmployeeRole, Invitation } from '../types';
import { User, Users, ChevronRight, Search, Star, Calendar, Eye, UserPlus, UserMinus, Plus } from 'lucide-react';
import { formatTableDate } from '../utils/dateFormat';
import Table from '../components/Table';
import StatCard from '../components/StatCard';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import Modal from '../components/Modal';
import InviteUserModal from '../components/InviteUserModal';
import { filterEmployeesByManager, getScopedEmployeeIds, getDirectReportIds, isEmployeeInManagerScope } from '../utils/employeeFilter';
import { canViewOrganizationWide } from '../utils/managerPermissions';


interface EmployeesPageProps {
  employees: Employee[];
  reports: Report[];
  onSelectEmployee: (employeeId: string) => void;
  currentManagerId?: string;
  viewMode?: 'manager' | 'employee';
  onAddEmployee?: (employee: Employee) => void;
  onUpdateEmployee?: (employee: Employee) => Promise<void>;
  onInvite?: (email: string, role: EmployeeRole) => Promise<Invitation | null | void>;
  searchQuery?: string;
  scopeFilter?: 'direct-reports' | 'organization';
}

const EmployeesPage: React.FC<EmployeesPageProps> = ({
  employees,
  reports,
  onSelectEmployee,
  currentManagerId,
  viewMode = 'manager',
  scopeFilter = 'direct-reports',
  onAddEmployee,
  onUpdateEmployee,
  onInvite,
  searchQuery
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'team'>('all'); // NEW: Tab state

  // Get current manager for permission checks
  const currentManager = useMemo(() => {
    if (!currentManagerId) return null;
    return employees.find(emp => emp.id === currentManagerId);
  }, [employees, currentManagerId]);

  const canViewOrgWide = useMemo(() => {
    return currentManager ? canViewOrganizationWide(currentManager) : false;
  }, [currentManager]);

  // Get employee IDs - Managers see ALL employees now
  const scopedEmployeeIds = useMemo(() => {
    // Always return all employees for managers, ignoring scope filter
    // Also return all if not manager view (though usually this page is manager-only or constrained by parent)
    return new Set(employees.map(emp => emp.id));
  }, [employees]);

  // Filter employees by selected scope
  const scopedEmployees = useMemo(() => {
    return employees.filter(emp => scopedEmployeeIds.has(emp.id));
  }, [employees, scopedEmployeeIds]);

  // Filter reports to only include scoped employees
  const scopedReports = useMemo(() => {
    return reports.filter(report => scopedEmployeeIds.has(report.employeeId));
  }, [reports, scopedEmployeeIds]);

  // Calculate average score for scoped employees only
  const averageScore = useMemo(() => {
    const employeeScores: { [key: string]: number[] } = {};

    scopedReports.forEach(report => {
      if (!employeeScores[report.employeeId]) {
        employeeScores[report.employeeId] = [];
      }
      employeeScores[report.employeeId].push(report.evaluationScore);
    });

    const allScores: number[] = [];
    Object.values(employeeScores).forEach(scores => {
      allScores.push(...scores);
    });

    if (allScores.length === 0) return 0;
    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  }, [scopedReports]);

  // Calculate total score and leaderboard position for each scoped employee
  const employeeScores = useMemo(() => {
    const scores: { [key: string]: { total: number; count: number; average: number } } = {};
    scopedReports.forEach(report => {
      if (!scores[report.employeeId]) {
        scores[report.employeeId] = { total: 0, count: 0, average: 0 };
      }
      scores[report.employeeId].total += report.evaluationScore;
      scores[report.employeeId].count += 1;
      scores[report.employeeId].average = scores[report.employeeId].total / scores[report.employeeId].count;
    });
    return scores;
  }, [scopedReports]);

  // Handle Team Actions
  const handleAddToTeam = async (employeeId: string) => {
    if (!onUpdateEmployee || !currentManagerId) return;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    if (confirm(`Add ${emp.name} to your reporting team?`)) {
      await onUpdateEmployee({ ...emp, managerId: currentManagerId });
    }
  };

  const handleRemoveFromTeam = async (employeeId: string) => {
    if (!onUpdateEmployee) return;
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    if (confirm(`Remove ${emp.name} from your reporting team?`)) {
      // Setting managerId to undefined/null removes them from specific management
      await onUpdateEmployee({ ...emp, managerId: undefined });
    }
  };

  // Filter employees based on search AND Tab
  const filteredEmployees = useMemo(() => {
    // 1. Base list: In 'all' tab -> all employees. In 'team' tab -> team members only.
    let baseList = employees;
    if (activeTab === 'team' && currentManagerId) {
      // Filter for My Team (Direct reports OR explicit manager assignments)
      baseList = employees.filter(emp => isEmployeeInManagerScope(emp, employees, currentManagerId));
    } else if (viewMode === 'manager') {
      // 'All Employees' logic (already what 'scopedEmployees' was doing in previous step)
      // scopedEmployees is effectively ALL employees now, so just use employees
      baseList = employees;
    } else {
      // Employee view - restrict generally? Or use scoped logic
      baseList = scopedEmployees;
    }

    let filtered = baseList;
    const query = (searchQuery || '').trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.title?.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [employees, scopedEmployees, searchQuery, activeTab, currentManagerId, viewMode]);

  const employeeTableHeaders = ['Name', 'Email', 'Join Date', 'Reports', 'Total Score', 'Actions'];
  const employeeTableRows = filteredEmployees.map(employee => {
    const score = employeeScores[employee.id];

    // Check membership
    const isInTeam = currentManagerId ? isEmployeeInManagerScope(employee, employees, currentManagerId) : false;
    // Allow View Details if in team OR if current user is owner/super admin (not fully implemented, assume manager scope check is enough)
    const canViewDetails = viewMode === 'manager' && currentManagerId ? isInTeam : true;

    return [
      <div>
        <span className="capitalize text-on-surface-secondary block">{employee.name}</span>
        {employee.title && (
          <span className="text-xs text-on-surface-secondary">{employee.title}</span>
        )}
      </div>,
      <span className="capitalize text-on-surface-secondary">{employee.email}</span>,
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-on-surface-tertiary" />
        <span className="capitalize text-on-surface-secondary">
          {employee.joinDate
            ? formatTableDate(employee.joinDate)
            : 'N/A'}
        </span>
      </div>,
      <div>
        {score ? (
          <span className="capitalize text-on-surface-secondary">{score.count}</span>
        ) : (
          <span className="capitalize text-on-surface-secondary">0</span>
        )}
      </div>,
      <div>
        {score ? (
          <div>
            <span className="capitalize text-on-surface-secondary">{score.total.toFixed(1)}</span>
            <span className="text-xs text-on-surface-secondary ml-1">
              ({score.average.toFixed(1)} avg)
            </span>
          </div>
        ) : (
          <span className="capitalize text-on-surface-secondary">No reports</span>
        )}
      </div>,
      <div className="flex items-center gap-3">
        {/* View Details Action */}
        <button
          onClick={() => onSelectEmployee(employee.id)}
          disabled={!canViewDetails}
          className={`flex items-center gap-1 text-sm font-medium transition-colors ${canViewDetails
              ? "text-primary hover:text-primary-hover hover:underline"
              : "text-on-surface-tertiary cursor-not-allowed opacity-50"
            }`}
          title={!canViewDetails ? "Add to team to view details" : ""}
        >
          <Eye size={16} strokeWidth={2} />
          View
        </button>

        {/* Team Management Actions */}
        {viewMode === 'manager' && currentManagerId && currentManagerId !== employee.id && (
          isInTeam ? (
            <button
              onClick={() => handleRemoveFromTeam(employee.id)}
              className="text-red-500 hover:text-red-700 hover:underline font-medium text-sm flex items-center gap-1 transition-colors"
              title="Remove from my reporting team"
            >
              <UserMinus size={16} strokeWidth={2} />
              Remove
            </button>
          ) : (
            <button
              onClick={() => handleAddToTeam(employee.id)}
              className="text-primary hover:text-primary-hover hover:underline font-medium text-sm flex items-center gap-1 transition-colors"
              title="Add to my reporting team"
            >
              <Plus size={16} strokeWidth={2} />
              Add
            </button>
          )
        )}
      </div>
    ];
  });

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <h2 className="text-xl font-bold text-on-surface">Employees</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Employees" value={scopedEmployees.length} icon={<User size={24} className="text-on-surface-secondary" />} />
        <StatCard title="Average Score" value={averageScore.toFixed(2)} icon={<Star size={24} className="text-on-surface-secondary" />} />
      </div>

      <div className="bg-surface-elevated rounded-lg p-6  border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          {/* Tab Toggle */}
          <div className="flex p-1 bg-surface border border-border rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-secondary hover:text-on-surface'
                }`}
            >
              All Employees
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'team'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-secondary hover:text-on-surface'
                }`}
            >
              My Team
            </button>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === 'manager' && onInvite && (
              <Button
                onClick={() => setShowInviteModal(true)}
                variant="primary"
                size="sm"
                icon={UserPlus}
              >
                Invite User
              </Button>
            )}
            {/* Search - Removed local search, now global */}
          </div>
        </div>
        {filteredEmployees.length > 0 ? (
          <Table headers={employeeTableHeaders} rows={employeeTableRows} />
        ) : (
          <p className="text-on-surface-secondary text-center py-8">No employees found matching your search.</p>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && onInvite && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={onInvite}
          organizationName="the organization"
        />
      )}
    </div>
  );
};

export default EmployeesPage;
