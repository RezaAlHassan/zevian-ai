import { useState, useEffect, useCallback } from 'react';
import { goalService } from '../services/databaseService';
import type { Goal } from '../types';

export function useGoals() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGoals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await goalService.getAll();
            setGoals(data);
        } catch (err) {
            console.error('Error fetching goals:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch goals');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGoals();
    }, [fetchGoals]);

    const createGoal = useCallback(async (goal: Omit<Goal, 'createdAt' | 'updatedAt'>) => {
        try {
            const newGoal = await goalService.create(goal);
            setGoals(prev => [...prev, newGoal]);
            return newGoal;
        } catch (err) {
            console.error('Error creating goal:', err);
            throw err;
        }
    }, []);

    const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
        try {
            const updatedGoal = await goalService.update(id, updates);
            setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
            return updatedGoal;
        } catch (err) {
            console.error('Error updating goal:', err);
            throw err;
        }
    }, []);

    const deleteGoal = useCallback(async (id: string) => {
        try {
            await goalService.delete(id);
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (err) {
            console.error('Error deleting goal:', err);
            throw err;
        }
    }, []);

    return {
        goals,
        loading,
        error,
        refetch: fetchGoals,
        createGoal,
        updateGoal,
        deleteGoal,
    };
}
