
import React, { useState, useMemo } from 'react';
import { Goal, Report, Employee, Criterion, Project } from '../types';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, File, Calendar, User, Users, Target, Trophy, Award, Eye } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { formatReportDate, formatTableDate } from '../utils/dateFormat';
import { canManagerEditGoal } from '../utils/goalFilter';

type SortDirection = 'asc' | 'desc' | null;

interface GoalDetailPageProps {
  goal: Goal;
  reports: Report[];
  employees: Employee[];
  projects: Project[];
  updateGoal: (goal: Goal) => void;
  onBack: () => void;
  currentManagerId?: string;
  viewMode?: 'manager' | 'employee';
}

const GoalDetailPage: React.FC<GoalDetailPageProps> = ({
  goal,
  reports,
  employees,
  projects,
  updateGoal,
  onBack,
  currentManagerId,
  viewMode = 'manager'
}) => {
  const [isEditingCriteria, setIsEditingCriteria] = useState(false);
  const [editedCriteria, setEditedCriteria] = useState<Criterion[]>(goal.criteria);
  const [newCriterionName, setNewCriterionName] = useState('');
  const [newCriterionWeight, setNewCriterionWeight] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Check if current manager can edit this goal
  const canEdit = useMemo(() => {
    if (viewMode === 'employee') return false;
    if (!currentManagerId) return false;
    return canManagerEditGoal(goal, currentManagerId);
  }, [goal, currentManagerId, viewMode]);

  const goalProject = useMemo(() => {
    return projects.find(p => p.id === goal.projectId);
  }, [projects, goal.projectId]);

  const goalReports = useMemo(() => {
    let filtered = reports.filter(r => r.goalId === goal.id);

    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'date':
            comparison = new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
            break;
          case 'employee':
            const empA = employees.find(e => e.id === a.employeeId)?.name || '';
            const empB = employees.find(e => e.id === b.employeeId)?.name || '';
            comparison = empA.localeCompare(empB);
            break;
          case 'score':
            comparison = a.evaluationScore - b.evaluationScore;
            break;
          default:
            return 0;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [reports, goal.id, sortColumn, sortDirection, employees]);

  const handleSort = (column: string, direction: SortDirection) => {
    setSortColumn(direction ? column : null);
    setSortDirection(direction);
  };

  // Calculate contributor scores (who contributed most)
  const contributorScores = useMemo(() => {
    const employeeContributions = new Map<string, { totalScore: number; reportCount: number; averageScore: number }>();

    goalReports.forEach(report => {
      const existing = employeeContributions.get(report.employeeId) || { totalScore: 0, reportCount: 0, averageScore: 0 };
      existing.totalScore += report.evaluationScore;
      existing.reportCount += 1;
      existing.averageScore = existing.totalScore / existing.reportCount;
      employeeContributions.set(report.employeeId, existing);
    });

    return Array.from(employeeContributions.entries())
      .map(([employeeId, data]) => ({
        employeeId,
        ...data,
        employee: employees.find(e => e.id === employeeId)
      }))
      .sort((a, b) => {
        // Sort by average score first, then by report count
        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
        }
        return b.reportCount - a.reportCount;
      });
  }, [goalReports, employees]);

  const assigneeNames = goalProject?.assignees && goalProject.assignees.length > 0
    ? goalProject.assignees.map(assignee => {
      const employee = employees.find(e => e.id === assignee.id);
      return employee ? `${employee.name} (${assignee.type})` : `Unknown (${assignee.type})`;
    }).join(', ')
    : 'Unassigned';

  const totalWeight = editedCriteria.reduce((sum, c) => sum + c.weight, 0);

  const handleAddCriterion = () => {
    const weight = parseInt(newCriterionWeight, 10);
    if (newCriterionName && weight > 0 && weight <= 100) {
      setEditedCriteria([...editedCriteria, {
        id: `crit-${Date.now()}`,
        name: newCriterionName,
        weight
      }]);
      setNewCriterionName('');
      setNewCriterionWeight('');
    }
  };

  const handleRemoveCriterion = (id: string) => {
    setEditedCriteria(editedCriteria.filter(c => c.id !== id));
  };

  const handleSaveCriteria = () => {
    if (totalWeight === 100) {
      updateGoal({ ...goal, criteria: editedCriteria });
      setIsEditingCriteria(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedCriteria(goal.criteria);
    setIsEditingCriteria(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const reportTableHeaders = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'employee', label: 'Employee', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false },
  ];
  const reportTableRows = goalReports.map(report => {
    const employee = employees.find(e => e.id === report.employeeId);
    return [
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-on-surface-secondary" />
        <span className="capitalize text-on-surface-secondary">{formatTableDate(report.submissionDate)}</span>
      </div>,
      <span className="capitalize text-on-surface-secondary">{employee?.name || 'Unknown'}</span>,
      <span className="capitalize text-on-surface-secondary">
        {report.evaluationScore.toFixed(1)} / 10
      </span>,
      <span className="text-sm text-on-surface-secondary">
        AI Evaluated
      </span>,
      <button
        onClick={() => setSelectedReport(report)}
        className="text-primary hover:text-primary-hover hover:underline font-medium text-sm flex items-center gap-1 transition-colors"
      >
        <Eye size={16} strokeWidth={2} />
        View Details
      </button>
    ];
  });

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
        >
          Back to Goals
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-3">
            <Target size={32} className="text-on-surface-secondary" />
            {goal.name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Goal Information */}
          <div className="bg-surface-elevated rounded-lg p-6  border border-border">
            <h2 className="text-xl font-bold mb-4 text-on-surface">Goal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-on-surface-secondary">Description</label>
                <p className="mt-1 text-on-surface">
                  {goal.description || 'No description provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface-secondary">Project</label>
                <p className="mt-1 text-on-surface font-medium">{goalProject?.name || 'Unknown Project'}</p>
              </div>
              {goalProject && (
                <div>
                  <label className="text-sm font-medium text-on-surface-secondary">Assigned To</label>
                  <div className="mt-1 flex items-center gap-2">
                    {goalProject.assignees && goalProject.assignees.length > 0 ? (
                      <>
                        <Users size={18} className="text-on-surface-secondary" />
                        <span className="text-on-surface font-medium">{assigneeNames}</span>
                      </>
                    ) : (
                      <>
                        <User size={18} className="text-on-surface-tertiary" />
                        <span className="text-on-surface-tertiary">Unassigned</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Knowledge Base */}
              {goal.knowledgeBase && goal.knowledgeBase.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-on-surface-secondary mb-2 block">Knowledge Base</label>
                  <div className="space-y-2">
                    {goal.knowledgeBase.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg"
                      >
                        <File size={18} className="text-on-surface-secondary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-on-surface-tertiary">
                            {formatFileSize(file.fileSize)} • {new Date(file.uploadDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-surface-elevated rounded-lg p-6 border border-border">
            <h2 className="text-xl font-bold mb-4 text-on-surface">Instructions</h2>
            <div className="bg-surface p-4 rounded-lg text-on-surface secondary border border-border whitespace-pre-line">
              {goal.instructions}
            </div>
          </div>

          {/* Scoring Criteria */}
          <div className="bg-surface-elevated rounded-lg p-6  border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-on-surface">Scoring Criteria</h2>
              {!isEditingCriteria && canEdit && (
                <Button
                  onClick={() => setIsEditingCriteria(true)}
                  variant="outline"
                  size="sm"
                  icon={Edit2}
                >
                  Edit Criteria
                </Button>
              )}
              {!canEdit && viewMode === 'manager' && (
                <p className="text-sm text-on-surface-secondary italic">
                  You can only edit goals you created
                </p>
              )}
            </div>

            {isEditingCriteria ? (
              <div className="space-y-4">
                <div className="flex gap-2 items-start">
                  <Input
                    type="text"
                    value={newCriterionName}
                    onChange={(e) => setNewCriterionName(e.target.value)}
                    placeholder="Criterion Name"
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    value={newCriterionWeight}
                    onChange={(e) => setNewCriterionWeight(e.target.value)}
                    placeholder="Weight %"
                    className="w-24"
                  />
                  <Button
                    onClick={handleAddCriterion}
                    variant="primary"
                    size="md"
                    icon={Plus}
                    className="h-[38px]"
                  />
                </div>

                <div className="space-y-2">
                  {editedCriteria.map((c) => (
                    <div
                      key={c.id}
                      className="flex justify-between items-center bg-surface p-3 rounded-lg border border-border"
                    >
                      <span>
                        {c.name} - <span className="font-semibold text-on-surface">{c.weight}%</span>
                      </span>
                      <button
                        onClick={() => handleRemoveCriterion(c.id)}
                        className="text-error hover:text-error-hover transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className={`text-sm ${totalWeight === 100 ? 'text-success' : 'text-warning'}`}>
                    Total Weight: {totalWeight}%
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      icon={X}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveCriteria}
                      disabled={totalWeight !== 100}
                      variant="primary"
                      size="sm"
                      icon={Save}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {goal.criteria.map((c, index) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center bg-surface p-3 rounded-lg border border-border"
                  >
                    <span className="text-on-surface">
                      {index + 1}. {c.name}
                    </span>
                    <span className="font-semibold text-on-surface">{c.weight}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Reports */}
          <div className="bg-surface-elevated rounded-lg p-6  border border-border">
            <h2 className="text-xl font-bold mb-4 text-on-surface">Recent Reports</h2>
            {goalReports.length > 0 ? (
              <Table
                headers={reportTableHeaders}
                rows={reportTableRows}
                sortable
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            ) : (
              <p className="text-on-surface-secondary text-center py-8">
                No reports submitted for this goal yet.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          <div className="bg-surface-elevated rounded-lg p-6  border border-border">
            <h3 className="text-lg font-semibold mb-4 text-on-surface">Statistics</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-on-surface-secondary">Total Reports</p>
                <p className="text-lg font-bold text-on-surface">{goalReports.length}</p>
              </div>
              <div>
                <p className="text-sm text-on-surface-secondary">Average Score</p>
                <p className="text-lg font-bold text-on-surface">
                  {goalReports.length > 0
                    ? (goalReports.reduce((sum, r) => sum + r.evaluationScore, 0) / goalReports.length).toFixed(1)
                    : '0.0'
                  } / 10
                </p>
              </div>
              <div>
                <p className="text-sm text-on-surface-secondary">Criteria Count</p>
                <p className="text-lg font-bold text-on-surface">{goal.criteria.length}</p>
              </div>
            </div>
          </div>

          {/* Top Contributors */}
          {contributorScores.length > 0 && (
            <div className="bg-surface-elevated rounded-lg p-6  border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={20} className="text-on-surface-secondary" />
                <h3 className="text-lg font-semibold text-on-surface">Top Contributors</h3>
                <span className="text-xs text-on-surface-secondary ml-2">(by this goal)</span>
              </div>
              <div className="space-y-3">
                {contributorScores.slice(0, 5).map((contributor, index) => (
                  <div
                    key={contributor.employeeId}
                    className={`p-3 rounded-lg border ${index === 0
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-surface border-border'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Award size={16} className="text-on-surface-secondary" />}
                        <span className="font-medium text-on-surface">
                          {contributor.employee?.name || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-on-surface">
                        {contributor.averageScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-on-surface-secondary">
                      <span>{contributor.reportCount} report{contributor.reportCount !== 1 ? 's' : ''}</span>
                      <span>Total: {(contributor.totalScore).toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          title={`Report - ${formatReportDate(selectedReport.submissionDate)}`}
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-on-surface mb-1">Employee</h3>
              <p className="text-on-surface-secondary">
                {employees.find(e => e.id === selectedReport.employeeId)?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface mb-1">Report Content</h3>
              <div
                className="bg-surface p-4 rounded-lg text-on-surface-secondary border border-border prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedReport.reportText }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface mb-1">AI Analysis</h3>
              <div className="bg-surface p-4 rounded-lg text-on-surface-secondary italic border border-border">
                "{selectedReport.evaluationReasoning}"
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface mb-1">Evaluation Score</h3>
              <div className="bg-surface p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-medium">Overall Score</span>
                  <span className="text-2xl font-bold text-on-surface">{selectedReport.evaluationScore.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface mb-1">Criteria Analysis</h3>
              <div className="space-y-2">
                {selectedReport.evaluationCriteriaScores.map((score, index) => (
                  <div key={index} className="bg-surface p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-on-surface">{score.name}</span>
                      <span className="text-sm font-semibold text-on-surface">{score.score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GoalDetailPage;

