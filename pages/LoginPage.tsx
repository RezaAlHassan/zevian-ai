import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Input } from '../components/ui/input';
import { Button } from "../components/ui/button";
import { LogIn, AlertTriangle, ArrowRight } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await authService.signIn(email, password);
            // Auth state change will key off redirect in App.tsx or we manually redirect
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to sign in');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
            <div className="max-w-md w-full bg-background rounded-2xl border border-border overflow-hidden">
                <div className="px-8 py-10">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <img src="/logo.png" alt="Performance Tracker Logo" className="h-16 object-contain" />
                        </div>
                        <h1 className="text-3xl font-semibold text-foreground mb-2">Welcome Back</h1>
                        <p className="text-base text-muted-foreground">Sign in to your performance tracker account</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-center gap-2 text-destructive text-sm">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            required
                        />

                        <div>
                            <Input
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <div className="flex justify-end mt-1">
                                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <Button type="submit" className="w-full justify-center" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
