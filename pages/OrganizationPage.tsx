
import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, Save, CheckCircle, BarChart3, Info,
    Settings, Calendar, Users, Globe, FolderKanban, RotateCcw, AlertTriangle
} from 'lucide-react';
import { Organization, ManagerSettings, Employee, Project } from '../types';
import { STANDARD_METRICS } from '../constants';
import Input from '../components/Input';
import Button from '../components/Button';
import Select from '../components/Select';
import MultiSelect from '../components/MultiSelect';
import Table from '../components/Table';
import { organizationService } from '../services/databaseService';
import { useToast } from '../context/ToastContext';
import { canSetGlobalFrequency, canViewOrganizationWide, canManageSettings, isAccountOwner } from '../utils/managerPermissions';

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
}

type TabType = 'general' | 'reporting' | 'hierarchy' | 'danger';

const OrganizationPage: React.FC<OrganizationPageProps> = ({
    organization,
    refreshOrganization,
    settings,
    employees,
    projects,
    updateSettings,
    updateEmployee,
    onRestartOnboarding,
    currentManagerId
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
                <p className="text-on-surface-secondary">Loading organization details...</p>
            </div>
        );
    }

    const tabs: { id: TabType; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
        { id: 'general', label: 'Organization', icon: <Building2 size={18} /> },
        { id: 'reporting', label: 'Reporting', icon: <Calendar size={18} /> },
        { id: 'hierarchy', label: 'Hierarchy', icon: <Users size={18} />, hidden: !isOwnerFlag },
        { id: 'danger', label: 'Advanced', icon: <RotateCcw size={18} />, hidden: !isOwnerFlag },
    ];

    return (
        <div className="w-full px-6 py-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-on-surface">Organization Management</h2>
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
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-on-surface-secondary hover:text-on-surface hover:bg-surface-hover'
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
                        <div className="bg-surface-elevated rounded-xl p-6 border border-border shadow-sm space-y-6">
                            <div className="flex items-center gap-2">
                                <Building2 size={20} className="text-primary" />
                                <h3 className="text-lg font-semibold text-on-surface">General Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-on-surface">Organization Name</label>
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
                        <div className="bg-surface-elevated rounded-xl p-6 border border-border shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={20} className="text-primary" />
                                    <h3 className="text-lg font-semibold text-on-surface">Organizational Metrics</h3>
                                </div>
                                <div className="bg-primary/5 border border-primary/20 rounded-full py-1 px-4 flex items-center gap-2">
                                    <span className="text-xs text-primary font-bold">{selectedMetrics.length} Active</span>
                                </div>
                            </div>
                            <p className="text-sm text-on-surface-secondary max-w-2xl">
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
                      p-4 rounded-xl border-2 cursor-pointer transition-all group
                      ${selectedMetrics.includes(metric.id)
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                : 'border-border bg-surface hover:border-on-surface-tertiary'
                                            }
                    `}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-sm text-on-surface">{metric.friendlyName}</h4>
                                                <div className={`
                          w-4 h-4 rounded-full border flex items-center justify-center
                          ${selectedMetrics.includes(metric.id) ? 'bg-primary border-primary' : 'border-border'}
                        `}>
                                                    {selectedMetrics.includes(metric.id) && <CheckCircle size={10} className="text-white" />}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-on-surface-secondary leading-tight line-clamp-2">
                                                {metric.description}
                                            </p>
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

                {/* Tab: Reporting */}
                {activeTab === 'reporting' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-surface-elevated rounded-xl p-6 border border-border shadow-sm space-y-8">
                            {/* Submission Policy */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Settings size={20} className="text-primary" />
                                    <h3 className="text-lg font-semibold text-on-surface">Submission Policy</h3>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-surface rounded-lg border border-border">
                                    <input
                                        type="checkbox"
                                        id="allowLate"
                                        checked={localSettings.allowLateSubmissions !== false}
                                        onChange={(e) => setLocalSettings(prev => ({ ...prev, allowLateSubmissions: e.target.checked }))}
                                        className="w-5 h-5 text-primary rounded border-border focus:ring-primary"
                                    />
                                    <label htmlFor="allowLate" className="text-sm font-medium text-on-surface cursor-pointer">
                                        Allow late submissions after goal deadline
                                    </label>
                                </div>
                            </div>

                            {/* Frequency Scope */}
                            <div className="space-y-4 pt-6 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Globe size={20} className="text-primary" />
                                    <h3 className="text-lg font-semibold text-on-surface">Reporting Frequency</h3>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleGlobalToggle(true)}
                                        disabled={!canSetGlobal}
                                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 transition-all ${localSettings.globalFrequency
                                            ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                            : 'border-border bg-surface text-on-surface-secondary hover:bg-surface-hover'
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
                                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 transition-all ${!localSettings.globalFrequency
                                            ? 'border-primary bg-primary/5 text-primary shadow-sm'
                                            : 'border-border bg-surface text-on-surface-secondary hover:bg-surface-hover'
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
                                    <label className="block text-sm font-semibold text-on-surface">Select Reporting Days</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                            <button
                                                key={day}
                                                onClick={() => {
                                                    const current = localSettings.selectedDays || [];
                                                    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
                                                    setLocalSettings(prev => ({ ...prev, selectedDays: updated }));
                                                }}
                                                className={`px-4 py-2 text-sm rounded-lg border transition-all ${localSettings.selectedDays?.includes(day)
                                                    ? 'bg-primary text-white border-primary shadow-sm'
                                                    : 'bg-surface border-border text-on-surface-secondary hover:border-primary/50'
                                                    }`}
                                            >
                                                {day.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                                        <Info size={16} className="text-primary mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-on-surface">Reporting Precedence</p>
                                            <p className="text-xs text-on-surface-secondary">
                                                Frequency is determined by the most specific setting available:
                                                <span className="font-bold text-primary ml-1">Global &lt; Project &lt; Employee Override</span>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Project Overrides */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-on-surface flex items-center gap-2">
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
                                                <div key={projectId} className="p-3 bg-surface rounded-lg border border-border space-y-3">
                                                    <p className="text-xs font-bold text-on-surface uppercase tracking-wider">{project.name}</p>
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
                                                                    : 'bg-white text-on-surface-secondary border-border hover:border-primary/50'
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
                                        <label className="text-sm font-semibold text-on-surface flex items-center gap-2">
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
                                                <div key={employeeId} className="p-3 bg-surface rounded-lg border border-border space-y-3">
                                                    <p className="text-xs font-bold text-on-surface uppercase tracking-wider">{employee.name}</p>
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
                                                                    : 'bg-white text-on-surface-secondary border-border hover:border-primary/50'
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
                        <div className="bg-surface-elevated rounded-xl p-6 border border-border shadow-sm space-y-6">
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-primary" />
                                <h3 className="text-lg font-semibold text-on-surface">Hierarchy & Permissions</h3>
                            </div>
                            <p className="text-sm text-on-surface-secondary">
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
                        <div className="bg-surface-elevated rounded-xl p-6 border border-error/20 shadow-sm space-y-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={20} className="text-error" />
                                <h3 className="text-lg font-semibold text-on-surface">Danger Zone</h3>
                            </div>
                            {/* 
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-on-surface">Restart Onboarding</p>
                                    <p className="text-xs text-on-surface-secondary leading-relaxed">
                                        This will reset your organizational setup process. Existing data will NOT be deleted, but you will be guided through the setup of projects, goals, and team members again.
                                    </p>
                                </div>
                                <Button
                                    onClick={onRestartOnboarding}
                                    variant="outline"
                                    className="border-error/30 text-error hover:bg-error hover:text-white transition-all shadow-none"
                                    icon={RotateCcw}
                                >
                                    Restart Onboarding Flow
                                </Button>
                                */}
                            <p className="text-sm text-on-surface-secondary italic text-center py-4">
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

    const headers = ['Manager', 'Reports To', 'View Org', 'Settings', 'Global Freq', 'Actions'];
    const rows = managers.map(emp => {
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
                <span className="font-semibold text-sm">{emp.name}</span>
                <span className="text-[10px] text-on-surface-tertiary uppercase font-bold">{emp.title || 'No Title'}</span>
            </div>,
            <div key="manager" className="w-32">
                {!emp.isAccountOwner ? (
                    <Select
                        value={emp.managerId || ''}
                        onChange={(e) => updateEmployee({ ...emp, managerId: e.target.value })}
                        options={[{ value: '', label: 'None' }, ...managerOptions.filter(o => o.value !== emp.id)]}
                        className="text-xs h-8"
                    />
                ) : <span className="text-xs text-primary font-bold">Organization Owner</span>}
            </div>,
            // View Org Permission
            <div key="view" className="flex justify-center">
                <input
                    type="checkbox"
                    checked={!!hasPerm('canViewOrganizationWide')}
                    disabled={emp.isAccountOwner}
                    onChange={() => togglePerm('canViewOrganizationWide')}
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary disabled:opacity-50"
                />
            </div>,
            // Manage Settings Permission
            <div key="settings" className="flex justify-center">
                <input
                    type="checkbox"
                    checked={!!hasPerm('canManageSettings')}
                    disabled={emp.isAccountOwner}
                    onChange={() => togglePerm('canManageSettings')}
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary disabled:opacity-50"
                />
            </div>,
            // Global Frequency Permission
            <div key="freq" className="flex justify-center">
                <input
                    type="checkbox"
                    checked={!!hasPerm('canSetGlobalFrequency')}
                    disabled={emp.isAccountOwner}
                    onChange={() => togglePerm('canSetGlobalFrequency')}
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary disabled:opacity-50"
                />
            </div>,
            <div key="status" className="text-[10px] text-on-surface-secondary">
                {emp.id === currentManagerId ? '(You)' : ''}
            </div>
        ];
    });

    return (
        <div className="border border-border rounded-xl overflow-hidden bg-surface">
            <Table headers={headers} rows={rows} />
        </div>
    );
};

export default OrganizationPage;
