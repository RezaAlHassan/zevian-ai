import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import { UserPlus, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Sign up auth user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { name },
                    emailRedirectTo: window.location.origin, // Direct to Dashboard/Onboarding, skipping Login page
                },
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // Check if session is null (implies email confirmation required)
                if (data.session) {
                    // Auto-confirmed (e.g. dev mode or "Disable Confirm Email" on)
                    setSuccess(true);
                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1500);
                } else {
                    // Email confirmation required
                    setSuccess(true);
                    // Do not redirect; let user read message
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create account');
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="max-w-md w-full bg-surface-elevated rounded-xl shadow-lg border border-border p-8 text-center">
                    <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-on-surface mb-2">Account Created!</h2>
                    <p className="text-on-surface-secondary mb-6">
                        Please check your email to confirm your account, then log in.
                    </p>
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full bg-surface-elevated rounded-xl shadow-lg border border-border overflow-hidden">
                <div className="px-8 py-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-on-surface mb-2">Get Started</h1>
                        <p className="text-on-surface-secondary">Create a new organization account</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-error/10 border border-error/20 rounded-lg p-3 flex items-center gap-2 text-error text-sm">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <Input
                            label="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
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

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full justify-center"
                            disabled={isLoading}
                            icon={isLoading ? undefined : UserPlus}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
