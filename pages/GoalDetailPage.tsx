
import React, { useState, useMemo } from 'react';
import { Goal, Report, Employee, Criterion, Project } from '../types';
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, File, Calendar, User, Users, Target, Trophy, Award, Eye, CheckCircle, RotateCcw, Search } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { ProfilePicture, StackedAvatars } from '../components/Avatar';
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
  const [showAssigneesModal, setShowAssigneesModal] = useState(false);
  const [assigneeSearchTerm, setAssigneeSearchTerm] = useState('');
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

  const goalAssigneeEmployees = useMemo(() => {
    if (!goal.assignees) return [];
    return goal.assignees
      .map(a => employees.find(e => e.id === a.id))
      .filter((e): e is Employee => !!e);
  }, [goal.assignees, employees]);

  const availableAssignees = useMemo(() => {
    if (!goalProject) return employees;
    // If project has explicit assignees, only they can be assigned to goals.
    // If project has NO assignees, we assume it's open to the whole org? 
    // Or strictly following "Project assignments block", if project has assignees, limit to them.
    if (goalProject.assignees && goalProject.assignees.length > 0) {
      return goalProject.assignees
        .map(a => employees.find(e => e.id === a.id))
        .filter((e): e is Employee => !!e);
    }
    return employees;
  }, [goalProject, employees]);

  const filteredAvailableAssignees = useMemo(() => {
    return availableAssignees.filter(e =>
      e.name.toLowerCase().includes(assigneeSearchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(assigneeSearchTerm.toLowerCase())
    );
  }, [availableAssignees, assigneeSearchTerm]);

  const handleToggleAssignee = (employeeId: string) => {
    const currentAssignees = goal.assignees || [];
    const exists = currentAssignees.find(a => a.id === employeeId);

    let newAssignees;
    if (exists) {
      newAssignees = currentAssignees.filter(a => a.id !== employeeId);
    } else {
      const employee = employees.find(e => e.id === employeeId);
      // Use employee role for the assignment type, default to 'employee'
      const type = employee?.role === 'manager' ? 'manager' : 'employee';
      newAssignees = [...currentAssignees, {
        id: employeeId,
        type,
        assignedAt: new Date().toISOString()
      }];
    }

    updateGoal({ ...goal, assignees: newAssignees });
  };

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
        Zevian Evaluated
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-on-surface-secondary hover:text-primary group/back"
          title="Back to Goals"
        >
          <div className="p-1 rounded-full bg-surface group-hover/back:bg-primary/10 transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium pr-1">Back</span>
        </button>
        <div className="h-6 w-px bg-border mx-1" />
        <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-on-surface">
              {goal.name}
            </h1>
            {goal.status === 'completed' && (
              <span className="bg-success/20 text-success text-xs px-2 py-1 rounded-full border border-success/30 flex items-center gap-1">
                <CheckCircle size={12} /> Completed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Button
                onClick={() => updateGoal({ ...goal, status: goal.status === 'completed' ? 'active' : 'completed' })}
                variant={goal.status === 'completed' ? 'outline' : 'primary'}
                size="sm"
                icon={goal.status === 'completed' ? RotateCcw : CheckCircle}
              >
                {goal.status === 'completed' ? 'Mark as Active' : 'Mark as Completed'}
              </Button>
            )}
          </div>
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


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="text-sm font-medium text-on-surface-secondary">Created By</label>
                  <div className="mt-1 flex items-center gap-2">
                    <User size={16} className="text-on-surface-secondary" />
                    <span className="text-on-surface">
                      {employees.find(e => e.id === goal.createdBy)?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-secondary">Created Date</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar size={16} className="text-on-surface-secondary" />
                    <span className="text-on-surface">
                      {goal.createdAt ? formatTableDate(goal.createdAt) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

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
                onRowClick={(index) => setSelectedReport(goalReports[index])}
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

          {/* Goal Assignees */}
          <div className="bg-surface-elevated rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <Users size={20} className="text-on-surface-secondary" />
                Goal Assignees
              </h3>
              {canEdit && (
                <button
                  onClick={() => setShowAssigneesModal(true)}
                  className="text-xs text-primary hover:text-primary-hover font-medium px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                >
                  Manage
                </button>
              )}
            </div>

            <div className="space-y-3">
              {goalAssigneeEmployees.length > 0 ? (
                goalAssigneeEmployees.map(employee => {
                  const assignment = goal.assignees?.find(a => a.id === employee.id);
                  return (
                    <div key={employee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors border border-transparent hover:border-border group">
                      <ProfilePicture name={employee.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                          <span>{employee.name}</span>
                          {assignment?.assignedAt && (
                            <span className="text-on-surface-tertiary text-[10px] font-normal">
                              (Assigned {formatTableDate(assignment.assignedAt)})
                            </span>
                          )}
                        </div>
                        {employee.title && (
                          <div className="text-[10px] text-on-surface-secondary font-medium truncate">
                            {employee.title}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-on-surface-tertiary bg-surface/50 rounded-lg border border-dashed border-border">
                  <User size={24} className="mb-2 opacity-50" />
                  <p className="text-sm">No assignees</p>
                  <p className="text-xs mt-1 text-center px-4">Visible to everyone in {goalProject?.name}</p>
                </div>
              )}
            </div>
          </div>
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
              <h3 className="text-lg font-semibold text-on-surface mb-1">Zevian Analysis</h3>
              <div className="bg-surface p-4 rounded-lg text-on-surface-secondary italic border border-border">
                "{selectedReport.evaluationReasoning}"
              </div>
            </div>
            {/* Manager Evaluation & Feedback */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-on-surface mb-4">Evaluation & Feedback</h3>
              <div className="space-y-4">
                <div className="bg-surface p-4 rounded-lg border border-border flex justify-between items-center">
                  <span className="font-medium text-on-surface">Overall Score</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {(selectedReport.managerOverallScore != null ? selectedReport.managerOverallScore : (selectedReport.evaluationScore ?? 0)).toFixed(2)}
                    </span>
                    {selectedReport.managerOverallScore != null && (
                      <div className="text-xs text-on-surface-tertiary">Overridden by manager</div>
                    )}
                  </div>
                </div>

                {selectedReport.managerFeedback && (
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface mb-2">Manager Feedback</h4>
                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 text-on-surface text-sm">
                      {selectedReport.managerFeedback}
                    </div>
                  </div>
                )}
                {!selectedReport.managerFeedback && selectedReport.managerOverallScore === undefined && (
                  <p className="text-xs text-on-surface-tertiary italic text-center">
                    Waiting for manager review and feedback.
                  </p>
                )}
              </div>
            </div>

            {selectedReport.criterionScores && selectedReport.criterionScores.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">Criteria Analysis</h3>
                <div className="space-y-2">
                  {selectedReport.criterionScores.map((score, index) => (
                    <div key={index} className="bg-surface p-3 rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-on-surface text-sm">{score.criterionName}</span>
                        <span className="text-sm font-semibold text-on-surface-secondary">{score.score.toFixed(1)}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Manage Assignees Modal */}
      <Modal
        isOpen={showAssigneesModal}
        onClose={() => setShowAssigneesModal(false)}
        title="Manage Goal Assignees"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-tertiary" />
            <input
              type="text"
              placeholder="Search employees..."
              value={assigneeSearchTerm}
              onChange={(e) => setAssigneeSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-sm text-on-surface placeholder-on-surface-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredAvailableAssignees.length > 0 ? (
              filteredAvailableAssignees.map(employee => {
                const isAssigned = goal.assignees?.some(a => a.id === employee.id);
                return (
                  <button
                    key={employee.id}
                    onClick={() => handleToggleAssignee(employee.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isAssigned
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-surface border-border hover:bg-surface-hover'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <ProfilePicture name={employee.name} size={32} />
                      <div className="text-left">
                        <div className={`font-medium ${isAssigned ? 'text-primary' : 'text-on-surface'}`}>
                          {employee.name}
                        </div>
                        <div className="text-xs text-on-surface-secondary">{employee.email}</div>
                      </div>
                    </div>
                    {isAssigned && (
                      <CheckCircle size={18} className="text-primary" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-on-surface-secondary">
                <p>No employees found.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              onClick={() => setShowAssigneesModal(false)}
              variant="primary"
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GoalDetailPage;

