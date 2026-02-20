
import React, { useState, useMemo } from 'react';
import { Report, Goal, Employee, Project } from '../types';
import Modal from '../components/Modal';
import Table from '../components/Table';
import ReportDetailModal from '../components/ReportDetailModal';
import { Eye, FileText, Calendar, TrendingUp } from 'lucide-react';
import { formatReportDate } from '../utils/dateFormat';

type SortDirection = 'asc' | 'desc' | null;

interface ReportsPageProps {
  reports: Report[];
  goals: Goal[];
  employees: Employee[];
  projects: Project[];
  currentEmployeeId: string;
}


import { useLocation } from 'react-router-dom';

// ... (existing imports)

const ReportsPage: React.FC<ReportsPageProps> = ({ reports, goals, employees, projects, currentEmployeeId }) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const location = useLocation();

  const employeeReports = useMemo(() => {
    let filtered = reports.filter(r => r.employeeId === currentEmployeeId);

    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'date':
            comparison = new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
            break;
          case 'goal':
            const goalA = goals.find(g => g.id === a.goalId)?.name || '';
            const goalB = goals.find(g => g.id === b.goalId)?.name || '';
            comparison = goalA.localeCompare(goalB);
            break;
          default:
            return 0;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [reports, currentEmployeeId, sortColumn, sortDirection, goals]);

  // Deep linking: Check for 'id' parameter in URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reportId = params.get('id');

    if (reportId) {
      const report = reports.find(r => r.id === reportId);
      if (report && report.employeeId === currentEmployeeId) {
        setSelectedReport(report);
      }
    }
  }, [location.search, reports, currentEmployeeId]);

  const handleSort = (column: string, direction: SortDirection) => {
    setSortColumn(direction ? column : null);
    setSortDirection(direction);
  };

  const reportTableHeaders = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'goal', label: 'Goal', sortable: true },
    { key: 'analysis', label: 'AI Score', sortable: true },
    { key: 'managerScore', label: 'Manager Score', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false },
  ];
  const reportTableRows = employeeReports.map((report) => {
    const goal = goals.find(g => g.id === report.goalId);
    const previewText = report.reportText.replace(/<[^>]*>/g, '').substring(0, 100);
    return [
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-on-surface-secondary" />
        <span className="capitalize text-on-surface-secondary">{formatReportDate(report.submissionDate)}</span>
      </div>,
      <span className="capitalize text-on-surface-secondary">{goal?.name || 'Unknown Goal'}</span>,
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-on-surface-tertiary" />
        <span className="text-on-surface-secondary font-medium">
          {(report.evaluationScore ?? 0).toFixed(1)}
        </span>
      </div>,
      <span className={`font-semibold ${report.managerOverallScore != null ? 'text-primary' : 'text-on-surface-tertiary'}`}>
        {report.managerOverallScore != null ? report.managerOverallScore.toFixed(1) : '—'}
      </span>,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={28} className="text-on-surface-secondary" />
          <h2 className="text-xl font-bold text-on-surface">My Reports</h2>
        </div>
      </div>

      {employeeReports.length === 0 ? (
        <div className="bg-surface-elevated rounded-lg p-12  border border-border text-center">
          <FileText size={48} className="text-on-surface-tertiary mx-auto mb-4" />
          <p className="text-lg text-on-surface-secondary mb-2">No reports submitted yet</p>
          <p className="text-sm text-on-surface-tertiary">Submit your first report to see it here</p>
        </div>
      ) : (
        <div className="bg-surface-elevated rounded-lg p-6  border border-border">
          <Table
            headers={reportTableHeaders}
            rows={reportTableRows}
            sortable
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            onRowClick={(index) => setSelectedReport(employeeReports[index])}
          />
        </div>
      )}

      <ReportDetailModal
        report={selectedReport}
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        employees={employees}
        goals={goals}
        projects={projects}
        isManagerView={false}
      />
    </div>
  );
};

export default ReportsPage;

