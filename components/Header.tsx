import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDropdown from './UserDropdown';
import { ViewMode, Page, Employee } from '../types';
import { NotificationBell } from './NotificationBell';
import { FileText, Users, Building2, Network, Eye } from 'lucide-react';
import Dropdown, { DropdownItem } from './Dropdown';
import { canViewOrganizationWide } from '../utils/managerPermissions';
import { User } from '@supabase/supabase-js';

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
  user
}) => {
  const navigate = useNavigate();

  // Use passed currentUser or find in list
  const currentEmployee = currentUser || employees.find(e => e.id === currentEmployeeId);

  // Fallback for user name/email if employee record not yet created
  const userName = currentEmployee?.name || user?.user_metadata?.name || 'User';
  const userEmail = currentEmployee?.email || user?.email || '';

  // Check permissions on the logged-in user for organization-wide access
  // This ensures account owners can access org view regardless of currentManagerId
  const canViewOrgWide = useMemo(() => {
    return currentEmployee ? canViewOrganizationWide(currentEmployee) : false;
  }, [currentEmployee]);

  return (
    <header className="bg-white sticky top-0 z-10 border-b border-border">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          {viewMode === 'employee' && (
            <button
              onClick={() => navigate('/submit')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-primary text-white font-medium hover:bg-primary-hover transition-all"
            >
              <FileText size={14} />
              <span>Submit Report</span>
            </button>
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
                scopeFilter === 'direct-reports' ? <Users size={16} className="text-primary" /> :
                  scopeFilter === 'reporting-chain' ? <Network size={16} className="text-primary" /> : <Building2 size={16} className="text-primary" />
              }
              variant="outline"
              size="sm"
              align="right"
              buttonClassName="bg-surface border-border h-9"
            >
              <div className="px-3 py-2 text-xs font-semibold text-on-surface-tertiary uppercase tracking-wider">
                Visibility Scope
              </div>
              <DropdownItem onClick={() => setScopeFilter('direct-reports')}>
                <div className="flex items-center gap-2">
                  <Users size={16} className={scopeFilter === 'direct-reports' ? 'text-primary' : 'text-on-surface-secondary'} />
                  <span className={scopeFilter === 'direct-reports' ? 'font-medium text-primary' : ''}>Direct Reports</span>
                </div>
              </DropdownItem>
              <DropdownItem onClick={() => setScopeFilter('reporting-chain')}>
                <div className="flex items-center gap-2">
                  <Network size={16} className={scopeFilter === 'reporting-chain' ? 'text-primary' : 'text-on-surface-secondary'} />
                  <span className={scopeFilter === 'reporting-chain' ? 'font-medium text-primary' : ''}>My Reporting Chain</span>
                </div>
              </DropdownItem>
              {canViewOrgWide && (
                <DropdownItem onClick={() => setScopeFilter('organization')}>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className={scopeFilter === 'organization' ? 'text-primary' : 'text-on-surface-secondary'} />
                    <span className={scopeFilter === 'organization' ? 'font-medium text-primary' : ''}>Organization</span>
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
