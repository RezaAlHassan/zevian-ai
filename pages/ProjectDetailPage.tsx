import React, { useState, useMemo } from 'react';
import { Project, Report, Employee, Goal } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Calendar, User, Users, FolderKanban, FileText, Bot, Target, RefreshCw, Link as LinkIcon, Eye, ChevronDown, ChevronUp, ExternalLink, Bookmark } from 'lucide-react';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { formatReportDate, formatTableDate } from '../utils/dateFormat';

// Profile Picture Component (Discord style)
const ProfilePicture: React.FC<{ name: string; size?: number; className?: string }> = ({ name, size = 32, className = '' }) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate a color based on name (consistent color for same name)
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500'
  ];
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIndex];

  return (
    <div
      className={`rounded-full ${bgColor} flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
};

// Stacked Profile Pictures Component (Discord style - overlapping)
const StackedAvatars: React.FC<{
  employees: Employee[];
  maxVisible?: number;
  size?: number;
  onSeeMore?: () => void;
}> = ({ employees, maxVisible = 5, size = 32, onSeeMore }) => {
  const visible = employees.slice(0, maxVisible);
  const remaining = employees.length - maxVisible;

  return (
    <div className="flex items-center" style={{ gap: size * -0.25 }}>
      {visible.map((employee, index) => (
        <div
          key={employee.id}
          className="relative"
          style={{ zIndex: maxVisible - index }}
        >
          <ProfilePicture
            name={employee.name}
            size={size}
            className="border-2 border-white shadow-sm"
          />
        </div>
      ))}
      {remaining > 0 && (
        <button
          onClick={onSeeMore}
          className="relative rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white font-semibold hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
          style={{
            width: size,
            height: size,
            fontSize: size * 0.35,
            zIndex: 0,
            marginLeft: size * -0.25 > 0 ? `${size * -0.25}px` : '0px'
          }}
        >
          +{remaining}
        </button>
      )}
    </div>
  );
};

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
        className="text-primary hover:text-primary-hover hover:underline transition-colors flex items-center gap-1 text-sm font-normal"
      >
        <Eye size={16} strokeWidth={1.5} className="text-primary" />
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
          Back to Projects
        </Button>
        <div className="flex items-center gap-3">
          <FolderKanban size={28} className="text-on-surface-secondary" />
          <h2 className="text-2xl font-bold text-on-surface">{project.name}</h2>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-surface-elevated rounded-lg p-6 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-on-surface-secondary mb-2">Category</h3>
            <p className="text-on-surface">{project.category || '—'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-on-surface-secondary mb-2">Assigned To</h3>
            <div className="flex items-center gap-3">
              {assigneeEmployees.length > 0 ? (
                <>
                  <StackedAvatars
                    employees={assigneeEmployees}
                    maxVisible={5}
                    size={32}
                    onSeeMore={() => setShowAssigneesModal(true)}
                  />
                  {assigneeEmployees.length > 5 && (
                    <button
                      onClick={() => setShowAssigneesModal(true)}
                      className="text-sm text-primary hover:text-primary-hover hover:underline"
                    >
                      See all {assigneeEmployees.length} assignees
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <User size={18} className="text-on-surface-tertiary" />
                  <span className="text-on-surface-tertiary">Unassigned</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-on-surface-secondary mb-2">Report Frequency</h3>
            <p className="text-on-surface capitalize">{project.reportFrequency.replace('-', ' ')}</p>
          </div>
        </div>

        {/* Complete Knowledge Base Section */}
        <div className="border-t border-border pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-on-surface">Complete Knowledge Base</h3>
            </div>
            <Button
              onClick={() => navigate(`/projects/${project.id}/knowledge-base`)}
              variant="outline"
              size="sm"
              icon={ExternalLink}
            >
              View Knowledge Base
            </Button>
          </div>
          <p className="text-sm text-on-surface-secondary max-w-2xl">
            Access the full project context, including project documentation, recent report summaries,
            technical nuances, and external resources used by AI for evaluation.
          </p>
        </div>
      </div>

      {/* Goals Section - At the top */}
      {projectGoals.length > 0 && (
        <div className="bg-surface-elevated rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={20} className="text-on-surface-secondary" />
              <h3 className="text-lg font-semibold text-on-surface">Project Goals</h3>
              <span className="text-sm text-on-surface-secondary">({projectGoals.length})</span>
            </div>
          </div>
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
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <div className="flex items-center gap-2 text-xs text-on-surface-secondary">
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

                          {/* Creator */}
                          {goal.createdBy && (() => {
                            const creator = employees.find(e => e.id === goal.createdBy);
                            return creator ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-on-surface-tertiary">Creator:</span>
                                <ProfilePicture name={creator.name} size={20} />
                                <span className="text-xs text-on-surface-secondary">{creator.name}</span>
                              </div>
                            ) : null;
                          })()}

                          {/* Employees Reporting */}
                          {(() => {
                            const reportingEmployees = goalReports
                              .map(r => employees.find(e => e.id === r.employeeId))
                              .filter((emp): emp is Employee => emp !== undefined);
                            const uniqueEmployees = Array.from(
                              new Map(reportingEmployees.map(emp => [emp.id, emp])).values()
                            );

                            return uniqueEmployees.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-on-surface-tertiary">Employees:</span>
                                <StackedAvatars
                                  employees={uniqueEmployees}
                                  maxVisible={5}
                                  size={20}
                                />
                                {uniqueEmployees.length > 5 && (
                                  <span className="text-xs text-on-surface-secondary">
                                    +{uniqueEmployees.length - 5}
                                  </span>
                                )}
                              </div>
                            ) : null;
                          })()}
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
                      {/* Goal Creator and Reporting Employees */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Creator */}
                        {goal.createdBy && (() => {
                          const creator = employees.find(e => e.id === goal.createdBy);
                          return creator ? (
                            <div>
                              <h5 className="text-sm font-medium text-on-surface-secondary mb-2">Created By</h5>
                              <div className="flex items-center gap-2">
                                <ProfilePicture name={creator.name} size={32} />
                                <span className="text-on-surface font-medium">{creator.name}</span>
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* Employees Reporting to This Goal */}
                        {(() => {
                          const reportingEmployees = goalReports
                            .map(r => employees.find(e => e.id === r.employeeId))
                            .filter((emp): emp is Employee => emp !== undefined);
                          const uniqueEmployees = Array.from(
                            new Map(reportingEmployees.map(emp => [emp.id, emp])).values()
                          );

                          return uniqueEmployees.length > 0 ? (
                            <div>
                              <h5 className="text-sm font-medium text-on-surface-secondary mb-2">
                                Employees Reporting ({uniqueEmployees.length})
                              </h5>
                              <div className="flex items-center gap-3">
                                <StackedAvatars
                                  employees={uniqueEmployees}
                                  maxVisible={5}
                                  size={32}
                                  onSeeMore={() => {
                                    // Could open a modal here if needed
                                  }}
                                />
                                {uniqueEmployees.length > 5 && (
                                  <span className="text-xs text-on-surface-secondary">
                                    +{uniqueEmployees.length - 5} more
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Managers Using This Goal */}
                      {(() => {
                        const managersUsingGoal = new Set<string>();
                        goalReports.forEach(report => {
                          const employee = employees.find(e => e.id === report.employeeId);
                          if (employee?.managerId) {
                            managersUsingGoal.add(employee.managerId);
                          }
                        });
                        const managerEmployees = Array.from(managersUsingGoal)
                          .map(managerId => employees.find(e => e.id === managerId))
                          .filter((emp): emp is Employee => emp !== undefined);

                        return managerEmployees.length > 0 ? (
                          <div>
                            <h5 className="text-sm font-medium text-on-surface-secondary mb-2">
                              Managers Using This Goal ({managerEmployees.length})
                            </h5>
                            <div className="flex items-center gap-3">
                              <StackedAvatars
                                employees={managerEmployees}
                                maxVisible={5}
                                size={32}
                                onSeeMore={() => {
                                  // Could open a modal here if needed
                                }}
                              />
                              {managerEmployees.length > 5 && (
                                <span className="text-xs text-on-surface-secondary">
                                  +{managerEmployees.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Criteria */}
                      <div>
                        <h5 className="text-sm font-medium text-on-surface-secondary mb-3">Scoring Criteria</h5>
                        <div className="space-y-2">
                          {goal.criteria.map((criterion, idx) => (
                            <div key={criterion.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-border">
                              <span className="text-on-surface">{criterion.name}</span>
                              <span className="font-semibold text-primary">{criterion.weight}%</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between bg-primary/5 p-3 rounded-lg border border-primary/20">
                            <span className="font-medium text-on-surface">Total Weight</span>
                            <span className="font-bold text-primary">
                              {goal.criteria.reduce((sum, c) => sum + c.weight, 0)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Instructions - Collapsible */}
                      {goal.instructions && (
                        <div>
                          <button
                            onClick={() => {
                              const newShow = new Set(showObjectivePoints);
                              if (showObjectives) {
                                newShow.delete(goal.id);
                              } else {
                                newShow.add(goal.id);
                              }
                              setShowObjectivePoints(newShow);
                            }}
                            className="flex items-center gap-2 text-sm font-medium text-on-surface-secondary hover:text-on-surface transition-colors mb-3"
                          >
                            {showObjectives ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                            <span>Instructions</span>
                          </button>
                          {showObjectives && (
                            <div className="bg-white p-3 rounded-lg border border-border whitespace-pre-line text-sm text-on-surface">
                              {goal.instructions}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reports Section */}
      {projectReports.length > 0 && (
        <div className="bg-surface-elevated rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-on-surface-secondary" />
              <h3 className="text-lg font-semibold text-on-surface">Project Reports</h3>
              <span className="text-sm text-on-surface-secondary">({projectReports.length})</span>
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            <Table
              headers={reportTableHeaders}
              rows={reportTableRows}
              sortable
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
          </div>
        </div>
      )}

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
                AI Analysis
              </h3>
              <div className="bg-surface p-4 rounded-lg text-on-surface-secondary italic border border-border">
                "{selectedReport.evaluationReasoning}"
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface mb-1">Evaluation Score</h3>
              <div className="bg-surface p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface font-medium">Overall Score</span>
                  <span className="text-2xl font-bold text-primary">{selectedReport.evaluationScore.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {selectedReport.evaluationCriteriaScores.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-on-surface mb-1">Criteria Analysis</h3>
                <div className="space-y-2">
                  {selectedReport.evaluationCriteriaScores.map((score, index) => (
                    <div key={index} className="bg-surface p-3 rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-on-surface">{score.name}</span>
                        <span className="text-sm text-on-surface-secondary">{score.score.toFixed(1)}/10</span>
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
