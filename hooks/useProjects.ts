import { useState, useEffect, useCallback } from 'react';
import { projectService } from '../services/databaseService';
import type { Project } from '../types';

export function useProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await projectService.getAll();
            setProjects(data);
        } catch (err) {
            console.error('Error fetching projects:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const createProject = useCallback(async (project: Omit<Project, 'createdAt' | 'updatedAt'>) => {
        try {
            const newProject = await projectService.create(project);
            setProjects(prev => [...prev, newProject]);
            return newProject;
        } catch (err) {
            console.error('Error creating project:', err);
            throw err;
        }
    }, []);

    const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
        try {
            const updatedProject = await projectService.update(id, updates);
            setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
            return updatedProject;
        } catch (err) {
            console.error('Error updating project:', err);
            throw err;
        }
    }, []);

    const deleteProject = useCallback(async (id: string) => {
        try {
            await projectService.delete(id);
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting project:', err);
            throw err;
        }
    }, []);

    return {
        projects,
        loading,
        error,
        refetch: fetchProjects,
        createProject,
        updateProject,
        deleteProject,
    };
}
