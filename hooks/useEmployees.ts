import { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../services/databaseService';
import type { Employee } from '../types';

export function useEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await employeeService.getAll();
            setEmployees(data);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch employees');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const createEmployee = useCallback(async (employee: Omit<Employee, 'createdAt' | 'updatedAt'>) => {
        try {
            const newEmployee = await employeeService.create(employee);
            setEmployees(prev => [...prev, newEmployee]);
            return newEmployee;
        } catch (err) {
            console.error('Error creating employee:', err);
            throw err;
        }
    }, []);

    const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
        try {
            const updatedEmployee = await employeeService.update(id, updates);
            setEmployees(prev => prev.map(e => e.id === id ? updatedEmployee : e));
            return updatedEmployee;
        } catch (err) {
            console.error('Error updating employee:', err);
            throw err;
        }
    }, []);

    const deleteEmployee = useCallback(async (id: string) => {
        try {
            await employeeService.delete(id);
            setEmployees(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error('Error deleting employee:', err);
            throw err;
        }
    }, []);

    return {
        employees,
        loading,
        error,
        refetch: fetchEmployees,
        createEmployee,
        updateEmployee,
        deleteEmployee,
    };
}
