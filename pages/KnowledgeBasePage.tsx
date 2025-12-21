
import React, { useState, useMemo, useRef } from 'react';
import { Project, Report, Employee, Goal } from '../types';
import { ArrowLeft, Edit2, Save, X, Bot, RefreshCw, Link as LinkIcon, FileText, Layout, Info, Paperclip, File, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Textarea from '../components/Textarea';

interface KnowledgeBasePageProps {
    project: Project;
    reports: Report[];
    goals: Goal[];
    employees: Employee[];
    updateProject: (project: Project) => void;
    onBack: () => void;
    viewMode: 'manager' | 'employee';
}

const KnowledgeBasePage: React.FC<KnowledgeBasePageProps> = ({
    project,
    reports,
    goals,
    employees,
    updateProject,
    onBack,
    viewMode
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContext, setEditedContext] = useState(project.aiContext || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isManager = viewMode === 'manager';

    // Parse attached documents from project description
    const attachedFiles = useMemo(() => {
        if (!project.description) return [];

        const lines = project.description.split('\n');
        const attachmentIndex = lines.findIndex(line => line.includes('[Attached Documents]:'));
        if (attachmentIndex === -1) return [];

        return lines.slice(attachmentIndex + 1)
            .filter(line => line.trim().startsWith('- '))
            .map(line => line.trim().substring(2));
    }, [project.description]);

    // Auto-generate context from project info + goals + reports + manager's addition
    const generatedContext = useMemo(() => {
        const parts: string[] = [];

        // 1. Add Project Overview
        parts.push('# Project Information');
        parts.push(`**Name**: ${project.name}`);

        // Clean description of [Attached Documents]
        const cleanDescription = project.description?.split('[Attached Documents]:')[0].trim();
        if (cleanDescription) {
            parts.push(`\n**Description**:\n${cleanDescription}`);
        }

        // 2. Add Goals and Objectives
        const projectGoals = goals.filter(g => g.projectId === project.id);
        if (projectGoals.length > 0) {
            parts.push('\n# Goals & Evaluation Criteria');
            projectGoals.forEach(goal => {
                parts.push(`\n### Goal: ${goal.name}`);
                if (goal.instructions) {
                    parts.push(`**Instructions**:\n${goal.instructions}`);
                }
                if (goal.criteria && goal.criteria.length > 0) {
                    parts.push('**Evaluation Criteria**:');
                    goal.criteria.forEach(c => {
                        parts.push(`- ${c.name} (${c.weight}%)`);
                    });
                }
            });
        }

        // 3. Add summary from reports
        const goalIds = projectGoals.map(g => g.id);
        const projectReports = reports.filter(r => goalIds.includes(r.goalId));

        if (projectReports.length > 0) {
            parts.push('\n# Recent Activity Summary');
            parts.push(`Total Reports Submitted: ${projectReports.length}`);

            // Group reports by employee
            const reportsByEmployee = projectReports.reduce((acc, report) => {
                const employee = employees.find(e => e.id === report.employeeId);
                const employeeName = employee?.name || 'Unknown';
                if (!acc[employeeName]) {
                    acc[employeeName] = [];
                }
                acc[employeeName].push(report);
                return acc;
            }, {} as Record<string, Report[]>);

            Object.entries(reportsByEmployee).forEach(([employeeName, empReports]: [string, Report[]]) => {
                parts.push(`\n### ${employeeName} (${empReports.length} report${empReports.length > 1 ? 's' : ''})`);
                empReports.slice(0, 3).forEach((report) => {
                    const goal = goals.find(g => g.id === report.goalId);
                    const reportText = report.reportText.replace(/<[^>]*>/g, '').substring(0, 200);
                    parts.push(`- **Goal**: ${goal?.name || 'Unknown'}\n  **Summary**: ${reportText}... \n  **Score**: ${report.evaluationScore.toFixed(1)}/10`);
                });
                if (empReports.length > 3) {
                    parts.push(`- ... and ${empReports.length - 3} more report${empReports.length - 3 > 1 ? 's' : ''}`);
                }
            });
        }

        return parts.join('\n');
    }, [project, reports, goals, employees]);

    const handleSave = () => {
        updateProject({
            ...project,
            aiContext: editedContext
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedContext(project.aiContext || '');
        setIsEditing(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(f => f.name);

            let newDescription = project.description || '';
            if (!newDescription.includes('[Attached Documents]:')) {
                newDescription += '\n\n[Attached Documents]:';
            }

            newFiles.forEach(fileName => {
                newDescription += `\n- ${fileName}`;
            });

            updateProject({
                ...project,
                description: newDescription
            });
        }
    };

    const handleRemoveFile = (fileName: string) => {
        if (!project.description) return;

        const lines = project.description.split('\n');
        const filteredLines = lines.filter(line => line.trim() !== `- ${fileName}`);

        // Check if we should remove the header too
        const finalLines = [];
        let hasAttachments = false;
        for (let i = 0; i < filteredLines.length; i++) {
            if (filteredLines[i].includes('[Attached Documents]:')) {
                // Check if next lines are attachments
                const nextIsAttachment = filteredLines.slice(i + 1).some(l => l.trim().startsWith('- '));
                if (nextIsAttachment) {
                    finalLines.push(filteredLines[i]);
                    hasAttachments = true;
                }
            } else {
                finalLines.push(filteredLines[i]);
            }
        }

        updateProject({
            ...project,
            description: finalLines.join('\n')
        });
    };

    return (
        <div className="w-full px-6 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={onBack}
                        variant="ghost"
                        size="sm"
                        icon={ArrowLeft}
                    >
                        Back to Project
                    </Button>
                    <div className="flex items-center gap-3">
                        <Layout size={28} className="text-on-surface-secondary" />
                        <div>
                            <h2 className="text-2xl font-bold text-on-surface">Knowledge Base</h2>
                            <p className="text-sm text-on-surface-tertiary">{project.name}</p>
                        </div>
                    </div>
                </div>
                {isManager && !isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="primary"
                        size="sm"
                        icon={Edit2}
                    >
                        Edit context
                    </Button>
                )}
                {isEditing && (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleCancel}
                            variant="ghost"
                            size="sm"
                            icon={X}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant="primary"
                            size="sm"
                            icon={Save}
                        >
                            Save Changes
                        </Button>
                    </div>
                )}
            </div>

            {/* Project Stats (At Top) */}
            <div className="bg-surface-elevated rounded-lg p-6 border border-border">
                <div className="flex flex-wrap gap-8 items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <FileText size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-tertiary uppercase tracking-wider font-semibold">Total Reports</p>
                            <p className="text-xl font-bold text-on-surface">{reports.filter(r => goals.some(g => g.id === r.goalId && g.projectId === project.id)).length}</p>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-border hidden sm:block"></div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                            <RefreshCw size={20} className="text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-tertiary uppercase tracking-wider font-semibold">Active Goals</p>
                            <p className="text-xl font-bold text-on-surface">{goals.filter(g => g.projectId === project.id).length}</p>
                        </div>
                    </div>
                    {project.updatedAt && (
                        <>
                            <div className="w-px h-8 bg-border hidden sm:block"></div>
                            <div className="flex items-center gap-3 text-on-surface-tertiary">
                                <Info size={16} />
                                <span className="text-sm italic">
                                    Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
                <Bot size={24} className="text-primary flex-shrink-0" />
                <div>
                    <h3 className="text-sm font-semibold text-primary">How this works</h3>
                    <p className="text-sm text-on-surface-secondary">
                        AI evaluation takes place using this knowledge base, and consists of reports, project description, and manager's context.
                    </p>
                </div>
            </div>

            {/* Full Width Content Area */}
            <div className="space-y-6">
                {/* Knowledge Base (Derived from reports) */}
                <div className="bg-surface-elevated rounded-lg p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Bot size={20} className="text-on-surface-secondary" />
                            <h3 className="text-lg font-semibold text-on-surface">Knowledge Base</h3>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-on-surface-tertiary">
                            <Info size={14} />
                            <span>Generated from recent reports</span>
                        </div>
                    </div>
                    <div className="bg-surface rounded-lg p-4 border border-border">
                        <pre className="text-sm text-on-surface-secondary whitespace-pre-wrap font-sans">
                            {generatedContext || 'No reports have been submitted for this project yet.'}
                        </pre>
                    </div>
                </div>

                {/* Add to knowledge base (Manager Context) */}
                <div className="bg-surface-elevated rounded-lg p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Edit2 size={20} className="text-on-surface-secondary" />
                            <h3 className="text-lg font-semibold text-on-surface">Add to knowledge base</h3>
                        </div>
                    </div>

                    <div className="relative group">
                        {isEditing ? (
                            <div className="space-y-4">
                                <Textarea
                                    value={editedContext}
                                    onChange={(e) => setEditedContext(e.target.value)}
                                    placeholder="Add additional context, technical nuances, or important information for AI evaluation..."
                                    rows={8}
                                    className="w-full pr-12 pb-12"
                                    helperText="This information helps the AI understand project-specific expectations."
                                />
                                <div className="absolute bottom-10 right-4 flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        multiple
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 rounded-full hover:bg-surface-hover text-on-surface-tertiary hover:text-primary transition-colors border border-border bg-surface shadow-sm"
                                        title="Upload files"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-surface rounded-lg p-4 border border-border min-h-[100px] relative">
                                    {project.aiContext ? (
                                        <div className="text-on-surface-secondary whitespace-pre-wrap">{project.aiContext}</div>
                                    ) : (
                                        <div className="text-on-surface-tertiary italic">No additional context provided yet.</div>
                                    )}
                                    {isManager && (
                                        <div className="absolute bottom-4 right-4">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                multiple
                                                onChange={handleFileUpload}
                                            />
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2 rounded-full hover:bg-surface-hover text-on-surface-tertiary hover:text-primary transition-colors border border-border bg-surface shadow-sm"
                                                title="Upload files"
                                            >
                                                <Paperclip size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Uploaded Files List */}
                    {attachedFiles.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface-tertiary uppercase tracking-wider">
                                <Paperclip size={14} />
                                <span>Uploaded Files</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {attachedFiles.map((fileName, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:border-primary/30 transition-all group"
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 rounded bg-primary/5 text-primary">
                                                <File size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-on-surface truncate" title={fileName}>
                                                {fileName}
                                            </span>
                                        </div>
                                        {isManager && (
                                            <button
                                                onClick={() => handleRemoveFile(fileName)}
                                                className="p-1 px-2 text-on-surface-tertiary hover:text-red-500 transition-colors"
                                                title="Remove file"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBasePage;
