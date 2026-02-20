import React, { useState, useMemo } from 'react';
import { Employee, Invitation, EmployeeRole, Project, Goal } from '../types';
import Table from './Table';
import Button from './Button';
import InviteUserModal from './InviteUserModal';
import { formatTableDate } from '../utils/dateFormat';
import { Mail, Clock, Trash2, UserPlus, User, Shield, Search } from 'lucide-react';

interface OrganizationUsersTabProps {
    employees: Employee[];
    invitations: Invitation[];
    projects: Project[];
    goals: Goal[];
    onInvite?: (email: string, role: EmployeeRole, projectIds?: string[], goalIds?: string[], managerId?: string) => Promise<Invitation | null | void>;
    onDeleteInvitation?: (invitationId: string) => Promise<void>;
    organizationName?: string;
}

const OrganizationUsersTab: React.FC<OrganizationUsersTabProps> = ({
    employees,
    invitations,
    projects,
    goals,
    onInvite,
    onDeleteInvitation,
    organizationName
}) => {
    const [subTab, setSubTab] = useState<'all' | 'pending'>('all');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter logic
    const filteredEmployees = useMemo(() => {
        if (!searchQuery.trim()) return employees;
        const query = searchQuery.toLowerCase().trim();
        return employees.filter(emp =>
            emp.name.toLowerCase().includes(query) ||
            emp.email.toLowerCase().includes(query) ||
            emp.title?.toLowerCase().includes(query)
        );
    }, [employees, searchQuery]);

    const filteredInvitations = useMemo(() => {
        const pending = invitations.filter(inv => inv.status === 'pending');
        if (!searchQuery.trim()) return pending;
        const query = searchQuery.toLowerCase().trim();
        return pending.filter(inv =>
            inv.email.toLowerCase().includes(query) ||
            inv.role.toLowerCase().includes(query)
        );
    }, [invitations, searchQuery]);

    const managers = useMemo(() => employees.filter(e => e.role === 'manager'), [employees]);

    // Users Table
    const userHeaders = ['Name', 'Email', 'Role', 'Join Date', 'Status'];
    const userRows = filteredEmployees.map(emp => [
        <div key="name" className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full ${emp.role === 'manager' ? 'bg-primary/10 text-primary' : 'bg-surface-secondary/50 text-on-surface-secondary'}`}>
                {emp.role === 'manager' ? <Shield size={14} /> : <User size={14} />}
            </div>
            <div>
                <span className="font-medium text-sm text-on-surface block">{emp.name}</span>
                {emp.title && <span className="textxs text-on-surface-tertiary">{emp.title}</span>}
            </div>
        </div>,
        <span key="email" className="text-sm text-on-surface-secondary">{emp.email}</span>,
        <span key="role" className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${emp.role === 'manager'
            ? 'bg-primary/10 text-primary'
            : 'bg-surface-secondary text-on-surface-secondary'
            }`}>
            {emp.role}
        </span>,
        <span key="date" className="text-sm text-on-surface-secondary">{emp.joinDate ? formatTableDate(emp.joinDate) : 'N/A'}</span>,
        <span key="status" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
        </span>
    ]);

    // Invitations Table
    const inviteHeaders = ['Email', 'Role', 'Invited By', 'Date', 'Actions'];
    const inviteRows = filteredInvitations.map(inv => {
        const invitedBy = employees.find(e => e.id === inv.invitedBy)?.name || 'Unknown';
        return [
            <div key="email" className="flex items-center gap-2">
                <Mail size={14} className="text-on-surface-tertiary" />
                <span className="text-sm text-on-surface">{inv.email}</span>
            </div>,
            <span key="role" className="capitalize text-sm text-on-surface-secondary">{inv.role}</span>,
            <span key="by" className="text-sm text-on-surface-secondary">{invitedBy}</span>,
            <div key="date" className="flex items-center gap-2 text-sm text-on-surface-secondary">
                <Clock size={14} className="text-on-surface-tertiary" />
                {formatTableDate(inv.invitedAt)}
            </div>,
            <div key="actions" className="flex items-center gap-2">
                {onDeleteInvitation && (
                    <button
                        onClick={() => {
                            if (window.confirm(`Cancel invitation for ${inv.email}?`)) {
                                onDeleteInvitation(inv.id);
                            }
                        }}
                        className="p-1.5 text-on-surface-tertiary hover:text-error hover:bg-error/10 rounded transition-colors"
                        title="Cancel Invitation"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        ]
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-surface-elevated rounded-xl p-6 border border-border shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex p-1 bg-surface border border-border rounded-lg">
                            <button
                                onClick={() => setSubTab('all')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${subTab === 'all'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-on-surface-secondary hover:text-on-surface'
                                    }`}
                            >
                                All Users
                            </button>
                            <button
                                onClick={() => setSubTab('pending')}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${subTab === 'pending'
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-on-surface-secondary hover:text-on-surface'
                                    }`}
                            >
                                Pending Invites
                                {filteredInvitations.length > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">
                                        {filteredInvitations.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {onInvite && (
                        <div className="flex items-center gap-4 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-tertiary" />
                                <input
                                    type="text"
                                    placeholder={`Search ${subTab === 'all' ? 'active users' : 'pending invites'}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-on-surface placeholder-on-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <Button
                                onClick={() => setShowInviteModal(true)}
                                variant="primary"
                                icon={UserPlus}
                                size="sm"
                            >
                                Invite User
                            </Button>
                        </div>
                    )}
                </div>

                {subTab === 'all' ? (
                    <div className="border border-border rounded-xl overflow-hidden bg-surface">
                        <Table headers={userHeaders} rows={userRows} />
                    </div>
                ) : (
                    <div className="border border-border rounded-xl overflow-hidden bg-surface">
                        {inviteRows.length > 0 ? (
                            <Table headers={inviteHeaders} rows={inviteRows} />
                        ) : (
                            <div className="p-8 text-center text-on-surface-secondary">
                                <p>No pending invitations.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showInviteModal && onInvite && (
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
        </div>
    );
};

export default OrganizationUsersTab;
