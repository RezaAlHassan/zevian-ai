
import React, { useState } from 'react';
import Modal from './Modal';
import Input from './Input';
import Select from './Select';
import { Project, Employee, EmployeeRole, Invitation } from '../types';
import Button from './Button';
import { UserPlus, Mail, Copy, CheckCircle, Loader2 } from 'lucide-react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: EmployeeRole, projectId?: string, managerId?: string) => Promise<Invitation | null | void>;
  organizationName?: string;
  projects?: Project[];
  managers?: Employee[];
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  organizationName = 'the organization',
  projects = [],
  managers = [],
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<EmployeeRole>('employee');
  const [projectId, setProjectId] = useState<string>('');
  const [managerId, setManagerId] = useState<string>('');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [copied, setCopied] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    if (email && email.includes('@')) {
      setIsInviting(true);
      try {
        const result = await onInvite(email, role, projectId || undefined, managerId || undefined);
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

  const handleClose = () => {
    setEmail('');
    setRole('employee');
    setProjectId('');
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite User">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Assign to Project (Optional)"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                options={[
                  { value: '', label: 'None' },
                  ...projects.map(p => ({ value: p.id, label: p.name }))
                ]}
              />
              <Select
                label="Assign to Team (Optional)"
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                options={[
                  { value: '', label: 'None' },
                  ...managers.map(m => ({ value: m.id, label: m.name }))
                ]}
              />
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
                  setProjectId('');
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



