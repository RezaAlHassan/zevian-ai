
import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, Save, CheckCircle, BarChart3, Info,
    Settings, Calendar, Users, Globe, FolderKanban, RotateCcw, AlertTriangle, Search, Target
} from 'lucide-react';
import { Organization, ManagerSettings, Employee, Project, Invitation, Goal, EmployeeRole } from '../types';
import { STANDARD_METRICS } from '../constants';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import MultiSelect from '../components/MultiSelect';
import Table from '../components/Table';
import { organizationService } from '../services/databaseService';
import OrganizationUsersTab from '../components/OrganizationUsersTab';
import { useToast } from '../context/ToastContext';
import { canSetGlobalFrequency, canViewOrganizationWide, canManageSettings, isAccountOwner } from '../utils/managerPermissions';
import Checkbox from '../components/Checkbox';

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
                <p className="text-trunks">Loading organization details...</p>
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
                <h2 className="text-moon-24 font-bold text-bulma">Organization Management</h2>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-beerus mb-6">
                {tabs.filter(t => !t.hidden).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              flex items-center gap-2 px-6 py-3 border-b-2 transition-all font-medium text-moon-14
              ${activeTab === tab.id
                                ? 'border-piccolo text-piccolo bg-piccolo/10'
                                : 'border-transparent text-trunks hover:text-bulma hover:bg-gohan'
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
                        <div className="bg-goten rounded-moon-s-lg p-6 border border-beerus space-y-6">
                            <div className="flex items-center gap-2">
                                <Building2 size={20} className="text-piccolo drop-shadow-sm" />
                                <h3 className="text-moon-18 font-semibold text-bulma">General Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-moon-14 font-medium text-bulma">Organization Name</label>
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
                        <div className="bg-goten rounded-moon-s-lg p-6 border border-beerus space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={20} className="text-piccolo drop-shadow-sm" />
                                    <h3 className="text-moon-18 font-semibold text-bulma">Organizational Metrics</h3>
                                </div>
                                <div className="bg-piccolo/5 border border-piccolo/20 rounded-full py-1 px-4 flex items-center gap-2">
                                    <span className="text-moon-12 text-piccolo font-bold">{selectedMetrics.length} Active</span>
                                </div>
                            </div>
                            <p className="text-moon-14 text-trunks max-w-2xl">
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
                        relative p-5 rounded-moon-s-lg border cursor-pointer transition-all duration-200 group
                        ${selectedMetrics.includes(metric.id)
                                                ? 'border-piccolo bg-piccolo/10 ring-1 ring-piccolo/20'
                                                : 'border-beerus bg-gohan hover:border-trunks/50'
                                            }
                      `}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div>
                                                <h4 className="font-bold text-moon-16 text-bulma mb-0.5 transition-colors group-hover:text-piccolo">
                                                    {metric.friendlyName || metric.name}
                                                </h4>
                                                <p className="text-moon-12 text-trunks font-medium mb-2">
                                                    {metric.name}
                                                </p>
                                                <p className="text-moon-14 text-trunks line-clamp-3 leading-relaxed">
                                                    {metric.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={handleSaveOrg} variant="primary" icon={Save} disabled={isSavingOrg}>
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
                        <div className="bg-goten rounded-moon-s-lg p-6 border border-beerus space-y-8">
                            {/* Submission Policy */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Settings size={20} className="text-piccolo drop-shadow-sm" />
                                    <h3 className="text-moon-18 font-semibold text-bulma">Submission Policy</h3>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-gohan rounded-moon-s-md border border-beerus">
                                    <Checkbox
                                        id="allowLate"
                                        checked={localSettings.allowLateSubmissions !== false}
                                        onChange={(checked) => setLocalSettings(prev => ({ ...prev, allowLateSubmissions: checked }))}
                                        label="Allow late submissions after goal deadline"
                                    />
                                </div>
                            </div>

                            {/* Frequency Scope */}
                            <div className="space-y-4 pt-6 border-t border-beerus">
                                <div className="flex items-center gap-2">
                                    <Globe size={20} className="text-piccolo drop-shadow-sm" />
                                    <h3 className="text-moon-18 font-semibold text-bulma">Reporting Frequency</h3>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleGlobalToggle(true)}
                                        disabled={!canSetGlobal}
                                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-moon-s-lg border-2 transition-all ${localSettings.globalFrequency
                                            ? 'border-primary bg-piccolo/5 text-piccolo'
                                            : 'border-beerus bg-gohan text-trunks hover:bg-surface-hover'
                                            } ${!canSetGlobal ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Globe size={18} />
                                        <div className="text-left">
                                            <p className="font-bold text-moon-14">Global</p>
                                            <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">One schedule for all</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleGlobalToggle(false)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-moon-s-lg border-2 transition-all ${!localSettings.globalFrequency
                                            ? 'border-primary bg-piccolo/5 text-piccolo'
                                            : 'border-beerus bg-gohan text-trunks hover:bg-surface-hover'
                                            }`}
                                    >
                                        <Users size={18} />
                                        <div className="text-left">
                                            <p className="font-bold text-moon-14">Targeted</p>
                                            <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Per Team or Project</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Day Selection */}
                            {localSettings.globalFrequency ? (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <label className="block text-moon-14 font-semibold text-bulma">Select Reporting Days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                            <button
                                                key={day}
                                                onClick={() => {
                                                    const current = localSettings.selectedDays || [];
                                                    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                                                    setLocalSettings(prev => ({ ...prev, selectedDays: updated }));
                                                }}
                                                className={`px-4 py-2 text-moon-14 rounded-moon-s-md border transition-all ${localSettings.selectedDays?.includes(day)
                                                    ? 'bg-piccolo text-white border-primary'
                                                    : 'bg-gohan border-beerus text-trunks hover:border-primary/50'
                                                    }`}
                                            >
                                                {day.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="p-4 bg-piccolo/5 border border-piccolo/20 rounded-moon-s-lg flex items-start gap-3">
                                        <Info size={16} className="text-piccolo mt-0.5 animate-pulse" />
                                        <div className="space-y-1">
                                            <p className="text-moon-14 font-semibold text-bulma">Reporting Precedence</p>
                                            <p className="text-moon-12 text-trunks">
                                                Frequency is determined by the most specific setting available:
                                                <span className="font-bold text-piccolo ml-1">Global &lt; Project &lt; Employee Override</span>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Project Overrides */}
                                    <div className="space-y-4">
                                        <label className="text-moon-14 font-semibold text-bulma flex items-center gap-2">
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
                                                <div key={projectId} className="p-3 bg-gohan rounded-moon-s-md border border-beerus space-y-3">
                                                    <p className="text-moon-12 font-bold text-bulma uppercase tracking-wider">{project.name}</p>
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
                                                                    ? 'bg-piccolo text-white border-primary'
                                                                    : 'bg-white text-trunks border-beerus hover:border-primary/50'
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
                                    <div className="space-y-4 pt-4 border-t border-beerus">
                                        <label className="text-moon-14 font-semibold text-bulma flex items-center gap-2">
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
                                                <div key={employeeId} className="p-3 bg-gohan rounded-moon-s-md border border-beerus space-y-3">
                                                    <p className="text-moon-12 font-bold text-bulma uppercase tracking-wider">{employee.name}</p>
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
                                                                    ? 'bg-piccolo text-white border-primary'
                                                                    : 'bg-white text-trunks border-beerus hover:border-primary/50'
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
                            <Button onClick={handleSaveSettings} variant="primary" icon={Save} disabled={isSavingSettings}>
                                {isSavingSettings ? 'Saving...' : 'Save Reporting Settings'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Tab: Hierarchy */}
                {activeTab === 'hierarchy' && isOwnerFlag && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-goten rounded-moon-s-lg p-6 border border-beerus space-y-6">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-piccolo drop-shadow-sm" />
                                <h3 className="text-moon-18 font-semibold text-bulma">Hierarchy & Permissions</h3>
                            </div>
                            <p className="text-moon-14 text-trunks">
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
                        <div className="bg-goten rounded-moon-s-lg p-6 border border-dodoria/20 space-y-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={20} className="text-dodoria" />
                                <h3 className="text-moon-18 font-semibold text-bulma">Danger Zone</h3>
                            </div>
                            {/* 
                                <div className="space-y-1">
                                    <p className="text-moon-14 font-bold text-bulma">Restart Onboarding</p>
                                    <p className="text-moon-12 text-trunks leading-relaxed">
                                        This will reset your organizational setup process. Existing data will NOT be deleted, but you will be guided through the setup of projects, goals, and team members again.
                                    </p>
                                </div>
                                <Button
                                    onClick={onRestartOnboarding}
                                    variant="outline"
                                    className="border-error/30 text-dodoria hover:bg-error hover:text-white transition-all shadow-none"
                                    icon={RotateCcw}
                                >
                                    Restart Onboarding Flow
                                </Button>
                                */}
                            <p className="text-moon-14 text-trunks italic text-center py-4">
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

    const headers = ['Employee', 'Reports To', 'View Org', 'Settings', 'Global Freq', 'Role'];
    const rows = displayedEmployees.map(emp => {
        // Helper to check permission or if owner
        const hasPerm = (p: keyof import('../types').EmployeePermissions) => emp.isAccountOwner || emp.permissions?.[p];

        // Helper to toggle permission
        const togglePerm = (p: keyof import('../types').EmployeePermissions) => {
            if (emp.isAccountOwner) return;
            const newPerms = { ...emp.permissions, [p]: !emp.permissions?.[p] };
            updateEmployee({ ...emp, permissions: newPerms });
        };

        return [
            <div key="name" className="flex flex-col">
                <span className="font-semibold text-moon-14">{emp.name}</span>
                <span className="text-[10px] text-trunks/70 uppercase font-bold">{emp.title || 'No Title'}</span>
            </div>,
            <div key="manager" className="w-32">
                <Select
                    value={emp.managerId || ''}
                    onChange={(e) => updateEmployee({ ...emp, managerId: e.target.value })}
                    options={[{ value: '', label: 'None' }, ...managerOptions.filter(o => o.value !== emp.id)]}
                    className="text-moon-12 h-8"
                />
            </div>,
            <div key="view" className="flex justify-center">
                <Checkbox
                    checked={!!hasPerm('canViewOrganizationWide')}
                    disabled={emp.role === 'employee'}
                    onChange={() => togglePerm('canViewOrganizationWide')}
                />
            </div>,
            <div key="settings" className="flex justify-center">
                <Checkbox
                    checked={!!hasPerm('canManageSettings')}
                    disabled={emp.role === 'employee'}
                    onChange={() => togglePerm('canManageSettings')}
                />
            </div>,
            <div key="freq" className="flex justify-center">
                <Checkbox
                    checked={!!hasPerm('canSetGlobalFrequency')}
                    disabled={emp.role === 'employee'}
                    onChange={() => togglePerm('canSetGlobalFrequency')}
                />
            </div>,
            <div key="status" className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${emp.role === 'manager' ? 'bg-piccolo/10 text-piccolo' : 'bg-surface-secondary text-trunks/70'
                    }`}>
                    {emp.role}
                </span>
                {emp.id === currentManagerId && <span className="text-[10px] text-trunks/70">(You)</span>}
            </div>
        ];
    });

    // Separate row for Owner as it's static
    const owner = employees.find(e => e.isAccountOwner);
    const ownerRow = owner ? [
        <div key="owner-name" className="flex flex-col">
            <span className="font-bold text-moon-14 text-piccolo">{owner.name}</span>
            <span className="text-[10px] text-primary/70 uppercase font-bold">{owner.title || 'Organization Owner'}</span>
        </div>,
        <div key="owner-manager" className="text-moon-12 font-bold text-piccolo italic">Root (Owner)</div>,
        <div key="owner-view" className="flex justify-center group/perm">
            <CheckCircle size={16} className="text-piccolo drop-shadow-sm transition-all group-hover/perm:scale-125 cursor-help" />
        </div>,
        <div key="owner-settings" className="flex justify-center group/perm">
            <CheckCircle size={16} className="text-piccolo drop-shadow-sm transition-all group-hover/perm:scale-125 cursor-help" />
        </div>,
        <div key="owner-freq" className="flex justify-center group/perm">
            <CheckCircle size={16} className="text-piccolo drop-shadow-sm transition-all group-hover/perm:scale-125 cursor-help" />
        </div>,
        <div key="owner-status" className="text-[10px] font-bold text-piccolo uppercase bg-piccolo/10 px-1.5 py-0.5 rounded">Owner</div>
    ] : null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowAll(false)}
                        className={`text-moon-14 font-bold transition-colors ${!showAll ? 'text-piccolo' : 'text-trunks/70 hover:text-on-surface'}`}
                    >
                        Management Team ({managers.length})
                    </button>
                    <button
                        onClick={() => setShowAll(true)}
                        className={`text-moon-14 font-bold transition-colors ${showAll ? 'text-piccolo' : 'text-trunks/70 hover:text-on-surface'}`}
                    >
                        All Employees ({employees.length})
                    </button>
                </div>

                <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-trunks/70" />
                    <input
                        type="text"
                        placeholder="Search hierarchy..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-gohan border border-beerus rounded-moon-s-md text-moon-14 text-bulma placeholder-on-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>
            <div className="border border-beerus rounded-moon-s-lg overflow-hidden bg-gohan">
                <Table
                    headers={headers}
                    rows={ownerRow ? [ownerRow, ...rows] : rows}
                />
            </div>
        </div>
    );
};

export default OrganizationPage;
