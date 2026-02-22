import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDropdown from './UserDropdown';
import { ViewMode, Page, Employee, Goal, Project, Report } from '../types';
import { NotificationBell } from './NotificationBell';
import { FileText, Users, Building2, Network, Clock, AlertCircle } from 'lucide-react';
import Dropdown, { DropdownItem } from './Dropdown';
import { canViewOrganizationWide } from '../utils/managerPermissions';
import { User } from '@supabase/supabase-js';
import { calculateNextReportDate, getReportStatusLabel } from '../utils/reportDueDate';

interface HeaderProps {
  viewMode: ViewMode;
  currentEmployeeId: string;
  setCurrentPage: (page: Page) => void;
  employees: Employee[];
  currentManagerId?: string;
  scopeFilter: 'direct-reports' | 'organization' | 'reporting-chain';
  setScopeFilter: (scope: 'direct-reports' | 'organization' | 'reporting-chain') => void;
  organizationName?: string;
  onLogout?: () => void;
  currentUser?: Employee | null;
  user?: User | null;
  goals?: Goal[];
  projects?: Project[];
  reports?: Report[];
}

const Header: React.FC<HeaderProps> = ({
  viewMode,
  currentEmployeeId,
  setCurrentPage,
  employees,
  currentManagerId,
  scopeFilter,
  setScopeFilter,
  organizationName,
  onLogout,
  currentUser,
  user,
  goals = [],
  projects = [],
  reports = []
}) => {
  const navigate = useNavigate();

  // Use passed currentUser or find in list
  const currentEmployee = currentUser || employees.find(e => e.id === currentEmployeeId);

  // Fallback for user name/email if employee record not yet created
  const userName = currentEmployee?.name || user?.user_metadata?.name || 'User';
  const userEmail = currentEmployee?.email || user?.email || '';

  // Check permissions on the logged-in user for organization-wide access
  const canViewOrgWide = useMemo(() => {
    return currentEmployee ? canViewOrganizationWide(currentEmployee) : false;
  }, [currentEmployee]);

  // Calculate Next Report Due for Employee
  const nextReportDue = useMemo(() => {
    if (viewMode !== 'employee' || !currentEmployeeId) return null;

    const employeeGoals = goals.filter(g =>
      g.status === 'active' &&
      (g.assignees?.some(a => String(a.id) === String(currentEmployeeId)) ||
        projects.find(p => p.id === g.projectId)?.assignees?.some(a => String(a.id) === String(currentEmployeeId)))
    );

    if (employeeGoals.length === 0) return null;

    const dueDates = employeeGoals.map(goal => {
      const project = projects.find(p => p.id === goal.projectId);
      const frequency = project?.reportFrequency || 'weekly';
      const lastReport = reports
        .filter(r => r.goalId === goal.id && String(r.employeeId) === String(currentEmployeeId))
        .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())[0];

      const dueDate = calculateNextReportDate(lastReport?.submissionDate || null, frequency);
      return { goal, dueDate, frequency, lastReport };
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const mostUrgent = dueDates[0];
    const status = getReportStatusLabel(mostUrgent.lastReport?.submissionDate || null, mostUrgent.frequency);

    return {
      ...mostUrgent,
      status
    };
  }, [viewMode, currentEmployeeId, goals, projects, reports]);

  return (
    <header className="bg-goten sticky top-0 z-50 border-b border-beerus h-16">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-6">
          {viewMode === 'employee' && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/submit')}
                className="flex items-center gap-2.5 px-4 py-2 rounded-moon-i-md bg-piccolo text-goten font-semibold text-moon-14 hover:bg-piccolo/90 transition-all active:scale-95"
              >
                <FileText size={16} />
                <span>Submit Report</span>
              </button>

              {nextReportDue && (
                <div className={`flex flex-col px-3 py-1.5 rounded-moon-s-sm border transition-all ${nextReportDue.status.isOverdue ? 'bg-dodoria/5 border-dodoria/20 text-dodoria' : 'bg-piccolo/5 border-piccolo/20 text-piccolo'}`}>
                  <div className="flex items-center gap-2">
                    {nextReportDue.status.isOverdue ? <AlertCircle size={14} className="animate-pulse" /> : <Clock size={14} />}
                    <span className="text-moon-12 font-bold uppercase tracking-wider">{nextReportDue.status.label}</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-70 truncate max-w-[150px]" title={nextReportDue.goal.name}>
                    {nextReportDue.goal.name}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center gap-2 ml-auto">
          {viewMode === 'manager' && currentManagerId && (
            <Dropdown
              buttonText={
                scopeFilter === 'direct-reports' ? 'Direct Reports' :
                  scopeFilter === 'reporting-chain' ? 'My Reporting Chain' : 'Organization'
              }
              icon={
                scopeFilter === 'direct-reports' ? <Users size={16} className="text-piccolo" /> :
                  scopeFilter === 'reporting-chain' ? <Network size={16} className="text-piccolo" /> : <Building2 size={16} className="text-piccolo" />
              }
              variant="outline"
              size="sm"
              align="right"
              buttonClassName="bg-gohan border-beerus h-9"
            >
              <div className="px-3 py-2 text-moon-12 font-semibold text-trunks uppercase tracking-wider">
                Visibility Scope
              </div>
              <DropdownItem onClick={() => setScopeFilter('direct-reports')}>
                <div className="flex items-center gap-2 group/item">
                  <Users size={16} className={`${scopeFilter === 'direct-reports' ? 'text-piccolo scale-110' : 'text-trunks group-hover/item:text-piccolo group-hover/item:scale-110'} transition-all duration-200`} />
                  <span className={scopeFilter === 'direct-reports' ? 'font-medium text-piccolo' : ''}>Direct Reports</span>
                </div>
              </DropdownItem>
              <DropdownItem onClick={() => setScopeFilter('reporting-chain')}>
                <div className="flex items-center gap-2 group/item">
                  <Network size={16} className={`${scopeFilter === 'reporting-chain' ? 'text-piccolo scale-110' : 'text-trunks group-hover/item:text-piccolo group-hover/item:scale-110'} transition-all duration-200`} />
                  <span className={scopeFilter === 'reporting-chain' ? 'font-medium text-piccolo' : ''}>My Reporting Chain</span>
                </div>
              </DropdownItem>
              {canViewOrgWide && (
                <DropdownItem onClick={() => setScopeFilter('organization')}>
                  <div className="flex items-center gap-2 group/item">
                    <Building2 size={16} className={`${scopeFilter === 'organization' ? 'text-piccolo scale-110' : 'text-trunks group-hover/item:text-piccolo group-hover/item:scale-110'} transition-all duration-200`} />
                    <span className={scopeFilter === 'organization' ? 'font-medium text-piccolo' : ''}>Organization</span>
                  </div>
                </DropdownItem>
              )}
            </Dropdown>
          )}
          <NotificationBell />
          <UserDropdown
            userName={userName}
            userEmail={userEmail}
            onNavigateToAccount={() => navigate('/account')}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
