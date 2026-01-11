
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Project, Report, Employee, Goal, ProjectDocument } from '../types';
import { ArrowLeft, Edit2, Save, X, Bot, RefreshCw, Link as LinkIcon, FileText, Layout, Info, Paperclip, File, Trash2, Loader2, Download, Upload } from 'lucide-react';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import { generateKnowledgeBase } from '../services/geminiService';
import { storageService } from '../services/storageService';

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
    const [uploadedDocuments, setUploadedDocuments] = useState<ProjectDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isManager = viewMode === 'manager';

    // Load uploaded documents from database
    useEffect(() => {
        const loadDocuments = async () => {
            try {
                setIsLoadingDocs(true);
                const docs = await storageService.getProjectDocuments(project.id);
                setUploadedDocuments(docs);
            } catch (error) {
                console.error('Failed to load documents:', error);
            } finally {
                setIsLoadingDocs(false);
            }
        };

        loadDocuments();
    }, [project.id]);

    // Utility to strip HTML tags
    const stripHtml = (html: string): string => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    // Logic to standardize/generate context from project info + goals + reports
    const getStandardizedContext = useCallback(() => {
        const parts: string[] = [];

        // 1. Add Project Overview
        parts.push('PROJECT INFORMATION');
        parts.push(`Name: ${project.name}`);

        // Clean description of [Attached Documents] and HTML tags
        const descriptionWithoutAttachments = project.description?.split('[Attached Documents]:')[0].trim();
        const cleanDescription = descriptionWithoutAttachments ? stripHtml(descriptionWithoutAttachments) : '';
        if (cleanDescription) {
            parts.push(`\nDescription:\n${cleanDescription}`);
        }

        // 2. Add Goals and Objectives
        const projectGoals = goals.filter(g => g.projectId === project.id);
        if (projectGoals.length > 0) {
            parts.push('\nGOALS & EVALUATION CRITERIA');
            projectGoals.forEach(goal => {
                parts.push(`\nGoal: ${goal.name}`);
                if (goal.instructions) {
                    parts.push(`Instructions:\n${goal.instructions}`);
                }
                if (goal.criteria && goal.criteria.length > 0) {
                    parts.push('Evaluation Criteria:');
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
            parts.push('\nRECENT ACTIVITY SUMMARY');
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
                parts.push(`\n${employeeName} (${empReports.length} report${empReports.length > 1 ? 's' : ''})`);
                empReports.slice(0, 3).forEach((report) => {
                    const goal = goals.find(g => g.id === report.goalId);
                    const reportText = report.reportText.replace(/<[^>]*>/g, '').substring(0, 200);
                    parts.push(`- Goal: ${goal?.name || 'Unknown'}\n  Summary: ${reportText}... \n  Score: ${report.evaluationScore.toFixed(1)}/10`);
                });
                if (empReports.length > 3) {
                    parts.push(`- ... and ${empReports.length - 3} more report${empReports.length - 3 > 1 ? 's' : ''}`);
                }
            });
        }

        return parts.join('\n');
    }, [project, goals, reports, employees]);

    // Auto-generate knowledge base if empty
    useEffect(() => {
        const autoGenerate = async () => {
            if (!project.aiContext && !isEditing && !isSyncing) {
                setIsSyncing(true);
                try {
                    const projectGoals = goals.filter(g => g.projectId === project.id);
                    const goalIds = projectGoals.map(g => g.id);
                    const projectReports = reports.filter(r => goalIds.includes(r.goalId));

                    // Fetch file contents from storage
                    const fileContents = await storageService.getProjectFileContents(project.id);

                    const aiGenerated = await generateKnowledgeBase({
                        projectName: project.name,
                        description: project.description || '',
                        goals: projectGoals,
                        reports: projectReports,
                        employees,
                        fileContents
                    });

                    updateProject({
                        ...project,
                        aiContext: aiGenerated
                    });
                    setEditedContext(aiGenerated);
                } catch (error) {
                    console.error('Failed to auto-generate knowledge base:', error);
                    // Fallback to simple standardization
                    const fallback = getStandardizedContext();
                    updateProject({
                        ...project,
                        aiContext: fallback
                    });
                    setEditedContext(fallback);
                } finally {
                    setIsSyncing(false);
                }
            }
        };

        // Wait for documents to load before auto-generating
        if (!isLoadingDocs) {
            autoGenerate();
        }
    }, [project.aiContext, isEditing, isSyncing, isLoadingDocs, project, goals, reports, employees, getStandardizedContext, updateProject]);

    const handleSave = async () => {
        setIsSyncing(true);
        try {
            const projectGoals = goals.filter(g => g.projectId === project.id);
            const goalIds = projectGoals.map(g => g.id);
            const projectReports = reports.filter(r => goalIds.includes(r.goalId));

            // Fetch file contents from storage
            const fileContents = await storageService.getProjectFileContents(project.id);

            const aiGenerated = await generateKnowledgeBase({
                projectName: project.name,
                description: project.description || '',
                goals: projectGoals,
                reports: projectReports,
                employees,
                fileContents
            });

            updateProject({
                ...project,
                aiContext: aiGenerated
            });
            setEditedContext(aiGenerated);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to generate comprehensive knowledge base:", error);
            // Fallback: save manual edits if AI fails
            updateProject({
                ...project,
                aiContext: editedContext
            });
            setIsEditing(false);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleCancel = () => {
        setEditedContext(project.aiContext || '');
        setIsEditing(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
            setIsUploading(true);

            try {
                // Upload each file to Supabase Storage
                const uploadedDocs = await Promise.all(
                    files.map(file =>
                        storageService.uploadFile(
                            project.id,
                            file,
                            employees.find(e => e.id === project.createdBy)?.id
                        )
                    )
                );

                // Update local state
                setUploadedDocuments(prev => [...uploadedDocs, ...prev]);
            } catch (error) {
                console.error('File upload failed:', error);
                alert('Failed to upload files. Please try again.');
            } finally {
                setIsUploading(false);
                // Clear file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    const handleRemoveFile = async (documentId: string) => {
        if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
            return;
        }

        try {
            await storageService.deleteFile(documentId);
            setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
        } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Failed to delete file. Please try again.');
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleDownload = (doc: ProjectDocument) => {
        window.open(doc.fileUrl, '_blank');
    };

    const handleRemoveFileOld = (fileName: string) => {
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
                <div className="flex gap-2">
                    {isManager && !isEditing && (
                        <Button
                            onClick={() => setIsEditing(true)}
                            variant="primary"
                            size="sm"
                            icon={Edit2}
                        >
                            Edit Knowledge Base
                        </Button>
                    )}
                    {isEditing && (
                        <>
                            <Button
                                onClick={handleCancel}
                                variant="ghost"
                                size="sm"
                                icon={X}
                                disabled={isSyncing}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                variant="primary"
                                size="sm"
                                icon={isSyncing ? Loader2 : Save}
                                className={isSyncing ? 'animate-pulse' : ''}
                                disabled={isSyncing}
                            >
                                {isSyncing ? 'Syncing with AI...' : 'Save Changes'}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Project Stats */}
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
                    <h3 className="text-sm font-semibold text-primary">Project Context</h3>
                    <p className="text-sm text-on-surface-secondary">
                        This content is used by AI to evaluate reports. It is automatically synthesized by Gemini AI when you save changes, incorporating project info, goals, recent activity, and uploaded documents.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-6">
                <div className="bg-surface-elevated rounded-lg p-6 border border-border min-h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Bot size={20} className="text-on-surface-secondary" />
                            <h3 className="text-lg font-semibold text-on-surface">Main Knowledge Base</h3>
                        </div>
                        {!isEditing && (
                            <div className="flex items-center gap-1 text-xs text-on-surface-tertiary">
                                <Info size={14} />
                                <span>Click "Edit" to modify this content</span>
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        {isEditing ? (
                            <div className="space-y-4">
                                <Textarea
                                    value={editedContext}
                                    onChange={(e) => setEditedContext(e.target.value)}
                                    placeholder="Standardize with AI or paste your project-specific knowledge base here..."
                                    rows={20}
                                    className="w-full font-mono text-sm"
                                    helperText="This text defines the context for all AI evaluations in this project."
                                />
                            </div>
                        ) : (
                            <div className="min-h-[300px] px-4 py-6">
                                {project.aiContext ? (
                                    <div className="prose prose-slate max-w-none">
                                        {project.aiContext.split('\n\n').map((section, idx) => {
                                            const lines = section.split('\n');
                                            const header = lines[0];
                                            const content = lines.slice(1);

                                            // Check if it's a header (all caps)
                                            const isHeader = header === header.toUpperCase() && header.trim().length > 0 && !header.startsWith('•') && !header.match(/^\d+\./);

                                            if (isHeader) {
                                                return (
                                                    <div key={idx} className="mb-6">
                                                        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-3 pb-1 border-b-2 border-primary/20">
                                                            {header}
                                                        </h3>
                                                        <div className="space-y-2">
                                                            {content.map((line, lineIdx) => {
                                                                if (!line.trim()) return null;

                                                                // Bullet point
                                                                if (line.trim().startsWith('•')) {
                                                                    const text = line.trim().substring(1).trim();
                                                                    // Check if it's a key-value pair (contains colon)
                                                                    if (text.includes(':')) {
                                                                        const [key, ...valueParts] = text.split(':');
                                                                        const value = valueParts.join(':').trim();
                                                                        return (
                                                                            <p key={lineIdx} className="ml-4 leading-relaxed text-on-surface-secondary">
                                                                                <span className="font-semibold text-on-surface">{key}:</span> {value}
                                                                            </p>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <p key={lineIdx} className="ml-4 leading-relaxed text-on-surface-secondary before:content-['•'] before:mr-2 before:text-primary">
                                                                            {text}
                                                                        </p>
                                                                    );
                                                                }

                                                                // Numbered list
                                                                if (line.match(/^\d+\./)) {
                                                                    const number = line.match(/^\d+\./)?.[0];
                                                                    const text = line.replace(/^\d+\.\s*/, '');
                                                                    return (
                                                                        <p key={lineIdx} className="ml-4 leading-relaxed text-on-surface-secondary">
                                                                            <span className="font-semibold text-primary mr-2">{number}</span>
                                                                            {text}
                                                                        </p>
                                                                    );
                                                                }

                                                                // Regular paragraph
                                                                return (
                                                                    <p key={lineIdx} className="leading-relaxed text-on-surface-secondary">
                                                                        {line}
                                                                    </p>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Standalone paragraph
                                                return (
                                                    <p key={idx} className="mb-4 leading-relaxed text-on-surface-secondary">
                                                        {section}
                                                    </p>
                                                );
                                            }
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                        <div className="p-4 rounded-full bg-surface-hover text-on-surface-tertiary">
                                            <FileText size={48} />
                                        </div>
                                        <div className="max-w-xs">
                                            <p className="text-on-surface-secondary font-medium">Knowledge base is empty</p>
                                            <p className="text-sm text-on-surface-tertiary mt-1">
                                                Click "Edit" and then "Save Changes" to allow Gemini to generate a comprehensive knowledge base for this project.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Section - BELOW the main container */}
                <div className="bg-surface-elevated rounded-lg p-6 border border-border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Paperclip size={20} className="text-on-surface-secondary" />
                            <h3 className="text-lg font-semibold text-on-surface">Supporting Documents</h3>
                        </div>
                        {isManager && (
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                size="sm"
                                icon={isUploading ? Loader2 : Upload}
                                disabled={isUploading}
                                className={isUploading ? 'animate-pulse' : ''}
                            >
                                {isUploading ? 'Uploading...' : 'Upload Files'}
                            </Button>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        accept=".txt,.md,.pdf,.doc,.docx"
                        onChange={handleFileUpload}
                    />

                    {isLoadingDocs ? (
                        <div className="text-center py-12">
                            <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={32} />
                            <p className="text-sm text-on-surface-tertiary">Loading documents...</p>
                        </div>
                    ) : uploadedDocuments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {uploadedDocuments.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden flex-1">
                                        <div className="p-2 rounded bg-primary/5 text-primary">
                                            <File size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-on-surface truncate" title={doc.fileName}>
                                                {doc.fileName}
                                            </p>
                                            <p className="text-xs text-on-surface-tertiary">
                                                {formatFileSize(doc.fileSize)}
                                                {doc.uploadedAt && ` • ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="p-1 px-2 text-on-surface-tertiary hover:text-primary transition-colors"
                                            title="Download file"
                                        >
                                            <Download size={14} />
                                        </button>
                                        {isManager && (
                                            <button
                                                onClick={() => handleRemoveFile(doc.id)}
                                                className="p-1 px-2 text-on-surface-tertiary hover:text-red-500 transition-colors"
                                                title="Delete file"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                            <p className="text-sm text-on-surface-tertiary italic">No supporting documents uploaded yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBasePage;
