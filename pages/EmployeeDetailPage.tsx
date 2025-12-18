
import React, { useState, useMemo, useEffect } from 'react';
import { Report, Goal, Employee, Project } from '../types';
import { summarizePerformance } from '../services/geminiService';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Bot, ArrowLeft, Eye, FileText, Star, Activity, Trophy, Award, Calendar, Sparkles, AlertTriangle } from 'lucide-react';
import Table from '../components/Table';
import StatCard from '../components/StatCard';
import { formatReportDate, formatTableDate } from '../utils/dateFormat';
import { isEmployeeInManagerScope } from '../utils/employeeFilter';
import { isDirectManager } from '../utils/managerPermissions';

type SortDirection = 'asc' | 'desc' | null;


interface EmployeeDetailPageProps {
    employee: Employee;
    reports: Report[];
    goals: Goal[];
    projects: Project[];
    employees: Employee[];
    allReports: Report[]; // All reports for team/company averages
    updateReport: (report: Report) => void;
    onBack: () => void;
    currentManagerId?: string;
    viewMode?: 'manager' | 'employee';
}

const ReportDetailModal: React.FC<{
    report: Report | null;
    goal: Goal | undefined;
    employee: Employee | undefined;
    employees: Employee[];
    onClose: () => void;
    onSave: (updatedReport: Report) => void;
    currentManagerId?: string;
    viewMode?: 'manager' | 'employee';
}> = ({ report, goal, employee, employees, onClose, onSave, currentManagerId, viewMode = 'manager' }) => {
    const [isEditingOverride, setIsEditingOverride] = useState(false);
    const [overrideScore, setOverrideScore] = useState<string>('');
    const [overrideReasoning, setOverrideReasoning] = useState<string>('');

    useEffect(() => {
        if (report) {
            setOverrideScore(report.managerOverallScore?.toString() || '');
            setOverrideReasoning(report.managerOverrideReasoning || '');
        }
    }, [report]);

    if (!report) return null;

    // Check if current manager can override (must be direct manager)
    const canOverride = useMemo(() => {
        if (viewMode === 'employee' || !currentManagerId || !employee) return false;
        return isDirectManager(employee, currentManagerId);
    }, [employee, currentManagerId, viewMode]);

    const handleSaveOverride = () => {
        if (!report || !overrideReasoning.trim()) return;

        const score = parseFloat(overrideScore);
        if (isNaN(score) || score < 0 || score > 10) {
            alert('Score must be between 0 and 10');
            return;
        }

        onSave({
            ...report,
            managerOverallScore: score,
            managerOverrideReasoning: overrideReasoning.trim(),
        });
        setIsEditingOverride(false);
    };

    const handleRemoveOverride = () => {
        if (!report) return;
        onSave({
            ...report,
            managerOverallScore: undefined,
            managerOverrideReasoning: undefined,
        });
        setIsEditingOverride(false);
        setOverrideScore('');
        setOverrideReasoning('');
    };

    return (
        <Modal isOpen={!!report} onClose={onClose} title={`Report - ${formatReportDate(report.submissionDate)}`}>
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-on-surface mb-1">Goal</h3>
                    <p className="text-on-surface-secondary">{goal?.name || 'N/A'}</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-on-surface mb-1">Report Text</h3>
                    <p className="bg-surface p-3 rounded-lg text-on-surface-secondary whitespace-pre-wrap border border-border">{report.reportText}</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-on-surface mb-1">Evaluation Reasoning</h3>
                    <p className="bg-surface p-3 rounded-lg text-on-surface-secondary italic border border-border">"{report.evaluationReasoning}"</p>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-on-surface mb-1">Evaluation Score Breakdown</h3>
                    <ul className="space-y-1">
                        {report.evaluationCriteriaScores.map(score => (
                            <li key={score.name} className="flex justify-between text-on-surface-secondary">
                                <span>{score.name}</span>
                                <span className="font-bold text-on-surface">{score.score.toFixed(1)} / 10</span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-border text-on-surface">
                        <span>AI Evaluation Score:</span>
                        <span>{report.evaluationScore.toFixed(2)} / 10</span>
                    </div>
                </div>

                {/* Manager Override Section */}
                {canOverride && (
                    <div className="border-t border-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-on-surface">Manager Override</h3>
                            {!isEditingOverride && (
                                <Button
                                    onClick={() => setIsEditingOverride(true)}
                                    variant="outline"
                                    size="sm"
                                >
                                    {report.managerOverallScore ? 'Edit Override' : 'Add Override'}
                                </Button>
                            )}
                        </div>

                        {isEditingOverride ? (
                            <div className="space-y-3 bg-surface p-4 rounded-lg border border-border">
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">
                                        Override Score (0-10) *
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="10"
                                        step="0.1"
                                        value={overrideScore}
                                        onChange={(e) => setOverrideScore(e.target.value)}
                                        placeholder="Enter score"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-on-surface mb-2">
                                        Justification * <span className="text-error">(Required)</span>
                                    </label>
                                    <Textarea
                                        value={overrideReasoning}
                                        onChange={(e) => setOverrideReasoning(e.target.value)}
                                        placeholder="Explain why you are overriding the AI score..."
                                        rows={3}
                                        required
                                    />
                                    <p className="text-xs text-on-surface-secondary mt-1">
                                        This justification is required and will be logged with the override.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSaveOverride}
                                        variant="primary"
                                        disabled={!overrideReasoning.trim() || !overrideScore}
                                    >
                                        Save Override
                                    </Button>
                                    {report.managerOverallScore && (
                                        <Button
                                            onClick={handleRemoveOverride}
                                            variant="danger"
                                        >
                                            Remove Override
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => {
                                            setIsEditingOverride(false);
                                            setOverrideScore(report.managerOverallScore?.toString() || '');
                                            setOverrideReasoning(report.managerOverrideReasoning || '');
                                        }}
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : report.managerOverallScore ? (
                            <div className="bg-surface p-4 rounded-lg border border-border">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-on-surface">Manager Override Score:</span>
                                    <span className="text-xl font-bold text-primary">{report.managerOverallScore.toFixed(2)} / 10</span>
                                </div>
                                {report.managerOverrideReasoning && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-on-surface-secondary mb-1">Justification:</p>
                                        <p className="text-sm text-on-surface-secondary italic">{report.managerOverrideReasoning}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-on-surface-secondary italic">No manager override applied.</p>
                        )}
                    </div>
                )}

                {!canOverride && viewMode === 'manager' && (
                    <div className="border-t border-border pt-4">
                        <p className="text-sm text-on-surface-secondary italic">
                            Only the direct manager of this employee can override the AI score.
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};


const EmployeeDetailPage: React.FC<EmployeeDetailPageProps> = ({
    employee,
    reports,
    goals,
    projects,
    employees,
    allReports,
    updateReport,
    onBack,
    currentManagerId,
    viewMode = 'manager'
}) => {
    // Check if employee is in manager's scope
    const canView = useMemo(() => {
        if (viewMode === 'employee') return true; // Employees can always view their own data
        if (!currentManagerId) return true; // No manager restriction
        return isEmployeeInManagerScope(employee, employees, currentManagerId);
    }, [employee, employees, currentManagerId, viewMode]);

    // If manager cannot view this employee, show access denied
    if (viewMode === 'manager' && currentManagerId && !canView) {
        return (
            <div className="w-full px-6 py-6">
                <Button onClick={onBack} variant="outline" icon={ArrowLeft} className="mb-4">
                    Back to Employees
                </Button>
                <div className="bg-surface-elevated rounded-lg p-6 border border-border text-center">
                    <AlertTriangle size={48} className="text-warning mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-on-surface mb-2">Access Restricted</h2>
                    <p className="text-on-surface-secondary">
                        You can only view employees in your team scope (direct reports and skip-level reports).
                    </p>
                </div>
            </div>
        );
    }
    const today = new Date();

    // Calculate earliest report date for default "all time" range
    const earliestReportDate = useMemo(() => {
        if (reports.length === 0) return today;
        const dates = reports.map(r => new Date(r.submissionDate));
        return new Date(Math.min(...dates.map(d => d.getTime())));
    }, [reports]);

    // Use local date strings to initialize state, ensuring "today" covers the full local day
    // toISOString() uses UTC, which might set the date to yesterday in positive timezones
    const toLocalDateString = (date: Date): string => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [startDate, setStartDate] = useState(toLocalDateString(earliestReportDate));
    const [endDate, setEndDate] = useState(toLocalDateString(today));
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [sortColumn, setSortColumn] = useState<string | null>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [showPreviousPeriod, setShowPreviousPeriod] = useState(false);

    const filteredReports = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        let filtered = reports.filter(r => {
            const reportDate = new Date(r.submissionDate);
            return reportDate >= start && reportDate <= end;
        });

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
    }, [reports, startDate, endDate, sortColumn, sortDirection, goals]);

    const handleSort = (column: string, direction: SortDirection) => {
        setSortColumn(direction ? column : null);
        setSortDirection(direction);
    };


    // Calculate consistency (coefficient of variation)
    const consistency = useMemo(() => {
        if (filteredReports.length < 2) return null;

        const scores = filteredReports.map(r => r.evaluationScore);
        const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

        // Convert to consistency percentage (lower CV = higher consistency)
        const consistencyPercent = Math.max(0, Math.min(100, 100 - coefficientOfVariation * 10));

        return {
            value: consistencyPercent,
            stdDev: stdDev,
            cv: coefficientOfVariation
        };
    }, [filteredReports]);

    // Calculate key skills from goal criteria in projects during selected period
    const keySkills = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Get all goals from projects that have reports in the selected period
        const relevantGoalIds = new Set(filteredReports.map(r => r.goalId));
        const relevantGoals = goals.filter(g => relevantGoalIds.has(g.id));

        // Get all unique criteria from these goals
        const criteriaMap = new Map<string, { count: number; totalScore: number }>();
        filteredReports.forEach(report => {
            const goal = relevantGoals.find(g => g.id === report.goalId);
            if (goal) {
                report.evaluationCriteriaScores.forEach(score => {
                    const existing = criteriaMap.get(score.name) || { count: 0, totalScore: 0 };
                    existing.count += 1;
                    existing.totalScore += score.score;
                    criteriaMap.set(score.name, existing);
                });
            }
        });

        // Convert to array and sort by frequency and average score
        const skills = Array.from(criteriaMap.entries())
            .map(([name, data]) => ({
                name,
                frequency: data.count,
                averageScore: data.totalScore / data.count
            }))
            .sort((a, b) => {
                // Sort by frequency first, then by average score
                if (b.frequency !== a.frequency) {
                    return b.frequency - a.frequency;
                }
                return b.averageScore - a.averageScore;
            })
            .slice(0, 8); // Top 8 key skills

        // Add dummy data to demonstrate low-scoring skills highlighting
        // Only add if we have fewer than 8 skills or want to show examples
        const dummySkills = [
            { name: 'Time Management', frequency: 5, averageScore: 4.2 },
            { name: 'Communication', frequency: 3, averageScore: 5.8 },
            { name: 'Code Quality', frequency: 8, averageScore: 7.5 },
            { name: 'Documentation', frequency: 2, averageScore: 3.9 },
            { name: 'Problem Solving', frequency: 6, averageScore: 8.1 },
        ];

        // Merge real skills with dummy skills, avoiding duplicates
        const allSkills = [...skills];
        dummySkills.forEach(dummy => {
            if (!allSkills.find(s => s.name === dummy.name)) {
                allSkills.push(dummy);
            }
        });

        // Sort again and return top 8
        return allSkills
            .sort((a, b) => {
                if (b.frequency !== a.frequency) {
                    return b.frequency - a.frequency;
                }
                return b.averageScore - a.averageScore;
            })
            .slice(0, 8);
    }, [filteredReports, goals, startDate, endDate]);

    // Calculate previous period for comparison
    const previousPeriodReports = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const periodLength = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - periodLength);

        return reports.filter(r => {
            const reportDate = new Date(r.submissionDate);
            return reportDate >= prevStart && reportDate <= prevEnd;
        });
    }, [reports, startDate, endDate]);

    // Calculate key skills for previous period
    const previousPeriodKeySkills = useMemo(() => {
        if (!showPreviousPeriod || previousPeriodReports.length === 0) return [];

        const relevantGoalIds = new Set(previousPeriodReports.map(r => r.goalId));
        const relevantGoals = goals.filter(g => relevantGoalIds.has(g.id));

        const criteriaMap = new Map<string, { count: number; totalScore: number }>();
        previousPeriodReports.forEach(report => {
            const goal = relevantGoals.find(g => g.id === report.goalId);
            if (goal) {
                report.evaluationCriteriaScores.forEach(score => {
                    const existing = criteriaMap.get(score.name) || { count: 0, totalScore: 0 };
                    existing.count += 1;
                    existing.totalScore += score.score;
                    criteriaMap.set(score.name, existing);
                });
            }
        });

        return Array.from(criteriaMap.entries())
            .map(([name, data]) => ({
                name,
                frequency: data.count,
                averageScore: data.totalScore / data.count
            }));
    }, [previousPeriodReports, goals, showPreviousPeriod]);

    // Calculate team averages for comparison
    const teamAverages = useMemo(() => {
        // Get goals/projects this employee is working on
        const employeeGoalIds = new Set(filteredReports.map(r => r.goalId));
        const employeeGoals = goals.filter(g => employeeGoalIds.has(g.id));
        const employeeProjectIds = new Set(employeeGoals.map(g => g.projectId));

        // Find team members: employees working on same goals or projects
        const teamMemberIds = new Set<string>();
        allReports.forEach(report => {
            if (report.employeeId === employee.id) return; // Exclude self

            const reportGoal = goals.find(g => g.id === report.goalId);
            if (reportGoal) {
                // Check if working on same goal or same project
                if (employeeGoalIds.has(report.goalId) || employeeProjectIds.has(reportGoal.projectId)) {
                    teamMemberIds.add(report.employeeId);
                }
            }
        });

        if (teamMemberIds.size === 0) return new Map<string, { count: number; totalScore: number }>();

        // Get team reports in the same date range
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const teamReports = allReports.filter(r => {
            const reportDate = new Date(r.submissionDate);
            return teamMemberIds.has(r.employeeId) &&
                reportDate >= start &&
                reportDate <= end &&
                employeeGoalIds.has(r.goalId); // Only reports for same goals
        });

        // Calculate team averages for each criterion
        const teamCriteriaMap = new Map<string, { count: number; totalScore: number }>();
        teamReports.forEach(report => {
            const goal = goals.find(g => g.id === report.goalId);
            if (goal) {
                report.evaluationCriteriaScores.forEach(score => {
                    const existing = teamCriteriaMap.get(score.name) || { count: 0, totalScore: 0 };
                    existing.count += 1;
                    existing.totalScore += score.score;
                    teamCriteriaMap.set(score.name, existing);
                });
            }
        });

        return teamCriteriaMap;
    }, [filteredReports, allReports, goals, employee.id, startDate, endDate]);

    // Prepare radar chart data
    const radarChartData = useMemo(() => {
        // Get top 6 skills for radar chart
        const topSkills = keySkills.slice(0, 6);

        const data = topSkills.map(skill => {
            const prevSkill = previousPeriodKeySkills.find(s => s.name === skill.name);
            const teamData = teamAverages.get(skill.name);
            const teamAverage = teamData && teamData.count > 0 ? teamData.totalScore / teamData.count : 0;

            return {
                skill: skill.name.length > 15 ? skill.name.substring(0, 15) + '...' : skill.name,
                current: skill.averageScore,
                previous: prevSkill ? prevSkill.averageScore : 0,
                team: teamAverage
            };
        });

        return data;
    }, [keySkills, previousPeriodKeySkills, teamAverages]);

    // Calculate avg rating on projects (using filtered reports)
    const avgRatingOnProjects = useMemo(() => {
        const projectScores: { [key: string]: number[] } = {};
        filteredReports.forEach(report => {
            const goal = goals.find(g => g.id === report.goalId);
            if (goal) {
                const projectId = goal.projectId;
                if (!projectScores[projectId]) {
                    projectScores[projectId] = [];
                }
                projectScores[projectId].push(report.evaluationScore);
            }
        });
        const allProjectScores: number[] = [];
        Object.values(projectScores).forEach(scores => {
            allProjectScores.push(...scores);
        });
        if (allProjectScores.length === 0) return 0;
        return allProjectScores.reduce((sum, score) => sum + score, 0) / allProjectScores.length;
    }, [filteredReports, goals]);

    // Calculate leaderboard position
    const leaderboardPosition = useMemo(() => {
        const employeeScores: { [key: string]: { total: number; count: number; average: number } } = {};
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        allReports.filter(r => {
            const reportDate = new Date(r.submissionDate);
            return reportDate >= start && reportDate <= end;
        }).forEach(report => {
            if (!employeeScores[report.employeeId]) {
                employeeScores[report.employeeId] = { total: 0, count: 0, average: 0 };
            }
            employeeScores[report.employeeId].total += report.evaluationScore;
            employeeScores[report.employeeId].count += 1;
            employeeScores[report.employeeId].average = employeeScores[report.employeeId].total / employeeScores[report.employeeId].count;
        });

        const sortedEmployees = Object.entries(employeeScores)
            .sort((a, b) => {
                if (b[1].average !== a[1].average) {
                    return b[1].average - a[1].average;
                }
                return b[1].count - a[1].count;
            });

        const position = sortedEmployees.findIndex(([id]) => id === employee.id);
        return position >= 0 ? position + 1 : null;
    }, [allReports, employee.id, startDate, endDate]);

    const analytics = useMemo(() => {
        if (filteredReports.length === 0) {
            return { overallScore: 0 };
        }

        const overallScore = filteredReports.reduce((sum, r) => sum + r.evaluationScore, 0) / filteredReports.length;

        return { overallScore };
    }, [filteredReports]);

    const handleGenerateSummary = async () => {
        if (filteredReports.length === 0) return;
        setIsSummaryLoading(true);
        setSummary('');
        try {
            const reasonings = filteredReports.map(r => r.evaluationReasoning);
            const newSummary = await summarizePerformance(reasonings, keySkills.map(s => ({ name: s.name, score: s.averageScore })));
            setSummary(newSummary);
        } catch (error) {
            console.error(error);
            setSummary('Failed to generate summary.');
        } finally {
            setIsSummaryLoading(false);
        }
    };

    const reportTableHeaders = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'goal', label: 'Goal', sortable: true },
        { key: 'score', label: 'Score', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];
    const reportTableRows = filteredReports.map(report => {
        const goal = goals.find(g => g.id === report.goalId);
        return [
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-on-surface-tertiary" />
                <span className="capitalize text-on-surface-secondary">{formatTableDate(report.submissionDate)}</span>
            </div>,
            <span className="capitalize text-on-surface-secondary truncate">{goal?.name || 'N/A'}</span>,
            <span className="capitalize text-on-surface-secondary">{report.evaluationScore.toFixed(2)}</span>,
            <button
                onClick={() => setSelectedReport(report)}
                className="text-primary hover:text-primary-hover hover:underline transition-colors flex items-center gap-1 text-sm font-normal"
            >
                <Eye size={16} strokeWidth={2} className="text-primary" />
                View Details
            </button>
        ];
    });

    return (
        <div className="w-full px-6 py-6 space-y-6">
            <div className="bg-surface-elevated p-4 rounded-lg  border border-border flex flex-col sm:flex-row gap-4 items-center">
                <button onClick={onBack} className="flex items-center gap-2 text-on-surface-secondary hover:text-on-surface transition-colors">
                    <ArrowLeft size={20} />
                    Back
                </button>
                <div className="border-l border-border h-8 mx-4 hidden sm:block"></div>
                <h2 className="text-xl font-bold text-on-surface">Performance: {employee.name}</h2>
                <div className="flex-grow"></div>
                <div className="flex items-center gap-2">
                    <label htmlFor="start-date" className="text-sm font-medium text-on-surface-secondary">From:</label>
                    <Input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="end-date" className="text-sm font-medium text-on-surface-secondary">To:</label>
                    <Input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
                </div>
            </div>

            {/* Summary Section */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={18} className="text-on-surface" />
                            <h3 className="text-base font-semibold text-on-surface">Performance Summary</h3>
                        </div>
                        <p className="text-sm text-on-surface-secondary ml-7">
                            Create an AI-powered performance summary for the selected date range based on all reports and evaluation criteria.
                        </p>
                    </div>
                    <Button
                        onClick={handleGenerateSummary}
                        disabled={isSummaryLoading || filteredReports.length === 0}
                        variant="primary"
                        size="md"
                        icon={isSummaryLoading ? undefined : Sparkles}
                    >
                        {isSummaryLoading ? (
                            <span className="flex items-center gap-2">
                                <Spinner />
                                Generating...
                            </span>
                        ) : (
                            'Generate Summary'
                        )}
                    </Button>
                </div>
                {summary && (
                    <div className="bg-surface p-4 rounded-lg text-sm text-on-surface-secondary border border-border mt-4">
                        {summary}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Reports in Period" value={filteredReports.length} icon={<FileText size={24} className="text-on-surface-secondary" />} />
                <StatCard title="Average Score" value={analytics.overallScore.toFixed(2)} icon={<Star size={24} className="text-on-surface-secondary" />} />
                <StatCard
                    title="Avg Rating on Projects"
                    value={avgRatingOnProjects.toFixed(2)}
                    icon={<Star size={24} className="text-on-surface-secondary" />}
                />
                <StatCard
                    title="Leaderboard Position"
                    value={leaderboardPosition ? `#${leaderboardPosition}` : 'N/A'}
                    icon={<Trophy size={24} className="text-on-surface-secondary" />}
                />
            </div>

            {/* Key Skills and Skill Spider Section */}
            {keySkills.length > 0 && (() => {
                const skillsNeedingCoaching = keySkills.filter(skill => skill.averageScore < 6.0);
                const regularSkills = keySkills.filter(skill => skill.averageScore >= 6.0);

                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Key Skills Section */}
                        <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                            {/* Skills Needing Coaching */}
                            {skillsNeedingCoaching.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertTriangle size={20} className="text-red-600" />
                                        <h3 className="text-lg font-semibold text-on-surface">Skills Needing Coaching</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {skillsNeedingCoaching.map((skill) => (
                                            <div
                                                key={skill.name}
                                                className="p-4 rounded-lg border bg-red-50/50 border-red-200"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-on-surface">{skill.name}</span>
                                                    <AlertTriangle size={16} className="text-red-600" />
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-on-surface-secondary">
                                                        {skill.frequency} report{skill.frequency !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="font-semibold text-red-600">
                                                        {skill.averageScore.toFixed(1)}/10
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Divider */}
                            {skillsNeedingCoaching.length > 0 && regularSkills.length > 0 && (
                                <div className="border-t border-border my-6"></div>
                            )}

                            {/* Regular Key Skills */}
                            {regularSkills.length > 0 && (
                                <>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Award size={20} className="text-on-surface-secondary" />
                                        <h3 className="text-lg font-semibold text-on-surface">Key Skills</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {regularSkills.map((skill) => (
                                            <div
                                                key={skill.name}
                                                className="p-4 rounded-lg border bg-surface border-border"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-on-surface">{skill.name}</span>
                                                    <Award size={16} className="text-on-surface-tertiary" />
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-on-surface-secondary">
                                                        {skill.frequency} report{skill.frequency !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className="font-semibold text-on-surface">
                                                        {skill.averageScore.toFixed(1)}/10
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Skill Spider Chart */}
                        {radarChartData.length > 0 && (
                            <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-on-surface">Skill Spider</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showPreviousPeriod}
                                            onChange={(e) => setShowPreviousPeriod(e.target.checked)}
                                            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2 rounded"
                                        />
                                        <span className="text-sm text-on-surface-secondary">Compare Previous Period</span>
                                    </label>
                                </div>
                                <ResponsiveContainer width="100%" height={400}>
                                    <RadarChart data={radarChartData}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis
                                            dataKey="skill"
                                            tick={{ fill: '#6b7280', fontSize: 11 }}
                                        />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 10]}
                                            tick={{ fill: '#6b7280', fontSize: 10 }}
                                        />
                                        <Radar
                                            name="Your Performance"
                                            dataKey="current"
                                            stroke="#2563eb"
                                            fill="#2563eb"
                                            fillOpacity={0.6}
                                            strokeWidth={2}
                                        />
                                        <Radar
                                            name="Team Average"
                                            dataKey="team"
                                            stroke="#f59e0b"
                                            fill="#f59e0b"
                                            fillOpacity={0.3}
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                        />
                                        {showPreviousPeriod && (
                                            <Radar
                                                name="Previous Period"
                                                dataKey="previous"
                                                stroke="#10b981"
                                                fill="#10b981"
                                                fillOpacity={0.4}
                                                strokeWidth={2}
                                                strokeDasharray="3 3"
                                            />
                                        )}
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#ffffff',
                                                border: '1px solid #e5e7eb',
                                                color: '#111827',
                                                borderRadius: '0.5rem',
                                                padding: '0.5rem'
                                            }}
                                        />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '10px' }}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                );
            })()}


            {/* Score Trend and Report History Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Trend Line Chart */}
                {filteredReports.length > 1 && (
                    <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                        <h3 className="text-lg font-semibold mb-4 text-on-surface">Score Trend</h3>
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={filteredReports
                                .sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime())
                                .map(r => ({
                                    date: formatReportDate(r.submissionDate),
                                    score: r.evaluationScore
                                }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{ fill: '#111827', fontSize: 12 }} />
                                <YAxis domain={[0, 10]} tick={{ fill: '#6b7280' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#111827', borderRadius: '0.5rem' }} />
                                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} name="Score" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Report History */}
                <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                    <h3 className="text-lg font-semibold mb-4 text-on-surface">Report History ({filteredReports.length})</h3>
                    {filteredReports.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto">
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
                        <p className="text-on-surface-secondary text-center py-4">No reports in selected date range.</p>
                    )}
                </div>
            </div>

            <ReportDetailModal
                report={selectedReport}
                goal={goals.find(g => g.id === selectedReport?.goalId)}
                employee={employee}
                employees={employees}
                onClose={() => setSelectedReport(null)}
                onSave={updateReport}
                currentManagerId={currentManagerId}
                viewMode={viewMode}
            />
        </div>
    );
};

export default EmployeeDetailPage;