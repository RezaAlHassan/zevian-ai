
import React, { useState, useMemo } from 'react';
import { Report, Goal, Employee } from '../types';
import Modal from '../components/Modal';
import Table from '../components/Table';
import { Eye, FileText, Calendar, TrendingUp } from 'lucide-react';
import { formatReportDate } from '../utils/dateFormat';

type SortDirection = 'asc' | 'desc' | null;

interface ReportsPageProps {
  reports: Report[];
  goals: Goal[];
  currentEmployeeId: string;
}

const ReportPreviewModal: React.FC<{
  report: Report | null;
  goal: Goal | undefined;
  onClose: () => void;
}> = ({ report, goal, onClose }) => {
  if (!report) return null;

  return (
    <Modal isOpen={!!report} onClose={onClose} title={`Report - ${formatReportDate(report.submissionDate)}`}>
      <div className="space-y-4">
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
          <h3 className="text-lg font-semibold text-on-surface mb-2">Criteria Analysis</h3>
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

        {/* Manager Evaluation & Feedback */}
        <div className="border-t border-border pt-6">
          <h3 className="text-lg font-semibold text-on-surface mb-4">Evaluation & Feedback</h3>
          <div className="space-y-4">
            <div className="bg-surface p-4 rounded-lg border border-border flex justify-between items-center">
              <span className="font-medium text-on-surface">Overall Score</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">
                  {(report.managerOverallScore != null ? report.managerOverallScore : (report.evaluationScore ?? 0)).toFixed(2)}
                </span>
                {report.managerOverallScore != null && (
                  <div className="text-xs text-on-surface-tertiary">Overridden by manager</div>
                )}
              </div>
            </div>

            {report.managerFeedback && (
              <div>
                <h4 className="text-sm font-semibold text-on-surface mb-2">Manager Feedback</h4>
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 text-on-surface text-sm">
                  {report.managerFeedback}
                </div>
              </div>
            )}
            {!report.managerFeedback && report.managerOverallScore == null && (
              <p className="text-xs text-on-surface-tertiary italic text-center">
                Waiting for manager review and feedback.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

import { useLocation } from 'react-router-dom';

// ... (existing imports)

const ReportsPage: React.FC<ReportsPageProps> = ({ reports, goals, currentEmployeeId }) => {
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
          />
        </div>
      )}

      <ReportPreviewModal
        report={selectedReport}
        goal={goals.find(g => g.id === selectedReport?.goalId)}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};

export default ReportsPage;

