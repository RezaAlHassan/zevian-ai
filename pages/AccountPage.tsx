import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Calendar, Briefcase, Building2, Save, X, Edit2 } from 'lucide-react';
import { employeeService } from '../services/databaseService';
import Button from '../components/Button';
import Input from '../components/Input';

const AccountPage: React.FC = () => {
    const { user, employee, refreshEmployee } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(employee?.name || '');
    const [title, setTitle] = useState(employee?.title || '');
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state when employee data loads
    useEffect(() => {
        if (employee) {
            setName(employee.name);
            setTitle(employee.title || '');
        }
    }, [employee]);

    if (!user) return null;

    const organizationName = localStorage.getItem('organizationName') || 'My Organization';

    const handleSave = async () => {
        if (!employee) return;
        setIsSaving(true);
        try {
            await employeeService.update(employee.id, {
                name,
                title
            });
            await refreshEmployee();
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setName(employee?.name || '');
        setTitle(employee?.title || '');
        setIsEditing(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-on-surface">Account Settings</h1>
                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size="sm"
                        icon={Edit2}
                    >
                        Edit Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleCancel}
                            variant="ghost"
                            size="sm"
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant="primary"
                            size="sm"
                            icon={Save}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-surface-elevated/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold border border-primary/20">
                            {(name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            {isEditing ? (
                                <div className="space-y-1">
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="text-xl font-semibold text-on-surface bg-transparent border-b border-primary focus:outline-none w-full"
                                        placeholder="Your Name"
                                        autoFocus
                                    />
                                    <p className="text-sm text-on-surface-tertiary">Display Name</p>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-xl font-semibold text-on-surface">
                                        {name || 'User'}
                                    </h2>
                                    <p className="text-on-surface-secondary">
                                        {employee?.role === 'manager' ? 'Manager' : 'Employee'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-border">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Essential Info */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-on-surface-tertiary uppercase tracking-wider flex items-center gap-2">
                                <User size={14} />
                                Personal Information
                            </h3>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-surface-elevated border border-border mt-0.5">
                                        <Mail className="w-4 h-4 text-on-surface-secondary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-on-surface">Email Address</p>
                                        <p className="text-sm text-on-surface-secondary">{user.email}</p>
                                        <p className="text-xs text-on-surface-tertiary mt-1">Primary contact for notifications</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-surface-elevated border border-border mt-0.5">
                                        <Calendar className="w-4 h-4 text-on-surface-secondary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-on-surface">Joined</p>
                                        <p className="text-sm text-on-surface-secondary">
                                            {new Date(employee?.joinDate || user.created_at || Date.now()).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Work Details */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-semibold text-on-surface-tertiary uppercase tracking-wider flex items-center gap-2">
                                <Briefcase size={14} />
                                Professional Details
                            </h3>

                            <div className="space-y-5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-surface-elevated border border-border mt-0.5">
                                        <Building2 className="w-4 h-4 text-on-surface-secondary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-on-surface">Organization</p>
                                        <p className="text-sm text-on-surface-secondary">{organizationName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-surface-elevated border border-border mt-0.5">
                                        <Briefcase className="w-4 h-4 text-on-surface-secondary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-on-surface mb-1">Job Title</p>
                                        {isEditing ? (
                                            <Input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="e.g. Senior Software Engineer"
                                                className="mt-1"
                                                size={1} // Just to make it smaller if needed, but Input doesn't support size like this, it takes basic input props
                                            />
                                        ) : (
                                            <p className={`text-sm ${title ? 'text-on-surface-secondary' : 'text-on-surface-tertiary italic'}`}>
                                                {title || 'No title set'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-lg bg-surface-elevated border border-border mt-0.5">
                                        <User className="w-4 h-4 text-on-surface-secondary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-on-surface">System Role</p>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 capitalize mt-1">
                                            {employee?.role || 'Member'}
                                        </span>
                                    </div>
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

