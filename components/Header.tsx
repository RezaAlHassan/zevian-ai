import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import UserDropdown from './UserDropdown';
import { ViewMode, Page, Employee } from '../types';
import { FileText, HelpCircle, Gift, Users, Building2, Network } from 'lucide-react';
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
            <div className="relative flex items-center p-1 bg-surface rounded-lg border border-border h-9 min-w-[600px]">
              {/* Sliding background indicator */}
              <div
                className="absolute top-1 bottom-1 rounded-md bg-primary/10 transition-all duration-300 ease-in-out"
                style={{
                  width: canViewOrgWide ? 'calc(33.33% - 2.6px)' : 'calc(50% - 4px)',
                  left: scopeFilter === 'direct-reports'
                    ? '4px'
                    : scopeFilter === 'reporting-chain'
                      ? (canViewOrgWide ? '33.33%' : '50%')
                      : '66.66%'
                }}
              />
              <button
                onClick={() => setScopeFilter('direct-reports')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 rounded-md text-xs font-medium transition-colors duration-300 ${scopeFilter === 'direct-reports'
                  ? 'text-primary'
                  : 'text-on-surface-secondary hover:text-on-surface'
                  }`}
              >
                <Users size={14} />
                <span className="hidden xl:inline whitespace-nowrap">Direct Reports</span>
                <span className="xl:hidden whitespace-nowrap">Direct</span>
              </button>
              <button
                onClick={() => setScopeFilter('reporting-chain')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 rounded-md text-xs font-medium transition-colors duration-300 ${scopeFilter === 'reporting-chain'
                  ? 'text-primary'
                  : 'text-on-surface-secondary hover:text-on-surface'
                  }`}
              >
                <Network size={14} />
                <span className="hidden xl:inline whitespace-nowrap">My Reporting Chain</span>
                <span className="xl:hidden whitespace-nowrap">Chain</span>
              </button>
              {canViewOrgWide && (
                <button
                  onClick={() => setScopeFilter('organization')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-3 rounded-md text-xs font-medium transition-colors duration-300 ${scopeFilter === 'organization'
                    ? 'text-primary'
                    : 'text-on-surface-secondary hover:text-on-surface'
                    }`}
                >
                  <Building2 size={14} />
                  <span className="hidden xl:inline whitespace-nowrap">Organization</span>
                  <span className="xl:hidden whitespace-nowrap">Org</span>
                </button>
              )}
            </div>
          )}
          <button className="p-2 text-on-surface-secondary hover:text-on-surface hover:bg-surface-hover rounded-md transition-all">
            <HelpCircle size={18} />
          </button>
          <button className="p-2 text-on-surface-secondary hover:text-on-surface hover:bg-surface-hover rounded-md transition-all">
            <Gift size={18} />
          </button>
          <UserDropdown
            userName={userName}
            userEmail={userEmail}
            isCreator={true}
            onNavigateToSettings={() => navigate('/settings')}
            onNavigateToAccount={() => navigate('/account')}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
