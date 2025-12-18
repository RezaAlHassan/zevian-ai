
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Page, ViewMode, EmployeeRole, Invitation } from '../types';
import { Target, FileText, Users, User, LayoutDashboard, List, Search, FolderKanban, UserPlus } from 'lucide-react';
import InviteUserModal from './InviteUserModal';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  viewMode: ViewMode;
  onInvite?: (email: string, role: EmployeeRole) => Promise<Invitation | null | void>;
  organizationName?: string;
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
      className={`flex items-center justify-between w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-on-surface-secondary hover:bg-surface-hover hover:text-on-surface'
        }`}
    >
      <div className="flex items-center gap-3">
        <span className={isActive ? 'text-primary' : 'text-on-surface-tertiary'}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="px-2 py-0.5 text-xs font-semibold bg-primary/20 text-primary rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, viewMode, onInvite, organizationName }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col fixed top-0 left-0 h-full text-on-surface z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-sm">PT</span>
        </div>
        <h1 className="text-lg font-semibold text-on-surface">Performance Tracker</h1>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-tertiary" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-on-surface placeholder-on-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
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
          </>
        ) : (
          <>
            <NavButton
              label="Dashboard"
              to="/dashboard"
              icon={<LayoutDashboard size={18} />}
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
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-all shadow-sm active:scale-[0.98]"
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
        />
      )}
    </aside>
  );
};

export default Sidebar;
