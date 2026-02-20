
import React, { useState, useMemo } from 'react';
import { Employee, Report, EmployeeRole, Invitation, Project, Goal } from '../types';
import { User, Users, Search, Star, MessageSquare, ClipboardCheck, Briefcase, Target, Eye } from 'lucide-react';
import { formatTableDate } from '../utils/dateFormat';
import Table from '../components/Table';
import StatCard from '../components/StatCard';
import Button from '../components/Button';
import InviteUserModal from '../components/InviteUserModal';
import UserProjectsModal from '../components/UserProjectsModal'; // NEW
import { isEmployeeInManagerScope } from '../utils/employeeFilter';
import { canViewOrganizationWide } from '../utils/managerPermissions';

interface EmployeesPageProps {
  employees: Employee[];
  reports: Report[];
  projects?: Project[];
  goals?: Goal[];
  invitations?: Invitation[]; // Kept for interface compatibility but mostly unused now
  onSelectEmployee: (employeeId: string) => void;
  currentManagerId?: string;
  viewMode?: 'manager' | 'employee';
  onAddEmployee?: (employee: Employee) => void;
  onUpdateEmployee?: (employee: Employee) => Promise<void>;
  onInvite?: (email: string, role: EmployeeRole, projectId?: string, managerId?: string) => Promise<Invitation | null | void>;
  onDeleteInvitation?: (invitationId: string) => Promise<void>;
  searchQuery?: string;
  scopeFilter?: 'direct-reports' | 'organization';
}

const EmployeesPage: React.FC<EmployeesPageProps> = ({
  employees,
  reports,
  projects = [],
  goals = [],
  onSelectEmployee,
  currentManagerId,
  viewMode = 'manager',
  onUpdateEmployee, // Used for team management
  // onInvite, // Moved to Organization page mostly, but good to keep if passing through
  searchQuery
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'managers'>('employees');

  // Modal State
  const [selectedUserForProjects, setSelectedUserForProjects] = useState<Employee | null>(null);

  // Filter Logic
  const filteredEmployees = useMemo(() => {
    let list = employees;
    const query = (searchQuery || '').trim().toLowerCase();

    // 1. Tab Filter
    if (activeTab === 'employees') {
      list = list.filter(e => e.role === 'employee');
    } else {
      list = list.filter(e => e.role === 'manager');
    }

    // 2. Search Filter
    if (query) {
      list = list.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        e.title?.toLowerCase().includes(query)
      );
    }
    return list;
  }, [employees, activeTab, searchQuery]);

  // --- Metrics Calculation ---

  // 1. Employee Metrics
  const employeeMetrics = useMemo(() => {
    const metrics: { [id: string]: { daysJoined: number; activeGoalCount: number; avgScore: number; reportCount: number } } = {};

    filteredEmployees.forEach(emp => {
      // Days Joined
      const joined = emp.joinDate ? new Date(emp.joinDate) : new Date();
      const diffTime = Math.abs(new Date().getTime() - joined.getTime());
      const daysJoined = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Active Goals (Count where assignee)
      const empGoals = goals.filter(g =>
        g.status !== 'completed' &&
        (g.assignees?.some(a => a.id === emp.id) || (!g.assignees?.length && false)) // Strict assignment for now
      );

      // Reports & Scores
      const empReports = reports.filter(r => r.employeeId === emp.id);
      const totalScore = empReports.reduce((sum, r) => sum + r.evaluationScore, 0);
      const avgScore = empReports.length > 0 ? totalScore / empReports.length : 0;

      metrics[emp.id] = {
        daysJoined,
        activeGoalCount: empGoals.length,
        avgScore,
        reportCount: empReports.length
      };
    });
    return metrics;
  }, [filteredEmployees, goals, reports]);

  // 2. Manager Metrics
  const managerMetrics = useMemo(() => {
    const metrics: { [id: string]: { feedbacksLeft: number; reportsReviewed: number; projectCount: number } } = {};

    filteredEmployees.forEach(mgr => {
      // Identify goals managed by this manager
      const managedGoalIds = new Set(goals.filter(g => g.managerId === mgr.id).map(g => g.id));

      // Reports for those goals
      const relevantReports = reports.filter(r => managedGoalIds.has(r.goalId));

      const feedbacksLeft = relevantReports.filter(r => r.managerFeedback).length;
      const reportsReviewed = relevantReports.filter(r => r.managerOverallScore !== undefined && r.managerOverallScore !== null).length;

      // Active Projects (Calculated same way as employees initially, where they are assignees or maybe creators?)
      // Let's assume assignees for now to be consistent with 'Active Projects' meaning 'Participating in'.
      const mgrProjects = projects.filter(p => p.assignees?.some(a => a.id === mgr.id));

      metrics[mgr.id] = {
        feedbacksLeft,
        reportsReviewed,
        projectCount: mgrProjects.length
      };
    });
    return metrics;
  }, [filteredEmployees, goals, reports, projects]);


  // --- Render Tables ---

  const renderEmployeeTable = () => {
    const headers = ['Name', 'Role/Title', 'Time in Org', 'Active Goals', 'Avg Score', 'Reports', 'Actions'];
    const rows = filteredEmployees.map(emp => {
      const m = employeeMetrics[emp.id] || { daysJoined: 0, activeGoalCount: 0, avgScore: 0, reportCount: 0 };

      return [
        <div key="name">
          <span className="font-medium text-sm text-on-surface block">{emp.name}</span>
          <span className="text-xs text-on-surface-secondary">{emp.email}</span>
        </div>,
        <span key="title" className="text-sm text-on-surface-secondary">{emp.title || 'N/A'}</span>,
        <span key="time" className="text-sm text-on-surface-secondary">{m.daysJoined} days</span>,
        <button
          key="goals"
          onClick={() => setSelectedUserForProjects(emp)}
          className="flex items-center gap-2 hover:bg-surface-secondary px-2 py-1 rounded transition-colors group"
        >
          <Target size={16} className="text-primary group-hover:scale-110 transition-transform" />
          <span className="font-bold text-on-surface group-hover:text-primary transition-colors">{m.activeGoalCount}</span>
        </button>,
        <div key="score" className="flex items-center gap-1">
          <Star size={14} className={m.avgScore > 0 ? "text-yellow-500 fill-yellow-500" : "text-on-surface-tertiary"} />
          <span className={`font-medium ${m.avgScore > 0 ? 'text-on-surface' : 'text-on-surface-tertiary'}`}>
            {m.avgScore > 0 ? m.avgScore.toFixed(1) : '-'}
          </span>
        </div>,
        <span key="reports" className="text-sm text-on-surface-secondary">{m.reportCount}</span>,
        emp.id !== currentManagerId ? (
          <button
            key="action"
            onClick={() => onSelectEmployee(emp.id)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
        ) : <div key="action" />
      ];
    });

    return (
      <Table
        headers={headers}
        rows={rows}
        onRowClick={(index) => {
          const emp = filteredEmployees[index];
          if (emp.id !== currentManagerId) {
            onSelectEmployee(emp.id);
          }
        }}
      />
    );
  };

  const renderManagerTable = () => {
    const headers = ['Name', 'Role/Title', 'Active Projects', 'Feedbacks', 'Reports Reviewed', 'Actions'];
    const rows = filteredEmployees.map(mgr => {
      const m = managerMetrics[mgr.id] || { feedbacksLeft: 0, reportsReviewed: 0, projectCount: 0 };

      return [
        <div key="name">
          <span className="font-medium text-sm text-on-surface block">{mgr.name}</span>
          <span className="text-xs text-on-surface-secondary">{mgr.email}</span>
        </div>,
        <span key="title" className="text-sm text-on-surface-secondary">{mgr.title || 'Manager'}</span>,
        <button
          key="projects"
          onClick={() => setSelectedUserForProjects(mgr)}
          className="flex items-center gap-2 hover:bg-surface-secondary px-2 py-1 rounded transition-colors group"
        >
          <Briefcase size={16} className="text-primary group-hover:scale-110 transition-transform" />
          <span className="font-bold text-on-surface group-hover:text-primary transition-colors">{m.projectCount}</span>
        </button>,
        <div key="feedbacks" className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-500" />
          <span className="font-medium text-on-surface">{m.feedbacksLeft}</span>
        </div>,
        <div key="reviewed" className="flex items-center gap-2">
          <ClipboardCheck size={16} className="text-emerald-500" />
          <span className="font-medium text-on-surface">{m.reportsReviewed}</span>
        </div>,
        mgr.id !== currentManagerId ? (
          <button
            key="action"
            onClick={() => onSelectEmployee(mgr.id)}
            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="View Activity"
          >
            <Eye size={18} />
          </button>
        ) : <div key="action" />
      ];
    });

    return (
      <Table
        headers={headers}
        rows={rows}
        onRowClick={(index) => {
          const mgr = filteredEmployees[index];
          if (mgr.id !== currentManagerId) {
            onSelectEmployee(mgr.id);
          }
        }}
      />
    );
  };

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-on-surface">Performance Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Total Employees" value={employees.filter(e => e.role === 'employee').length} icon={<User size={24} className="text-on-surface-secondary" />} />
        <StatCard title="Total Managers" value={employees.filter(e => e.role === 'manager').length} icon={<Users size={24} className="text-on-surface-secondary" />} />
      </div>

      <div className="bg-surface-elevated rounded-lg p-6 border border-border">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'employees'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-secondary hover:text-on-surface'
              }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'managers'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-secondary hover:text-on-surface'
              }`}
          >
            Managers
          </button>
        </div>

        {activeTab === 'employees' ? renderEmployeeTable() : renderManagerTable()}
      </div>

      {selectedUserForProjects && (
        <UserProjectsModal
          isOpen={!!selectedUserForProjects}
          onClose={() => setSelectedUserForProjects(null)}
          user={selectedUserForProjects}
          projects={projects}
          goals={goals}
          mode={selectedUserForProjects.role === 'manager' ? 'projects' : 'goals'}
        />
      )}
    </div>
  );
};

export default EmployeesPage;


