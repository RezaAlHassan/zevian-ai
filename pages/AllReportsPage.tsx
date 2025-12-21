
import React, { useState, useMemo } from 'react';
import { Report, Goal, Employee, Project } from '../types';
import Modal from '../components/Modal';
import Table from '../components/Table';
import Input from '../components/Input';
import MultiSelect from '../components/MultiSelect';
import Button from '../components/Button';
import Select from '../components/Select';
import Dropdown, { DropdownItem, DropdownDivider } from '../components/Dropdown';
import { Eye, FileText, Calendar, TrendingUp, Filter, X, Search, Users, FolderKanban, Target } from 'lucide-react';
import { formatReportDate, formatTableDate } from '../utils/dateFormat';
import { filterEmployeesByManager, getScopedEmployeeIds, getDirectReportIds } from '../utils/employeeFilter';
import { canViewOrganizationWide } from '../utils/managerPermissions';

type SortDirection = 'asc' | 'desc' | null;

interface AllReportsPageProps {
  reports: Report[];
  goals: Goal[];
  employees: Employee[];
  projects: Project[];
  currentManagerId?: string;
  viewMode?: 'manager' | 'employee';
  scopeFilter?: 'direct-reports' | 'organization';
}

const ReportPreviewModal: React.FC<{
  report: Report | null;
  goal: Goal | undefined;
  employee: Employee | undefined;
  onClose: () => void;
}> = ({ report, goal, employee, onClose }) => {
  if (!report) return null;

  return (
    <Modal isOpen={!!report} onClose={onClose} title={`Report - ${formatReportDate(report.submissionDate)}`}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-on-surface mb-1">Employee</h3>
          <p className="text-on-surface-secondary">{employee?.name || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-on-surface mb-1">Goal</h3>
          <p className="text-on-surface-secondary">{goal?.name || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-on-surface mb-1">Report Content</h3>
          <div
            className="bg-surface p-4 rounded-lg text-on-surface-secondary border border-border prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: report.reportText }}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-on-surface mb-1 flex items-center gap-2">
            <TrendingUp size={20} className="text-on-surface-secondary" />
            AI Analysis
          </h3>
          <div className="bg-surface p-4 rounded-lg text-on-surface-secondary italic border border-border">
            "{report.evaluationReasoning}"
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-on-surface mb-1">Evaluation Score</h3>
          <div className="bg-surface p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <span className="text-on-surface font-medium">Overall Score</span>
              <span className="text-2xl font-bold text-primary">{report.evaluationScore.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-on-surface mb-1">Criteria Analysis</h3>
          <div className="space-y-2">
            {report.criterionScores.map((score, index) => (
              <div key={index} className="bg-surface p-3 rounded-lg border border-border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-on-surface">{score.criterionName}</span>
                  <span className="text-sm font-semibold text-primary">{score.score.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const AllReportsPage: React.FC<AllReportsPageProps> = ({
  reports,
  goals,
  employees,
  projects,
  currentManagerId,
  viewMode = 'manager',
  scopeFilter = 'direct-reports'
}) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Get current manager for permission checks
  const currentManager = useMemo(() => {
    if (!currentManagerId) return null;
    return employees.find(emp => emp.id === currentManagerId);
  }, [employees, currentManagerId]);

  const canViewOrgWide = useMemo(() => {
    return currentManager ? canViewOrganizationWide(currentManager) : false;
  }, [currentManager]);

  // Get employee IDs based on selected scope
  const scopedEmployeeIds = useMemo(() => {
    if (viewMode !== 'manager' || !currentManagerId) {
      return new Set(employees.map(emp => emp.id));
    }

    switch (scopeFilter) {
      case 'direct-reports':
        return getDirectReportIds(employees, currentManagerId);
      case 'organization':
        if (canViewOrgWide) {
          return new Set(employees.map(emp => emp.id));
        }
        return getDirectReportIds(employees, currentManagerId);
      default:
        return getDirectReportIds(employees, currentManagerId);
    }
  }, [employees, currentManagerId, scopeFilter, canViewOrgWide, viewMode]);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [scoreRange, setScoreRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Filter employees by selected scope
  const scopedEmployees = useMemo(() => {
    return employees.filter(emp => scopedEmployeeIds.has(emp.id));
  }, [employees, scopedEmployeeIds]);

  // Filter reports to only include scoped employees (and self if manager)
  const scopedReports = useMemo(() => {
    return reports.filter(report =>
      scopedEmployeeIds.has(report.employeeId) ||
      (currentManagerId && report.employeeId === currentManagerId)
    );
  }, [reports, scopedEmployeeIds, currentManagerId]);

  // Get all goal IDs for selected projects
  const goalIdsForSelectedProjects = useMemo(() => {
    if (selectedProjectIds.length === 0) return [];
    return goals.filter(g => selectedProjectIds.includes(g.projectId)).map(g => g.id);
  }, [goals, selectedProjectIds]);

  // Filter reports
  const filteredReports = useMemo(() => {
    let filtered = [...scopedReports];

    // Filter by employee
    if (selectedEmployeeIds.length > 0) {
      filtered = filtered.filter(r => selectedEmployeeIds.includes(r.employeeId));
    }

    // Filter by project (via goals)
    if (goalIdsForSelectedProjects.length > 0) {
      filtered = filtered.filter(r => goalIdsForSelectedProjects.includes(r.goalId));
    }

    // Filter by goal
    if (selectedGoalIds.length > 0) {
      filtered = filtered.filter(r => selectedGoalIds.includes(r.goalId));
    }

    // Filter by score range
    if (scoreRange.min) {
      const min = parseFloat(scoreRange.min);
      if (!isNaN(min)) {
        filtered = filtered.filter(r => r.evaluationScore >= min);
      }
    }
    if (scoreRange.max) {
      const max = parseFloat(scoreRange.max);
      if (!isNaN(max)) {
        filtered = filtered.filter(r => r.evaluationScore <= max);
      }
    }

    // Filter by date range
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => new Date(r.submissionDate) >= start);
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.submissionDate) <= end);
    }

    // Filter by search query (searches in report text, employee name, goal name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const employee = employees.find(e => e.id === r.employeeId);
        const goal = goals.find(g => g.id === r.goalId);
        const reportText = r.reportText.replace(/<[^>]*>/g, '').toLowerCase();

        return (
          (employee?.name.toLowerCase().includes(query)) ||
          (goal?.name.toLowerCase().includes(query)) ||
          (reportText.includes(query))
        );
      });
    }

    // Sort reports
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'date':
            comparison = new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
            break;
          case 'employee':
            const empA = scopedEmployees.find(e => e.id === a.employeeId)?.name || '';
            const empB = scopedEmployees.find(e => e.id === b.employeeId)?.name || '';
            comparison = empA.localeCompare(empB);
            break;
          case 'project':
            const goalA = goals.find(g => g.id === a.goalId);
            const goalB = goals.find(g => g.id === b.goalId);
            const projA = goalA ? projects.find(p => p.id === goalA.projectId)?.name || '' : '';
            const projB = goalB ? projects.find(p => p.id === goalB.projectId)?.name || '' : '';
            comparison = projA.localeCompare(projB);
            break;
          case 'goal':
            const goalAName = goals.find(g => g.id === a.goalId)?.name || '';
            const goalBName = goals.find(g => g.id === b.goalId)?.name || '';
            comparison = goalAName.localeCompare(goalBName);
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
  }, [
    reports,
    selectedEmployeeIds,
    goalIdsForSelectedProjects,
    selectedGoalIds,
    scoreRange,
    dateRange,
    searchQuery,
    sortColumn,
    sortDirection,
    scopedEmployees,
    goals,
    projects
  ]);

  const clearFilters = () => {
    setSelectedEmployeeIds([]);
    setSelectedProjectIds([]);
    setSelectedGoalIds([]);
    setScoreRange({ min: '', max: '' });
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
  };

  const hasActiveFilters = selectedEmployeeIds.length > 0 ||
    selectedProjectIds.length > 0 ||
    selectedGoalIds.length > 0 ||
    scoreRange.min !== '' ||
    scoreRange.max !== '' ||
    dateRange.start !== '' ||
    dateRange.end !== '' ||
    searchQuery.trim() !== '';

  const employeeOptions = scopedEmployees.map(emp => ({
    value: emp.id,
    label: emp.name
  }));

  const projectOptions = projects.map(proj => ({
    value: proj.id,
    label: proj.name
  }));

  const goalOptions = goals.map(goal => ({
    value: goal.id,
    label: goal.name
  }));

  const handleSort = (column: string, direction: SortDirection) => {
    setSortColumn(direction ? column : null);
    setSortDirection(direction);
  };

  const reportTableHeaders = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'employee', label: 'Employee', sortable: true },
    { key: 'project', label: 'Project', sortable: true },
    { key: 'goal', label: 'Goal', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'preview', label: 'Preview', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false },
  ];
  const reportTableRows = filteredReports.map((report) => {
    const goal = goals.find(g => g.id === report.goalId);
    const project = goal ? projects.find(p => p.id === goal.projectId) : undefined;
    const employee = scopedEmployees.find(e => e.id === report.employeeId);
    const previewText = report.reportText.replace(/<[^>]*>/g, '').substring(0, 50);

    return [
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-on-surface-secondary" />
        <span className="capitalize text-on-surface-secondary">{formatTableDate(report.submissionDate)}</span>
      </div>,
      <span className="capitalize text-on-surface-secondary">{employee?.name || 'Unknown'}</span>,
      <span className="capitalize text-on-surface-secondary">{project?.name || '—'}</span>,
      <span className="capitalize text-on-surface-secondary">{goal?.name || 'Unknown Goal'}</span>,
      <span className="capitalize text-on-surface-secondary">{report.evaluationScore.toFixed(1)}</span>,
      <span className="capitalize text-on-surface-secondary truncate block">{previewText}...</span>,
      <button
        onClick={() => setSelectedReport(report)}
        className="text-primary hover:text-primary-hover hover:underline font-medium text-sm flex items-center gap-1 transition-colors whitespace-nowrap"
      >
        <Eye size={16} strokeWidth={2} />
        View Details
      </button>
    ];
  });

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-on-surface-secondary" />
          <h2 className="text-xl font-bold text-on-surface">All Reports</h2>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs bg-primary/20 text-primary rounded-full">
              {filteredReports.length} result{filteredReports.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
            icon={Filter}
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          {hasActiveFilters && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              icon={X}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface-elevated rounded-lg p-4 border border-border">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[300px]">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-secondary pointer-events-none z-10" />
            <Input
              type="text"
              placeholder="Search reports by employee, goal, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-surface-elevated rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-on-surface">Advanced Filters</h3>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                icon={X}
              >
                Clear All
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1">
              <MultiSelect
                label="Filter by Employees"
                options={employeeOptions}
                selectedValues={selectedEmployeeIds}
                onChange={setSelectedEmployeeIds}
                placeholder="Select employees..."
                searchable
              />
            </div>
            <div className="lg:col-span-1">
              <MultiSelect
                label="Filter by Projects"
                options={projectOptions}
                selectedValues={selectedProjectIds}
                onChange={setSelectedProjectIds}
                placeholder="Select projects..."
                searchable
              />
            </div>
            <div className="lg:col-span-1">
              <MultiSelect
                label="Filter by Goals"
                options={goalOptions}
                selectedValues={selectedGoalIds}
                onChange={setSelectedGoalIds}
                placeholder="Select goals..."
                searchable
              />
            </div>
            <div className="lg:col-span-1">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface-secondary">Score Range</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scoreRange.min}
                    onChange={(e) => setScoreRange(prev => ({ ...prev, min: e.target.value }))}
                    placeholder="Min"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scoreRange.max}
                    onChange={(e) => setScoreRange(prev => ({ ...prev, max: e.target.value }))}
                    placeholder="Max"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-on-surface-secondary mb-2">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-on-surface-secondary mb-2">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}

      {filteredReports.length === 0 ? (
        <div className="bg-surface-elevated rounded-lg p-12 border border-border text-center">
          <FileText size={48} className="text-on-surface-tertiary mx-auto mb-4" />
          <p className="text-lg text-on-surface-secondary mb-2">
            {hasActiveFilters ? 'No reports match your filters' : 'No reports found'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-primary hover:text-primary-hover text-sm font-medium"
            >
              Clear filters to see all reports
            </button>
          )}
        </div>
      ) : (
        <div className="bg-surface-elevated rounded-lg p-6 border border-border">
          <Table
            headers={reportTableHeaders}
            rows={reportTableRows}
            sortable
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </div>
      )}

      <ReportPreviewModal
        report={selectedReport}
        goal={goals.find(g => g.id === selectedReport?.goalId)}
        employee={scopedEmployees.find(e => e.id === selectedReport?.employeeId)}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};

export default AllReportsPage;

