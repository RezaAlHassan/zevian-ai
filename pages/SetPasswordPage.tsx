import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Invitation } from '../types';
import { CheckCircle, XCircle, Loader2, Lock, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { authService } from '../services/authService';
import { invitationService } from '../services/invitationService';
import { employeeService } from '../services/databaseService';
import { supabase } from '../services/supabaseClient';

const SetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Force sign out to prevent session leakage (e.g. if owner clicks the link)
        const ensureCleanSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                console.log('[SetPasswordPage] Clearing existing session before acceptance...');
                await authService.signOut();
            }
        };
        ensureCleanSession();

        const loadInvitation = async () => {
            if (!token) {
                setError('Invalid invitation token');
                setLoading(false);
                return;
            }

            try {
                const foundInvitation = await invitationService.getByToken(token);

                if (!foundInvitation) {
                    setError('Invitation not found or has expired');
                    setLoading(false);
                    return;
                }

                if (foundInvitation.expiresAt && new Date(foundInvitation.expiresAt) < new Date()) {
                    setError('This invitation has expired');
                    setLoading(false);
                    return;
                }

                if (foundInvitation.status === 'accepted') {
                    setError('This invitation has already been accepted');
                    setLoading(false);
                    return;
                }

                setInvitation(foundInvitation);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load invitation:', err);
                setError('Invitation not found or has expired');
                setLoading(false);
            }
        };

        loadInvitation();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!invitation) {
            setError('Invitation data not found');
            return;
        }

        console.log('[SetPasswordPage] Starting account setup with invitation:', {
            email: invitation.email,
            role: invitation.role,
            organizationId: invitation.organizationId,
            token
        });

        setSubmitting(true);

        try {
            // 1. Create Auth User (sign up)
            console.log('[SetPasswordPage] Step 1: Creating auth user...');
            await authService.acceptInvite(invitation.email, password, name, invitation.role);

            // 2. Get the newly created auth user
            console.log('[SetPasswordPage] Step 2: Getting authenticated user...');
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                console.error('[SetPasswordPage] Failed to get user:', userError);
                throw new Error('Failed to get authenticated user');
            }
            console.log('[SetPasswordPage] Auth user created:', { userId: user.id, email: user.email });

            // 3. Create Employee Record with auth_user_id
            const newEmployee = {
                id: `emp-${Date.now()}`,
                organizationId: invitation.organizationId,
                name,
                email: invitation.email,
                role: invitation.role,
                joinDate: new Date().toISOString(),
                authUserId: user.id
            };

            console.log('[SetPasswordPage] Step 3: Creating employee record:', newEmployee);
            const createdEmployee = await employeeService.create(newEmployee);
            console.log('[SetPasswordPage] Employee created successfully:', createdEmployee);

            // 4. Mark invitation as accepted
            console.log('[SetPasswordPage] Step 4: Marking invitation as accepted...');
            await invitationService.accept(token!);

            // 5. Store role in localStorage for immediate redirection
            console.log('[SetPasswordPage] Step 5: Storing role in localStorage:', invitation.role);
            localStorage.setItem('userRole', invitation.role);
            localStorage.setItem('onboardingCompleted', 'true'); // Skip onboarding for invited users

            // 6. Redirect to appropriate dashboard based on role
            console.log('[SetPasswordPage] Step 6: Redirecting to dashboard for role:', invitation.role);
            setTimeout(() => {
                console.log('[SetPasswordPage] Navigating to dashboard now...');
                navigate('/dashboard');
            }, 2000); // Increased timeout to ensure employee record is loaded

        } catch (err) {
            console.error('[SetPasswordPage] Setup failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to complete account setup');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={48} />
                    <p className="text-on-surface-secondary">Loading invitation...</p>
                </div>
            </div>
        );
    }

    if (error && !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="max-w-md w-full bg-surface-elevated rounded-lg p-8 border border-border text-center">
                    <XCircle size={48} className="text-error mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-on-surface mb-2">Setup Error</h2>
                    <p className="text-on-surface-secondary mb-6">{error}</p>
                    <Button variant="primary" onClick={() => navigate('/login')}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    if (submitting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="max-w-md w-full bg-surface-elevated rounded-lg p-8 border border-border text-center">
                    <CheckCircle size={48} className="text-success mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-on-surface mb-2">Account Created!</h2>
                    <p className="text-on-surface-secondary mb-6">
                        Redirecting to your dashboard...
                    </p>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

    const orgName = localStorage.getItem('organizationName') || 'the organization';

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface-elevated rounded-xl shadow-lg border border-border overflow-hidden">
                <div className="px-8 py-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Lock size={32} className="text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold text-on-surface mb-2">Create Account</h1>
                        <p className="text-on-surface-secondary">
                            Create your account to join <strong>{orgName}</strong>
                        </p>
                        <p className="text-sm text-on-surface-tertiary mt-2">
                            Role: <strong className="capitalize">{invitation?.role}</strong>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-error/10 border border-error/20 rounded-lg p-3 flex items-center gap-2 text-error text-sm">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your full name"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full justify-center"
                                disabled={submitting}
                                icon={Lock}
                            >
                                {submitting ? 'Creating Account...' : 'Complete Setup'}
                            </Button>
                        </div>
                    </form>

                    <p className="text-xs text-on-surface-tertiary text-center mt-6">
                        By completing setup, you agree to join {orgName} and access your dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SetPasswordPage;
