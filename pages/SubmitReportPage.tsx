import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Goal, Report, Employee, Project, ManagerSettings, ReportCriterionScore, Organization, ProjectDocument } from '../types';
import { evaluateReport } from '../services/geminiService';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { CheckCircle, AlertTriangle, Target, Paperclip, Send, FolderKanban, Info, X, FileText, Loader2 } from 'lucide-react';
import { STANDARD_METRICS } from '../constants';
import { storageService } from '../services/storageService';

interface SubmitReportPageProps {
  goals: Goal[];
  projects: Project[];
  addReport: (report: Report) => void;
  employees: Employee[];
  currentEmployeeId?: string;
  isEmployeeView?: boolean;
  settings?: ManagerSettings;
  organization?: Organization;
}

const SubmitReportPage: React.FC<SubmitReportPageProps> = ({ goals, projects, addReport, employees, currentEmployeeId, isEmployeeView = false, settings, organization }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    isEmployeeView && currentEmployeeId ? currentEmployeeId : (employees[0]?.id || '')
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [reportText, setReportText] = useState('');

  // File Upload State
  const [uploadedDocuments, setUploadedDocuments] = useState<ProjectDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationPreviews, setEvaluationPreviews] = useState<Map<string, {
    evaluationScore: number;
    evaluationReasoning: string;
    criterionScores: ReportCriterionScore[];
  }>>(new Map());
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load Project Documents
  useEffect(() => {
    if (selectedProjectId) {
      const loadDocuments = async () => {
        try {
          setIsLoadingDocs(true);
          const docs = await storageService.getProjectDocuments(selectedProjectId);
          setUploadedDocuments(docs);
        } catch (err) {
          console.error('Failed to load project documents:', err);
        } finally {
          setIsLoadingDocs(false);
        }
      };
      loadDocuments();
    } else {
      setUploadedDocuments([]);
    }
  }, [selectedProjectId]);

  // Filtering projects and goals
  const availableProjects = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return projects.filter(project => {
      const isProjectAssigned = project.assignees?.some(assignee => assignee.id === selectedEmployeeId) || false;
      const hasGoalAssignment = goals.some(goal =>
        goal.projectId === project.id &&
        goal.assignees?.some(a => a.id === selectedEmployeeId)
      );
      return isProjectAssigned || hasGoalAssignment;
    });
  }, [projects, selectedEmployeeId, goals]);

  const availableGoals = useMemo(() => {
    if (!selectedProjectId) return [];
    return goals.filter(goal => {
      if (goal.projectId !== selectedProjectId) return false;
      if (goal.status === 'completed') return false;
      if (goal.assignees?.some(a => a.id === selectedEmployeeId)) return true;
      if (goal.assignees && goal.assignees.length > 0) return false;
      const project = projects.find(p => p.id === goal.projectId);
      return project?.assignees?.some(a => a.id === selectedEmployeeId) || !project?.assignees || project.assignees.length === 0;
    });
  }, [goals, selectedProjectId, selectedEmployeeId, projects]);

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const selectedGoals = useMemo(() => goals.filter(g => selectedGoalIds.includes(g.id)), [goals, selectedGoalIds]);
  const selectedGoalCriteria = useMemo(() => {
    const criteriaMap = new Map();
    selectedGoals.forEach(g => g.criteria.forEach(c => criteriaMap.set(c.id, c)));
    return Array.from(criteriaMap.values());
  }, [selectedGoals]);

  const metricsToShow = useMemo(() => organization?.selectedMetrics || [], [organization]);

  const handleEvaluateReport = async () => {
    const plainText = reportText.replace(/<[^>]*>/g, '').trim().length;
    if (selectedGoalIds.length === 0 || plainText < 50) {
      setError('Please select at least one goal and enter a report of at least 50 characters.');
      return;
    }

    setIsEvaluating(true);
    setError(null);
    try {
      const cleanText = reportText.replace(/<[^>]*>/g, '').trim();
      const newEvaluations = new Map();
      const projectKnowledgeBase = selectedProject?.aiContext;
      const organizationMetrics = organization?.selectedMetrics;

      for (const goalId of selectedGoalIds) {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) continue;

        const evaluation = await evaluateReport(
          cleanText,
          goal.criteria,
          goal.instructions,
          projectKnowledgeBase,
          organizationMetrics
        );

        const totalWeight = goal.criteria.reduce((sum, c) => sum + c.weight, 0);
        const goalScore = evaluation.criteriaScores
          .filter(s => goal.criteria.some(c => c.name.toLowerCase() === s.criterionName.toLowerCase()))
          .reduce((sum, s) => {
            const criterion = goal.criteria.find(c => c.name.toLowerCase() === s.criterionName.toLowerCase());
            return sum + (s.score * ((criterion?.weight || 0) / (totalWeight || 1)));
          }, 0);

        const orgMetricScores = evaluation.criteriaScores.filter(s =>
          !goal.criteria.some(c => c.name.toLowerCase() === s.criterionName.toLowerCase())
        );
        const orgScore = orgMetricScores.length > 0
          ? orgMetricScores.reduce((sum, s) => sum + s.score, 0) / orgMetricScores.length
          : goalScore;

        const finalScore = (goalScore * 0.7) + (orgScore * 0.3);

        newEvaluations.set(goalId, {
          evaluationScore: parseFloat(finalScore.toFixed(2)),
          evaluationReasoning: evaluation.reasoning,
          criterionScores: evaluation.criteriaScores
        });
      }
      setEvaluationPreviews(newEvaluations);
      setIsPreviewModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      evaluationPreviews.forEach((evalData, goalId) => {
        addReport({
          id: `report-${Date.now()}-${goalId}`,
          goalId,
          employeeId: selectedEmployeeId,
          reportText,
          submissionDate: new Date().toISOString(),
          evaluationScore: evalData.evaluationScore,
          evaluationReasoning: evalData.evaluationReasoning,
          criterionScores: evalData.criterionScores
        });
      });
      setSuccess('Report submitted successfully!');
      setReportText('');
      setSelectedGoalIds([]);
      setSelectedProjectId('');
    } catch (err) {
      setError('Submission failed.');
    } finally {
      setIsSubmitting(false);
      setIsPreviewModalOpen(false);
    }
  };

  const handleProjectChange = (id: string) => {
    setSelectedProjectId(id);
    setSelectedGoalIds([]);
    setReportText('');
  };

  const handleGoalToggle = (id: string) => {
    setSelectedGoalIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedProjectId) {
      const files = Array.from(e.target.files) as File[];
      setIsUploading(true);
      try {
        const uploaded = await Promise.all(
          files.map(file => storageService.uploadFile(selectedProjectId, file, selectedEmployeeId))
        );
        setUploadedDocuments(prev => [...uploaded, ...prev]);
        setSuccess('Files uploaded.');
      } catch (err) {
        setError('Upload failed.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleRemoveFile = async (id: string) => {
    if (!confirm('Delete document?')) return;
    try {
      await storageService.deleteFile(id);
      setUploadedDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError('Delete failed.');
    }
  };

  const textLength = reportText.replace(/<[^>]*>/g, '').trim().length;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* 1. Minimalist Header */}
      <header className="flex flex-col gap-1 border-b border-border pb-6">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Submit Report</h1>
        <p className="text-sm text-on-surface-secondary opacity-60">Document your results and align with organizational excellence.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Reporting Flow */}
        <div className="lg:col-span-3 space-y-6">

          {/* 2. Selection Header (Compact Horizontal Bar) */}
          <div className="bg-surface/30 border border-border/50 rounded-2xl p-4 space-y-4">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-on-surface-tertiary uppercase tracking-widest px-1">Project Selection</span>
              <div className="flex flex-wrap gap-2">
                {availableProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleProjectChange(p.id)}
                    className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all ${selectedProjectId === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-white hover:border-primary/20'}`}
                  >
                    <FolderKanban size={14} className={selectedProjectId === p.id ? 'text-primary' : 'text-on-surface-tertiary'} />
                    <span className={`text-[11px] font-bold ${selectedProjectId === p.id ? 'text-primary' : 'text-on-surface'}`}>{p.name}</span>
                    {selectedProjectId === p.id && <CheckCircle size={10} className="text-primary ml-1" />}
                  </button>
                ))}
              </div>
            </div>

            {selectedProjectId && (
              <div className="space-y-2 pt-2 border-t border-border/10">
                <span className="text-[10px] font-black text-on-surface-tertiary uppercase tracking-widest px-1">Alignment Goals</span>
                <div className="flex flex-wrap gap-2">
                  {availableGoals.map(g => {
                    const isSelected = selectedGoalIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => handleGoalToggle(g.id)}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-white hover:border-primary/20'}`}
                      >
                        <Target size={14} className={isSelected ? 'text-primary' : 'text-on-surface-tertiary'} />
                        <span className={`text-[11px] font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{g.name}</span>
                        {isSelected && <CheckCircle size={10} className="text-primary ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. The Focus Zone - Clean Editor */}
          {selectedGoalIds.length > 0 && (
            <section className="bg-white border border-border rounded-[2.5rem] overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/5 transition-all animate-in fade-in duration-300">
              {/* Chips Context Area directly above Textarea */}
              <div className="px-8 pt-8 pb-4 border-b border-border/30 bg-surface/5">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-black text-on-surface-tertiary uppercase tracking-widest mr-2">Alignment:</span>
                  {metricsToShow.map(m => {
                    const metric = STANDARD_METRICS.find(std => std.id === m);
                    return metric && (
                      <div key={m} className="px-3 py-1 bg-white border border-border rounded-lg text-[10px] font-bold text-on-surface-secondary shadow-sm">
                        {metric.friendlyName}
                      </div>
                    );
                  })}
                  {selectedGoalCriteria.map(c => (
                    <div key={c.id} className="px-3 py-1 bg-primary/5 border border-primary/20 rounded-lg text-[10px] font-bold text-primary flex items-center gap-1.5">
                      <Target size={10} className="opacity-40" />
                      {c.name}
                      <span className="text-primary font-mono ml-1.5 bg-primary/10 px-1 py-0.5 rounded text-[9px]">{c.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8">
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Focus on your impact, data, and results..."
                  className="w-full min-h-[450px] bg-transparent border-none focus:ring-0 text-lg font-medium leading-relaxed text-on-surface placeholder:text-on-surface-tertiary/20 resize-none"
                />

                <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-8">
                  <div className="flex items-center gap-8">
                    <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 text-on-surface-secondary hover:text-primary transition-colors group">
                      <div className="w-10 h-10 rounded-xl bg-surface group-hover:bg-primary/5 flex items-center justify-center transition-all">
                        {isUploading ? <Loader2 size={16} className="animate-spin text-primary" /> : <Paperclip size={16} />}
                      </div>
                      <span className="font-bold text-xs">{isUploading ? 'Uploading...' : 'Attach'}</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />

                    <div className="text-[10px] font-black text-on-surface-tertiary tracking-widest font-mono uppercase">
                      <span className={textLength > 2800 ? 'text-error' : ''}>{textLength.toLocaleString()}</span>
                      <span className="opacity-30 ml-1">/ 3,000</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleEvaluateReport} variant="outline" isLoading={isEvaluating} className="h-11 px-6 rounded-xl font-bold text-xs">Analyze Draft</Button>
                    <Button onClick={handleFinalSubmit} variant="primary" isLoading={isSubmitting} icon={Send} className="h-11 px-6 rounded-xl font-bold text-xs shadow-lg shadow-primary/10">Submit Final</Button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 4. Streamlined Context Sidebar */}
        <aside className="lg:col-span-1">
          <div className="bg-surface/50 border border-border rounded-[2rem] p-6 lg:sticky lg:top-8 space-y-8">
            <h3 className="text-[10px] font-black text-on-surface-tertiary tracking-widest uppercase flex items-center gap-2">
              <Info size={14} className="text-primary" /> Context
            </h3>

            {selectedProject ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div>
                  <h4 className="text-[10px] font-black text-on-surface-tertiary uppercase tracking-widest mb-1 shadow-sm opacity-50">Locked Project</h4>
                  <p className="text-sm font-bold text-on-surface leading-snug">{selectedProject.name}</p>

                  {selectedProject.knowledgeBaseLink && (
                    <a href={selectedProject.knowledgeBaseLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest mt-4 hover:underline">
                      <FileText size={12} /> Knowledge Base
                    </a>
                  )}
                </div>

                {uploadedDocuments.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-border/50">
                    <span className="text-[10px] font-black text-on-surface-tertiary uppercase tracking-widest opacity-50">Project Files</span>
                    <div className="space-y-1.5">
                      {uploadedDocuments.map(d => (
                        <div key={d.id} className="group p-2.5 rounded-xl bg-white/40 border border-border/20 flex items-center justify-between transition-colors hover:bg-white/60">
                          <span className="text-[11px] font-bold truncate pr-4">{d.fileName}</span>
                          <button onClick={() => handleRemoveFile(d.id)} className="text-on-surface-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedGoals.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <span className="text-[10px] font-black text-on-surface-tertiary uppercase tracking-widest opacity-50">Goal Guidelines</span>
                    <div className="space-y-3">
                      {selectedGoals.map(g => (
                        <div key={g.id} className="p-4 rounded-2xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
                          <p className="text-[10px] font-black text-primary uppercase mb-1.5">{g.name}</p>
                          <p className="text-[11px] text-on-surface-secondary leading-relaxed line-clamp-3">{g.instructions || 'Standard evaluation apply.'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 opacity-20">
                <FolderKanban size={32} className="mx-auto mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Select Project</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Preview Modal */}
      <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title="Analysis Preview">
        <div className="space-y-8 max-h-[75vh] overflow-y-auto pr-4">
          {Array.from(evaluationPreviews).map(([id, data]: [string, any]) => {
            const goal = goals.find(g => g.id === id);
            return (
              <div key={id} className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Target size={24} className="text-primary" /> {goal?.name}
                </h3>
                <div className="bg-surface p-8 rounded-2xl border border-border flex items-center justify-between mb-8 shadow-sm">
                  <div>
                    <span className="text-xs font-black text-on-surface-tertiary uppercase tracking-widest block mb-1">Score Estimate</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-primary">{data.evaluationScore.toFixed(1)}</span>
                      <span className="text-lg font-bold text-on-surface-tertiary">/ 10</span>
                    </div>
                  </div>
                  <CheckCircle size={40} className="text-primary/10" />
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-on-surface-tertiary uppercase tracking-widest">AI Feedback</h4>
                  <p className="text-sm font-medium leading-relaxed italic text-on-surface-secondary">"{data.evaluationReasoning}"</p>
                </div>
              </div>
            );
          })}
          <div className="flex gap-4 pt-6 border-t border-border sticky bottom-1 bg-white">
            <Button onClick={() => setIsPreviewModalOpen(false)} variant="outline" className="flex-1 h-14 rounded-2xl font-bold">Revise</Button>
            <Button onClick={handleFinalSubmit} variant="primary" isLoading={isSubmitting} className="flex-1 h-14 rounded-2xl font-bold shadow-lg shadow-primary/20">Finalize Submission</Button>
          </div>
        </div>
      </Modal>

      {/* Notifications */}
      {success && (
        <div className="fixed bottom-10 right-10 bg-success text-white px-8 py-4 rounded-full font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-center gap-3">
          <CheckCircle size={20} /> {success}
        </div>
      )}
      {error && (
        <div className="fixed bottom-10 right-10 bg-error text-white px-8 py-4 rounded-full font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-center gap-3">
          <AlertTriangle size={20} /> {error}
        </div>
      )}
    </div>
  );
};

export default SubmitReportPage;
