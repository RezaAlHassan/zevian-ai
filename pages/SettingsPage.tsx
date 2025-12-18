
import React, { useState, useMemo, useEffect } from 'react';
import { ManagerSettings, Employee, Project } from '../types';
import { Settings, Save, Calendar, Users, Globe, Building2, FolderKanban, RotateCcw, AlertTriangle, Shield, Rocket } from 'lucide-react';
import Select from '../components/Select';
import Input from '../components/Input';
import Button from '../components/Button';
import MultiSelect from '../components/MultiSelect';
import Table from '../components/Table';
import { canSetGlobalFrequency, canViewOrganizationWide, canManageSettings, isAccountOwner } from '../utils/managerPermissions';

interface SettingsPageProps {
  settings: ManagerSettings;
  employees: Employee[];
  projects: Project[];
  updateSettings: (settings: ManagerSettings) => void;
  updateEmployee?: (employee: Employee) => void;
  onRestartOnboarding?: () => void;
  currentManagerId?: string;
  viewMode?: 'manager' | 'employee';
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  employees,
  projects,
  updateSettings,
  updateEmployee,
  onRestartOnboarding,
  currentManagerId,
  viewMode = 'manager'
}) => {
  // Get current manager
  const currentManager = useMemo(() => {
    if (!currentManagerId) return null;
    return employees.find(emp => emp.id === currentManagerId);
  }, [employees, currentManagerId]);


  // Testing mode: Toggle between account owner and senior manager for testing
  const [testMode, setTestMode] = useState<'owner' | 'senior-manager'>('owner');
  const [testManager, setTestManager] = useState<Employee | null>(null);

  // Create a test manager object based on test mode
  useEffect(() => {
    if (currentManager) {
      if (testMode === 'owner') {
        setTestManager({
          ...currentManager,
          isAccountOwner: true,
          permissions: {
            canSetGlobalFrequency: true,
            canViewOrganizationWide: true,
            canManageSettings: true,
          }
        });
      } else {
        // Senior manager: has canSetGlobalFrequency but not all permissions
        setTestManager({
          ...currentManager,
          isAccountOwner: false,
          permissions: {
            canSetGlobalFrequency: true,
            canViewOrganizationWide: false,
            canManageSettings: true,
          }
        });
      }
    }
  }, [currentManager, testMode]);

  // Use test manager for permission checks if in test mode
  const effectiveManager = testManager || currentManager;
  const effectiveIsOwner = effectiveManager ? isAccountOwner(effectiveManager) : false;
  const effectiveCanSetGlobal = effectiveManager ? canSetGlobalFrequency(effectiveManager) : false;
  const effectiveCanViewOrgWide = effectiveManager ? canViewOrganizationWide(effectiveManager) : false;
  const effectiveCanManage = effectiveManager ? canManageSettings(effectiveManager) : false;

  // Ensure settings have all required fields with defaults
  const [localSettings, setLocalSettings] = useState<ManagerSettings>({
    selectedDays: settings.selectedDays || [],
    globalFrequency: settings.globalFrequency !== undefined ? settings.globalFrequency : true,
    employeeFrequencies: settings.employeeFrequencies || {},
    projectFrequencies: settings.projectFrequencies || {},
    allowLateSubmissions: settings.allowLateSubmissions !== undefined ? settings.allowLateSubmissions : true,
  });
  const [saved, setSaved] = useState(false);

  // Update local settings when prop changes
  useEffect(() => {
    setLocalSettings({
      selectedDays: settings.selectedDays || [],
      globalFrequency: settings.globalFrequency !== undefined ? settings.globalFrequency : true,
      employeeFrequencies: settings.employeeFrequencies || {},
      projectFrequencies: settings.projectFrequencies || {},
      allowLateSubmissions: settings.allowLateSubmissions !== undefined ? settings.allowLateSubmissions : true,
    });
  }, [settings]);


  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSelectedDaysChange = (days: string[]) => {
    setLocalSettings(prev => ({
      ...prev,
      selectedDays: days,
    }));
  };

  const handleGlobalToggle = (isGlobal: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      globalFrequency: isGlobal,
      employeeFrequencies: isGlobal ? undefined : {},
    }));
  };

  const handleEmployeeSelectedDaysChange = (employeeId: string, days: string[]) => {
    setLocalSettings(prev => ({
      ...prev,
      employeeFrequencies: {
        ...prev.employeeFrequencies,
        [employeeId]: {
          selectedDays: days,
        },
      },
    }));
  };


  const handleProjectSelectedDaysChange = (projectId: string, days: string[]) => {
    setLocalSettings(prev => ({
      ...prev,
      projectFrequencies: {
        ...prev.projectFrequencies,
        [projectId]: {
          selectedDays: days,
        },
      },
    }));
  };

  const handleSelectedProjectsChange = (projectIds: string[]) => {
    // Initialize settings for newly selected projects
    setLocalSettings(prev => {
      const newProjectFrequencies = { ...prev.projectFrequencies };

      // Remove settings for deselected projects
      Object.keys(newProjectFrequencies).forEach(projectId => {
        if (!projectIds.includes(projectId)) {
          delete newProjectFrequencies[projectId];
        }
      });

      // Initialize settings for newly selected projects
      projectIds.forEach(projectId => {
        if (!newProjectFrequencies[projectId]) {
          newProjectFrequencies[projectId] = {
            selectedDays: [],
          };
        }
      });

      return {
        ...prev,
        projectFrequencies: newProjectFrequencies,
      };
    });
  };

  const selectedEmployeeIds = Object.keys(localSettings.employeeFrequencies || {});
  const selectedProjectIds = Object.keys(localSettings.projectFrequencies || {});

  // Create employee options with name, title, and email for searchability
  // The label includes all searchable text but displays nicely
  const employeeOptions = useMemo(() => {
    return employees.map(employee => {
      // Include all searchable fields in label for MultiSelect search functionality
      // Format: "Name - Title (email)" or "Name (email)" if no title
      const label = employee.title
        ? `${employee.name} - ${employee.title} (${employee.email})`
        : `${employee.name} (${employee.email})`;
      return {
        value: employee.id,
        label: label,
      };
    });
  }, [employees]);

  const handleSelectedEmployeesChange = (employeeIds: string[]) => {
    // Initialize settings for newly selected employees
    setLocalSettings(prev => {
      const newEmployeeFrequencies = { ...prev.employeeFrequencies };

      // Remove settings for deselected employees
      Object.keys(newEmployeeFrequencies).forEach(employeeId => {
        if (!employeeIds.includes(employeeId)) {
          delete newEmployeeFrequencies[employeeId];
        }
      });

      // Initialize settings for newly selected employees
      employeeIds.forEach(employeeId => {
        if (!newEmployeeFrequencies[employeeId]) {
          newEmployeeFrequencies[employeeId] = {
            selectedDays: [],
          };
        }
      });

      return {
        ...prev,
        employeeFrequencies: newEmployeeFrequencies,
      };
    });
  };

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={28} className="text-on-surface-secondary" />
        <h2 className="text-xl font-bold text-on-surface">Manager Settings</h2>
      </div>

      {/* Report Submission Settings */}
      <div className="bg-surface-elevated rounded-lg p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-on-surface-secondary" />
          <h3 className="text-xl font-semibold text-on-surface">Report Submission Settings</h3>
        </div>

        {/* Allow Late Submissions Toggle */}
        <div className="mb-6 pb-6 border-b border-border">
          <label className="block text-sm font-medium text-on-surface mb-3">
            Late Submission Policy
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.allowLateSubmissions !== false}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, allowLateSubmissions: e.target.checked }))}
                className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 rounded"
              />
              <span className="text-on-surface font-medium">Allow late submissions after goal deadline</span>
            </label>
          </div>
          <p className="mt-2 text-sm text-on-surface-secondary">
            {localSettings.allowLateSubmissions !== false
              ? 'Reports can be submitted even after the goal deadline has passed.'
              : 'Reports cannot be submitted after the goal deadline has passed.'}
          </p>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-on-surface-secondary" />
          <h3 className="text-xl font-semibold text-on-surface">Report Submission Frequency</h3>
        </div>

        <div className="space-y-6">
          {/* Global vs Per-Employee/Team Toggle */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-on-surface">
                Frequency Scope
              </label>
              {!effectiveCanSetGlobal && (
                <div className="flex items-center gap-2 text-warning text-sm">
                  <AlertTriangle size={16} />
                  <span>Permission required</span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleGlobalToggle(true)}
                disabled={!effectiveCanSetGlobal}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${localSettings.globalFrequency
                  ? 'bg-on-surface-secondary text-white border-on-surface-secondary'
                  : 'bg-surface border-border text-on-surface-secondary hover:bg-surface-hover'
                  } ${!effectiveCanSetGlobal ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Globe size={18} />
                <span className="font-medium">Global</span>
              </button>
              <button
                onClick={() => handleGlobalToggle(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${!localSettings.globalFrequency
                  ? 'bg-on-surface-secondary text-white border-on-surface-secondary'
                  : 'bg-surface border-border text-on-surface-secondary hover:bg-surface-hover'
                  }`}
              >
                <Users size={18} />
                <span className="font-medium">Team/Employee</span>
              </button>
            </div>
            {!effectiveCanSetGlobal && (
              <p className="mt-2 text-sm text-on-surface-secondary">
                You need the "Set global frequency settings" permission to configure global frequency.
                Contact your account owner to request this permission.
              </p>
            )}
          </div>

          {/* Global Frequency Setting */}
          {localSettings.globalFrequency && (
            <div className="space-y-4">
              {/* Day Selection */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-3">
                  Select Days for Reporting
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label
                      key={day}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${localSettings.selectedDays?.includes(day)
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-surface border-border text-on-surface hover:bg-surface-hover'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={localSettings.selectedDays?.includes(day) || false}
                        onChange={(e) => {
                          const currentDays = localSettings.selectedDays || [];
                          if (e.target.checked) {
                            handleSelectedDaysChange([...currentDays, day]);
                          } else {
                            handleSelectedDaysChange(currentDays.filter(d => d !== day));
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-sm text-on-surface-secondary">
                  {localSettings.selectedDays && localSettings.selectedDays.length > 0
                    ? `Reports will be required on: ${localSettings.selectedDays.join(', ')} every week`
                    : 'Select at least one day for reporting'}
                </p>
              </div>
            </div>
          )}

          {/* Per-Employee Frequency Settings */}
          {!localSettings.globalFrequency && (
            <div className="space-y-6">
              {/* Per-Project Settings */}
              <div>
                <label className="block text-base font-medium text-on-surface mb-3">
                  Project Settings
                  <span className="text-xs text-on-surface-tertiary ml-2">(Precedence: Global &lt; Project &lt; Per-Employee)</span>
                </label>
                <div className="space-y-4">
                  {/* Project Selection */}
                  <MultiSelect
                    label="Search and Select Projects"
                    options={projects.map(p => ({ value: p.id, label: p.name }))}
                    selectedValues={selectedProjectIds}
                    onChange={handleSelectedProjectsChange}
                    placeholder="Search by project name..."
                    searchable
                    helperText="Project settings take precedence over global settings but are overridden by per-employee settings"
                  />

                  {/* Selected Projects Configuration */}
                  {selectedProjectIds.length > 0 && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedProjectIds.map(projectId => {
                        const project = projects.find(p => p.id === projectId);
                        if (!project) return null;

                        const projectSettings = localSettings.projectFrequencies?.[projectId] || {
                          selectedDays: [],
                        };

                        return (
                          <div key={projectId} className="p-4 bg-surface rounded-lg border border-border space-y-3">
                            <div className="flex items-center gap-2">
                              <FolderKanban size={18} className="text-on-surface-secondary" />
                              <p className="font-medium text-on-surface">{project.name}</p>
                            </div>
                            {/* Day Selection */}
                            <div>
                              <label className="block text-xs font-medium text-on-surface mb-2">
                                Select Days for Reporting
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                  <label
                                    key={day}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all text-xs ${projectSettings.selectedDays?.includes(day)
                                      ? 'bg-primary/10 text-primary border-primary/20'
                                      : 'bg-surface border-border text-on-surface hover:bg-surface-hover'
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={projectSettings.selectedDays?.includes(day) || false}
                                      onChange={(e) => {
                                        const currentDays = projectSettings.selectedDays || [];
                                        if (e.target.checked) {
                                          handleProjectSelectedDaysChange(projectId, [...currentDays, day]);
                                        } else {
                                          handleProjectSelectedDaysChange(projectId, currentDays.filter(d => d !== day));
                                        }
                                      }}
                                      className="w-3 h-3"
                                    />
                                    <span className="font-medium">{day.slice(0, 3)}</span>
                                  </label>
                                ))}
                              </div>
                              <p className="mt-2 text-xs text-on-surface-secondary">
                                {projectSettings.selectedDays && projectSettings.selectedDays.length > 0
                                  ? `Reports will be required on: ${projectSettings.selectedDays.join(', ')} every week`
                                  : 'Select at least one day for reporting'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Per-Employee Settings */}
              <div>
                <label className="block text-base font-medium text-on-surface mb-3">
                  Employee Settings
                </label>
                <div className="space-y-4">
                  {/* Employee Selection */}
                  <MultiSelect
                    label="Search and Select Employees"
                    options={employeeOptions}
                    selectedValues={selectedEmployeeIds}
                    onChange={handleSelectedEmployeesChange}
                    placeholder="Search by name, email, or title..."
                    searchable
                    helperText="Search for employees by name, email, or job title to configure their reporting settings"
                  />

                  {/* Selected Employees Configuration */}
                  {selectedEmployeeIds.length > 0 && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedEmployeeIds.map(employeeId => {
                        const employee = employees.find(e => e.id === employeeId);
                        if (!employee) return null;

                        const employeeSettings = localSettings.employeeFrequencies?.[employeeId] || {
                          selectedDays: [],
                        };

                        return (
                          <div key={employeeId} className="p-4 bg-surface rounded-lg border border-border space-y-3">
                            <div>
                              <p className="font-medium text-on-surface">{employee.name}</p>
                              {employee.title && (
                                <p className="text-sm text-on-surface-secondary font-medium">{employee.title}</p>
                              )}
                              <p className="text-sm text-on-surface-secondary">{employee.email}</p>
                            </div>
                            {/* Day Selection */}
                            <div>
                              <label className="block text-xs font-medium text-on-surface mb-2">
                                Select Days for Reporting
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                  <label
                                    key={day}
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded border cursor-pointer transition-all text-xs ${employeeSettings.selectedDays?.includes(day)
                                      ? 'bg-primary/10 text-primary border-primary/20'
                                      : 'bg-surface border-border text-on-surface hover:bg-surface-hover'
                                      }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={employeeSettings.selectedDays?.includes(day) || false}
                                      onChange={(e) => {
                                        const currentDays = employeeSettings.selectedDays || [];
                                        if (e.target.checked) {
                                          handleEmployeeSelectedDaysChange(employeeId, [...currentDays, day]);
                                        } else {
                                          handleEmployeeSelectedDaysChange(employeeId, currentDays.filter(d => d !== day));
                                        }
                                      }}
                                      className="w-3 h-3"
                                    />
                                    <span className="font-medium">{day.slice(0, 3)}</span>
                                  </label>
                                ))}
                              </div>
                              <p className="mt-2 text-xs text-on-surface-secondary">
                                {employeeSettings.selectedDays && employeeSettings.selectedDays.length > 0
                                  ? `Reports will be required on: ${employeeSettings.selectedDays.join(', ')} every week`
                                  : 'Select at least one day for reporting'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Testing Mode Toggle */}
      <div className="bg-surface-elevated rounded-lg p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-on-surface-secondary" />
          <h3 className="text-xl font-semibold text-on-surface">Testing Mode</h3>
        </div>
        <p className="text-on-surface-secondary text-sm mb-4">
          Toggle between Account Owner and Senior Manager permissions for testing purposes.
        </p>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="testMode"
              value="owner"
              checked={testMode === 'owner'}
              onChange={(e) => setTestMode(e.target.value as 'owner' | 'senior-manager')}
              className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
            />
            <span className="text-on-surface font-medium">Account Owner</span>
            <span className="text-xs text-on-surface-secondary">(All permissions)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="testMode"
              value="senior-manager"
              checked={testMode === 'senior-manager'}
              onChange={(e) => setTestMode(e.target.value as 'owner' | 'senior-manager')}
              className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
            />
            <span className="text-on-surface font-medium">Senior Manager</span>
            <span className="text-xs text-on-surface-secondary">(Can set global frequency, manage settings)</span>
          </label>
        </div>
        <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-on-surface">
            <strong>Current Permissions:</strong>
          </p>
          <ul className="text-sm text-on-surface-secondary mt-2 space-y-1">
            <li>• Set Global Frequency: {effectiveCanSetGlobal ? '✓ Yes' : '✗ No'}</li>
            <li>• View Org-Wide Data: {effectiveCanViewOrgWide ? '✓ Yes' : '✗ No'}</li>
            <li>• Manage Settings: {effectiveCanManage ? '✓ Yes' : '✗ No'}</li>
            <li>• Account Owner: {effectiveIsOwner ? '✓ Yes' : '✗ No'}</li>
          </ul>
        </div>
      </div>

      {/* Permissions Management Section - Only for Account Owners */}
      {effectiveIsOwner && (
        <div className="bg-surface-elevated rounded-lg p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-on-surface-secondary" />
            <h3 className="text-xl font-semibold text-on-surface">Hierarchy & Permissions</h3>
          </div>
          <p className="text-on-surface-secondary text-sm mb-4">
            Manage reporting structure and permissions. Assign managers to a "Reports To" manager to create a hierarchy.
            Grant "Full (Senior)" access to delegate organization-wide control.
          </p>
          {updateEmployee && (
            <PermissionsManager
              employees={employees}
              currentManagerId={currentManagerId}
              updateEmployee={updateEmployee}
            />
          )}
          {!updateEmployee && (
            <p className="text-sm text-on-surface-secondary italic">
              Employee update function not available. This is a read-only view.
            </p>
          )}
        </div>
      )}

      {/* Onboarding Section */}
      {onRestartOnboarding && (
        <div className="bg-surface-elevated rounded-lg p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <RotateCcw size={20} className="text-on-surface-secondary" />
            <h3 className="text-xl font-semibold text-on-surface">Onboarding</h3>
          </div>
          <p className="text-on-surface-secondary text-sm mb-4">
            Restart the onboarding process to set up your organization, employees, teams, projects, and goals from scratch.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onRestartOnboarding}
              variant="outline"
              icon={RotateCcw}
            >
              Restart Onboarding
            </Button>
            <Button
              onClick={() => {
                // Clear onboarding completion flag and show onboarding
                localStorage.removeItem('onboardingCompleted');
                onRestartOnboarding();
              }}
              variant="primary"
              icon={Rocket}
            >
              Test Onboarding
            </Button>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          variant="primary"
          size="lg"
          icon={Save}
        >
          Save Settings
        </Button>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="fixed bottom-4 right-4 bg-success/20 border border-success/30 text-success px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <Save size={20} />
          <span className="font-medium">Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
};

// Hierarchy & Permissions Manager Component - Only visible to account owners
interface PermissionsManagerProps {
  employees: Employee[];
  currentManagerId?: string;
  updateEmployee: (employee: Employee) => void;
}

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ employees, currentManagerId, updateEmployee }) => {
  // Show all employees who are Managers (role='manager') or have direct reports
  const managers = useMemo(() => {
    return employees.filter(emp => emp.role === 'manager' || emp.isAccountOwner);
  }, [employees]);

  const [localManagers, setLocalManagers] = useState<Employee[]>(managers);

  useEffect(() => {
    setLocalManagers(managers);
  }, [managers]);

  const handleManagerChange = (employeeId: string, newManagerId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      updateEmployee({ ...emp, managerId: newManagerId });
    }
  };

  const handleToggleFullAccess = (employeeId: string, isFullAccess: boolean) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      updateEmployee({
        ...emp,
        permissions: {
          canSetGlobalFrequency: isFullAccess,
          canViewOrganizationWide: isFullAccess,
          canManageSettings: isFullAccess,
        }
      });
    }
  };

  const managerOptions = employees
    .filter(e => e.role === 'manager' || e.isAccountOwner)
    .map(e => ({ value: e.id, label: e.name }));

  const tableHeaders = ['Manager', 'Reports To', 'Access Level', 'Status'];
  const tableRows = localManagers.map(employee => {
    const isFullAccess = employee.permissions?.canViewOrganizationWide && employee.permissions?.canManageSettings;

    // Filter out self from manager options to prevent cycles (basic check)
    // A robust check would prevent cycles in DFS, but simple 'not self' is a start.
    const validManagerOptions = managerOptions.filter(opt => opt.value !== employee.id);

    return [
      <div>
        <span className="font-medium text-on-surface block">{employee.name}</span>
        <span className="text-sm text-on-surface-secondary">{employee.email}</span>
      </div>,
      <div className="w-48">
        {!employee.isAccountOwner ? (
          <Select
            value={employee.managerId || ''}
            onChange={(e) => handleManagerChange(employee.id, e.target.value)}
            options={[{ value: '', label: 'No Manager' }, ...validManagerOptions]}
            className="text-sm"
          />
        ) : (
          <span className="text-sm text-on-surface-secondary">N/A (Owner)</span>
        )}
      </div>,
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!isFullAccess}
            disabled={employee.isAccountOwner}
            onChange={() => !employee.isAccountOwner && handleToggleFullAccess(employee.id, false)}
            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
          />
          <span className="text-sm text-on-surface">Limited</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!!isFullAccess || employee.isAccountOwner}
            disabled={employee.isAccountOwner}
            onChange={() => !employee.isAccountOwner && handleToggleFullAccess(employee.id, true)}
            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
          />
          <span className="text-sm text-on-surface">Full (Senior)</span>
        </label>
      </div>,
      <div className="text-sm text-on-surface-secondary">
        {employee.id === currentManagerId && <span className="italic mr-2">(You)</span>}
        {employee.isAccountOwner && <span className="px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-medium">Owner</span>}
      </div>,
    ];
  });

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-lg p-4 border border-border">
        <Table headers={tableHeaders} rows={tableRows} />
      </div>
      <div className="text-xs text-on-surface-secondary space-y-1">
        <p><strong>Limited Manager:</strong> Can only view and manage their direct (and indirect) reporting chain.</p>
        <p><strong>Full (Senior) Manager:</strong> Has "Account Owner" specific content controls, full organization visibility, and can manage settings.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
