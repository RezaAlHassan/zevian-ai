import React, { useState, useMemo } from 'react';
import { Project, Report, Employee, Goal } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Calendar, User, Users, FolderKanban, FileText, Bot, Target, RefreshCw, Link as LinkIcon, Eye, ChevronDown, ChevronUp, ExternalLink, Bookmark } from 'lucide-react';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { ProfilePicture, StackedAvatars } from '../components/Avatar';
import { formatReportDate, formatTableDate } from '../utils/dateFormat';



interface ProjectDetailPageProps {
  project: Project;
  reports: Report[];
  goals: Goal[];
  employees: Employee[];
  updateProject: (project: Project) => void;
  onBack: () => void;
  viewMode: 'manager' | 'employee';
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  project,
  reports,
  goals,
  employees,
  updateProject,
  onBack,
  viewMode
}) => {
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showObjectivePoints, setShowObjectivePoints] = useState<Set<string>>(new Set());
  const [showAssigneesModal, setShowAssigneesModal] = useState(false);

  // Get all goals for this project
  const projectGoals = useMemo(() => {
    return goals.filter(g => g.projectId === project.id);
  }, [goals, project.id]);

  // Get all reports for goals in this project
  const projectReports = useMemo(() => {
    const goalIds = projectGoals.map(g => g.id);
    return reports.filter(r => goalIds.includes(r.goalId));
  }, [reports, projectGoals]);

  // Get assignee employees
  const assigneeEmployees = useMemo(() => {
    if (!project.assignees) return [];
    return project.assignees
      .map(a => employees.find(e => e.id === a.id))
      .filter((e): e is Employee => !!e);
  }, [project.assignees, employees]);

  // Get assignee names for display
  const assigneeNames = useMemo(() => {
    if (!project.assignees || project.assignees.length === 0) return 'Unassigned';
    return project.assignees.map(assignee => {
      const employee = employees.find(e => e.id === assignee.id);
      return employee ? `${employee.name} (${assignee.type})` : `Unknown (${assignee.type})`;
    }).join(', ');
  }, [project.assignees, employees]);

  // Handle table sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Get sorted reports for table
  const sortedReportsForTable = useMemo(() => {
    let sorted = [...projectReports];

    if (sortColumn && sortDirection) {
      sorted.sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'date':
            comparison = new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
            break;
          case 'employee':
            const employeeA = employees.find(e => e.id === a.employeeId)?.name || '';
            const employeeB = employees.find(e => e.id === b.employeeId)?.name || '';
            comparison = employeeA.localeCompare(employeeB);
            break;
          case 'goal':
            const goalA = goals.find(g => g.id === a.goalId)?.name || '';
            const goalB = goals.find(g => g.id === b.goalId)?.name || '';
            comparison = goalA.localeCompare(goalB);
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

    return sorted;
  }, [projectReports, sortColumn, sortDirection, employees, goals]);

  // Reports table headers and rows
  const reportTableHeaders = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'employee', label: 'Employee', sortable: true },
    { key: 'goal', label: 'Goal', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false },
  ];

  const reportTableRows = sortedReportsForTable.map(report => {
    const goal = goals.find(g => g.id === report.goalId);
    const employee = employees.find(e => e.id === report.employeeId);

    return [
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-on-surface-tertiary" />
        <span>{formatTableDate(report.submissionDate)}</span>
      </div>,
      <span className="truncate">{employee?.name || 'Unknown'}</span>,
      <span className="truncate">{goal?.name || 'N/A'}</span>,
      <span className="text-on-surface">{report.evaluationScore.toFixed(2)}</span>,
      <button
        onClick={() => setSelectedReport(report)}
        className="p-1.5 text-on-surface-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
        title="View Details"
      >
        <Eye size={18} strokeWidth={2} />
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
          title="Back to Projects"
        >
          <div className="p-1 rounded-full bg-surface group-hover/back:bg-primary/10 transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium pr-1">Back</span>
        </button>
        <div className="h-6 w-px bg-border mx-1" />
        <h2 className="text-2xl font-bold text-on-surface">{project.name}</h2>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Goals Section */}
          <div className="bg-surface-elevated rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-on-surface-secondary" />
                <h3 className="text-lg font-semibold text-on-surface">Project Goals</h3>
                <span className="text-sm text-on-surface-secondary">({projectGoals.length})</span>
              </div>
            </div>

            {projectGoals.length > 0 ? (
              <div className="space-y-2">
                {projectGoals.map(goal => {
                  const isExpanded = expandedGoals.has(goal.id);
                  const showObjectives = showObjectivePoints.has(goal.id);
                  const goalReports = projectReports.filter(r => r.goalId === goal.id);
                  const goalAvgScore = goalReports.length > 0
                    ? goalReports.reduce((sum, r) => sum + r.evaluationScore, 0) / goalReports.length
                    : 0;

                  return (
                    <div key={goal.id} className="bg-surface rounded-lg border border-border overflow-hidden">
                      {/* Goal Header - Always Visible */}
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedGoals);
                          if (isExpanded) {
                            newExpanded.delete(goal.id);
                          } else {
                            newExpanded.add(goal.id);
                          }
                          setExpandedGoals(newExpanded);
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Target size={18} className="text-on-surface-secondary flex-shrink-0" />
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-semibold text-on-surface truncate">{goal.name}</h4>
                            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-on-surface-secondary">
                              <span>{goal.criteria.length} criteria</span>
                              {goalReports.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{goalReports.length} report{goalReports.length !== 1 ? 's' : ''}</span>
                                  <span>•</span>
                                  <span>Avg: {goalAvgScore.toFixed(1)}/10</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-on-surface-secondary flex-shrink-0" />
                        ) : (
                          <ChevronDown size={20} className="text-on-surface-secondary flex-shrink-0" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          {/* Goal Details in Sidebar style */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-on-surface-secondary mb-3">Scoring Criteria</h5>
                              <div className="space-y-2">
                                {goal.criteria.map((criterion) => (
                                  <div key={criterion.id} className="flex items-center justify-between bg-white p-2 rounded border border-border text-sm">
                                    <span className="text-on-surface">{criterion.name}</span>
                                    <span className="font-semibold text-primary">{criterion.weight}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {goal.instructions && (
                              <div>
                                <h5 className="text-sm font-medium text-on-surface-secondary mb-3">Instructions</h5>
                                <div className="bg-white p-3 rounded border border-border whitespace-pre-line text-sm text-on-surface max-h-[200px] overflow-y-auto">
                                  {goal.instructions}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-surface/50 rounded-lg border border-dashed border-border">
                <Target size={32} className="mx-auto mb-3 text-on-surface-tertiary opacity-50" />
                <p className="text-on-surface-secondary">No goals defined for this project.</p>
              </div>
            )}
          </div>

          {/* Reports Section */}
          <div className="bg-surface-elevated rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-on-surface-secondary" />
                <h3 className="text-lg font-semibold text-on-surface">Recent Reports</h3>
                <span className="text-sm text-on-surface-secondary">({projectReports.length})</span>
              </div>
            </div>

            {projectReports.length > 0 ? (
              <div className="overflow-x-auto">
                <Table
                  headers={reportTableHeaders}
                  rows={reportTableRows}
                  sortable
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </div>
            ) : (
              <div className="text-center py-12 bg-surface/50 rounded-lg border border-dashed border-border">
                <FileText size={32} className="mx-auto mb-3 text-on-surface-tertiary opacity-50" />
                <p className="text-on-surface-secondary">No reports submitted yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Details */}
          <div className="bg-surface-elevated rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-on-surface flex items-center gap-2">
              <FolderKanban size={20} className="text-on-surface-secondary" />
              Project Info
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-tertiary">Category</label>
                <p className="text-sm font-medium text-on-surface mt-0.5">{project.category || 'Standard'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-tertiary">Frequency</label>
                <p className="text-sm font-medium text-on-surface mt-0.5 capitalize">{project.reportFrequency.replace('-', ' ')}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-tertiary">Created</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Calendar size={14} className="text-on-surface-tertiary" />
                  <span className="text-sm font-medium text-on-surface">
                    {project.createdAt ? formatTableDate(project.createdAt) : '—'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-tertiary">Created By</label>
                <div className="flex items-center gap-2 mt-1">
                  {project.createdBy ? (() => {
                    const creator = employees.find(e => e.id === project.createdBy);
                    return creator ? (
                      <>
                        <ProfilePicture name={creator.name} size={24} />
                        <span className="text-sm font-medium text-on-surface">{creator.name}</span>
                      </>
                    ) : <span className="text-sm text-on-surface">—</span>;
                  })() : <span className="text-sm text-on-surface">—</span>}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <Button
                onClick={() => navigate(`/projects/${project.id}/knowledge-base`)}
                variant="outline"
                size="sm"
                icon={ExternalLink}
                className="w-full justify-center"
              >
                Access Knowledge Base
              </Button>
            </div>
          </div>

          {/* Project Assignees */}
          <div className="bg-surface-elevated rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <Users size={20} className="text-on-surface-secondary" />
                Team Members
              </h3>
              {assigneeEmployees.length > 5 && (
                <button
                  onClick={() => setShowAssigneesModal(true)}
                  className="text-xs text-primary hover:text-primary-hover font-medium"
                >
                  View All
                </button>
              )}
            </div>

            <div className="space-y-3">
              {assigneeEmployees.length > 0 ? (
                assigneeEmployees.slice(0, 10).map(employee => {
                  const assignment = project.assignees?.find(a => a.id === employee.id);
                  return (
                    <div key={employee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface transition-colors border border-transparent hover:border-border group">
                      <ProfilePicture name={employee.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                          {employee.name}
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
                <div className="flex flex-col items-center justify-center py-6 text-on-surface-tertiary bg-surface/50 rounded-lg border border-dashed border-border text-center">
                  <User size={24} className="mb-2 opacity-50" />
                  <p className="text-xs">No team members assigned</p>
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
              <h3 className="text-lg font-semibold text-on-surface mb-1">Goal</h3>
              <p className="text-on-surface-secondary">
                {goals.find(g => g.id === selectedReport.goalId)?.name || 'N/A'}
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
              <h3 className="text-lg font-semibold text-on-surface mb-1 flex items-center gap-2">
                <Bot size={20} className="text-on-surface-secondary" />
                Zevian Analysis
              </h3>
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



      {/* Assignees Modal */}
      <Modal
        isOpen={showAssigneesModal}
        onClose={() => setShowAssigneesModal(false)}
        title="All Assignees"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {assigneeEmployees.length > 0 ? (
            assigneeEmployees.map(employee => (
              <div key={employee.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg border border-border">
                <ProfilePicture name={employee.name} size={40} />
                <div className="flex-1">
                  <div className="font-medium text-on-surface">{employee.name}</div>
                  <div className="text-sm text-on-surface-secondary">{employee.email}</div>
                  {employee.title && (
                    <div className="text-xs text-on-surface-tertiary">{employee.title}</div>
                  )}
                </div>
                {project.assignees?.find(a => a.id === employee.id) && (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {project.assignees.find(a => a.id === employee.id)?.type}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-on-surface-secondary">
              <User size={32} className="mx-auto mb-2 text-on-surface-tertiary" />
              <p>No assignees</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
