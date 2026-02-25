import React, { useState, useMemo } from 'react';
import { Project, Report, Employee, Goal } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Calendar, User, Users, FolderKanban, FileText, Bot, Target, RefreshCw, Link as LinkIcon, Eye, ChevronDown, ChevronUp, ExternalLink, Bookmark, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import Textarea from '../components/Textarea';
import { Badge } from "../components/ui/badge";
import { DataTable } from '../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
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
      return employee ? `${employee.name} (${assignee.type})` : `Unknown(${assignee.type})`;
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
  const columns: ColumnDef<Report>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <span>{formatTableDate(row.original.submissionDate)}</span>
        </div>
      )
    },
    {
      id: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = employees.find(e => e.id === row.original.employeeId);
        return <span className="truncate">{employee?.name || 'Unknown'}</span>;
      }
    },
    {
      id: "goal",
      header: "Goal",
      cell: ({ row }) => {
        const goal = goals.find(g => g.id === row.original.goalId);
        return <span className="truncate">{goal?.name || 'N/A'}</span>;
      }
    },
    {
      accessorKey: "evaluationScore",
      header: "Zevian Score",
      cell: ({ row }) => <span className="text-foreground font-medium">{row.original.evaluationScore.toFixed(1)}</span>
    },
    {
      accessorKey: "managerOverallScore",
      header: "Manager Score",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.managerOverallScore != null ? (
            <span className="text-primary font-semibold">
              {row.original.managerOverallScore.toFixed(1)}
            </span>
          ) : (
            <Badge variant="outline" className="px-1.5 py-0.5 bg-muted/50 text-muted-foreground text-[10px] uppercase font-bold">Pending Review</Badge>
          )}
        </div>
      )
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedReport(row.original);
          }}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 group"
          title="View Details"
        >
          <Eye size={18} strokeWidth={2} className="text-primary transition-all group-hover:scale-110" />
        </button>
      )
    }
  ];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-muted-foreground hover:text-primary group/back"
          title="Back to Projects"
        >
          <div className="p-1 rounded-full bg-muted group-hover/back:bg-primary/10 transition-colors">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-medium pr-1">Back</span>
        </button>
        <div className="h-6 w-px bg-border mx-1" />
        <h2 className="text-2xl font-bold text-foreground">{project.name}</h2>
      </div>
      {/* Project Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Goals Section */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-primary drop-shadow-sm" />
                <h3 className="text-lg font-semibold text-foreground">Project Goals</h3>
                <span className="text-sm text-muted-foreground">({projectGoals.length})</span>
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
                    <div key={goal.id} className="bg-muted rounded-lg border border-border overflow-hidden">
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
                        className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Target size={18} className="text-primary/70 flex-shrink-0" />
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-semibold text-foreground truncate">{goal.name}</h4>
                            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
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
                          <ChevronUp size={20} className="text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown size={20} className="text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          {/* Goal Details in Sidebar style */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-muted-foreground mb-3">Scoring Criteria</h5>
                              <div className="space-y-2">
                                {goal.criteria.map((criterion) => (
                                  <div key={criterion.id} className="flex items-center justify-between bg-background p-2 rounded border border-border text-sm">
                                    <span className="text-foreground">{criterion.name}</span>
                                    <span className="font-semibold text-primary">{criterion.weight}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {goal.instructions && (
                              <div>
                                <h5 className="text-sm font-medium text-muted-foreground mb-3">Instructions</h5>
                                <div className="bg-background p-3 rounded border border-border whitespace-pre-line text-sm text-foreground max-h-[200px] overflow-y-auto">
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
              <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed border-border">
                <Target size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No goals defined for this project.</p>
              </div>
            )}
          </div>

          {/* Reports Section */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-primary drop-shadow-sm" />
                <h3 className="text-lg font-semibold text-foreground">Recent Reports</h3>
                <span className="text-sm text-muted-foreground">({projectReports.length})</span>
              </div>
            </div>

            {projectReports.length > 0 ? (
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={sortedReportsForTable}
                  onRowClick={(row) => setSelectedReport(row)}
                />
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed border-border">
                <FileText size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No reports submitted yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Details */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
              <FolderKanban size={20} className="text-primary drop-shadow-sm" />
              Project Info
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                <p className="text-sm font-medium text-foreground mt-0.5">{project.category || 'Standard'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequency</label>
                <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{project.reportFrequency.replace('-', ' ')}</p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Calendar size={14} className="text-primary/70" />
                  <span className="text-sm font-medium text-foreground">
                    {project.createdAt ? formatTableDate(project.createdAt) : '—'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created By</label>
                <div className="flex items-center gap-2 mt-1">
                  {project.createdBy ? (() => {
                    const creator = employees.find(e => e.id === project.createdBy);
                    return creator ? (
                      <>
                        <ProfilePicture name={creator.name} size={24} />
                        <span className="text-sm font-medium text-foreground">{creator.name}</span>
                      </>
                    ) : <span className="text-sm text-foreground">—</span>;
                  })() : <span className="text-sm text-foreground">—</span>}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <Button
                onClick={() => navigate(`/projects/${project.id}/knowledge-base`)}
                variant="outline"
                size="sm"
                className="w-full justify-center"><ExternalLink className="mr-2 h-4 w-4" />Access Knowledge Base
              </Button >
            </div >
          </div >

          {/* Project Assignees */}
          < div className="bg-card rounded-lg p-6 border border-border" >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users size={20} className="text-primary drop-shadow-sm" />
                Team Members
              </h3>
              {assigneeEmployees.length > 5 && (
                <button
                  onClick={() => setShowAssigneesModal(true)}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
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
                    <div key={employee.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border group">
                      <ProfilePicture name={employee.name} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {employee.name}
                        </div>
                        {employee.title && (
                          <div className="text-[10px] text-muted-foreground font-medium truncate">
                            {employee.title}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border text-center">
                  <User size={24} className="mb-2 opacity-50" />
                  <p className="text-xs">No team members assigned</p>
                </div>
              )}
            </div>
          </div >
        </div >
      </div >
      {/* Report Detail Modal */}
      {
        selectedReport && (
          <Modal
            isOpen={!!selectedReport}
            onClose={() => setSelectedReport(null)}
            title={`Report - ${formatReportDate(selectedReport.submissionDate)}`}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Employee</h3>
                <p className="text-muted-foreground">
                  {employees.find(e => e.id === selectedReport.employeeId)?.name || 'Unknown'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Goal</h3>
                <p className="text-muted-foreground">
                  {goals.find(g => g.id === selectedReport.goalId)?.name || 'N/A'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Report Content</h3>
                <div
                  className="bg-muted p-4 rounded-lg text-muted-foreground border border-border prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedReport.reportText }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Bot size={20} className="text-primary drop-shadow-sm" />
                  Zevian Analysis
                </h3>
                <div className="bg-muted p-4 rounded-lg text-muted-foreground italic border border-border">
                  "{selectedReport.evaluationReasoning}"
                </div>
              </div>
              {/* Manager Evaluation & Feedback */}
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Evaluation & Feedback</h3>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg border border-border flex justify-between items-center">
                    <span className="font-medium text-foreground">Overall Score</span>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-primary">
                        {(selectedReport.managerOverallScore != null ? selectedReport.managerOverallScore : (selectedReport.evaluationScore ?? 0)).toFixed(2)}
                      </span>
                      {selectedReport.managerOverallScore != null && (
                        <div className="text-xs text-muted-foreground">Overridden by manager</div>
                      )}
                    </div>
                  </div>

                  {selectedReport.managerFeedback && (
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Manager Feedback</h4>
                      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 text-foreground text-sm">
                        {selectedReport.managerFeedback}
                      </div>
                    </div>
                  )}
                  {!selectedReport.managerFeedback && selectedReport.managerOverallScore === undefined && (
                    <p className="text-xs text-muted-foreground italic text-center">
                      Waiting for manager review and feedback.
                    </p>
                  )}
                </div>
              </div>

              {selectedReport.criterionScores && selectedReport.criterionScores.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Criteria Analysis</h3>
                  <div className="space-y-2">
                    {selectedReport.criterionScores.map((score, index) => (
                      <div key={index} className="bg-muted p-3 rounded-lg border border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground text-sm">{score.criterionName}</span>
                          <span className="text-sm font-semibold text-muted-foreground">{score.score.toFixed(1)}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )
      }
      {/* Assignees Modal */}
      <Modal
        isOpen={showAssigneesModal}
        onClose={() => setShowAssigneesModal(false)}
        title="All Assignees"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {assigneeEmployees.length > 0 ? (
            assigneeEmployees.map(employee => (
              <div key={employee.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
                <ProfilePicture name={employee.name} size={40} />
                <div className="flex-1">
                  <div className="font-medium text-foreground">{employee.name}</div>
                  <div className="text-sm text-muted-foreground">{employee.email}</div>
                  {employee.title && (
                    <div className="text-xs text-muted-foreground">{employee.title}</div>
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
            <div className="text-center py-8 text-muted-foreground">
              <User size={32} className="mx-auto mb-2 text-muted-foreground" />
              <p>No assignees</p>
            </div>
          )}
        </div>
      </Modal>
    </div >
  );
};

export default ProjectDetailPage;
