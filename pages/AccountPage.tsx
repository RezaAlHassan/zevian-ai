import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Briefcase, Building2 } from 'lucide-react';

const AccountPage: React.FC = () => {
    const { user, employee } = useAuth();

    if (!user) return null;

    const organizationName = localStorage.getItem('organizationName') || 'My Organization';

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-on-surface">account settings</h1>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold">
                            {(employee?.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-on-surface">
                                {employee?.name || user.user_metadata?.name || 'User'}
                            </h2>
                            <p className="text-on-surface-secondary">
                                {employee?.role === 'manager' ? 'Manager' : 'Employee'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-border">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-on-surface-secondary uppercase tracking-wider">
                                Contact Information
                            </h3>

                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-on-surface-tertiary mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-on-surface">Email Address</p>
                                    <p className="text-sm text-on-surface-secondary">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-on-surface-secondary uppercase tracking-wider">
                                Organization Details
                            </h3>

                            <div className="flex items-start gap-3">
                                <Building2 className="w-5 h-5 text-on-surface-tertiary mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-on-surface">Organization</p>
                                    <p className="text-sm text-on-surface-secondary">{organizationName}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Briefcase className="w-5 h-5 text-on-surface-tertiary mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-on-surface">Role</p>
                                    <p className="text-sm text-on-surface-secondary capitalize">
                                        {employee?.role || 'Member'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-on-surface-tertiary mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-on-surface">Joined</p>
                                    <p className="text-sm text-on-surface-secondary">
                                        {new Date(employee?.joinDate || user.created_at || Date.now()).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountPage;
