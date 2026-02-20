
import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import { Project, Employee, EmployeeRole, Invitation, Goal } from '../types';
import Button from './Button';
import { UserPlus, Mail, Copy, CheckCircle, Loader2, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: EmployeeRole, projectIds?: string[], goalIds?: string[], managerId?: string) => Promise<Invitation | null | void>;
  organizationName?: string;
  projects?: Project[];
  goals?: Goal[];
  managers?: Employee[];
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  organizationName = 'the organization',
  projects = [],
  goals = [],
  managers = [],
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<EmployeeRole>('employee');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [managerId, setManagerId] = useState<string>('');

  const [isProjectsDropdownOpen, setIsProjectsDropdownOpen] = useState(false);
  const [isGoalsDropdownOpen, setIsGoalsDropdownOpen] = useState(false);

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Filter goals: Only show goals that are NOT part of the selected projects.
  // Because if a project is selected, the user gets access to all its goals.
  const availableGoals = useMemo(() => {
    return goals.filter(g => !selectedProjectIds.includes(g.projectId));
  }, [goals, selectedProjectIds]);

  const handleInvite = async () => {
    if (email && email.includes('@')) {
      setIsInviting(true);
      try {
        const result = await onInvite(
          email,
          role,
          selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
          selectedGoalIds.length > 0 ? selectedGoalIds : undefined,
          managerId || undefined
        );
        if (result) {
          setInvitation(result);
        }
      } catch (error) {
        // Error handling should ideally be done in the parent or a toast here
        console.error("Invite failed", error);
      } finally {
        setIsInviting(false);
      }
    }
  };

  const toggleProject = (pid: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
    // Consolidate goals: if I select a project, remove its goals from selectedGoalIds to strictly follow "block out" logic?
    // Or just let them be. The backend handles duplicates or overwrites.
    // But for UI clarity, if a goal becomes unavailable because its project is selected, we should probably unselect it.
    // However, availableGoals update handles the list.
    // Let's cleanup selectedGoalIds for goals that are now covered by project assignment.
    const projectGoals = goals.filter(g => g.projectId === pid).map(g => g.id);
    setSelectedGoalIds(prev => prev.filter(gid => !projectGoals.includes(gid)));
  };

  const toggleGoal = (gid: string) => {
    setSelectedGoalIds(prev =>
      prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid]
    );
  };

  const handleClose = () => {
    setEmail('');
    setRole('employee');
    setSelectedProjectIds([]);
    setSelectedGoalIds([]);
    setManagerId('');
    setInvitation(null);
    setCopied(false);
    onClose();
  };

  const copyInviteLink = () => {
    if (invitation) {
      const inviteLink = `${window.location.origin}/invite/${invitation.token}`;
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite User"
      maxWidth="xl"
      maxHeight="95vh"
      closeOnOutsideClick={false}
      scrollable={false}
    >
      <div className="space-y-4">
        {!invitation ? (
          <>
            <div>
              <p className="text-sm text-on-surface-secondary mb-4">
                Invite a user to join {organizationName}. Managers can read reports, employees send reports.
              </p>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
                icon={Mail}
              />
            </div>
            <div>
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as EmployeeRole)}
                options={[
                  { value: 'employee', label: 'Employee (Sends Reports)' },
                  { value: 'manager', label: 'Manager (Reads Reports)' },
                ]}
              />
              <p className="text-xs text-on-surface-tertiary mt-2">
                {role === 'manager'
                  ? 'Managers can view and read reports from their team members.'
                  : 'Employees can submit reports for their assigned goals.'}
              </p>
            </div>

            <div className="space-y-4">
              {/* Projects Multi-Select (Manager Only) */}
              {role === 'manager' && (
                <div className="relative">
                  <label className="block text-sm font-medium text-on-surface-secondary mb-1">Assign Projects (Optional)</label>
                  <button
                    type="button"
                    onClick={() => setIsProjectsDropdownOpen(!isProjectsDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <span className={selectedProjectIds.length === 0 ? "text-on-surface-tertiary" : ""}>
                      {selectedProjectIds.length === 0
                        ? "Select projects..."
                        : `${selectedProjectIds.length} project${selectedProjectIds.length !== 1 ? 's' : ''} selected`}
                    </span>
                    {isProjectsDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isProjectsDropdownOpen && (
                    <div className="relative z-10 w-full mt-1 bg-surface-elevated border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {projects.length > 0 ? (
                        projects.map(p => (
                          <div
                            key={p.id}
                            onClick={() => toggleProject(p.id)}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-surface-hover cursor-pointer"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedProjectIds.includes(p.id) ? "bg-primary border-primary" : "border-on-surface-tertiary"
                              }`}>
                              {selectedProjectIds.includes(p.id) && <Check size={12} className="text-white" />}
                            </div>
                            <span className="text-sm text-on-surface">{p.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-on-surface-secondary">No projects available</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Goals Multi-Select (Employee Only) */}
              {role === 'employee' && (
                <>
                  <div className="relative">
                    <label className="block text-sm font-medium text-on-surface-secondary mb-1">Assign Specific Goals (Optional)</label>
                    <button
                      type="button"
                      onClick={() => setIsGoalsDropdownOpen(!isGoalsDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-surface border border-border rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <span className={selectedGoalIds.length === 0 ? "text-on-surface-tertiary" : ""}>
                        {selectedGoalIds.length === 0
                          ? "Select goals..."
                          : `${selectedGoalIds.length} goal${selectedGoalIds.length !== 1 ? 's' : ''} selected`}
                      </span>
                      {isGoalsDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isGoalsDropdownOpen && (
                      <div className="relative z-10 w-full mt-1 bg-surface-elevated border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {availableGoals.length > 0 ? (
                          availableGoals.map(g => (
                            <div
                              key={g.id}
                              onClick={() => toggleGoal(g.id)}
                              className="flex items-center gap-2 px-3 py-2 hover:bg-surface-hover cursor-pointer"
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedGoalIds.includes(g.id) ? "bg-primary border-primary" : "border-on-surface-tertiary"
                                }`}>
                                {selectedGoalIds.includes(g.id) && <Check size={12} className="text-white" />}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm text-on-surface truncate">{g.name}</div>
                                <div className="text-xs text-on-surface-secondary truncate">
                                  {projects.find(p => p.id === g.projectId)?.name || 'Unknown Project'}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-on-surface-secondary">No additional goals available</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Team/Manager Selection (Employee Only) */}
                  <div className="relative">
                    <Select
                      label="Assign to Team (Optional)"
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                      options={[
                        { value: '', label: 'None' },
                        ...managers.map(m => ({ value: m.id, label: m.name }))
                      ]}
                      helperText="Specify which manager this employee will report to."
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isInviting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleInvite}
                disabled={!email || !email.includes('@') || isInviting}
                icon={isInviting ? Loader2 : UserPlus}
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-success/10 border border-success/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={20} className="text-success flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-on-surface mb-1">Invitation Sent!</h3>
                  <p className="text-sm text-on-surface-secondary">
                    An invitation has been sent to <strong>{invitation.email}</strong> with role: <strong className="capitalize">{invitation.role}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-lg p-4 border border-border">
              <label className="block text-sm font-medium text-on-surface mb-2">
                Invitation Link
              </label>
              <div className="flex items-center gap-2">
                <Input
                  value={`${window.location.origin}/invite/${invitation.token}`}
                  readOnly
                  className="flex-1 font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteLink}
                  icon={copied ? CheckCircle : Copy}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-on-surface-tertiary mt-2">
                Share this link with the user. The token is saved and will recognize which dashboard and organization to join.
              </p>
            </div>

            <div className="bg-surface-elevated rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-on-surface mb-2">Invitation Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">Token:</span>
                  <span className="font-mono text-xs text-on-surface">{invitation.token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">Organization:</span>
                  <span className="text-on-surface">{invitation.organizationName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">Expires:</span>
                  <span className="text-on-surface">
                    {invitation.expiresAt
                      ? new Date(invitation.expiresAt).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                {invitation.initialProjectId && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Initial Project:</span>
                    <span className="text-on-surface">
                      {projects.find(p => p.id === invitation.initialProjectId)?.name || invitation.initialProjectId}
                    </span>
                  </div>
                )}
                {invitation.initialManagerId && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Initial Team:</span>
                    <span className="text-on-surface">
                      {managers.find(m => m.id === invitation.initialManagerId)?.name || invitation.initialManagerId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setInvitation(null);
                  setEmail('');
                  setRole('employee');
                  setSelectedProjectIds([]);
                  setSelectedGoalIds([]);
                  setManagerId('');
                }}
              >
                Invite Another
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default InviteUserModal;



