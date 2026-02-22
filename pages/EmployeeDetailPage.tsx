
import React, { useState, useMemo, useEffect } from 'react';
import { Report, Goal, Employee, Project } from '../types';
import { summarizePerformance, analyzeSkillMetrics } from '../services/geminiService';
import { employeeService } from '../services/databaseService';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import ReportDetailModal from '../components/ReportDetailModal';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { ArrowLeft, Filter, Calendar, Eye, TrendingUp, Sparkles, User, Target, Clock, AlertCircle, Bot, FileText, Star, Activity, Trophy, Award, AlertTriangle, ArrowUpDown, List, TrendingDown, Sliders } from 'lucide-react';
import Table from '../components/Table';
import StatCard from '../components/StatCard';
import { formatReportDate, formatTableDate } from '../utils/dateFormat';
import { isEmployeeInManagerScope } from '../utils/employeeFilter';
import { isDirectManager } from '../utils/managerPermissions';
import { useOrganization } from '../hooks/useOrganization';
import MetricsSelectionModal from '../components/MetricsSelectionModal';
import { STANDARD_METRICS } from '../constants';

type SortDirection = 'asc' | 'desc' | null;


interface EmployeeDetailPageProps {
    employee: Employee;
    reports: Report[];
    goals: Goal[];
    projects: Project[];
    employees: Employee[];
    allReports: Report[]; // All reports for team/company averages
    updateReport: (report: Report) => Promise<void>;
    onBack: () => void;
    currentManagerId?: string;
    viewMode?: 'manager' | 'employee';
}



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
    const [isSkillListModalOpen, setIsSkillListModalOpen] = useState(false);
    const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
    const [skillAnalysisScores, setSkillAnalysisScores] = useState<{ [key: string]: number }>(employee.skillAnalysis || {});

    // Clear Zevian analysis when date range changes to ensure manual re-analysis for new period
    // Only clear if we actually have scores and they weren't just loaded from the employee record
    useEffect(() => {
        // If the current scores match the persisted ones, don't clear them immediately on date change
        // as people might want to see the latest fingerprint regardless of range.
        // But for consistency with the new "persistence" request, we allow them to stay.
    }, [startDate, endDate]);
    const [isAnalyzingSkills, setIsAnalyzingSkills] = useState(false);
    const [skillSortOrder, setSkillSortOrder] = useState<'high-to-low' | 'low-to-high'>('high-to-low');

    const { organization, updateOrganizationMetrics } = useOrganization(employee.organizationId);
    const selectedMetrics = useMemo(() => organization?.selectedMetrics || [], [organization]);

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

    const performSkillAnalysis = async (metricsToAnalyze: string[]) => {
        if (filteredReports.length === 0 || metricsToAnalyze.length === 0) return;

        setIsAnalyzingSkills(true);
        try {
            const metrics = metricsToAnalyze.map(id => {
                const def = STANDARD_METRICS.find(m => m.id === id);
                return { id, name: def?.friendlyName || def?.name || id };
            });

            // Get the Zevian context from the first project for now, or synthesize
            const primaryProjectId = goals.find(g => g.id === filteredReports[0].goalId)?.projectId;
            const primaryProject = projects.find(p => p.id === primaryProjectId);
            const knowledgeBase = primaryProject?.aiContext;

            const scores = await analyzeSkillMetrics(filteredReports, metrics, knowledgeBase);
            setSkillAnalysisScores(scores);

            // Persist the scores to the database
            await employeeService.update(employee.id, {
                skillAnalysis: scores
            });
        } catch (error) {
            console.error("Failed to perform skill analysis:", error);
        } finally {
            setIsAnalyzingSkills(false);
        }
    };

    // Skill analysis is now triggered manually via a button to reduce API calls
    // and ensure it only runs when the user explicitly requests it for the current date range.


    // Calculate consistency (coefficient of variation)


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
                report.criterionScores.forEach(score => {
                    const existing = criteriaMap.get(score.criterionName) || { count: 0, totalScore: 0 };
                    existing.count += 1;
                    existing.totalScore += score.score;
                    criteriaMap.set(score.criterionName, existing);
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
            .slice(0, 40); // Top 40 skills

        return skills;
    }, [filteredReports, goals, startDate, endDate]);

    const sortedSkills = useMemo(() => {
        const combined = [...keySkills];

        // Add organization-selected metrics if they aren't already clearly represented
        selectedMetrics.forEach(metricId => {
            const metricDef = STANDARD_METRICS.find(m => m.id === metricId);
            const metricName = metricDef?.friendlyName || metricDef?.name || metricId;

            // Look for existing entry by name or metric ID
            const existingIndex = combined.findIndex(s => s.name === metricName || s.name === metricDef?.name || s.name === metricId);

            if (existingIndex === -1) {
                // Get current score (Zevian analysis takes precedence)
                let score = skillAnalysisScores[metricId];
                let count = 0;

                // Count occurrences in reports regardless of AI score presence
                filteredReports.forEach(report => {
                    const scoreObj = report.criterionScores.find(s => s.criterionName === metricDef?.name || s.criterionName === metricId);
                    if (scoreObj) count++;
                });

                if (score === undefined) {
                    // Fallback to manual average if Zevian hasn't analyzed it yet
                    let total = 0;
                    filteredReports.forEach(report => {
                        const scoreObj = report.criterionScores.find(s => s.criterionName === metricDef?.name || s.criterionName === metricId);
                        if (scoreObj) total += scoreObj.score;
                    });
                    score = count > 0 ? total / count : 0;
                }

                combined.push({
                    name: metricName,
                    frequency: count,
                    averageScore: score
                });
            } else {
                // If Zevian has a score for an existing metric, update the ranking score with it
                if (skillAnalysisScores[metricId] !== undefined) {
                    combined[existingIndex].averageScore = skillAnalysisScores[metricId];
                }
            }
        });

        return combined.sort((a, b) => {
            if (skillSortOrder === 'high-to-low') {
                return b.averageScore - a.averageScore;
            } else {
                return a.averageScore - b.averageScore;
            }
        });
    }, [keySkills, selectedMetrics, skillAnalysisScores, filteredReports, skillSortOrder]);

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
        if (previousPeriodReports.length === 0) return [];

        const relevantGoalIds = new Set(previousPeriodReports.map(r => r.goalId));
        const relevantGoals = goals.filter(g => relevantGoalIds.has(g.id));

        const criteriaMap = new Map<string, { count: number; totalScore: number }>();
        previousPeriodReports.forEach(report => {
            const goal = relevantGoals.find(g => g.id === report.goalId);
            if (goal) {
                report.criterionScores.forEach(score => {
                    const existing = criteriaMap.get(score.criterionName) || { count: 0, totalScore: 0 };
                    existing.count += 1;
                    existing.totalScore += score.score;
                    criteriaMap.set(score.criterionName, existing);
                });
            }
        });

        return Array.from(criteriaMap.entries())
            .map(([name, data]) => ({
                name,
                frequency: data.count,
                averageScore: data.totalScore / data.count
            }));
    }, [previousPeriodReports, goals]);

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
                report.criterionScores.forEach(score => {
                    const existing = teamCriteriaMap.get(score.criterionName) || { count: 0, totalScore: 0 };
                    existing.count += 1;
                    existing.totalScore += score.score;
                    teamCriteriaMap.set(score.criterionName, existing);
                });
            }
        });

        return teamCriteriaMap;
    }, [filteredReports, allReports, goals, employee.id, startDate, endDate]);

    // Prepare radar chart data
    const radarChartData = useMemo(() => {
        // Show empty state if Zevian analysis hasn't been triggered yet
        if (Object.keys(skillAnalysisScores).length === 0) return [];

        // If we have organization-selected metrics, use those
        if (selectedMetrics.length > 0) {
            return selectedMetrics.map(metricId => {
                const metricDef = STANDARD_METRICS.find(m => m.id === metricId);
                const metricName = metricDef?.friendlyName || metricDef?.name || metricId;

                // Use AI-analyzed score if available
                let score = skillAnalysisScores[metricId];

                // Robust matching fallback (if key in scores is name vs ID)
                if (score === undefined) {
                    const normalizedTargetId = metricId.toLowerCase().trim();
                    const normalizedTargetName = (metricDef?.name || '').toLowerCase().trim();
                    const normalizedTargetFriendly = (metricDef?.friendlyName || '').toLowerCase().trim();

                    const foundKey = Object.keys(skillAnalysisScores).find(key => {
                        const nk = key.toLowerCase().trim();
                        return nk === normalizedTargetId || nk === normalizedTargetName || nk === normalizedTargetFriendly;
                    });

                    if (foundKey) {
                        score = skillAnalysisScores[foundKey];
                    }
                }

                if (score === undefined) {
                    let total = 0;
                    let count = 0;
                    filteredReports.forEach(report => {
                        const scoreObj = report.criterionScores.find(s => s.criterionName === metricDef?.name || s.criterionName === metricId);
                        if (scoreObj) {
                            total += scoreObj.score;
                            count++;
                        }
                    });
                    score = count > 0 ? total / count : 0;
                }

                // Calculate team average
                let teamTotal = 0;
                let teamCount = 0;
                const teamData = teamAverages.get(metricDef?.name || metricId);
                if (teamData) {
                    teamTotal = teamData.totalScore;
                    teamCount = teamData.count;
                }

                return {
                    skill: metricName.length > 15 ? metricName.substring(0, 15) + '...' : metricName,
                    current: score,
                    team: teamCount > 0 ? teamTotal / teamCount : 0
                };
            });
        }

        // Fallback to top goal criteria (current behavior)
        const topSkills = keySkills.slice(0, 6);

        const data = topSkills.map(skill => {
            const teamData = teamAverages.get(skill.name);
            const teamAverage = teamData && teamData.count > 0 ? teamData.totalScore / teamData.count : 0;

            return {
                skill: skill.name.length > 15 ? skill.name.substring(0, 15) + '...' : skill.name,
                current: skill.averageScore,
                team: teamAverage
            };
        });

        return data;
    }, [selectedMetrics, filteredReports, teamAverages, keySkills, skillAnalysisScores]);

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

    // Calculate Submission Reliability
    const submissionReliability = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let expectedReports = 0;
        const frequencyMultipliers: { [key: string]: number } = {
            'daily': 1,
            'weekly': 1 / 7,
            'bi-weekly': 1 / 14,
            'monthly': 1 / 30
        };

        const projectStats = new Map<string, { expected: number; actual: number }>();

        projects.forEach(project => {
            // Filter goals to only those assigned to this specific employee
            const projectGoals = goals.filter(g => {
                if (g.projectId !== project.id) return false;

                // If goal has assignees, current employee must be one of them
                if (g.assignees && g.assignees.length > 0) {
                    return g.assignees.some(a => a.id === employee.id);
                }

                // If goal is unassigned, employee must be assigned to the project to be responsible
                return project.assignees?.some(a => a.id === employee.id);
            });

            if (projectGoals.length === 0) return;

            const multiplier = frequencyMultipliers[project.reportFrequency] || 0;
            let expectedForProject = 0;

            const now = new Date();
            const calculationEnd = end > now ? now : end;

            projectGoals.forEach(goal => {
                const goalCreated = goal.createdAt ? new Date(goal.createdAt) : start;
                const effectiveStart = new Date(Math.max(start.getTime(), goalCreated.getTime()));

                if (effectiveStart < calculationEnd) {
                    const goalDays = Math.ceil((calculationEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
                    expectedForProject += Math.ceil(goalDays * multiplier);
                }
            });

            const actualForProject = filteredReports.filter(r => {
                const goalIds = projectGoals.map(g => g.id);
                return goalIds.includes(r.goalId);
            }).length;

            projectStats.set(project.id, {
                expected: expectedForProject,
                actual: actualForProject
            });
        });

        let totalExpected = 0;
        let totalActual = 0;
        projectStats.forEach(({ expected, actual }) => {
            totalExpected += expected;
            totalActual += actual;
        });

        if (totalExpected === 0) return null;
        const reliabilityRate = Math.min(100, Math.max(0, (totalActual / totalExpected) * 100));

        return {
            rate: reliabilityRate,
            expected: totalExpected,
            actual: totalActual
        };
    }, [filteredReports, projects, goals, startDate, endDate]);

    const orgMetricsAverage = useMemo(() => {
        if (selectedMetrics.length === 0 || !radarChartData.length) return 0;
        const total = radarChartData.reduce((sum, d) => sum + d.current, 0);
        return total / radarChartData.length;
    }, [radarChartData, selectedMetrics]);

    const analytics = useMemo(() => {
        const reportAverage = filteredReports.length > 0
            ? filteredReports.reduce((sum, r) => sum + r.evaluationScore, 0) / filteredReports.length
            : 0;

        return { overallScore: reportAverage };
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
        { key: 'score', label: 'Zevian Score', sortable: true },
        { key: 'managerScore', label: 'Manager Score', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];
    const reportTableRows = filteredReports.map(report => {
        const goal = goals.find(g => g.id === report.goalId);
        return [
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-primary/70" />
                <span className="capitalize text-on-surface-secondary">{formatTableDate(report.submissionDate)}</span>
            </div>,
            <div className="max-w-[150px] lg:max-w-[250px] truncate capitalize text-on-surface-secondary" title={goal?.name}>
                {goal?.name || 'N/A'}
            </div>,
            <span className="capitalize text-on-surface-secondary">{(report.evaluationScore ?? 0).toFixed(1)}</span>,
            <div className="flex items-center">
                {report.managerOverallScore != null ? (
                    <span className="text-primary font-semibold">
                        {report.managerOverallScore.toFixed(1)}
                    </span>
                ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-hit/10 border border-hit/20 text-[#854d0e] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        <Clock size={10} className="text-[#854d0e]" />
                        Pending Review
                    </div>
                )}
            </div>,
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReport(report);
                }}
                className="p-1.5 text-on-surface-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 group"
                title="View Details"
            >
                <Eye size={18} strokeWidth={2} className="text-primary transition-all group-hover:scale-110" />
            </button>
        ];
    });

    return (
        <div className="w-full px-6 py-6 space-y-6">
            <div className="sticky top-0 z-20 bg-surface-elevated/90 backdrop-blur-md p-4 rounded-lg border border-border flex flex-col sm:flex-row gap-4 items-center -mx-4 mb-6">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-on-surface-secondary hover:text-primary group/back"
                    title="Back"
                >
                    <div className="p-1 rounded-full bg-surface group-hover/back:bg-primary/10 transition-colors">
                        <ArrowLeft size={16} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-medium pr-1">Back</span>
                </button>
                <div className="border-l border-border h-6 mx-1 hidden sm:block"></div>
                <h2 className="text-xl font-bold text-on-surface">Performance: {employee.name}</h2>
                <div className="flex-grow"></div>
                <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-1 rounded">Select duration:</span>
                </div>
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
                            <Sparkles size={18} className="text-primary" />
                            <h3 className="text-base font-semibold text-on-surface">Performance Summary</h3>
                        </div>
                        <p className="text-sm text-on-surface-secondary ml-7">
                            Create a Zevian-powered performance summary for the selected date range based on all reports and evaluation criteria.
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
                <StatCard title="Reports in Period" value={filteredReports.length} icon={<FileText size={24} className="text-primary" />} />

                <StatCard
                    title="Late Submissions"
                    value={submissionReliability ? Math.max(0, submissionReliability.expected - submissionReliability.actual) : 0}
                    icon={<Clock size={24} className="text-primary" />}
                    showActionBadge={submissionReliability ? (submissionReliability.expected - submissionReliability.actual) > 0 : false}
                />

                <StatCard
                    title="Avg Score (Org Metrics)"
                    value={orgMetricsAverage > 0 ? orgMetricsAverage.toFixed(2) : "0.00"}
                    icon={<Target size={24} className="text-primary" />}
                />

                <StatCard title="Average Score" value={analytics.overallScore.toFixed(2)} icon={<Star size={24} className="text-primary" />} />
            </div>

            {/* Skill Analysis and Score Trend Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="bg-surface-elevated rounded-xl border border-border overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-border bg-surface/30">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-on-surface">Skill Analysis</h3>
                                <p className="text-sm text-on-surface-secondary mt-1">Holistic proficiency across projects</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {viewMode === 'manager' && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setIsMetricsModalOpen(true)}
                                        className="flex items-center gap-2"
                                        icon={Sliders}
                                    >
                                        Customize Metrics
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 text-on-surface">
                                <List size={18} className="text-primary" />
                                <span className="font-semibold">Skill Rankings</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsSkillListModalOpen(true)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1.5 rounded-lg transition-colors border border-primary/20"
                                >
                                    <List size={14} />
                                    Skill List
                                </button>
                            </div>
                        </div>

                        {radarChartData.length > 0 ? (
                            <>
                                <div className="relative flex-1">
                                    {isAnalyzingSkills && (
                                        <div className="absolute inset-0 bg-surface/50 backdrop-blur-md z-10 flex flex-col items-center justify-center rounded-2xl border border-border/50">
                                            <div className="bg-surface-elevated p-6 rounded-2xl border border-border flex flex-col items-center">
                                                <Spinner size="lg" />
                                                <p className="mt-4 text-sm font-bold text-primary animate-pulse tracking-wide uppercase">Synthesizing Zevian Insights...</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="bg-goten rounded-moon-s-md p-6 border border-beerus h-full min-h-[400px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={radarChartData} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                                <PolarGrid stroke="var(--beerus)" strokeDasharray="3 3" />
                                                <PolarAngleAxis
                                                    dataKey="skill"
                                                    tick={({ x, y, payload }) => (
                                                        <g transform={`translate(${x},${y})`}>
                                                            <text
                                                                x={0}
                                                                y={0}
                                                                dy={4}
                                                                textAnchor="middle"
                                                                fill="var(--trunks)"
                                                                fontSize={10}
                                                                fontWeight={600}
                                                            >
                                                                {payload.value}
                                                            </text>
                                                        </g>
                                                    )}
                                                />
                                                <PolarRadiusAxis
                                                    angle={90}
                                                    domain={[0, 10]}
                                                    tick={{ fill: 'var(--trunks)', fontSize: 9 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Radar
                                                    name="Current Proficiency"
                                                    dataKey="current"
                                                    stroke="#5C62F5"
                                                    fill="#5C62F5"
                                                    fillOpacity={0.15}
                                                    strokeWidth={2}
                                                    animationDuration={1500}
                                                />
                                                <Tooltip
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            return (
                                                                <div className="bg-goten border border-beerus p-3 rounded-moon-s-md">
                                                                    <p className="text-moon-12 font-bold text-bulma mb-2">{payload[0].payload.skill}</p>
                                                                    <div className="space-y-1.5">
                                                                        {payload.map((entry: any) => (
                                                                            <div key={entry.name} className="flex items-center justify-between gap-4">
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                                    <span className="text-moon-10 text-trunks">{entry.name}</span>
                                                                                </div>
                                                                                <span className="text-moon-10 font-bold text-bulma">{(Number(entry.value) || 0).toFixed(1)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-surface/20 rounded-xl border border-dashed border-border">
                                <Star size={32} className="text-on-surface-tertiary mb-3 opacity-20" />
                                <p className="text-sm text-on-surface-secondary">No skill data available yet</p>
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => performSkillAnalysis(organization?.selectedMetrics || [])}
                                    disabled={isAnalyzingSkills || filteredReports.length === 0 || !organization?.selectedMetrics?.length}
                                    className="mt-6 flex items-center gap-2 mx-auto"
                                    icon={Sparkles}
                                >
                                    {isAnalyzingSkills ? 'Generating...' : 'Generate Zevian Fingerprint'}
                                </Button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Score Trend Line Chart */}
                <div className="bg-surface-elevated p-6 rounded-xl border border-border flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-on-surface">Score Trend</h3>
                            <p className="text-sm text-on-surface-secondary mt-1">Performance trajectory over time</p>
                        </div>
                    </div>
                    {filteredReports.length > 1 ? (
                        <div className="flex-1 min-h-[400px] mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={filteredReports
                                        .sort((a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime())
                                        .map(r => ({
                                            date: formatReportDate(r.submissionDate),
                                            score: r.evaluationScore
                                        }))}
                                    margin={{ top: 10, right: 20, left: 20, bottom: 30 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--beerus)" vertical={false} strokeOpacity={0.4} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fill: 'var(--trunks)', fontSize: 10 }}
                                        axisLine={{ stroke: 'var(--beerus)' }}
                                        tickLine={false}
                                        label={{ value: 'Date', position: 'bottom', offset: 0, fill: 'var(--trunks)', fontSize: 10, fontWeight: 600 }}
                                    />
                                    <YAxis
                                        domain={[0, 10]}
                                        tick={{ fill: 'var(--trunks)', fontSize: 10 }}
                                        axisLine={{ stroke: 'var(--beerus)' }}
                                        tickLine={false}
                                        label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: -10, fill: 'var(--trunks)', fontSize: 10, fontWeight: 600 }}
                                    />
                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', color: '#111827', borderRadius: '0.5rem' }} />
                                    <Line type="monotone" dataKey="score" stroke="#5C62F5" strokeWidth={3} dot={{ fill: '#5C62F5', r: 4, strokeWidth: 2, stroke: '#fff' }} name="Score" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-surface/20 rounded-xl border border-dashed border-border mt-6">
                            <TrendingUp size={32} className="text-on-surface-tertiary mb-3 opacity-20" />
                            <p className="text-sm text-on-surface-secondary">Multiple reports needed to show trend line</p>
                        </div>
                    )}
                </div>
            </div >

            {/* Report History */}
            < div className="bg-surface-elevated p-6 rounded-xl border border-border" >
                <div className="flex items-center gap-2 mb-6">
                    <Clock size={24} className="text-on-surface-secondary" />
                    <h3 className="text-xl font-bold text-on-surface">Report History ({filteredReports.length})</h3>
                </div>
                {
                    filteredReports.length > 0 ? (
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                            <Table
                                headers={reportTableHeaders}
                                rows={reportTableRows}
                                sortable
                                sortColumn={sortColumn}
                                sortDirection={sortDirection}
                                onSort={handleSort}
                                onRowClick={(index) => setSelectedReport(filteredReports[index])}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-surface/20 rounded-xl border border-dashed border-border">
                            <FileText size={32} className="text-on-surface-tertiary mb-3 opacity-20" />
                            <p className="text-on-surface-secondary">No reports in selected date range.</p>
                        </div>
                    )
                }
            </div >

            <ReportDetailModal
                report={selectedReport}
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
            // ... props
            />

            {/* Skill List Modal */}
            <Modal
                isOpen={isSkillListModalOpen}
                onClose={() => setIsSkillListModalOpen(false)}
                title="Measured Skills Proficiency"
            >
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-on-surface-secondary">Detailed breakdown of skills measured by Zevian AI based on all project reports.</p>
                        <span className="text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">{sortedSkills.length} Skills</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {sortedSkills.map((skill, index) => (
                            <div key={index} className="bg-surface-elevated p-4 rounded-xl border border-border flex flex-col gap-3 hover:border-primary/30 transition-all duration-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-on-surface line-clamp-1">{skill.name}</span>
                                    <span className="text-sm font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary">
                                        {skill.averageScore.toFixed(1)}
                                    </span>
                                </div>
                                <div className="w-full bg-surface rounded-full h-2 overflow-hidden border border-border/50">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(skill.averageScore / 10) * 100}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-medium text-on-surface-secondary">
                                    <span className="flex items-center gap-1">
                                        <Activity size={12} className="text-primary" />
                                        {skill.frequency} Mentions
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        {skill.averageScore >= 8 ? (
                                            <div className="flex items-center gap-1 text-green-500">
                                                <Trophy size={12} />
                                                <span className="uppercase tracking-wider font-bold text-[10px]">Expert</span>
                                            </div>
                                        ) : skill.averageScore >= 6 ? (
                                            <div className="flex items-center gap-1 text-primary">
                                                <Award size={12} />
                                                <span className="uppercase tracking-wider font-bold text-[10px]">Advanced</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <Activity size={12} />
                                                <span className="uppercase tracking-wider font-bold text-[10px]">Developing</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {viewMode === 'manager' && (
                        <div className="pt-4 border-t border-border flex justify-end gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsMetricsModalOpen(true)}
                                icon={Sliders}
                            >
                                Customize Metrics
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                    setIsSkillListModalOpen(false);
                                    performSkillAnalysis(selectedMetrics);
                                }}
                                icon={Sparkles}
                                disabled={isAnalyzingSkills || filteredReports.length === 0}
                            >
                                Re-analyze Skills
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>
            {/* Metrics Customization Modal */}
            {
                viewMode === 'manager' && (
                    <MetricsSelectionModal
                        isOpen={isMetricsModalOpen}
                        onClose={() => setIsMetricsModalOpen(false)}
                        selectedMetrics={selectedMetrics}
                        onSave={async (metrics) => {
                            try {
                                setSkillAnalysisScores({}); // Clear old scores to force re-analysis and reflect correctly in chart
                                await updateOrganizationMetrics(metrics);
                                await performSkillAnalysis(metrics);
                            } catch (err) {
                                alert('Failed to update metrics. Please try again.');
                            }
                        }}
                    />
                )
            }
        </div >
    );
};

export default EmployeeDetailPage;