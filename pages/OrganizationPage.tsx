
import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, Save, CheckCircle, BarChart3, Info,
    Settings, Calendar, Users, Globe, FolderKanban, RotateCcw, AlertTriangle, Search, Target
} from 'lucide-react';
import { Organization, ManagerSettings, Employee, Project, Invitation, Goal, EmployeeRole } from '../types';
import { STANDARD_METRICS } from '../constants';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import Select from '../components/Select';
import MultiSelect from '../components/MultiSelect';
import { DataTable } from '../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { organizationService } from '../services/databaseService';
import OrganizationUsersTab from '../components/OrganizationUsersTab';
import { useToast } from '../context/ToastContext';
import { canSetGlobalFrequency, canViewOrganizationWide, canManageSettings, isAccountOwner } from '../utils/managerPermissions';
import { Checkbox } from '../components/ui/checkbox';

interface OrganizationPageProps {
    organization: Organization | null;
    refreshOrganization: () => Promise<void>;
    settings: ManagerSettings;
    employees: Employee[];
    projects: Project[];
    updateSettings: (settings: ManagerSettings) => void;
    updateEmployee?: (employee: Employee) => void;
    onRestartOnboarding?: () => void;
    currentManagerId?: string;
    invitations?: Invitation[];
    goals?: Goal[];
    onInvite?: (email: string, role: EmployeeRole, projectIds?: string[], goalIds?: string[], managerId?: string) => Promise<Invitation | null | void>;
    onDeleteInvitation?: (invitationId: string) => Promise<void>;
}

type TabType = 'general' | 'users' | 'reporting' | 'hierarchy' | 'danger';

const OrganizationPage: React.FC<OrganizationPageProps> = ({
    organization,
    refreshOrganization,
    settings,
    employees,
    projects,
    updateSettings,
    updateEmployee,
    onRestartOnboarding,
    currentManagerId,
    invitations = [],
    goals = [],
    onInvite,
    onDeleteInvitation
}) => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('general');

    // Organization State
    const [orgName, setOrgName] = useState('');
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
    const [isSavingOrg, setIsSavingOrg] = useState(false);

    // Reporting Settings State
    const [localSettings, setLocalSettings] = useState<ManagerSettings>({
        selectedDays: settings?.selectedDays || [],
        globalFrequency: settings?.globalFrequency !== undefined ? settings.globalFrequency : true,
        employeeFrequencies: settings?.employeeFrequencies || {},
        projectFrequencies: settings?.projectFrequencies || {},
        allowLateSubmissions: settings?.allowLateSubmissions !== undefined ? settings.allowLateSubmissions : true,
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        if (organization) {
            setOrgName(organization.name);
            setSelectedMetrics(organization.selectedMetrics || []);
        }
    }, [organization]);

    useEffect(() => {
        setLocalSettings({
            selectedDays: settings?.selectedDays || [],
            globalFrequency: settings?.globalFrequency !== undefined ? settings.globalFrequency : true,
            employeeFrequencies: settings?.employeeFrequencies || {},
            projectFrequencies: settings?.projectFrequencies || {},
            allowLateSubmissions: settings?.allowLateSubmissions !== undefined ? settings.allowLateSubmissions : true,
        });
    }, [settings]);

    // Permission Checks
    const currentManager = useMemo(() => {
        if (!currentManagerId) return null;
        return employees.find(emp => emp.id === currentManagerId);
    }, [employees, currentManagerId]);

    const isOwnerFlag = currentManager ? isAccountOwner(currentManager) : false;
    const canSetGlobal = currentManager ? canSetGlobalFrequency(currentManager) : false;
    const canManage = currentManager ? canManageSettings(currentManager) : false;

    const handleSaveOrg = async () => {
        if (!organization) return;
        setIsSavingOrg(true);
        try {
            await organizationService.update(organization.id, {
                name: orgName,
                selectedMetrics
            });
            await refreshOrganization();
            showToast('Organization settings saved.', { type: 'success' });
        } catch (error) {
            console.error('Failed to save organization settings:', error);
            showToast('Failed to save organization. Please try again.', { type: 'error' });
        } finally {
            setIsSavingOrg(false);
        }
    };

    const handleSaveSettings = () => {
        setIsSavingSettings(true);
        updateSettings(localSettings);
        setTimeout(() => {
            setIsSavingSettings(false);
            showToast('Reporting settings saved.', { type: 'success' });
        }, 500);
    };

    const handleGlobalToggle = (isGlobal: boolean) => {
        setLocalSettings(prev => ({
            ...prev,
            globalFrequency: isGlobal,
            employeeFrequencies: isGlobal ? undefined : {},
        }));
    };

    const handleProjectSelectedDaysChange = (projectId: string, days: string[]) => {
        setLocalSettings(prev => ({
            ...prev,
            projectFrequencies: {
                ...(prev.projectFrequencies || {}),
                [projectId]: {
                    ...(prev.projectFrequencies?.[projectId] || {}),
                    selectedDays: days
                },
            },
        }));
    };

    const handleEmployeeSelectedDaysChange = (employeeId: string, days: string[]) => {
        setLocalSettings(prev => ({
            ...prev,
            employeeFrequencies: {
                ...(prev.employeeFrequencies || {}),
                [employeeId]: {
                    ...(prev.employeeFrequencies?.[employeeId] || {}),
                    selectedDays: days
                },
            },
        }));
    };

    if (!organization) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading organization details...</p>
            </div>
        );
    }

    const tabs: { id: TabType; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
        { id: 'general', label: 'Organization', icon: <Building2 size={18} /> },
        { id: 'users', label: 'Users', icon: <Users size={18} /> },
        { id: 'reporting', label: 'Reporting', icon: <Calendar size={18} /> },
        { id: 'hierarchy', label: 'Hierarchy', icon: <Users size={18} />, hidden: !isOwnerFlag },
        { id: 'danger', label: 'Advanced', icon: <RotateCcw size={18} />, hidden: !isOwnerFlag },
    ];

    return (
        <div className="w-full px-6 py-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">Organization Management</h2>
            </div>
            {/* Tab Navigation */}
            <div className="flex border-b border-border mb-6">
                {tabs.filter(t => !t.hidden).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              flex items-center gap-2 px-6 py-3 border-b-2 transition-all font-medium text-sm
              ${activeTab === tab.id
                                ? 'border-primary text-primary bg-primary/10'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
                            }
            `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="space-y-6">
                {/* Tab: General */}
                {activeTab === 'general' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Organization Info */}
                        <div className="bg-background rounded-2xl p-6 border border-border space-y-6">
                            <div className="flex items-center gap-2">
                                <Building2 size={20} className="text-primary drop-shadow-sm" />
                                <h3 className="text-lg font-semibold text-foreground">General Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-foreground">Organization Name</label>
                                    <Input
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        placeholder="Your Organization Name"
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Metrics */}
                        <div className="bg-background rounded-2xl p-6 border border-border space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={20} className="text-primary drop-shadow-sm" />
                                    <h3 className="text-lg font-semibold text-foreground">Organizational Metrics</h3>
                                </div>
                                <div className="bg-primary/5 border border-primary/20 rounded-full py-1 px-4 flex items-center gap-2">
                                    <span className="text-xs text-primary font-bold">{selectedMetrics.length} Active</span>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground max-w-2xl">
                                Choose the performance vectors measured across your organization. These dictate AI evaluation focus.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {STANDARD_METRICS.map((metric) => (
                                    <div
                                        key={metric.id}
                                        onClick={() => {
                                            if (selectedMetrics.includes(metric.id)) {
                                                setSelectedMetrics(selectedMetrics.filter(id => id !== metric.id));
                                            } else {
                                                setSelectedMetrics([...selectedMetrics, metric.id]);
                                            }
                                        }}
                                        className={`
                        relative p-5 rounded-2xl border cursor-pointer transition-all duration-200 group
                        ${selectedMetrics.includes(metric.id)
                                                ? 'border-primary bg-primary/10 ring-1 ring-ring/20'
                                                : 'border-border bg-muted hover:border-muted-foreground/50'
                                            }
                      `}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div>
                                                <h4 className="font-bold text-base text-foreground mb-0.5 transition-colors group-hover:text-primary">
                                                    {metric.friendlyName || metric.name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground font-medium mb-2">
                                                    {metric.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                                    {metric.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleSaveOrg} disabled={isSavingOrg}><Save className="mr-2 h-4 w-4" />
                                {isSavingOrg ? 'Saving...' : 'Save Organization Details'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tab: Users */}
                {activeTab === 'users' && (
                    <OrganizationUsersTab
                        employees={employees}
                        invitations={invitations}
                        projects={projects}
                        goals={goals}
                        onInvite={onInvite}
                        onDeleteInvitation={onDeleteInvitation}
                        organizationName={orgName}
                    />
                )}

                {/* Tab: Reporting */}
                {activeTab === 'reporting' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-background rounded-2xl p-6 border border-border space-y-8">
                            {/* Submission Policy */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Settings size={20} className="text-primary drop-shadow-sm" />
                                    <h3 className="text-lg font-semibold text-foreground">Submission Policy</h3>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-muted rounded-xl border border-border">
                                    <Checkbox
                                        id="allowLate"
                                        checked={localSettings.allowLateSubmissions !== false}
                                        onChange={(checked) => setLocalSettings(prev => ({ ...prev, allowLateSubmissions: checked }))}
                                        label="Allow late submissions after goal deadline"
                                    />
                                </div>
                            </div>

                            {/* Frequency Scope */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Globe size={20} className="text-primary drop-shadow-sm" />
                                    <h3 className="text-lg font-semibold text-foreground">Reporting Frequency</h3>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleGlobalToggle(true)}
                                        disabled={!canSetGlobal}
                                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all ${localSettings.globalFrequency
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-border bg-muted text-muted-foreground hover:bg-accent'
                                            } ${!canSetGlobal ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Globe size={18} />
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Global</p>
                                            <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">One schedule for all</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleGlobalToggle(false)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 transition-all ${!localSettings.globalFrequency
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-border bg-muted text-muted-foreground hover:bg-accent'
                                            }`}
                                    >
                                        <Users size={18} />
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Targeted</p>
                                            <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Per Team or Project</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Day Selection */}
                            {localSettings.globalFrequency ? (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <label className="block text-sm font-semibold text-foreground">Select Reporting Days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                            <button
                                                key={day}
                                                onClick={() => {
                                                    const current = localSettings.selectedDays || [];
                                                    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                                                    setLocalSettings(prev => ({ ...prev, selectedDays: updated }));
                                                }}
                                                className={`px-4 py-2 text-sm rounded-xl border transition-all ${localSettings.selectedDays?.includes(day)
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-muted border-border text-muted-foreground hover:border-primary/50'
                                                    }`}
                                            >
                                                {day.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
                                        <Info size={16} className="text-primary mt-0.5 animate-pulse" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-foreground">Reporting Precedence</p>
                                            <p className="text-xs text-muted-foreground">
                                                Frequency is determined by the most specific setting available:
                                                <span className="font-bold text-primary ml-1">Global &lt; Project &lt; Employee Override</span>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Project Overrides */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <FolderKanban size={16} />
                                            Project Overrides
                                        </label>
                                        <MultiSelect
                                            options={projects.map(p => ({ value: p.id, label: p.name }))}
                                            selectedValues={Object.keys(localSettings.projectFrequencies || {})}
                                            onChange={(ids) => {
                                                const updated = { ...localSettings.projectFrequencies };
                                                ids.forEach(id => { if (!updated[id]) updated[id] = { selectedDays: [] }; });
                                                Object.keys(updated).forEach(id => { if (!ids.includes(id)) delete updated[id]; });
                                                setLocalSettings(prev => ({ ...prev, projectFrequencies: updated }));
                                            }}
                                            placeholder="Select projects to override..."
                                        />

                                        {Object.entries(localSettings.projectFrequencies || {}).map(([projectId, freq]: [string, any]) => {
                                            const project = projects.find(p => p.id === projectId);
                                            if (!project) return null;
                                            return (
                                                <div key={projectId} className="p-3 bg-muted rounded-xl border border-border space-y-3">
                                                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">{project.name}</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                            <button
                                                                key={day}
                                                                onClick={() => {
                                                                    const current = (freq as { selectedDays?: string[] }).selectedDays || [];
                                                                    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                                                                    handleProjectSelectedDaysChange(projectId, updated);
                                                                }}
                                                                className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${(freq as { selectedDays?: string[] }).selectedDays?.includes(day)
                                                                    ? 'bg-primary text-white border-primary'
                                                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                                                    }`}
                                                            >
                                                                {day.slice(0, 3)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Employee Overrides */}
                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                                            <Users size={16} />
                                            Employee Overrides
                                        </label>
                                        <MultiSelect
                                            options={employees.map(e => ({ value: e.id, label: `${e.name} (${e.email})` }))}
                                            selectedValues={Object.keys(localSettings.employeeFrequencies || {})}
                                            onChange={(ids) => {
                                                const updated = { ...localSettings.employeeFrequencies };
                                                ids.forEach(id => { if (!updated[id]) updated[id] = { selectedDays: [] }; });
                                                Object.keys(updated).forEach(id => { if (!ids.includes(id)) delete updated[id]; });
                                                setLocalSettings(prev => ({ ...prev, employeeFrequencies: updated }));
                                            }}
                                            placeholder="Select employees to override..."
                                        />

                                        {Object.entries(localSettings.employeeFrequencies || {}).map(([employeeId, freq]: [string, any]) => {
                                            const employee = employees.find(e => e.id === employeeId);
                                            if (!employee) return null;
                                            return (
                                                <div key={employeeId} className="p-3 bg-muted rounded-xl border border-border space-y-3">
                                                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">{employee.name}</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                            <button
                                                                key={day}
                                                                onClick={() => {
                                                                    const current = (freq as { selectedDays?: string[] }).selectedDays || [];
                                                                    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                                                                    handleEmployeeSelectedDaysChange(employeeId, updated);
                                                                }}
                                                                className={`px-2 py-1 text-[10px] font-bold rounded border transition-all ${(freq as { selectedDays?: string[] }).selectedDays?.includes(day)
                                                                    ? 'bg-primary text-white border-primary'
                                                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                                                    }`}
                                                            >
                                                                {day.slice(0, 0 + 3)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSaveSettings} disabled={isSavingSettings}><Save className="mr-2 h-4 w-4" />
                                {isSavingSettings ? 'Saving...' : 'Save Reporting Settings'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tab: Hierarchy */}
                {activeTab === 'hierarchy' && isOwnerFlag && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-background rounded-2xl p-6 border border-border space-y-6">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-primary drop-shadow-sm" />
                                <h3 className="text-lg font-semibold text-foreground">Hierarchy & Permissions</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Manage the chain of command and delegate senior administrative access.
                            </p>
                            {updateEmployee && (
                                <PermissionsTable
                                    employees={employees}
                                    currentManagerId={currentManagerId}
                                    updateEmployee={updateEmployee}
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Tab: Danger */}
                {activeTab === 'danger' && isOwnerFlag && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-background rounded-2xl p-6 border border-destructive/20 space-y-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={20} className="text-destructive" />
                                <h3 className="text-lg font-semibold text-foreground">Danger Zone</h3>
                            </div>
                            {/* 
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-foreground">Restart Onboarding</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        This will reset your organizational setup process. Existing data will NOT be deleted, but you will be guided through the setup of projects, goals, and team members again.
                                    </p>
                                </div>
                                <Button
                                    onClick={onRestartOnboarding}
                                    variant="outline"
                                    className="border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-all shadow-none"
                                     
                                >
<RotateCcw className="mr-2 h-4 w-4" />

                                    Restart Onboarding Flow
                                </Button>
                                */}
                            <p className="text-sm text-muted-foreground italic text-center py-4">
                                Advanced organization management options are currently restricted.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const PermissionsTable: React.FC<{
    employees: Employee[];
    currentManagerId?: string;
    updateEmployee: (employee: Employee) => void;
}> = ({ employees, currentManagerId, updateEmployee }) => {
    const managers = employees.filter(emp => emp.role === 'manager' || emp.isAccountOwner);
    const managerOptions = managers.map(e => ({ value: e.id, label: e.name }));

    const [searchQuery, setSearchQuery] = useState('');
    // Show all employees in hierarchy management, but allow toggling
    const [showAll, setShowAll] = useState(false);
    const displayedEmployees = useMemo(() => {
        let list = showAll
            ? employees.filter(e => !e.isAccountOwner)
            : managers.filter(e => !e.isAccountOwner);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(e =>
                e.name.toLowerCase().includes(query) ||
                e.email.toLowerCase().includes(query) ||
                e.title?.toLowerCase().includes(query)
            );
        }
        return list;
    }, [employees, managers, showAll, searchQuery]);

    const columns: ColumnDef<Employee>[] = [
        {
            id: "employee",
            header: "Employee",
            cell: ({ row }) => {
                const emp = row.original;
                const isOwner = emp.isAccountOwner;
                return (
                    <div className="flex flex-col">
                        <span className={`font-semibold text-sm ${isOwner ? 'text-primary' : ''}`}>{emp.name}</span>
                        <span className={`text-[10px] uppercase font-bold ${isOwner ? 'text-primary/70' : 'text-muted-foreground/70'}`}>
                            {isOwner ? (emp.title || 'Organization Owner') : (emp.title || 'No Title')}
                        </span>
                    </div>
                );
            }
        },
        {
            id: "reportsTo",
            header: "Reports To",
            cell: ({ row }) => {
                const emp = row.original;
                if (emp.isAccountOwner) {
                    return <div className="text-xs font-bold text-primary italic">Root (Owner)</div>;
                }
                return (
                    <div className="w-32">
                        <Select
                            value={emp.managerId || ''}
                            onChange={(e) => updateEmployee({ ...emp, managerId: e.target.value })}
                            options={[{ value: '', label: 'None' }, ...managerOptions.filter(o => o.value !== emp.id)]}
                            className="text-xs h-8"
                        />
                    </div>
                );
            }
        },
        {
            id: "canViewOrganizationWide",
            header: "View Org",
            cell: ({ row }) => {
                const emp = row.original;
                const hasPerm = emp.isAccountOwner || emp.permissions?.canViewOrganizationWide;
                if (emp.isAccountOwner) {
                    return (
                        <div className="flex justify-center group/perm">
                            <CheckCircle size={16} className="text-primary drop-shadow-sm transition-all group-hover/perm:scale-125 cursor-help" />
                        </div>
                    );
                }
                return (
                    <div className="flex justify-center">
                        <Checkbox
                            checked={!!hasPerm}
                            disabled={emp.role === 'employee'}
                            onChange={() => {
                                const newPerms = { ...emp.permissions, canViewOrganizationWide: !emp.permissions?.canViewOrganizationWide };
                                updateEmployee({ ...emp, permissions: newPerms });
                            }}
                        />
                    </div>
                );
            }
        },
        {
            id: "canManageSettings",
            header: "Settings",
            cell: ({ row }) => {
                const emp = row.original;
                const hasPerm = emp.isAccountOwner || emp.permissions?.canManageSettings;
                if (emp.isAccountOwner) {
                    return (
                        <div className="flex justify-center group/perm">
                            <CheckCircle size={16} className="text-primary drop-shadow-sm transition-all group-hover/perm:scale-125 cursor-help" />
                        </div>
                    );
                }
                return (
                    <div className="flex justify-center">
                        <Checkbox
                            checked={!!hasPerm}
                            disabled={emp.role === 'employee'}
                            onChange={() => {
                                const newPerms = { ...emp.permissions, canManageSettings: !emp.permissions?.canManageSettings };
                                updateEmployee({ ...emp, permissions: newPerms });
                            }}
                        />
                    </div>
                );
            }
        },
        {
            id: "canSetGlobalFrequency",
            header: "Global Freq",
            cell: ({ row }) => {
                const emp = row.original;
                const hasPerm = emp.isAccountOwner || emp.permissions?.canSetGlobalFrequency;
                if (emp.isAccountOwner) {
                    return (
                        <div className="flex justify-center group/perm">
                            <CheckCircle size={16} className="text-primary drop-shadow-sm transition-all group-hover/perm:scale-125 cursor-help" />
                        </div>
                    );
                }
                return (
                    <div className="flex justify-center">
                        <Checkbox
                            checked={!!hasPerm}
                            disabled={emp.role === 'employee'}
                            onChange={() => {
                                const newPerms = { ...emp.permissions, canSetGlobalFrequency: !emp.permissions?.canSetGlobalFrequency };
                                updateEmployee({ ...emp, permissions: newPerms });
                            }}
                        />
                    </div>
                );
            }
        },
        {
            id: "role",
            header: "Role",
            cell: ({ row }) => {
                const emp = row.original;
                if (emp.isAccountOwner) {
                    return <div className="text-[10px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">Owner</div>;
                }
                return (
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${emp.role === 'manager' ? 'bg-primary/10 text-primary' : 'bg-muted-secondary text-muted-foreground/70'
                            }`}>
                            {emp.role}
                        </span>
                        {emp.id === currentManagerId && <span className="text-[10px] text-muted-foreground/70">(You)</span>}
                    </div>
                );
            }
        }
    ];

    // Separate row for Owner as it's static
    const owner = employees.find(e => e.isAccountOwner);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowAll(false)}
                        className={`text-sm font-bold transition-colors ${!showAll ? 'text-primary' : 'text-muted-foreground/70 hover:text-foreground'}`}
                    >
                        Management Team ({managers.length})
                    </button>
                    <button
                        onClick={() => setShowAll(true)}
                        className={`text-sm font-bold transition-colors ${showAll ? 'text-primary' : 'text-muted-foreground/70 hover:text-foreground'}`}
                    >
                        All Employees ({employees.length})
                    </button>
                </div>

                <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70" />
                    <input
                        type="text"
                        placeholder="Search hierarchy..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-muted border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <DataTable
                    columns={columns}
                    data={owner ? [owner, ...displayedEmployees] : displayedEmployees}
                    pagination={false}
                />
            </div>
        </div>
    );
};

export default OrganizationPage;
