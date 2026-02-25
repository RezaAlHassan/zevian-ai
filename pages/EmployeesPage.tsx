
import React, { useState, useMemo } from 'react';
import { Employee, Report, EmployeeRole, Invitation, Project, Goal } from '../types';
import { User, Users, Search, Star, MessageSquare, ClipboardCheck, Briefcase, Target, Eye } from 'lucide-react';
import { formatTableDate } from '../utils/dateFormat';
import { Badge } from "../components/ui/badge";
import { DataTable } from '../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import StatCard from '../components/StatCard';
import { Button } from '../components/ui/button';
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
    const columns: ColumnDef<Employee>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-sm text-foreground block">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        )
      },
      {
        accessorKey: "title",
        header: "Role/Title",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.title || 'N/A'}</span>
      },
      {
        id: "timeInOrg",
        header: "Time in Org",
        cell: ({ row }) => {
          const m = employeeMetrics[row.original.id] || { daysJoined: 0 };
          return <span className="text-sm text-muted-foreground">{m.daysJoined} days</span>;
        }
      },
      {
        id: "activeGoals",
        header: "Active Goals",
        cell: ({ row }) => {
          const m = employeeMetrics[row.original.id] || { activeGoalCount: 0 };
          return (
            <button
              onClick={() => setSelectedUserForProjects(row.original)}
              className="flex items-center gap-2 hover:bg-muted-secondary px-2 py-1 rounded transition-colors group"
            >
              <Target size={16} className="text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{m.activeGoalCount}</span>
            </button>
          );
        }
      },
      {
        id: "avgScore",
        header: "Avg Score",
        cell: ({ row }) => {
          const m = employeeMetrics[row.original.id] || { avgScore: 0 };
          return (
            <div className="flex items-center gap-1">
              <Star size={14} className={m.avgScore > 0 ? "text-amber-500 fill-amber-500" : "text-muted-foreground"} />
              {m.avgScore > 0 ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">{m.avgScore.toFixed(1)}</Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
          );
        }
      },
      {
        id: "reports",
        header: "Reports",
        cell: ({ row }) => {
          const m = employeeMetrics[row.original.id] || { reportCount: 0 };
          return <span className="text-sm text-muted-foreground">{m.reportCount}</span>;
        }
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (row.original.id === currentManagerId) return <div />;
          return (
            <button
              onClick={() => onSelectEmployee(row.original.id)}
              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors group"
              title="View Details"
            >
              <Eye size={18} className="transition-transform group-hover:scale-110" />
            </button>
          );
        }
      }
    ];

    return (
      <DataTable
        columns={columns}
        data={filteredEmployees}
        onRowClick={(row) => {
          if (row.id !== currentManagerId) {
            onSelectEmployee(row.id);
          }
        }}
      />
    );
  };

  const renderManagerTable = () => {
    const columns: ColumnDef<Employee>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-sm text-foreground block">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.email}</span>
          </div>
        )
      },
      {
        accessorKey: "title",
        header: "Role/Title",
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.title || 'Manager'}</span>
      },
      {
        id: "activeProjects",
        header: "Active Projects",
        cell: ({ row }) => {
          const m = managerMetrics[row.original.id] || { projectCount: 0 };
          return (
            <button
              onClick={() => setSelectedUserForProjects(row.original)}
              className="flex items-center gap-2 hover:bg-muted-secondary px-2 py-1 rounded transition-colors group"
            >
              <Briefcase size={16} className="text-primary group-hover:scale-110 transition-transform" />
              <span className="font-bold text-foreground group-hover:text-primary transition-colors">{m.projectCount}</span>
            </button>
          );
        }
      },
      {
        id: "feedbacks",
        header: "Feedbacks",
        cell: ({ row }) => {
          const m = managerMetrics[row.original.id] || { feedbacksLeft: 0 };
          return (
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-blue-500" />
              <span className="font-medium text-foreground">{m.feedbacksLeft}</span>
            </div>
          );
        }
      },
      {
        id: "reviewed",
        header: "Reports Reviewed",
        cell: ({ row }) => {
          const m = managerMetrics[row.original.id] || { reportsReviewed: 0 };
          return (
            <div className="flex items-center gap-2">
              <ClipboardCheck size={16} className="text-emerald-500" />
              <span className="font-medium text-foreground">{m.reportsReviewed}</span>
            </div>
          );
        }
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (row.original.id === currentManagerId) return <div />;
          return (
            <button
              onClick={() => onSelectEmployee(row.original.id)}
              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors group"
              title="View Activity"
            >
              <Eye size={18} className="transition-transform group-hover:scale-110" />
            </button>
          );
        }
      }
    ];

    return (
      <DataTable
        columns={columns}
        data={filteredEmployees}
        onRowClick={(row) => {
          if (row.id !== currentManagerId) {
            onSelectEmployee(row.id);
          }
        }}
      />
    );
  };

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Performance Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard title="Total Employees" value={employees.filter(e => e.role === 'employee').length} icon={<User size={24} className="text-muted-foreground" />} />
        <StatCard title="Total Managers" value={employees.filter(e => e.role === 'manager').length} icon={<Users size={24} className="text-muted-foreground" />} />
      </div>

      <div className="bg-card rounded-lg p-6 border border-border">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'employees'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
          >
            Employees
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === 'managers'
              ? 'border-primary text-primary bg-primary/5'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
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


