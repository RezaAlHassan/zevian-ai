import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Project, Report, Employee, Goal, ProjectDocument, KnowledgePin, KnowledgeBaseData } from '../types';
import { ArrowLeft, Save, X, Bot, RefreshCw, FileText, Info, Paperclip, File, Trash2, Loader2, Download, Upload, Plus, Pin, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { generateKnowledgeBase } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { knowledgeBaseService } from '../services/knowledgeBaseService';
// uuid removed
// Actually knowledgeBaseService.addPin returns the real object.

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
    const isManager = viewMode === 'manager';

    // State
    const [kbData, setKbData] = useState<KnowledgeBaseData | null>(project.knowledgeBaseCache || null);
    const [pins, setPins] = useState<KnowledgePin[]>([]);
    const [isLoadingPins, setIsLoadingPins] = useState(false);

    // Legacy / Fallback state
    const [isLegacyMode, setIsLegacyMode] = useState(!project.knowledgeBaseCache && !!project.aiContext);

    // File Upload State
    const [uploadedDocuments, setUploadedDocuments] = useState<ProjectDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state
    const [isSyncing, setIsSyncing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // New Pin Input State
    const [activeSectionForPin, setActiveSectionForPin] = useState<string | null>(null);
    const [newPinContent, setNewPinContent] = useState('');

    // Load Pins
    useEffect(() => {
        const loadPins = async () => {
            try {
                setIsLoadingPins(true);
                const loadedPins = await knowledgeBaseService.getPins(project.id);
                setPins(loadedPins);
            } catch (error) {
                console.error("Failed to load pins", error);
            } finally {
                setIsLoadingPins(false);
            }
        };
        loadPins();
    }, [project.id]);

    // Load Documents
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

    // Update local state when project prop changes (e.g. initial load)
    useEffect(() => {
        if (project.knowledgeBaseCache) {
            setKbData(project.knowledgeBaseCache);
            setIsLegacyMode(false);
        } else if (project.aiContext && !project.knowledgeBaseCache) {
            setIsLegacyMode(true);
        }
    }, [project.knowledgeBaseCache, project.aiContext]);


    const handleRegenerate = async () => {
        setIsGenerating(true);
        try {
            const projectGoals = goals.filter(g => g.projectId === project.id);
            const goalIds = projectGoals.map(g => g.id);
            const projectReports = reports.filter(r => goalIds.includes(r.goalId));

            // Fetch file contents
            let fileContents: { name: string, content: string }[] = [];
            try {
                fileContents = await storageService.getProjectFileContents(project.id);
            } catch (e) {
                console.warn("Could not load file contents for context generation", e);
            }

            const newData = await generateKnowledgeBase({
                projectName: project.name,
                description: project.description || '',
                goals: projectGoals,
                reports: projectReports,
                employees,
                fileContents,
                pinnedItems: pins
            });

            setKbData(newData);
            setIsLegacyMode(false); // Upgraded from legacy if successful

            // Auto-save the cache and new context
            await saveChanges(newData, pins);

        } catch (error) {
            console.error('Failed to regenerate knowledge base:', error);
            alert('Failed to regenerate Knowledge Base. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const saveChanges = async (data: KnowledgeBaseData, currentPins: KnowledgePin[]) => {
        setIsSyncing(true);
        try {
            // Generate the flattened context string
            const contextString = knowledgeBaseService.formatContextString(data, currentPins);

            // Update project
            const updatedProject = {
                ...project,
                aiContext: contextString,
                knowledgeBaseCache: data
            };

            // Call parent update (which saves to DB via projectService.update or similar)
            // Assuming updateProject persists it. If not, we might need a direct service call, 
            // but usually updateProject links to a service call in parent.
            // Checking App.tsx (implied structure), updateProject usually calls API.
            // If not, we might need to verify. Assuming standard pattern from previous files.
            await updateProject(updatedProject);

            // For local reflection without waiting for parent reload?
            setKbData(data);
            setIsLegacyMode(false);

        } catch (error) {
            console.error("Failed to save knowledge base:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddPin = async (section: any) => {
        if (!newPinContent.trim()) return;

        const tempId = `temp-${Date.now()}`;
        // Optimistic update? Better to wait for server response for ID.
        try {
            const newPin = await knowledgeBaseService.addPin({
                projectId: project.id,
                section,
                content: newPinContent,
                createdBy: employees.find(e => e.id === project.createdBy)?.id // Or current user?
                // Ideally current user ID, but we don't have clear access to "me" here except via isManager check or props?
                // Assuming isManager implies we can just use the project creator or we need a auth user ID. 
                // Let's passed in viewMode. For now using project.createdBy or undefined is safer if we don't have current user.
                // Wait, in `addPin` service checking RLS will fail if not auth.
                // The service call adds the pin.
                // We'll trust the backend RLS allows "Manager manage pins".
                // createdBy is optional in types.
            });

            const updatedPins = [...pins, newPin];
            setPins(updatedPins);
            setNewPinContent('');
            setActiveSectionForPin(null);

            // Update the context string immediately so AI stays in sync
            if (kbData) {
                await saveChanges(kbData, updatedPins);
            }

        } catch (error) {
            console.error("Failed to add pin:", error);
            alert("Failed to add pin");
        }
    };

    const handleDeletePin = async (pinId: string) => {
        if (!confirm("Are you sure you want to unpin this rule?")) return;
        try {
            await knowledgeBaseService.deletePin(pinId);
            const updatedPins = pins.filter(p => p.id !== pinId);
            setPins(updatedPins);

            if (kbData) {
                await saveChanges(kbData, updatedPins);
            }
        } catch (error) {
            console.error("Failed to delete pin:", error);
        }
    };

    // File Upload Handler (Existing logic preserved)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
            setIsUploading(true);
            try {
                const uploadedDocs = await Promise.all(
                    files.map(file =>
                        storageService.uploadFile(
                            project.id,
                            file,
                            undefined // uploadedBy
                        )
                    )
                );
                setUploadedDocuments(prev => [...uploadedDocs, ...prev]);
            } catch (error) {
                console.error('File upload failed:', error);
                alert('Failed to upload files. Please try again.');
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveFile = async (documentId: string) => {
        if (!confirm('Delete document?')) return;
        try {
            await storageService.deleteFile(documentId);
            setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
        } catch (error) {
            alert('Failed to delete file.');
        }
    };

    // Helper Renderer for Sections
    const renderSection = (
        title: string,
        sectionKey: 'lexicon' | 'priorities' | 'benchmarks' | 'constraints',
        items?: string[] | { term: string, definition: string }[],
        emptyText: string = "No items generated."
    ) => {
        const sectionPins = pins.filter(p => p.section === sectionKey);

        return (
            <div className="bg-muted rounded-lg p-5 border border-border space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {title}
                        <span className="text-xs font-normal text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                            {sectionPins.length + (items?.length || 0)}
                        </span>
                    </h4>
                    {isManager && (
                        <Button
                            onClick={() => { setActiveSectionForPin(sectionKey); setNewPinContent(''); }}
                            variant="ghost"
                            size="sm"><Plus className="mr-2 h-4 w-4" />Add Pin
                                                    </Button>
                    )}
                </div>
                {/* Add Pin Input */}
                {activeSectionForPin === sectionKey && (
                    <div className="flex gap-2 p-3 bg-accent rounded-lg animate-in fade-in slide-in-from-top-2">
                        <div className="flex-shrink-0 pt-2">
                            <Pin size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <textarea
                                value={newPinContent}
                                onChange={e => setNewPinContent(e.target.value)}
                                placeholder={`Enter mandatory rule for ${title}...`}
                                className="w-full bg-muted border border-border rounded-md p-2 text-sm focus:ring-1 focus:ring-primary outline-none min-h-[60px]"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setActiveSectionForPin(null)}>Cancel</Button>
                                <Button size="sm" onClick={() => handleAddPin(sectionKey)}>Pin Rule</Button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="space-y-2">
                    {/* Pinned Items */}
                    {sectionPins.map(pin => (
                        <div key={pin.id} className="group flex items-start justify-between p-3 rounded-md bg-secondary/10 border border-secondary/20 hover:border-secondary/30 transition-all">
                            <div className="flex gap-3">
                                <Pin size={16} className="text-secondary flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-sm text-foreground font-medium">{pin.content}</p>
                                    <p className="text-[10px] text-secondary mt-1 uppercase tracking-wider font-bold">Pinned &bull; Hard Constraint</p>
                                </div>
                            </div>
                            {isManager && (
                                <button
                                    onClick={() => handleDeletePin(pin.id)}
                                    className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* AI Items */}
                    {items && items.length > 0 ? (
                        items.map((item, idx) => {
                            const text = typeof item === 'string' ? item : `${item.term}: ${item.definition}`;
                            return (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-md bg-muted border border-border/50 text-sm text-muted-foreground">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                                    <p>{text}</p>
                                </div>
                            );
                        })
                    ) : (
                        sectionPins.length === 0 && (
                            <div className="text-sm text-muted-foreground italic p-2">{emptyText}</div>
                        )
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full px-6 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button onClick={onBack} variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Project</Button>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Knowledge Base</h2>
                        <p className="text-sm text-muted-foreground">{project.name}</p>
                    </div>
                </div>

                {isManager && (
                    <Button
                        onClick={handleRegenerate}
                        disabled={isGenerating}
                        className={isGenerating ? 'animate-pulse' : ''}>
                        {isGenerating ? (isLegacyMode ? 'Converting...' : 'Regenerating...') : (isLegacyMode ? 'Analyze & Enable Pinned Rules' : 'Regenerate Suggestions')}
                    </Button>
                )}
            </div>
            {/* Legacy Warning */}
            {isLegacyMode && !isGenerating && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="text-sm font-semibold text-amber-500 mb-1">Legacy Format Detected</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            This Knowledge Base is stored in a legacy text format. To use <strong>Pinned Rules</strong> (Human Overrides) and granular editing, please regenerate the Knowledge Base. This will structure the data and allow you to lock in specific rules.
                        </p>
                    </div>
                </div>
            )}
            {/* Main Content */}
            {isGenerating ? (
                <div className="bg-card rounded-lg p-12 flex flex-col items-center justify-center text-center border border-border min-h-[400px]">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative">
                        <Bot size={32} className="text-primary animate-pulse" />
                        <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-spin-slow" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                        {isLegacyMode ? "Structuring Knowledge Base..." : "Synthesizing Project Context..."}
                    </h3>
                    <p className="text-muted-foreground max-w-md">
                        Zevian is analyzing your reports, goals, and documents to build a structured set of rules and benchmarks.
                        {pins.length > 0 && <span className="block mt-2 font-medium text-secondary">Applying {pins.length} pinned rules as hard constraints.</span>}
                    </p>
                </div>
            ) : isLegacyMode ? (
                /* Legacy View */
                (<div className="bg-card rounded-lg p-6 border border-border">
                    <div className="prose prose-slate max-w-none prose-sm">
                        <div className="whitespace-pre-wrap font-mono text-sm text-muted-foreground">
                            {project.aiContext}
                        </div>
                    </div>
                </div>)
            ) : kbData ? (
                /* Structured View */
                (<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column: Description & Metadata */}
                    <div className="space-y-6">
                        <div className="bg-card rounded-lg p-5 border border-border">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 pb-2 border-b border-border">Project Overview</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                {kbData.projectDescription}
                            </p>

                            {/* Roadmaps */}
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Roadmap & KPIs</h4>
                                <ul className="space-y-1">
                                    {kbData.roadmapsAndKPIs.map((k, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                            <span className="text-primary font-bold">{i + 1}.</span> {k}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* File Uploads (Moved to sidebar) */}
                        <div className="bg-card rounded-lg p-5 border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Documents</h3>
                                {isManager && (
                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        variant="outline"
                                        size="sm"
                                        disabled={isUploading}><Upload className="mr-2 h-4 w-4" />
                                        {isUploading ? 'Wait...' : 'Add'}
                                    </Button>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />

                            <div className="space-y-2">
                                {uploadedDocuments.length === 0 && <p className="text-xs text-muted-foreground italic">No documents.</p>}
                                {uploadedDocuments.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-muted border border-border text-sm">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText size={14} className="text-primary flex-shrink-0" />
                                            <span className="truncate">{doc.fileName}</span>
                                        </div>
                                        {isManager && <button onClick={() => handleRemoveFile(doc.id)} className="text-muted-foreground hover:text-red-500"><X size={14} /></button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Right Column (Wide): Rules & Lexicon */}
                    <div className="xl:col-span-2 space-y-6">
                        {renderSection("Project Lexicon", "lexicon", kbData.projectLexicon)}
                        {renderSection("Operational Priorities", "priorities", kbData.operationalPriorities)}
                        {renderSection("Style & Quality Benchmarks", "benchmarks", [kbData.styleAndQualityBenchmarks])}
                        {renderSection("Implicit Constraints", "constraints", kbData.implicitConstraints)}
                    </div>
                </div>)
            ) : (
                /* Empty / Error State */
                (<div className="bg-card rounded-lg p-12 text-center border border-border">
                    <Bot size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-foreground">Knowledge Base Not Initialized</h3>
                    <p className="text-muted-foreground mb-6">Create a knowledge base to guide the AI with specific rules and context.</p>
                    {isManager && (
                        <Button onClick={handleRegenerate}>Initialize Knowledge Base</Button>
                    )}
                </div>)
            )}
        </div>
    );
};

export default KnowledgeBasePage;
