import React, { useState, useEffect } from 'react';
import { Report, Employee, Goal, Project } from '../types';
import Modal from './Modal';
import { TrendingUp, User, Target, Layers } from 'lucide-react';
import { formatReportDate } from '../utils/dateFormat';
import Textarea from './Textarea';
import Input from './Input';
import Button from './Button';

interface ReportDetailModalProps {
    report: Report | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdateReport?: (report: Report) => Promise<void>;
    employees: Employee[];
    goals: Goal[];
    projects: Project[];
    currentManagerId?: string;
    isManagerView?: boolean;
    onSelectEmployee?: (id: string) => void;
    onSelectProject?: (id: string) => void;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
    report,
    isOpen,
    onClose,
    onUpdateReport,
    employees,
    goals,
    projects,
    currentManagerId,
    isManagerView = false,
    onSelectEmployee,
    onSelectProject
}) => {
    const [overrideScore, setOverrideScore] = useState<string>('');
    const [overrideReasoning, setOverrideReasoning] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && report) {
            setOverrideScore(report.managerOverallScore?.toString() || report.evaluationScore.toString() || '');
            setOverrideReasoning(report.managerOverrideReasoning || '');
            setFeedback(report.managerFeedback || '');
            setError(null);
        }
    }, [isOpen, report]);

    const handleSave = async () => {
        if (!onUpdateReport || !report) return;

        const newScore = parseFloat(overrideScore);
        if (isNaN(newScore) || newScore < 0 || newScore > 10) {
            setError('Score must be a number between 0 and 10');
            return;
        }

        // If score changed from original AI score, reasoning is required
        const isScoreChanged = Math.abs(newScore - report.evaluationScore) > 0.1;

        if (isScoreChanged && !overrideReasoning.trim()) {
            setError('Reasoning is required when overriding the score');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const updatedReport: Report = {
                ...report,
                managerOverallScore: newScore,
                managerOverrideReasoning: overrideReasoning.trim(),
                managerFeedback: feedback.trim(),
                reviewedBy: currentManagerId
            };

            await onUpdateReport(updatedReport);
            onClose();
        } catch (err) {
            console.error('Failed to update report:', err);
            setError('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveOverride = async () => {
        if (!onUpdateReport || !report) return;
        setIsSaving(true);
        try {
            const updatedReport: Report = {
                ...report,
                managerOverallScore: undefined,
                managerOverrideReasoning: undefined,
                managerFeedback: undefined,
                reviewedBy: undefined
            };
            await onUpdateReport(updatedReport);
            onClose();
        } catch (err) {
            console.error('Failed to remove override:', err);
            setError('Failed to remove override');
        } finally {
            setIsSaving(false);
        }
    };

    if (!report) return null;

    const employee = employees.find(e => e.id === report.employeeId);
    const goal = goals.find(g => g.id === report.goalId);
    const project = goal ? projects.find(p => p.id === goal.projectId) : null;

    // Determine effective score to display in header
    const displayScore = (report.managerOverallScore !== undefined
        ? report.managerOverallScore
        : report.evaluationScore) ?? 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Report - ${formatReportDate(report.submissionDate)}`}
        >
            <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-elevated p-4 rounded-lg border border-border">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-on-surface-secondary mb-1">
                            <User size={14} className="text-piccolo" />
                            Employee
                        </div>
                        {onSelectEmployee && employee ? (
                            <button
                                onClick={() => {
                                    onClose();
                                    onSelectEmployee(employee.id);
                                }}
                                className="text-primary hover:underline font-medium"
                            >
                                {employee.name}
                            </button>
                        ) : (
                            <span className="font-medium text-on-surface">{employee?.name || 'Unknown'}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-on-surface-secondary mb-1">
                            <Target size={14} className="text-piccolo" />
                            Goal
                        </div>
                        <span className="font-medium text-on-surface">{goal?.name || 'N/A'}</span>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-on-surface-secondary mb-1">
                            <Layers size={14} className="text-piccolo" />
                            Project
                        </div>
                        {onSelectProject && project ? (
                            <button
                                onClick={() => {
                                    onClose();
                                    onSelectProject(project.id);
                                }}
                                className="text-primary hover:underline font-medium"
                            >
                                {project.name}
                            </button>
                        ) : (
                            <span className="font-medium text-on-surface">{project?.name || 'N/A'}</span>
                        )}
                    </div>
                </div>

                {/* Report Content */}
                <div>
                    <h3 className="text-lg font-semibold text-on-surface mb-2">Report Content</h3>
                    <div
                        className="bg-surface p-4 rounded-lg text-on-surface-secondary border border-border prose prose-invert max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: report.reportText }}
                    />
                </div>

                {/* AI Analysis */}
                <div>
                    <h3 className="text-lg font-semibold text-on-surface mb-2 flex items-center gap-2">
                        <TrendingUp size={20} className="text-piccolo" />
                        AI Analysis
                    </h3>
                    <div className="bg-surface p-4 rounded-lg text-on-surface-secondary italic border border-border text-sm">
                        "{report.evaluationReasoning}"
                    </div>
                </div>

                {/* Criteria */}
                {report.criterionScores && report.criterionScores.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-on-surface mb-2">Criteria Analysis</h3>
                        <div className="space-y-2">
                            {report.criterionScores.map((score, index) => (
                                <div key={index} className="bg-surface p-3 rounded-lg border border-border flex justify-between items-center">
                                    <span className="font-medium text-on-surface text-sm">{score.criterionName}</span>
                                    <span className="text-sm font-semibold text-on-surface-secondary">{score.score.toFixed(1)}/10</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Score & Feedback Section */}
                <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-semibold text-on-surface mb-4">Evaluation & Feedback</h3>

                    {isManagerView ? (
                        <div className="space-y-4 bg-surface-elevated p-4 rounded-lg border border-border">
                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1">
                                    Score (0-10)
                                </label>
                                <Input
                                    value={overrideScore}
                                    onChange={(e) => setOverrideScore(e.target.value)}
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    className="w-32"
                                />
                                <div className="text-xs text-on-surface-tertiary mt-1">
                                    Original AI Score: {report.evaluationScore.toFixed(2)}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1">
                                    Justification {Math.abs(parseFloat(overrideScore || '0') - report.evaluationScore) > 0.1 && <span className="text-red-500">*</span>}
                                </label>
                                <Textarea
                                    value={overrideReasoning}
                                    onChange={(e) => setOverrideReasoning(e.target.value)}
                                    placeholder="Explain why you are changing the score..."
                                    rows={3}
                                />
                                {Math.abs(parseFloat(overrideScore || '0') - report.evaluationScore) > 0.1 && (
                                    <p className="text-xs text-on-surface-secondary mt-1">
                                        Justification is required when overriding the Zevian score.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-on-surface mb-1">
                                    Feedback for Employee (Optional)
                                </label>
                                <Textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide constructive feedback..."
                                    rows={3}
                                />
                            </div>

                            {error && (
                                <div className="text-red-500 text-sm font-medium">{error}</div>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                {report.managerOverallScore !== undefined && (
                                    <Button
                                        variant="outline"
                                        onClick={handleRemoveOverride}
                                        isLoading={isSaving}
                                        disabled={isSaving}
                                        className="text-error border-error/20 hover:bg-error/5"
                                    >
                                        Remove Override
                                    </Button>
                                )}
                                <Button
                                    variant="primary"
                                    onClick={handleSave}
                                    isLoading={isSaving}
                                    disabled={isSaving || (Math.abs(parseFloat(overrideScore || '0') - report.evaluationScore) > 0.1 && !overrideReasoning.trim())}
                                >
                                    Save Evaluation
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-surface p-4 rounded-lg border border-border flex justify-between items-center">
                                <span className="font-medium text-on-surface">Overall Score</span>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-primary">{displayScore.toFixed(2)}</span>
                                    {report.managerOverallScore !== undefined && (
                                        <div className="text-xs text-on-surface-tertiary">Overridden by manager</div>
                                    )}
                                </div>
                            </div>

                            {report.managerFeedback && (
                                <div>
                                    <h4 className="text-sm font-semibold text-on-surface mb-2">Manager Feedback</h4>
                                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 text-on-surface text-sm">
                                        {report.managerFeedback}
                                    </div>
                                </div>
                            )}

                            {report.managerOverrideReasoning && (
                                <div>
                                    <h4 className="text-sm font-semibold text-on-surface mb-2">Justification</h4>
                                    <div className="bg-surface p-4 rounded-lg border border-border text-on-surface-secondary italic text-sm">
                                        "{report.managerOverrideReasoning}"
                                    </div>
                                </div>
                            )}

                            {report.reviewedBy && (
                                <div className="text-right">
                                    <p className="text-xs text-on-surface-tertiary">
                                        Reviewed by {employees.find(e => e.id === report.reviewedBy)?.name || 'a manager'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ReportDetailModal;
