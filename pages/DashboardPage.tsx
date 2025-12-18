import React, { useState, useMemo, useEffect } from 'react';
import { Report, Goal, Employee, Project } from '../types';
import { summarizePerformance } from '../services/geminiService';
import Spinner from '../components/Spinner';
import StatCard from '../components/StatCard';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Table from '../components/Table';
import { Sliders, Sparkles, FileText, Star, User, Users, Activity, Trophy, Award, FolderKanban, Target, Calendar, Clock, AlertTriangle, TrendingUp, BarChart3, Eye, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { formatReportDate, formatTableDate } from '../utils/dateFormat';
import { filterGoalsByManager } from '../utils/goalFilter';
import { getScopedEmployeeIds, getDirectReportIds } from '../utils/employeeFilter';
import { getReportingChainIds } from '../utils/scopeUtils';
import { canViewOrganizationWide } from '../utils/managerPermissions';
import Select from '../components/Select';

type SortDirection = 'asc' | 'desc' | null;

interface DashboardPageProps {
    reports: Report[];
    goals: Goal[];
    projects: Project[];
    employees: Employee[];
    updateReport: (report: Report) => void;
    currentEmployeeId?: string; // For employee view
    currentManagerId?: string; // For manager view
    isEmployeeView?: boolean;
    onNavigate?: (page: string) => void;
    onSelectEmployee?: (employeeId: string) => void;
    onSelectProject?: (projectId: string) => void;
    viewMode?: 'manager' | 'employee';
    scopeFilter?: 'direct-reports' | 'organization' | 'reporting-chain';
}



const DashboardPage: React.FC<DashboardPageProps> = ({ reports, goals, projects, employees, updateReport, currentEmployeeId, currentManagerId, isEmployeeView = false, onNavigate, onSelectEmployee, onSelectProject, viewMode = 'employee', scopeFilter = 'direct-reports' }) => {

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
        if (isEmployeeView || !currentManagerId) {
            return new Set(employees.map(emp => emp.id));
        }

        switch (scopeFilter) {
            case 'direct-reports':
                return getDirectReportIds(employees, currentManagerId);
            case 'reporting-chain':
                return getReportingChainIds(currentManagerId, employees);
            case 'organization':
                if (canViewOrgWide) {
                    return new Set(employees.map(emp => emp.id));
                }
                // Fallback to direct reports if no permission
                return getDirectReportIds(employees, currentManagerId);
            default:
                return getDirectReportIds(employees, currentManagerId);
        }
    }, [employees, currentManagerId, scopeFilter, canViewOrgWide, isEmployeeView]);

    // Filter goals by manager if in manager mode
    const filteredGoals = useMemo(() => {
        if (!isEmployeeView && currentManagerId) {
            return filterGoalsByManager(goals, projects, employees, currentManagerId);
        }
        return goals;
    }, [goals, projects, employees, currentManagerId, isEmployeeView]);

    // Filter reports to only include scoped employees based on selected scope
    const scopedReports = useMemo(() => {
        if (isEmployeeView) {
            return reports;
        }
        if (currentManagerId) {
            return reports.filter(report => scopedEmployeeIds.has(report.employeeId));
        }
        return reports;
    }, [reports, scopedEmployeeIds, currentManagerId, isEmployeeView]);

    // Calculate earliest report date for default "all time" range
    const earliestReportDate = useMemo(() => {
        if (scopedReports.length === 0) return new Date();
        const dates = scopedReports
            .map(r => new Date(r.submissionDate))
            .filter(d => !isNaN(d.getTime())); // Filter out invalid dates
        if (dates.length === 0) return new Date();
        return new Date(Math.min(...dates.map(d => d.getTime())));
    }, [scopedReports]);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Initialize date range when scopedReports changes (only once)
    useEffect(() => {
        if (startDate === '' && endDate === '') {
            if (scopedReports.length > 0) {
                const earliest = earliestReportDate.toISOString().split('T')[0];
                const latest = new Date().toISOString().split('T')[0];
                setStartDate(earliest);
                setEndDate(latest);
            } else {
                // If no reports, use today's date
                const todayStr = new Date().toISOString().split('T')[0];
                setStartDate(todayStr);
                setEndDate(todayStr);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scopedReports.length]);

    const [summary, setSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'redFlag' | 'recent' | 'topContributors'>('redFlag');
    const [chartTimePeriod, setChartTimePeriod] = useState<'weekly' | 'monthly'>('weekly');
    const [showRedFlagLine, setShowRedFlagLine] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [sortColumn, setSortColumn] = useState<string | null>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [showPreviousPeriod, setShowPreviousPeriod] = useState(false);

    const filteredReports = useMemo(() => {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return scopedReports.filter(r => {
            const reportDate = new Date(r.submissionDate);
            const inDateRange = reportDate >= start && reportDate <= end;
            // In employee view, only show their own reports
            if (isEmployeeView && currentEmployeeId) {
                return inDateRange && r.employeeId === currentEmployeeId;
            }
            return inDateRange;
        });
    }, [scopedReports, startDate, endDate, isEmployeeView, currentEmployeeId]);


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

    // Get ongoing projects and their goals
    const ongoingProjects = useMemo(() => {
        return projects.map(project => {
            const projectGoals = filteredGoals.filter(g => g.projectId === project.id);
            const projectReports = reports.filter(r => {
                const goalIds = projectGoals.map(g => g.id);
                return goalIds.includes(r.goalId);
            });

            return {
                ...project,
                goals: projectGoals,
                reportCount: projectReports.length,
                averageScore: projectReports.length > 0
                    ? projectReports.reduce((sum, r) => sum + r.evaluationScore, 0) / projectReports.length
                    : 0
            };
        });
    }, [projects, goals, reports]);

    const analytics = useMemo(() => {
        if (filteredReports.length === 0) {
            return { overallScore: 0 };
        }

        const overallScore = filteredReports.reduce((sum, r) => sum + r.evaluationScore, 0) / filteredReports.length;

        return { overallScore };
    }, [filteredReports]);

    // Calculate top contributors across all reports (for manager view)
    const topContributors = useMemo(() => {
        if (isEmployeeView) return [];

        const employeeContributions = new Map<string, { totalScore: number; reportCount: number; averageScore: number }>();

        filteredReports.forEach(report => {
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
                if (b.averageScore !== a.averageScore) {
                    return b.averageScore - a.averageScore;
                }
                return b.reportCount - a.reportCount;
            })
            .slice(0, 5);
    }, [filteredReports, employees, isEmployeeView]);

    // Get recent reports (last 10) for manager view
    const recentReports = useMemo(() => {
        if (isEmployeeView) return [];
        return filteredReports
            .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
            .slice(0, 10);
    }, [filteredReports, isEmployeeView]);

    // Calculate Submission Reliability Rate (The Accountability Meter)
    const submissionReliability = useMemo(() => {
        if (isEmployeeView) return null;

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Calculate expected reports based on project reportFrequency
        let expectedReports = 0;
        const frequencyMultipliers: { [key: string]: number } = {
            'daily': 1,
            'weekly': 1 / 7,
            'bi-weekly': 1 / 14,
            'monthly': 1 / 30
        };

        // Group reports by project and calculate expected vs actual
        const projectStats = new Map<string, { expected: number; actual: number }>();

        projects.forEach(project => {
            const projectGoals = filteredGoals.filter(g => g.projectId === project.id);
            if (projectGoals.length === 0) return;

            const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const multiplier = frequencyMultipliers[project.reportFrequency] || 0;
            const expectedForProject = Math.ceil(daysDiff * multiplier * projectGoals.length);

            const actualForProject = filteredReports.filter(r => {
                const goalIds = projectGoals.map(g => g.id);
                return goalIds.includes(r.goalId);
            }).length;

            projectStats.set(project.id, {
                expected: expectedForProject,
                actual: actualForProject
            });
        });

        // Calculate total expected and actual
        let totalExpected = 0;
        let totalActual = 0;
        projectStats.forEach(({ expected, actual }) => {
            totalExpected += expected;
            totalActual += actual;
        });

        // If no expected reports, return null
        if (totalExpected === 0) return null;

        const reliabilityRate = Math.min(100, Math.max(0, (totalActual / totalExpected) * 100));

        // Generate trend data (last 4 weeks for sparkline)
        const trendData: number[] = [];
        const weeksToShow = 4;
        for (let i = weeksToShow - 1; i >= 0; i--) {
            const weekEnd = new Date(end);
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);

            let weekExpected = 0;
            let weekActual = 0;

            projects.forEach(project => {
                const projectGoals = filteredGoals.filter(g => g.projectId === project.id);
                if (projectGoals.length === 0) return;

                const multiplier = frequencyMultipliers[project.reportFrequency] || 0;
                const weekExpectedForProject = Math.ceil(7 * multiplier * projectGoals.length);
                weekExpected += weekExpectedForProject;

                const weekActualForProject = filteredReports.filter(r => {
                    const goalIds = projectGoals.map(g => g.id);
                    const reportDate = new Date(r.submissionDate);
                    return goalIds.includes(r.goalId) &&
                        reportDate >= weekStart &&
                        reportDate <= weekEnd;
                }).length;
                weekActual += weekActualForProject;
            });

            const weekRate = weekExpected > 0 ? (weekActual / weekExpected) * 100 : 0;
            trendData.push(Math.min(100, Math.max(0, weekRate)));
        }

        return {
            rate: reliabilityRate,
            expected: totalExpected,
            actual: totalActual,
            trend: trendData
        };
    }, [filteredReports, projects, goals, startDate, endDate, isEmployeeView]);

    // Get Red Flag reports (scores < 6.0) for manager view
    const redFlagReports = useMemo(() => {
        if (isEmployeeView) return [];
        const threshold = 6.0;
        return filteredReports
            .filter(r => r.evaluationScore < threshold)
            .sort((a, b) => {
                // Sort by score (lowest first), then by date (most recent first)
                if (a.evaluationScore !== b.evaluationScore) {
                    return a.evaluationScore - b.evaluationScore;
                }
                return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
            })
            .slice(0, 10); // Limit to 10 most critical
    }, [filteredReports, isEmployeeView]);

    // Calculate chart data grouped by time period
    const chartData = useMemo(() => {
        if (filteredReports.length === 0) return [];

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const dataMap = new Map<string, { total: number; redFlag: number }>();
        const threshold = 6.0;

        // Initialize all periods in the range
        const periods: { key: string; label: string; start: Date; end: Date }[] = [];
        const current = new Date(start);

        if (chartTimePeriod === 'weekly') {
            // Start from the beginning of the first week
            const firstWeekStart = new Date(start);
            const dayOfWeek = firstWeekStart.getDay(); // 0 = Sunday, 6 = Saturday
            firstWeekStart.setDate(firstWeekStart.getDate() - dayOfWeek);
            firstWeekStart.setHours(0, 0, 0, 0);

            current.setTime(firstWeekStart.getTime());

            while (current <= end) {
                const weekStart = new Date(current);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);

                const weekKey = `${weekStart.toISOString().split('T')[0]}`;
                const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                periods.push({ key: weekKey, label: weekLabel, start: new Date(weekStart), end: new Date(weekEnd) });
                dataMap.set(weekKey, { total: 0, redFlag: 0 });

                current.setDate(current.getDate() + 7);
            }
        } else {
            // Monthly
            while (current <= end) {
                const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
                const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
                monthEnd.setHours(23, 59, 59, 999);

                const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
                const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                periods.push({ key: monthKey, label: monthLabel, start: new Date(monthStart), end: new Date(monthEnd) });
                dataMap.set(monthKey, { total: 0, redFlag: 0 });

                current.setMonth(current.getMonth() + 1);
            }
        }

        // Count reports per period
        filteredReports.forEach(report => {
            const reportDate = new Date(report.submissionDate);

            for (const period of periods) {
                if (reportDate >= period.start && reportDate <= period.end) {
                    const data = dataMap.get(period.key)!;
                    data.total++;
                    if (report.evaluationScore < threshold) {
                        data.redFlag++;
                    }
                    break;
                }
            }
        });

        // Convert to array format for chart
        return periods.map(period => {
            const data = dataMap.get(period.key)!;
            return {
                period: period.label,
                total: data.total,
                redFlag: data.redFlag
            };
        });
    }, [filteredReports, startDate, endDate, chartTimePeriod]);

    // Calculate Goal Alignment Matrix data (stacked by performance bands for scalability)
    const goalAlignmentData = useMemo(() => {
        if (filteredReports.length === 0 || isEmployeeView) return [];

        // Get all goals that have reports in the filtered date range
        const goalIds = new Set(filteredReports.map(r => r.goalId));
        const relevantGoals = filteredGoals.filter(g => goalIds.has(g.id));

        // For each goal, count reports by performance bands
        const goalData = relevantGoals.map(goal => {
            const goalReports = filteredReports.filter(r => r.goalId === goal.id);
            const project = projects.find(p => p.id === goal.projectId);

            // Categorize reports by performance bands
            let highPerformance = 0; // 8.0 - 10.0
            let mediumPerformance = 0; // 6.0 - 7.9
            let lowPerformance = 0; // < 6.0

            goalReports.forEach(report => {
                const score = report.evaluationScore;
                if (score >= 8.0) {
                    highPerformance++;
                } else if (score >= 6.0) {
                    mediumPerformance++;
                } else {
                    lowPerformance++;
                }
            });

            // Create data object with goal name (truncate for display)
            const dataPoint: any = {
                goal: goal.name.length > 20 ? goal.name.substring(0, 20) + '...' : goal.name,
                goalFull: goal.name,
                project: project?.name || 'Unknown',
                total: goalReports.length,
                'High (8.0+)': highPerformance,
                'Medium (6.0-7.9)': mediumPerformance,
                'Low (<6.0)': lowPerformance
            };

            return dataPoint;
        });

        // Sort by total reports (descending) and limit to top 15 goals for better visibility
        return goalData
            .sort((a, b) => b.total - a.total)
            .slice(0, 15);
    }, [filteredReports, goals, projects, isEmployeeView]);

    // Performance bands for the chart
    const performanceBands = [
        { key: 'High (8.0+)', name: 'High (8.0+)', color: '#10b981' },
        { key: 'Medium (6.0-7.9)', name: 'Medium (6.0-7.9)', color: '#f59e0b' },
        { key: 'Low (<6.0)', name: 'Low (<6.0)', color: '#ef4444' }
    ];

    // Employee View Calculations
    // Calculate key skills from goal criteria in projects during selected period
    const keySkills = useMemo(() => {
        if (!isEmployeeView) return [];

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Get all goals from projects that have reports in the selected period
        const relevantGoalIds = new Set(filteredReports.map(r => r.goalId));
        const relevantGoals = filteredGoals.filter(g => relevantGoalIds.has(g.id));

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
    }, [filteredReports, goals, startDate, endDate, isEmployeeView]);

    // Calculate previous period for comparison
    const previousPeriodReports = useMemo(() => {
        if (!isEmployeeView) return [];

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        const periodLength = end.getTime() - start.getTime();
        const prevEnd = new Date(start.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - periodLength);

        return reports.filter(r => {
            const reportDate = new Date(r.submissionDate);
            return reportDate >= prevStart && reportDate <= prevEnd &&
                (currentEmployeeId ? r.employeeId === currentEmployeeId : true);
        });
    }, [reports, startDate, endDate, isEmployeeView, currentEmployeeId]);

    // Calculate key skills for previous period
    const previousPeriodKeySkills = useMemo(() => {
        if (!isEmployeeView || !showPreviousPeriod || previousPeriodReports.length === 0) return [];

        const relevantGoalIds = new Set(previousPeriodReports.map(r => r.goalId));
        const relevantGoals = filteredGoals.filter(g => relevantGoalIds.has(g.id));

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
    }, [previousPeriodReports, goals, showPreviousPeriod, isEmployeeView]);

    // Prepare radar chart data
    const radarChartData = useMemo(() => {
        if (!isEmployeeView || keySkills.length === 0) return [];

        // Get top 6 skills for radar chart
        const topSkills = keySkills.slice(0, 6);

        const data = topSkills.map(skill => {
            const prevSkill = previousPeriodKeySkills.find(s => s.name === skill.name);
            return {
                skill: skill.name.length > 15 ? skill.name.substring(0, 15) + '...' : skill.name,
                current: skill.averageScore,
                previous: prevSkill ? prevSkill.averageScore : 0
            };
        });

        return data;
    }, [keySkills, previousPeriodKeySkills, isEmployeeView]);

    // Calculate avg rating on projects (using filtered reports)
    const avgRatingOnProjects = useMemo(() => {
        if (!isEmployeeView) return 0;

        const projectScores: { [key: string]: number[] } = {};
        filteredReports.forEach(report => {
            const goal = filteredGoals.find(g => g.id === report.goalId);
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
    }, [filteredReports, goals, isEmployeeView]);

    // Calculate leaderboard position
    const leaderboardPosition = useMemo(() => {
        if (!isEmployeeView || !currentEmployeeId) return null;

        const employeeScores: { [key: string]: { total: number; count: number; average: number } } = {};
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        reports.filter(r => {
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

        const position = sortedEmployees.findIndex(([id]) => id === currentEmployeeId);
        return position >= 0 ? position + 1 : null;
    }, [reports, currentEmployeeId, startDate, endDate, isEmployeeView]);

    const handleGenerateSummary = async () => {
        if (filteredReports.length === 0) return;
        setIsSummaryLoading(true);
        setSummary('');
        try {
            const reasonings = filteredReports.map(r => r.evaluationReasoning);
            let criteriaAverages;

            if (isEmployeeView && keySkills.length > 0) {
                // For employee view, use keySkills
                criteriaAverages = keySkills.map(s => ({ name: s.name, score: s.averageScore }));
            } else {
                // For manager view, get criteria from goals in filtered reports
                const relevantGoalIds = new Set(filteredReports.map(r => r.goalId));
                const relevantGoals = filteredGoals.filter(g => relevantGoalIds.has(g.id));
                const criteriaMap = new Map<string, number>();
                filteredReports.forEach(report => {
                    report.evaluationCriteriaScores.forEach(score => {
                        const existing = criteriaMap.get(score.name) || 0;
                        criteriaMap.set(score.name, existing + score.score);
                    });
                });
                criteriaAverages = Array.from(criteriaMap.entries()).map(([name, total]) => {
                    const count = filteredReports.filter(r =>
                        r.evaluationCriteriaScores.some(s => s.name === name)
                    ).length;
                    return { name, score: total / count };
                });
            }

            const newSummary = await summarizePerformance(reasonings, criteriaAverages);
            setSummary(newSummary);
        } catch (error) {
            console.error(error);
            setSummary('Failed to generate summary.');
        } finally {
            setIsSummaryLoading(false);
        }
    };

    // Handle table sorting
    const handleSort = (column: string, direction: SortDirection) => {
        setSortColumn(direction ? column : null);
        setSortDirection(direction);
    };

    // Get sorted reports for table
    const sortedReportsForTable = useMemo(() => {
        let sorted = [...filteredReports];

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
                        const goalA = filteredGoals.find(g => g.id === a.goalId)?.name || '';
                        const goalB = filteredGoals.find(g => g.id === b.goalId)?.name || '';
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
    }, [filteredReports, sortColumn, sortDirection, employees, goals]);

    // Reports table headers and rows
    const reportTableHeaders = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'employee', label: 'Employee', sortable: true },
        { key: 'goal', label: 'Goal', sortable: true },
        { key: 'score', label: 'Score', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    // Employee view table headers and rows
    const employeeReportTableHeaders = [
        { key: 'date', label: 'Date', sortable: true },
        { key: 'goal', label: 'Goal', sortable: true },
        { key: 'score', label: 'Score', sortable: true },
        { key: 'actions', label: 'Actions', sortable: false },
    ];

    const employeeReportTableRows = sortedReportsForTable.map(report => {
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

    const reportTableRows = sortedReportsForTable.map(report => {
        const goal = goals.find(g => g.id === report.goalId);
        const employee = employees.find(e => e.id === report.employeeId);

        return [
            <div className="flex items-center gap-2">
                <Calendar size={14} className="text-on-surface-tertiary" />
                <span className="capitalize text-on-surface-secondary">{formatTableDate(report.submissionDate)}</span>
            </div>,
            onSelectEmployee && employee ? (
                <button
                    onClick={() => onSelectEmployee(employee.id)}
                    className="text-primary hover:underline truncate text-left capitalize text-on-surface-secondary"
                >
                    {employee.name}
                </button>
            ) : (
                <span className="capitalize text-on-surface-secondary truncate">{employee?.name || 'Unknown'}</span>
            ),
            <span className="capitalize text-on-surface-secondary truncate">{goal?.name || 'N/A'}</span>,
            <span className="capitalize text-on-surface-secondary">{report.evaluationScore.toFixed(2)}</span>,
            <button
                onClick={() => setSelectedReport(report)}
                className="text-primary hover:text-primary-hover hover:underline transition-colors flex items-center gap-1 text-sm font-normal"
            >
                <Eye size={24} strokeWidth={1.5} className="text-primary" />
                View Details
            </button>
        ];
    });

    return (
        <div className="w-full px-6 py-6 space-y-6">
            {/* Header with Date Selection */}
            <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Sliders size={24} className="text-on-surface-secondary" />
                        <h2 className="text-xl font-bold text-on-surface">Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Calendar size={18} className="text-on-surface-secondary" />
                            <label htmlFor="start-date" className="text-sm font-medium text-on-surface-secondary">From</label>
                            <Input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="min-w-[150px]" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="end-date" className="text-sm font-medium text-on-surface-secondary">To</label>
                            <Input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="min-w-[150px]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Summary Banner (Manager View Only) */}
            {!isEmployeeView && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={18} className="text-on-surface" />
                                <h3 className="text-base font-semibold text-on-surface">AI Performance Summary</h3>
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
                </div>
            )}

            {/* Employee View Content - Performance Summary */}
            {isEmployeeView && (
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Reports" value={filteredReports.length} icon={<FileText size={24} className="text-on-surface-secondary" />} />
                <StatCard
                    title="Average Score"
                    value={analytics.overallScore.toFixed(2)}
                    icon={<Star size={24} className="text-on-surface-secondary" />}
                    showActionBadge={analytics.overallScore < 6.0}
                />
                {submissionReliability && !isEmployeeView && (
                    <StatCard
                        title="Report Reliability"
                        value={`${submissionReliability.rate.toFixed(0)}%`}
                        icon={<TrendingUp size={24} className="text-on-surface-secondary" />}
                        showActionBadge={submissionReliability.rate < 80}
                    />
                )}
                {consistency && (
                    <StatCard
                        title="Consistency"
                        value={`${consistency.value.toFixed(0)}%`}
                        icon={<Activity size={24} className="text-on-surface-secondary" />}
                    />
                )}
                {isEmployeeView ? (
                    <StatCard
                        title="Leaderboard Position"
                        value={leaderboardPosition ? `#${leaderboardPosition}` : 'N/A'}
                        icon={<Trophy size={24} className="text-on-surface-secondary" />}
                    />
                ) : (
                    <>
                        {/* Teams stat removed - teams data not available */}
                    </>
                )}
            </div>

            {/* Employee View Content */}
            {isEmployeeView && (
                <>
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
                                                    name="Current Period"
                                                    dataKey="current"
                                                    stroke="#2563eb"
                                                    fill="#2563eb"
                                                    fillOpacity={0.6}
                                                    strokeWidth={2}
                                                />
                                                {showPreviousPeriod && (
                                                    <Radar
                                                        name="Previous Period"
                                                        dataKey="previous"
                                                        stroke="#10b981"
                                                        fill="#10b981"
                                                        fillOpacity={0.4}
                                                        strokeWidth={2}
                                                        strokeDasharray="5 5"
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
                                        headers={employeeReportTableHeaders}
                                        rows={employeeReportTableRows}
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
                </>
            )}

            {/* Reports Over Time Chart and Reports & Contributors (Manager View Only) */}
            {!isEmployeeView && filteredReports.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Reports Over Time Chart */}
                    <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={24} className="text-on-surface-secondary" />
                                <h3 className="text-lg font-semibold text-on-surface">Reports Over Time</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-surface rounded-lg border border-border p-1">
                                    <button
                                        onClick={() => setChartTimePeriod('weekly')}
                                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${chartTimePeriod === 'weekly'
                                            ? 'bg-primary text-white'
                                            : 'text-on-surface-secondary hover:text-on-surface'
                                            }`}
                                    >
                                        Weekly
                                    </button>
                                    <button
                                        onClick={() => setChartTimePeriod('monthly')}
                                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${chartTimePeriod === 'monthly'
                                            ? 'bg-primary text-white'
                                            : 'text-on-surface-secondary hover:text-on-surface'
                                            }`}
                                    >
                                        Monthly
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Custom Legend */}
                        <div className="flex items-center justify-center gap-6 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-0.5 bg-primary"></div>
                                <span className="text-sm text-on-surface">Total Reports</span>
                            </div>
                            <button
                                onClick={() => setShowRedFlagLine(!showRedFlagLine)}
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <svg width="16" height="2" className={showRedFlagLine ? '' : 'opacity-50'}>
                                    <line
                                        x1="0"
                                        y1="1"
                                        x2="16"
                                        y2="1"
                                        stroke="#ef4444"
                                        strokeWidth="2"
                                        strokeDasharray="4 4"
                                    />
                                </svg>
                                <span
                                    className={`text-sm ${showRedFlagLine ? 'text-on-surface' : 'text-on-surface-secondary line-through'}`}
                                >
                                    Red Flag Reports
                                </span>
                            </button>
                        </div>

                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={450}>
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fill: '#6b7280', fontSize: 11 }}
                                        tickFormatter={(value) => {
                                            if (value.length > 15) {
                                                return value.substring(0, 15) + '...';
                                            }
                                            return value;
                                        }}
                                        interval={0}
                                        height={20}
                                    />
                                    <YAxis
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        label={{ value: 'Number of Reports', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            color: '#111827',
                                            borderRadius: '0.5rem',
                                            padding: '0.5rem'
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        dot={{ fill: '#2563eb', r: 4 }}
                                        name="Total Reports"
                                        activeDot={{ r: 6 }}
                                    />
                                    {showRedFlagLine && (
                                        <Line
                                            type="monotone"
                                            dataKey="redFlag"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            dot={{ fill: '#ef4444', r: 4 }}
                                            name="Red Flag Reports"
                                            strokeDasharray="5 5"
                                            activeDot={{ r: 6 }}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-8 text-on-surface-secondary">
                                <BarChart3 size={32} className="mx-auto mb-2 text-on-surface-tertiary" />
                                <p>No data available for the selected time period</p>
                            </div>
                        )}
                    </div>

                    {/* Combined Reports Section */}
                    {!isEmployeeView && (filteredReports.length > 0 || recentReports.length > 0 || redFlagReports.length > 0) && (
                        <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FileText size={24} className="text-on-surface-secondary" />
                                    <h3 className="text-lg font-semibold text-on-surface">Reports & Contributors</h3>
                                    {activeTab === 'redFlag' && redFlagReports.length > 0 && (
                                        <span className="px-2 py-1 text-xs bg-red-500/20 text-red-700 rounded-full font-semibold">
                                            {redFlagReports.length} red flag{redFlagReports.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                {onNavigate && (
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onNavigate('all-reports');
                                        }}
                                        className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                                    >
                                        View All Reports
                                        <ChevronRight size={16} />
                                    </a>
                                )}
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-4 border-b border-border">
                                <button
                                    onClick={() => setActiveTab('redFlag')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'redFlag'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-on-surface-secondary hover:text-on-surface'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={16} />
                                        Red Flag
                                        {redFlagReports.length > 0 && (
                                            <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-700 rounded-full">
                                                {redFlagReports.length}
                                            </span>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('recent')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'recent'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-on-surface-secondary hover:text-on-surface'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} />
                                        Recent
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('topContributors')}
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'topContributors'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-on-surface-secondary hover:text-on-surface'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Trophy size={16} />
                                        Top Contributors
                                    </div>
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="max-h-[500px] overflow-y-auto">
                                {/* Red Flag Tab */}
                                {activeTab === 'redFlag' && (
                                    <div>
                                        {redFlagReports.length > 0 ? (
                                            <div className="space-y-2">
                                                {redFlagReports.map((report) => {
                                                    const goal = filteredGoals.find(g => g.id === report.goalId);
                                                    const project = goal ? projects.find(p => p.id === goal.projectId) : null;
                                                    const employee = employees.find(e => e.id === report.employeeId);
                                                    const previewText = report.reportText.replace(/<[^>]*>/g, '').substring(0, 100);

                                                    return (
                                                        <div
                                                            key={report.id}
                                                            className="bg-surface p-3 rounded-lg border border-red-500/30 hover:border-red-500/50 transition-colors cursor-pointer"
                                                            onClick={() => setSelectedReport(report)}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                        {onSelectEmployee && employee ? (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onSelectEmployee(employee.id);
                                                                                }}
                                                                                className="font-semibold text-sm text-primary hover:underline truncate"
                                                                            >
                                                                                {employee.name}
                                                                            </button>
                                                                        ) : (
                                                                            <span className="font-semibold text-sm text-on-surface truncate">{employee?.name || 'Unknown'}</span>
                                                                        )}
                                                                        <span className="text-xs text-on-surface-secondary">•</span>
                                                                        <span className="text-xs text-on-surface-secondary truncate">{goal?.name || 'Unknown Goal'}</span>
                                                                        {project && (
                                                                            <>
                                                                                <span className="text-xs text-on-surface-secondary">•</span>
                                                                                {onSelectProject ? (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onSelectProject(project.id);
                                                                                        }}
                                                                                        className="text-xs text-primary hover:underline truncate"
                                                                                    >
                                                                                        {project.name}
                                                                                    </button>
                                                                                ) : (
                                                                                    <span className="text-xs text-on-surface-secondary truncate">{project.name}</span>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-on-surface-secondary line-clamp-1 mb-1">{previewText}...</p>
                                                                    <div className="text-xs text-on-surface-tertiary">
                                                                        {formatReportDate(report.submissionDate)}
                                                                    </div>
                                                                </div>
                                                                <div className="ml-3 text-right flex-shrink-0">
                                                                    <div className="text-sm font-bold text-red-600 mb-1">
                                                                        {report.evaluationScore.toFixed(1)}/10
                                                                    </div>
                                                                    <div className="text-xs text-red-600 font-medium">
                                                                        Critical
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-on-surface-secondary">
                                                <AlertTriangle size={32} className="mx-auto mb-2 text-on-surface-tertiary" />
                                                <p>No red flag reports found</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Recent Tab */}
                                {activeTab === 'recent' && (
                                    <div>
                                        {recentReports.length > 0 ? (
                                            <div className="space-y-2">
                                                {recentReports.map((report) => {
                                                    const goal = filteredGoals.find(g => g.id === report.goalId);
                                                    const project = goal ? projects.find(p => p.id === goal.projectId) : null;
                                                    const employee = employees.find(e => e.id === report.employeeId);
                                                    const previewText = report.reportText.replace(/<[^>]*>/g, '').substring(0, 100);

                                                    return (
                                                        <div
                                                            key={report.id}
                                                            className="bg-surface p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                                                            onClick={() => setSelectedReport(report)}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                        {onSelectEmployee && employee ? (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    onSelectEmployee(employee.id);
                                                                                }}
                                                                                className="font-medium text-sm text-primary hover:underline truncate"
                                                                            >
                                                                                {employee.name}
                                                                            </button>
                                                                        ) : (
                                                                            <span className="font-medium text-sm text-on-surface truncate">{employee?.name || 'Unknown'}</span>
                                                                        )}
                                                                        <span className="text-xs text-on-surface-secondary">•</span>
                                                                        <span className="text-xs text-on-surface-secondary truncate">{goal?.name || 'Unknown Goal'}</span>
                                                                        {project && (
                                                                            <>
                                                                                <span className="text-xs text-on-surface-secondary">•</span>
                                                                                {onSelectProject ? (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            onSelectProject(project.id);
                                                                                        }}
                                                                                        className="text-xs text-primary hover:underline truncate"
                                                                                    >
                                                                                        {project.name}
                                                                                    </button>
                                                                                ) : (
                                                                                    <span className="text-xs text-on-surface-secondary truncate">{project.name}</span>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-on-surface-secondary line-clamp-1 mb-1">{previewText}...</p>
                                                                    <div className="text-xs text-on-surface-tertiary">
                                                                        {formatReportDate(report.submissionDate)}
                                                                    </div>
                                                                </div>
                                                                <div className="ml-3 text-right flex-shrink-0">
                                                                    <div className="text-sm font-semibold text-on-surface">
                                                                        {report.evaluationScore.toFixed(1)}/10
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-on-surface-secondary">
                                                <Clock size={32} className="mx-auto mb-2 text-on-surface-tertiary" />
                                                <p>No recent reports found</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Top Contributors Tab */}
                                {activeTab === 'topContributors' && (
                                    <div>
                                        {topContributors.length > 0 ? (
                                            <div className="space-y-3">
                                                {topContributors.map((contributor, index) => (
                                                    <div
                                                        key={contributor.employeeId}
                                                        className={`p-4 rounded-lg border ${index === 0
                                                            ? 'bg-primary/10 border-primary/30'
                                                            : 'bg-surface border-border'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                {index === 0 && <Award size={18} className="text-primary" />}
                                                                <div>
                                                                    {onSelectEmployee && contributor.employee ? (
                                                                        <button
                                                                            onClick={() => onSelectEmployee(contributor.employeeId)}
                                                                            className={`font-semibold text-sm hover:underline ${index === 0 ? 'text-primary' : 'text-on-surface'
                                                                                }`}
                                                                        >
                                                                            {contributor.employee.name}
                                                                        </button>
                                                                    ) : (
                                                                        <span className={`font-semibold text-sm ${index === 0 ? 'text-primary' : 'text-on-surface'
                                                                            }`}>
                                                                            {contributor.employee?.name || 'Unknown'}
                                                                        </span>
                                                                    )}
                                                                    <div className="text-xs text-on-surface-secondary mt-0.5">
                                                                        {contributor.reportCount} report{contributor.reportCount !== 1 ? 's' : ''}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-lg font-bold ${index === 0 ? 'text-primary' : 'text-on-surface'
                                                                    }`}>
                                                                    {contributor.averageScore.toFixed(1)}/10
                                                                </div>
                                                                <div className="text-xs text-on-surface-secondary">
                                                                    Avg Score
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-on-surface-secondary pt-2 border-t border-border">
                                                            <span>Total Score: {contributor.totalScore.toFixed(1)}</span>
                                                            {index === 0 && (
                                                                <span className="text-primary font-medium">Top Performer</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-on-surface-secondary">
                                                <Trophy size={32} className="mx-auto mb-2 text-on-surface-tertiary" />
                                                <p>No contributors found in the selected date range</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Goal Alignment Matrix and Ongoing Projects (Manager View Only) */}
            {!isEmployeeView && (goalAlignmentData.length > 0 || ongoingProjects.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Goal Alignment Matrix */}
                    {goalAlignmentData.length > 0 && (
                        <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Target size={24} className="text-on-surface-secondary" />
                                    <h3 className="text-lg font-semibold text-on-surface">Goal Alignment Matrix</h3>
                                </div>
                                {onNavigate && (
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onNavigate('goals'); }}
                                        className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                                    >
                                        View All Goals
                                        <ChevronRight size={16} />
                                    </a>
                                )}
                            </div>
                            <p className="text-sm text-on-surface-secondary mb-4">
                                Shows how much work is actually linking to specific goals/OKRs. Stacked bars represent performance quality distribution (High: 8.0+, Medium: 6.0-7.9, Low: &lt;6.0).
                            </p>
                            <ResponsiveContainer width="100%" height={500}>
                                <BarChart
                                    data={goalAlignmentData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="goal"
                                        tick={{ fill: '#6b7280', fontSize: 10 }}
                                        tickFormatter={(value) => {
                                            if (value.length > 20) {
                                                return value.substring(0, 20) + '...';
                                            }
                                            return value;
                                        }}
                                        interval={0}
                                        height={30}
                                    />
                                    <YAxis
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        label={{ value: 'Number of Reports', angle: -90, position: 'insideLeft', style: { fill: '#6b7280' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e5e7eb',
                                            color: '#111827',
                                            borderRadius: '0.5rem',
                                            padding: '0.5rem'
                                        }}
                                        formatter={(value: number) => [value, 'Reports']}
                                        labelFormatter={(label) => {
                                            const dataPoint = goalAlignmentData.find(d => d.goal === label);
                                            return dataPoint ? `${dataPoint.goalFull} (${dataPoint.project})` : label;
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '10px' }}
                                    />
                                    {performanceBands.map((band) => (
                                        <Bar
                                            key={band.key}
                                            dataKey={band.key}
                                            stackId="a"
                                            fill={band.color}
                                            name={band.name}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Ongoing Projects Section */}
                    {ongoingProjects.length > 0 && (
                        <div className="bg-surface-elevated p-6 rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FolderKanban size={24} className="text-on-surface-secondary" />
                                    <h3 className="text-lg font-semibold text-on-surface">Ongoing Projects</h3>
                                </div>
                                {onNavigate && (
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); onNavigate('projects'); }}
                                        className="text-sm text-primary hover:text-primary-hover font-medium flex items-center gap-1"
                                    >
                                        View All Projects
                                        <ChevronRight size={16} />
                                    </a>
                                )}
                            </div>
                            <div className="space-y-4">
                                {ongoingProjects.map((project) => (
                                    <div
                                        key={project.id}
                                        className={`bg-surface p-4 rounded-lg border border-border ${onSelectProject ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
                                        onClick={onSelectProject ? () => onSelectProject(project.id) : undefined}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-on-surface mb-1">{project.name}</h4>
                                                {project.description && (
                                                    <p className="text-sm text-on-surface-secondary mb-2">{project.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-on-surface-secondary">
                                                    {project.category && (
                                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                                                            {project.category}
                                                        </span>
                                                    )}
                                                    <span>{project.reportFrequency} reports</span>
                                                    {project.reportCount > 0 && (
                                                        <span>Avg Score: {project.averageScore.toFixed(1)}/10</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {project.goals.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-border">
                                                <h5 className="text-sm font-medium text-on-surface mb-2 flex items-center gap-2">
                                                    <Target size={14} className="text-on-surface-secondary" />
                                                    Goals ({project.goals.length})
                                                </h5>
                                                <div className="space-y-2">
                                                    {project.goals.map((goal) => {
                                                        const goalReports = reports.filter(r => r.goalId === goal.id);
                                                        const goalAvgScore = goalReports.length > 0
                                                            ? goalReports.reduce((sum, r) => sum + r.evaluationScore, 0) / goalReports.length
                                                            : 0;
                                                        return (
                                                            <div key={goal.id} className="bg-surface-elevated p-3 rounded border border-border">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1">
                                                                        <span className="font-medium text-sm text-on-surface">{goal.name}</span>
                                                                        {goal.deadline && (
                                                                            <div className="flex items-center gap-1 mt-1 text-xs text-on-surface-secondary">
                                                                                <Calendar size={12} />
                                                                                <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                                                                            </div>
                                                                        )}
                                                                        {goal.criteria.length > 0 && (
                                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                                {goal.criteria.slice(0, 3).map((criterion) => (
                                                                                    <span key={criterion.id} className="text-xs px-2 py-0.5 bg-surface border border-border text-on-surface-secondary rounded">
                                                                                        {criterion.name}
                                                                                    </span>
                                                                                ))}
                                                                                {goal.criteria.length > 3 && (
                                                                                    <span className="text-xs text-on-surface-secondary">
                                                                                        +{goal.criteria.length - 3} more
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {goalReports.length > 0 && (
                                                                        <div className="ml-3 text-right">
                                                                            <div className="text-sm font-semibold text-on-surface">
                                                                                {goalAvgScore.toFixed(1)}/10
                                                                            </div>
                                                                            <div className="text-xs text-on-surface-secondary">
                                                                                {goalReports.length} report{goalReports.length !== 1 ? 's' : ''}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                            {onSelectEmployee && employees.find(e => e.id === selectedReport.employeeId) ? (
                                <button
                                    onClick={() => {
                                        setSelectedReport(null);
                                        onSelectEmployee(selectedReport.employeeId);
                                    }}
                                    className="text-primary hover:underline"
                                >
                                    {employees.find(e => e.id === selectedReport.employeeId)?.name || 'Unknown'}
                                </button>
                            ) : (
                                <p className="text-on-surface-secondary">
                                    {employees.find(e => e.id === selectedReport.employeeId)?.name || 'Unknown'}
                                </p>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface mb-1">Goal</h3>
                            <p className="text-on-surface-secondary">
                                {filteredGoals.find(g => g.id === selectedReport.goalId)?.name || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface mb-1">Project</h3>
                            {(() => {
                                const goal = filteredGoals.find(g => g.id === selectedReport.goalId);
                                const project = goal ? projects.find(p => p.id === goal.projectId) : null;
                                if (onSelectProject && project) {
                                    return (
                                        <button
                                            onClick={() => {
                                                setSelectedReport(null);
                                                onSelectProject(project.id);
                                            }}
                                            className="text-primary hover:underline"
                                        >
                                            {project.name}
                                        </button>
                                    );
                                }
                                return <p className="text-on-surface-secondary">{project?.name || 'N/A'}</p>;
                            })()}
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
                                <TrendingUp size={20} className="text-on-surface-secondary" />
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
                                    <span className="text-2xl font-bold text-on-surface">{selectedReport.evaluationScore.toFixed(2)}</span>
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

        </div>
    );
};

export default DashboardPage;