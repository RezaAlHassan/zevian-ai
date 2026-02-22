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
    const [verificationRequired, setVerificationRequired] = useState(false);
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
                    setVerificationRequired(true);
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
            <div className="min-h-screen flex items-center justify-center bg-gohan p-4">
                <div className="max-w-md w-full bg-goten rounded-moon-s-xl border border-beerus p-8 text-center">
                    <div className="w-16 h-16 bg-roshi/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-roshi" />
                    </div>
                    <h2 className="text-moon-24 font-semibold text-bulma mb-2">
                        {verificationRequired ? 'Verify Your Account' : 'Account Created!'}
                    </h2>
                    <p className="text-moon-14 text-trunks mb-6">
                        {verificationRequired
                            ? 'We have sent a confirmation link to your email. Please verify your account before logging in.'
                            : 'Redirecting you to the dashboard...'}
                    </p>

                    {verificationRequired ? (
                        <div className="space-y-4">
                            <div className="p-3 bg-gohan rounded-moon-s-md border border-beerus text-moon-12 text-trunks">
                                <p>Didn't receive the email? Check your spam folder.</p>
                            </div>
                            <Button
                                onClick={() => navigate('/login')}
                                variant="primary"
                                className="w-full justify-center"
                            >
                                Back to Login
                            </Button>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-piccolo"></div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gohan p-4">
            <div className="max-w-md w-full bg-goten rounded-moon-s-xl border border-beerus overflow-hidden">
                <div className="px-8 py-10">
                    <div className="text-center mb-8">
                        <h1 className="text-moon-32 font-semibold text-bulma mb-2">Get Started</h1>
                        <p className="text-moon-16 text-trunks">Create a new organization account</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-dodoria/10 border border-dodoria/20 rounded-moon-s-md p-3 flex items-center gap-2 text-dodoria text-moon-14">
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
