import React, { useState, useMemo } from 'react';
import { Goal, Report, Employee, Project, ManagerSettings, ReportCriterionScore } from '../types';
import { evaluateReport } from '../services/geminiService';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import RichTextEditor from '../components/RichTextEditor';
import Button from '../components/Button';
import Select from '../components/Select';
import { CheckCircle, AlertTriangle, Eye, Target, Plus, Paperclip, Mic, FileText, Send, ChevronDown, ChevronUp, Calendar, FolderKanban, Info } from 'lucide-react';

interface SubmitReportPageProps {
  goals: Goal[];
  projects: Project[];
  addReport: (report: Report) => void;
  employees: Employee[];
  currentEmployeeId?: string;
  isEmployeeView?: boolean;
  settings?: ManagerSettings;
}

const SubmitReportPage: React.FC<SubmitReportPageProps> = ({ goals, projects, addReport, employees, currentEmployeeId, isEmployeeView = false, settings }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    isEmployeeView && currentEmployeeId ? currentEmployeeId : (employees[0]?.id || '')
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');
  const [isProjectDetailsModalOpen, setIsProjectDetailsModalOpen] = useState(false);

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

  // Get projects assigned to the selected employee
  const availableProjects = useMemo(() => {
    if (!selectedEmployeeId) {
      console.log('[SubmitReport] No employee selected');
      return [];
    }

    console.log('[SubmitReport] Filtering projects for employee:', selectedEmployeeId);
    console.log('[SubmitReport] Total projects:', projects.length);

    const filtered = projects.filter(project => {
      const hasAssignees = project.assignees && project.assignees.length > 0;
      const isAssigned = project.assignees?.some(assignee =>
        assignee.type === 'employee' && assignee.id === selectedEmployeeId
      ) || false;

      console.log(`[SubmitReport] Project "${project.name}":`, {
        hasAssignees,
        assignees: project.assignees,
        isAssigned
      });

      return isAssigned;
    });

    console.log('[SubmitReport] Filtered projects:', filtered.length, filtered.map(p => p.name));
    return filtered;
  }, [projects, selectedEmployeeId]);

  // Get goals that belong to the selected project
  const availableGoals = useMemo(() => {
    if (!selectedProjectId) return [];
    return goals.filter(goal => goal.projectId === selectedProjectId);
  }, [goals, selectedProjectId]);

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Check if submission is allowed (considering deadline and settings)
  const canSubmitAfterDeadline = useMemo(() => {
    return settings?.allowLateSubmissions !== false; // Default to true if not set
  }, [settings]);

  const selectedGoals = useMemo(() => {
    return goals.filter(g => selectedGoalIds.includes(g.id));
  }, [goals, selectedGoalIds]);

  // Check if any selected goal deadline has passed
  const goalsWithDeadlineIssues = useMemo(() => {
    return selectedGoals.filter(goal => {
      if (!goal.deadline) return false;
      const isDeadlinePassed = new Date(goal.deadline) < new Date();
      return isDeadlinePassed && !canSubmitAfterDeadline;
    });
  }, [selectedGoals, canSubmitAfterDeadline]);

  const handleEvaluateReport = async () => {
    const textLength = reportText.replace(/<[^>]*>/g, '').trim().length;
    if (selectedGoalIds.length === 0 || !selectedEmployeeId || !selectedProjectId || textLength < 50) {
      setError(isEmployeeView
        ? 'Please select a project, at least one goal, and enter a report of at least 50 characters.'
        : 'Please select an employee, a project, at least one goal, and enter a report of at least 50 characters.');
      return;
    }

    // Check deadline if not allowed to submit late
    if (goalsWithDeadlineIssues.length > 0) {
      const goalNames = goalsWithDeadlineIssues.map(g => g.name).join(', ');
      setError(`The following goal(s) have passed their deadline and late submissions are not allowed: ${goalNames}. Please deselect them or enable late submissions in settings.`);
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setSuccess(null);

    try {
      const plainText = reportText.replace(/<[^>]*>/g, '').trim();
      const newEvaluations = new Map<string, {
        evaluationScore: number;
        evaluationReasoning: string;
        criterionScores: ReportCriterionScore[];
      }>();

      // Evaluate report for each selected goal
      for (const goalId of selectedGoalIds) {
        const goalToEvaluate = goals.find(g => g.id === goalId);
        if (!goalToEvaluate) continue;

        const evaluation = await evaluateReport(plainText, goalToEvaluate.criteria);

        const totalWeight = goalToEvaluate.criteria.reduce((sum, c) => sum + c.weight, 0);
        const overallScore = evaluation.criteriaScores.reduce((weightedSum, scoreItem) => {
          const criterion = goalToEvaluate.criteria.find(c => c.name === scoreItem.criterionName);
          if (criterion) {
            return weightedSum + (scoreItem.score * (criterion.weight / totalWeight));
          }
          return weightedSum;
        }, 0);

        newEvaluations.set(goalId, {
          evaluationScore: parseFloat(overallScore.toFixed(2)),
          evaluationReasoning: evaluation.reasoning,
          criterionScores: evaluation.criteriaScores,
        });
      }

      setEvaluationPreviews(newEvaluations);
      setIsPreviewModalOpen(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (evaluationPreviews.size === 0) return;

    // Double-check deadline before final submission
    if (goalsWithDeadlineIssues.length > 0) {
      setError(`Some goals have passed their deadline. Late submissions are not allowed.`);
      setIsPreviewModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create a report for each selected goal
      const timestamp = Date.now();
      selectedGoalIds.forEach((goalId, index) => {
        const evaluation = evaluationPreviews.get(goalId);
        if (!evaluation) return;

        const newReport: Report = {
          id: `report-${timestamp}-${index}`,
          goalId: goalId,
          employeeId: selectedEmployeeId,
          reportText,
          submissionDate: new Date().toISOString(),
          evaluationScore: evaluation.evaluationScore,
          evaluationReasoning: evaluation.evaluationReasoning,
          criterionScores: evaluation.criterionScores,
        };

        addReport(newReport);
      });

      setSuccess(`Report submitted successfully for ${selectedGoalIds.length} goal(s)!`);
      setReportText('');
      setSelectedGoalIds([]);
      setSelectedProjectId('');
      setExpandedGoalId(null);
      setEvaluationPreviews(new Map());
      setIsPreviewModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setIsPreviewModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const textLength = reportText.replace(/<[^>]*>/g, '').trim().length;
  const maxLength = 3000;

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedGoalIds([]);
    setExpandedGoalId(null);
    setReportText('');
  };

  const toggleGoalAccordion = (goalId: string) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoalIds(prev => {
      if (prev.includes(goalId)) {
        return prev.filter(id => id !== goalId);
      } else {
        return [...prev, goalId];
      }
    });
  };

  return (
    <>
      <div className="w-full px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-on-surface mb-2">Submit Report</h1>
          <p className="text-sm text-on-surface-secondary">
            Select a project, then choose a goal to submit your work report.
          </p>
        </div>

        {/* Employee Selection (if not employee view) */}
        {!isEmployeeView && (
          <div className="mb-6">
            <Select
              label="Select Employee"
              value={selectedEmployeeId}
              onChange={(e) => {
                setSelectedEmployeeId(e.target.value);
                setSelectedProjectId('');
                setSelectedGoalIds([]);
                setExpandedGoalId(null);
              }}
              options={[
                { value: '', label: '-- Select an employee --' },
                ...employees.map(emp => ({ value: emp.id, label: emp.name }))
              ]}
            />
          </div>
        )}

        {/* Project Selection */}
        {selectedEmployeeId && availableProjects.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-on-surface-secondary">Select Project</label>
              {selectedProjectId && (
                <Button
                  onClick={() => setIsProjectDetailsModalOpen(true)}
                  variant="ghost"
                  size="sm"
                  icon={Info}
                >
                  View Project Details
                </Button>
              )}
            </div>
            <Select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              options={[
                { value: '', label: '-- Select a project --' },
                ...availableProjects.map(project => ({ value: project.id, label: project.name }))
              ]}
            />
          </div>
        )}

        {/* Goals Accordion */}
        {selectedProjectId && availableGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-on-surface mb-4">Select Goals</h2>
            <div className="space-y-2">
              {availableGoals.map((goal) => {
                const isExpanded = expandedGoalId === goal.id;
                const isSelected = selectedGoalIds.includes(goal.id);
                const isDeadlinePassed = goal.deadline ? new Date(goal.deadline) < new Date() : false;
                const canSubmit = !isDeadlinePassed || canSubmitAfterDeadline;

                return (
                  <div
                    key={goal.id}
                    className={`border rounded-lg transition-all ${isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white hover:border-primary/50'
                      }`}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleGoalToggle(goal.id)}
                        disabled={!canSubmit}
                        className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={() => toggleGoalAccordion(goal.id)}
                        className="flex-1 flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                            }`}>
                            <Target size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-on-surface">{goal.name}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-secondary">
                              <span>{goal.criteria.length} criteria</span>
                              <span>•</span>
                              <span>{goal.instructions ? 'Instructions available' : 'No instructions'}</span>
                              {goal.deadline && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span className={isDeadlinePassed ? 'text-error' : ''}>
                                      {new Date(goal.deadline).toLocaleDateString()}
                                    </span>
                                  </div>
                                </>
                              )}
                              {isDeadlinePassed && (
                                <>
                                  <span>•</span>
                                  <span className={canSubmit ? 'text-warning' : 'text-error'}>
                                    {canSubmit ? 'Deadline Passed (Late Submission Allowed)' : 'Deadline Passed'}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="text-xs font-medium text-primary">Selected</span>
                          )}
                          {isExpanded ? (
                            <ChevronUp size={20} className="text-on-surface-secondary" />
                          ) : (
                            <ChevronDown size={20} className="text-on-surface-secondary" />
                          )}
                        </div>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-semibold text-on-surface mb-2">Criteria</h4>
                            <div className="space-y-1">
                              {goal.criteria.map((criterion) => (
                                <div key={criterion.id} className="text-sm text-on-surface-secondary">
                                  • {criterion.name} ({criterion.weight}%)
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-on-surface mb-2">Instructions</h4>
                            <div className="text-sm text-on-surface-secondary whitespace-pre-line">
                              {goal.instructions || 'No instructions provided.'}
                            </div>
                          </div>
                          {!canSubmit && (
                            <p className="text-xs text-error">
                              This goal's deadline has passed and late submissions are not allowed.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Report Input Section */}
        {selectedGoalIds.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-on-surface mb-4">
              Report Details {selectedGoalIds.length > 1 && `(${selectedGoalIds.length} goals selected)`}
            </h2>
            <div className="bg-white border border-border rounded-lg p-4">
              <RichTextEditor
                value={reportText}
                onChange={setReportText}
                placeholder="Describe the work you've completed, challenges faced, and outcomes achieved..."
                minLength={50}
              />
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg text-error bg-error/10 border border-error/20">
            <AlertTriangle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-lg text-success bg-success/10 border border-success/20">
            <CheckCircle size={20} />
            <span className="text-sm font-medium">{success}</span>
          </div>
        )}

        {/* Action Buttons */}
        {selectedGoalIds.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="p-2 text-on-surface-secondary hover:text-on-surface hover:bg-surface-hover rounded-lg transition-all">
                <Paperclip size={18} />
              </button>
              <button className="p-2 text-on-surface-secondary hover:text-on-surface hover:bg-surface-hover rounded-lg transition-all">
                <Mic size={18} />
              </button>
              <button className="p-2 text-on-surface-secondary hover:text-on-surface hover:bg-surface-hover rounded-lg transition-all">
                <FileText size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-on-surface-secondary">
                {textLength} / {maxLength}
              </span>
              <Button
                onClick={handleEvaluateReport}
                disabled={isEvaluating || textLength < 50}
                variant="primary"
                size="lg"
                icon={isEvaluating ? undefined : Send}
              >
                {isEvaluating ? (
                  <>
                    <Spinner />
                    Processing...
                  </>
                ) : (
                  `Preview Evaluation${selectedGoalIds.length > 1 ? ` (${selectedGoalIds.length} goals)` : ''}`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Empty States */}
        {!selectedEmployeeId && (
          <div className="text-center py-12">
            <p className="text-on-surface-secondary">Please select an employee to view available projects.</p>
          </div>
        )}

        {selectedEmployeeId && availableProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderKanban size={48} className="mx-auto mb-4 text-on-surface-tertiary" />
            <p className="text-on-surface-secondary">No projects available for this employee.</p>
          </div>
        )}

        {selectedProjectId && availableGoals.length === 0 && (
          <div className="text-center py-12">
            <Target size={48} className="mx-auto mb-4 text-on-surface-tertiary" />
            <p className="text-on-surface-secondary">No goals available for this project.</p>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      <Modal
        isOpen={isProjectDetailsModalOpen}
        onClose={() => setIsProjectDetailsModalOpen(false)}
        title={selectedProject ? `Project Details - ${selectedProject.name}` : 'Project Details'}
      >
        {selectedProject && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">Project Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-on-surface-secondary">Name:</span>
                  <p className="text-on-surface">{selectedProject.name}</p>
                </div>
                {selectedProject.description && (
                  <div>
                    <span className="text-sm font-medium text-on-surface-secondary">Description:</span>
                    <p className="text-on-surface">{selectedProject.description}</p>
                  </div>
                )}
                {selectedProject.category && (
                  <div>
                    <span className="text-sm font-medium text-on-surface-secondary">Category:</span>
                    <p className="text-on-surface">{selectedProject.category}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-on-surface-secondary">Report Frequency:</span>
                  <p className="text-on-surface capitalize">{selectedProject.reportFrequency.replace('-', ' ')}</p>
                </div>
                {selectedProject.knowledgeBaseLink && (
                  <div>
                    <span className="text-sm font-medium text-on-surface-secondary">Knowledge Base:</span>
                    <a
                      href={selectedProject.knowledgeBaseLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedProject.knowledgeBaseLink}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-on-surface-secondary">Assigned To:</span>
                  <p className="text-on-surface">
                    {selectedProject.assignees && selectedProject.assignees.length > 0
                      ? selectedProject.assignees.map(assignee => {
                        if (assignee.type === 'employee') {
                          return employees.find(e => e.id === assignee.id)?.name || 'Unknown';
                        } else {
                          return employees.find(e => e.id === assignee.id)?.name || 'Unknown';
                        }
                      }).join(', ')
                      : 'Unassigned'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-primary mb-3">Goals ({availableGoals.length})</h3>
              {availableGoals.length > 0 ? (
                <div className="space-y-3">
                  {availableGoals.map((goal) => {
                    const isDeadlinePassed = goal.deadline ? new Date(goal.deadline) < new Date() : false;
                    return (
                      <div key={goal.id} className="bg-surface p-4 rounded-lg border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-on-surface">{goal.name}</h4>
                          {goal.deadline && (
                            <div className={`flex items-center gap-1 text-xs ${isDeadlinePassed ? 'text-error' : 'text-on-surface-secondary'
                              }`}>
                              <Calendar size={12} />
                              <span>{new Date(goal.deadline).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-on-surface-secondary space-y-1">
                          <div>Criteria: {goal.criteria.length}</div>
                          <div>Instructions: {goal.instructions ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-on-surface-secondary">No goals for this project.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Evaluation Preview Modal */}
      <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} title={`Evaluation Preview${selectedGoalIds.length > 1 ? ` (${selectedGoalIds.length} goals)` : ''}`}>
        {evaluationPreviews.size > 0 && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto">
            {selectedGoalIds.map((goalId) => {
              const goal = goals.find(g => g.id === goalId);
              const evaluation = evaluationPreviews.get(goalId);
              if (!goal || !evaluation) return null;

              return (
                <div key={goalId} className="bg-surface-elevated p-6 rounded-lg border border-border">
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                    <Target size={20} />
                    {goal.name}
                  </h3>

                  <div className="bg-surface p-6 rounded-lg border border-border text-center mb-4">
                    <p className="text-sm text-on-surface-secondary mb-2">Overall Evaluation Score</p>
                    <div className="flex items-center justify-center gap-3">
                      <Target size={32} className="text-primary" />
                      <p className="text-2xl font-bold text-on-surface">{evaluation.evaluationScore.toFixed(2)}</p>
                      <span className="text-lg text-on-surface-secondary">/ 10</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-primary mb-2">Evaluation Summary</h4>
                    <div className="bg-surface p-4 rounded-lg border border-border">
                      <p className="text-on-surface-secondary italic">"{evaluation.evaluationReasoning}"</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-primary mb-3">Criteria Breakdown</h4>
                    <div className="space-y-2">
                      {evaluation.criterionScores.map((score, index) => (
                        <div key={index} className="bg-surface p-3 rounded-lg border border-border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-on-surface">{score.criterionName}</span>
                            <span className="text-lg font-bold text-primary">{score.score.toFixed(1)} / 10</span>
                          </div>
                          <div className="w-full bg-surface-elevated rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(score.score / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                onClick={() => setIsPreviewModalOpen(false)}
                variant="outline"
              >
                Revise Report
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                variant="primary"
                icon={isSubmitting ? undefined : CheckCircle}
              >
                {isSubmitting ? (
                  <>
                    <Spinner />
                    Submitting...
                  </>
                ) : (
                  `Submit Report${selectedGoalIds.length > 1 ? `s (${selectedGoalIds.length})` : ''}`
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default SubmitReportPage;
