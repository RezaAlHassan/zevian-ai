
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Page, ViewMode, EmployeeRole, Invitation, Project, Employee, Goal } from '../types';
import { Target, FileText, Users, User, LayoutDashboard, List, Search, FolderKanban, UserPlus, Building2 } from 'lucide-react';
import InviteUserModal from './InviteUserModal';
import { Badge } from "./ui/badge";

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  viewMode: ViewMode;
  onInvite?: (email: string, role: EmployeeRole, projectIds?: string[], goalIds?: string[], managerId?: string) => Promise<Invitation | null | void>;
  organizationName?: string;
  projects?: Project[];
  goals?: Goal[];
  employees?: Employee[];
}

const NavButton: React.FC<{
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: string;
}> = ({ label, to, icon, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to ||
    (to === '/employees' && location.pathname.startsWith('/employees/')) ||
    (to === '/goals' && location.pathname.startsWith('/goals/')) ||
    (to === '/projects' && location.pathname.startsWith('/projects/'));

  return (
    <Link
      to={to}
      className={`flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${isActive
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
    >
      <div className="flex items-center gap-3">
        <span className={`${isActive ? 'text-primary scale-110' : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'} transition-all duration-200`}>
          {icon}
        </span>
        <span className={isActive ? 'font-bold' : ''}>{label}</span>
      </div>
      {badge && (
        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/20 font-bold">
          {badge}
        </Badge>
      )}
    </Link>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  viewMode,
  onInvite,
  organizationName,
  projects = [],
  goals = [],
  employees = []
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Calculate managers for the invite modal dropdown
  const managers = React.useMemo(() => {
    return employees.filter(emp => emp.role === 'manager');
  }, [employees]);

  return (
    <aside className="w-64 bg-background border-r border-border flex flex-col fixed top-0 left-0 h-full text-foreground z-50">
      {/* Logo */}
      <div className="px-6 h-16 flex items-center border-b border-border">
        <img src="/logo-full.png" alt="Zevian Logo" className="h-8 object-contain" />
      </div>


      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {viewMode === 'manager' ? (
          <>
            <NavButton
              label="Dashboard"
              to="/dashboard"
              icon={<LayoutDashboard size={18} />}
            />
            <NavButton
              label="Projects"
              to="/projects"
              icon={<FolderKanban size={18} />}
            />
            <NavButton
              label="Goals"
              to="/goals"
              icon={<Target size={18} />}
            />
            <NavButton
              label="Reports"
              to="/all-reports"
              icon={<FileText size={18} />}
            />
            <NavButton
              label="Employees"
              to="/employees"
              icon={<User size={18} />}
            />
            <NavButton
              label="Organization"
              to="/organization"
              icon={<Building2 size={18} />}
            />
          </>
        ) : (
          <>
            <NavButton
              label="Dashboard"
              to="/dashboard"
              icon={<LayoutDashboard size={18} />}
            />
            <NavButton
              label="Projects"
              to="/projects"
              icon={<FolderKanban size={18} />}
            />
            <NavButton
              label="Goals"
              to="/goals"
              icon={<Target size={18} />}
            />
            <NavButton
              label="My Reports"
              to="/reports"
              icon={<List size={18} />}
            />
          </>
        )}
      </nav>

      {/* Invite User Button (Manager Only) */}
      {viewMode === 'manager' && onInvite && (
        <div className="p-4 border-t border-border mt-auto">
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all active:scale-[0.98]"
          >
            <UserPlus size={18} />
            <span>Invite User</span>
          </button>
        </div>
      )}

      {onInvite && (
        <InviteUserModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onInvite={onInvite}
          organizationName={organizationName}
          projects={projects}
          goals={goals}
          managers={managers}
        />
      )}
    </aside>
  );
};

export default Sidebar;
