
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Invitation, Employee, EmployeeRole } from '../types';
import { CheckCircle, XCircle, Loader2, Mail, Shield, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Modal from '../components/Modal';
import { authService } from '../services/authService';
import { invitationService } from '../services/invitationService';

interface InviteAcceptPageProps {
  // Props no longer needed - keeping interface for backward compatibility
}

const InviteAcceptPage: React.FC<InviteAcceptPageProps> = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvitation = async () => {
      if (!token) {
        setError('Invalid invitation token');
        setLoading(false);
        return;
      }

      try {
        // Fetch invitation from database
        const foundInvitation = await invitationService.getByToken(token);

        if (!foundInvitation) {
          setError('Invitation not found or has expired');
          setLoading(false);
          return;
        }

        // Check if invitation is expired
        if (foundInvitation.expiresAt && new Date(foundInvitation.expiresAt) < new Date()) {
          setError('This invitation has expired');
          setLoading(false);
          return;
        }

        // Check if already accepted
        if (foundInvitation.status === 'accepted') {
          setError('This invitation has already been accepted');
          setLoading(false);
          return;
        }

        setInvitation(foundInvitation);
        setLoading(false);

        // Store token and organization info in localStorage for recognition
        localStorage.setItem('invitationToken', token);
        localStorage.setItem('organizationId', foundInvitation.organizationId);
      } catch (err) {
        console.error('Failed to load invitation:', err);
        setError('Invitation not found or has expired');
        setLoading(false);
      }
    };

    loadInvitation();
  }, [token]);

  const handleAccept = () => {
    if (!invitation || !token) {
      return;
    }

    // Store invitation data in localStorage for the password setup page
    localStorage.setItem('invitationToken', token);
    localStorage.setItem('organizationId', invitation.organizationId);

    // Redirect to password setup page
    navigate(`/set-password/${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-card rounded-lg p-8 border border-border text-center">
          <XCircle size={48} className="text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Invitation Error</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const orgName = localStorage.getItem('organizationName') || 'the organization';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-lg p-8 border border-border">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            {invitation?.role === 'manager' ? (
              <Shield size={32} className="text-primary" />
            ) : (
              <User size={32} className="text-primary" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">You're Invited!</h2>
          <p className="text-muted-foreground">
            Join <strong>{orgName}</strong> as a{' '}
            <strong className="capitalize">{invitation?.role}</strong>
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-muted rounded-lg p-4 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Mail size={20} className="text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Invited Email</p>
                <p className="font-medium text-foreground">{invitation?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {invitation?.role === 'manager' ? (
                <Shield size={20} className="text-muted-foreground" />
              ) : (
                <User size={20} className="text-muted-foreground" />
              )}
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium text-foreground capitalize">
                  {invitation?.role === 'manager' ? 'Manager (Reads Reports)' : 'Employee (Sends Reports)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={handleAccept} className="w-full">
            Continue to Setup
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Token: <code className="font-mono">{token}</code>
          <br />
          This token is saved and will recognize which dashboard and organization to join.
        </p>
      </div>
    </div>
  );
};

export default InviteAcceptPage;

