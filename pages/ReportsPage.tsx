
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
          <h3 className="text-lg font-semibold text-on-surface mb-1">Criteria Analysis</h3>
          <div className="space-y-2">
            {report.evaluationCriteriaScores.map((score, index) => (
              <div key={index} className="bg-surface p-3 rounded-lg border border-border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-on-surface">{score.name}</span>
                  <span className="text-sm text-on-surface-secondary">Analyzed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const ReportsPage: React.FC<ReportsPageProps> = ({ reports, goals, currentEmployeeId }) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const handleSort = (column: string, direction: SortDirection) => {
    setSortColumn(direction ? column : null);
    setSortDirection(direction);
  };

  const reportTableHeaders = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'goal', label: 'Goal', sortable: true },
    { key: 'preview', label: 'Preview', sortable: false },
    { key: 'analysis', label: 'Analysis', sortable: false },
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
      <span className="capitalize text-on-surface-secondary">{previewText}...</span>,
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-on-surface-secondary" />
        <span className="capitalize text-on-surface-secondary">Available</span>
      </div>,
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

