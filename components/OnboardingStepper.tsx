import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Employee, Organization } from '../types';
import Button from './Button';

interface OnboardingStepperProps {
    currentEmployee: Employee;
    organization: Organization | null;
    employeesCount: number;
    onNavigate: (page: string) => void;
    onOpenMetricsModal: () => void;
}

const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
    currentEmployee,
    organization,
    employeesCount,
    onNavigate,
    onOpenMetricsModal
}) => {
    const [settingsVisited, setSettingsVisited] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        const visited = localStorage.getItem('onboarding_settings_visited') === 'true';
        setSettingsVisited(visited);

        const dismissed = localStorage.getItem('onboarding_dismissed') === 'true';
        setIsDismissed(dismissed);
    }, []);

    const markSettingsVisited = () => {
        localStorage.setItem('onboarding_settings_visited', 'true');
        setSettingsVisited(true);
        onNavigate('settings');
    };

    const handleDismiss = () => {
        localStorage.setItem('onboarding_dismissed', 'true');
        setIsDismissed(true);
    };

    // if (isDismissed) return null;

    const isManager = currentEmployee.role === 'manager';
    // Simplified manager check - in real app might rely on specific permissions
    const canInvite = isManager || currentEmployee.isAccountOwner;
    const canManageMetrics = isManager || currentEmployee.isAccountOwner;

    // Define Steps
    const steps = [
        {
            id: 'profile',
            title: 'Complete Profile',
            description: 'Add your job title.',
            isCompleted: !!currentEmployee.title,
            actionLabel: 'Update Profile',
            onAction: () => onNavigate('account'), // assuming 'account' is the page for profile
            isVisible: true
        },
        {
            id: 'settings',
            title: 'Configure Settings',
            description: 'Review notification and reporting preferences.',
            isCompleted: settingsVisited,
            actionLabel: 'Go to Settings',
            onAction: markSettingsVisited,
            isVisible: true
        },
        {
            id: 'invite',
            title: 'Invite Users',
            description: 'Add your team members to start tracking performance.',
            isCompleted: employeesCount > 1,
            actionLabel: 'Invite Team',
            onAction: () => onNavigate('employees'),
            isVisible: canInvite
        }
    ];

    const visibleSteps = steps.filter(step => step.isVisible);
    const completedCount = visibleSteps.filter(step => step.isCompleted).length;
    const allCompleted = completedCount === visibleSteps.length;

    // Auto-dismiss if all completed? Or show "All set!" message?
    // Let's show a success state if recently completed, but hide if refreshed (handled by caller logically, but component can handle "all done" state)

    // Always render for managers to ensure access to setup steps
    // if (visibleSteps.length === 0) return null; 

    if (isDismissed || allCompleted) return null;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <div className="bg-surface-elevated border border-border rounded-lg overflow-hidden mb-4 transition-all">
            <div
                className="p-3 bg-surface border-b border-border/50 flex items-center justify-between cursor-pointer hover:bg-surface-tertiary/20 transition-colors"
                onClick={toggleExpand}
            >
                <div className="flex items-center gap-3">
                    <div className="relative w-6 h-6 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                className="text-surface-tertiary"
                            />
                            <circle
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                fill="none"
                                strokeDasharray={63}
                                strokeDashoffset={63 - ((completedCount / visibleSteps.length) * 63)}
                                className={allCompleted ? 'text-success transition-all duration-500' : 'text-primary transition-all duration-500'}
                            />
                        </svg>
                        {allCompleted && (
                            <CheckCircle2 size={12} className="absolute text-success" />
                        )}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-base font-semibold text-on-surface leading-tight">
                            {allCompleted ? 'Setup Complete' : 'Getting Started'}
                        </span>
                        {!allCompleted && (
                            <span className="text-xs text-on-surface-secondary font-medium">
                                {completedCount} of {visibleSteps.length} steps complete
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        className="p-1 text-on-surface-tertiary hover:text-on-surface hover:bg-surface-tertiary rounded transition-colors"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {!isManager && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss();
                            }}
                            className="p-1 text-on-surface-tertiary hover:text-on-surface hover:bg-surface-tertiary rounded transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="p-2 bg-surface">
                    {allCompleted ? (
                        <div className="text-center py-3">
                            <p className="text-xs text-on-surface-secondary mb-2">You're all set! Your profile and organization are configured.</p>
                            {!isManager && <Button variant="outline" size="sm" onClick={handleDismiss} className="text-sm">Dismiss Guide</Button>}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {visibleSteps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`
                                        flex items-center justify-between p-2 rounded-md transition-all border
                                        ${step.isCompleted
                                            ? 'bg-surface-tertiary/10 border-transparent opacity-50 hover:opacity-100'
                                            : 'bg-surface border-border/40 hover:border-primary/20 hover:bg-surface-elevated cursor-pointer'}
                                    `}
                                    onClick={() => !step.isCompleted && step.onAction()}
                                >
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        {step.isCompleted ? (
                                            <CheckCircle2 size={16} className="text-success shrink-0" />
                                        ) : (
                                            <Circle size={16} className="text-on-surface-tertiary shrink-0" />
                                        )}
                                        <div className="min-w-0">
                                            <h4 className={`text-sm font-medium truncate ${step.isCompleted ? 'text-on-surface-secondary line-through' : 'text-on-surface'}`}>
                                                {step.title}
                                            </h4>
                                            {!step.isCompleted && (
                                                <p className="text-xs text-on-surface-secondary truncate">
                                                    {step.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {!step.isCompleted && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-primary hover:bg-primary/5 hover:text-primary-hover shrink-0 h-8 px-3 text-sm font-medium"
                                            onClick={step.onAction}
                                        >
                                            <span className="hidden sm:inline">{step.actionLabel}</span>
                                            <span className="sm:hidden">Go</span>
                                            <ArrowRight size={14} className="ml-1" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OnboardingStepper;
