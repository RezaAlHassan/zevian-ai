import React, { useState, useMemo } from 'react';
import { Employee, Invitation, EmployeeRole, Project, Goal } from '../types';
import { DataTable } from './ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from './ui/button';
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
    // Users Table Columns
    const userColumns: ColumnDef<Employee>[] = [
        {
            id: "name",
            header: "Name",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full ${row.original.role === 'manager' ? 'bg-primary/10 text-primary' : 'bg-muted-secondary/50 text-muted-foreground'}`}>
                        {row.original.role === 'manager' ? <Shield size={14} /> : <User size={14} />}
                    </div>
                    <div>
                        <span className="font-medium text-sm text-foreground block">{row.original.name}</span>
                        {row.original.title && <span className="textxs text-muted-foreground/70">{row.original.title}</span>}
                    </div>
                </div>
            )
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.email}</span>
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${row.original.role === 'manager'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted-secondary text-muted-foreground'
                    }`}>
                    {row.original.role}
                </span>
            )
        },
        {
            id: "joinDate",
            header: "Join Date",
            cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.joinDate ? formatTableDate(row.original.joinDate) : 'N/A'}</span>
        },
        {
            id: "status",
            header: "Status",
            cell: () => (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Active
                </span>
            )
        }
    ];

    // Invitations Table Columns
    const inviteColumns: ColumnDef<Invitation>[] = [
        {
            accessorKey: "email",
            header: "Email",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Mail size={14} className="text-muted-foreground/70" />
                    <span className="text-sm text-foreground">{row.original.email}</span>
                </div>
            )
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => <span className="capitalize text-sm text-muted-foreground">{row.original.role}</span>
        },
        {
            id: "invitedBy",
            header: "Invited By",
            cell: ({ row }) => {
                const invitedBy = employees.find(e => e.id === row.original.invitedBy)?.name || 'Unknown';
                return <span className="text-sm text-muted-foreground">{invitedBy}</span>;
            }
        },
        {
            accessorKey: "invitedAt",
            header: "Date",
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} className="text-muted-foreground/70" />
                    {formatTableDate(row.original.invitedAt)}
                </div>
            )
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {onDeleteInvitation && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Cancel invitation for ${row.original.email}?`)) {
                                    onDeleteInvitation(row.original.id);
                                }
                            }}
                            className="p-1.5 text-muted-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded transition-all duration-200 group"
                            title="Cancel Invitation"
                        >
                            <Trash2 size={16} className="transition-transform group-hover:scale-110" />
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-background rounded-2xl p-6 border border-border space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-4 border-b border-border w-full sm:w-auto">
                            <button
                                onClick={() => setSubTab('all')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${subTab === 'all'
                                    ? 'border-primary text-primary bg-primary/5'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                All Users
                            </button>
                            <button
                                onClick={() => setSubTab('pending')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${subTab === 'pending'
                                    ? 'border-primary text-primary bg-primary/5'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                Pending Invites
                                {filteredInvitations.length > 0 && (
                                    <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full transition-colors ${subTab === 'pending' ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'}`}>
                                        {filteredInvitations.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {onInvite && (
                        <div className="flex items-center gap-4 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70" />
                                <input
                                    type="text"
                                    placeholder={`Search ${subTab === 'all' ? 'active users' : 'pending invites'}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <Button onClick={() => setShowInviteModal(true)} size="sm"><UserPlus className="mr-2 h-4 w-4" />Invite User
                            </Button>
                        </div>
                    )}
                </div>

                {subTab === 'all' ? (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <DataTable columns={userColumns} data={filteredEmployees} pagination={false} />
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        {filteredInvitations.length > 0 ? (
                            <DataTable columns={inviteColumns} data={filteredInvitations} pagination={false} />
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
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
