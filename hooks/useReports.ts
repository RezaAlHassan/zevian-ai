import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/databaseService';
import type { Report } from '../types';

export function useReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await reportService.getAll();
            setReports(data);
        } catch (err) {
            console.error('Error fetching reports:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const createReport = useCallback(async (report: Omit<Report, 'createdAt' | 'updatedAt'>) => {
        try {
            const newReport = await reportService.create(report);
            setReports(prev => [newReport, ...prev]);
            return newReport;
        } catch (err) {
            console.error('Error creating report:', err);
            throw err;
        }
    }, []);

    const updateReport = useCallback(async (id: string, updates: Partial<Report>) => {
        try {
            const updatedReport = await reportService.update(id, updates);
            setReports(prev => prev.map(r => r.id === id ? updatedReport : r));
            return updatedReport;
        } catch (err) {
            console.error('Error updating report:', err);
            throw err;
        }
    }, []);

    const deleteReport = useCallback(async (id: string) => {
        try {
            await reportService.delete(id);
            setReports(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            console.error('Error deleting report:', err);
            throw err;
        }
    }, []);

    return {
        reports,
        loading,
        error,
        refetch: fetchReports,
        createReport,
        updateReport,
        deleteReport,
    };
}
