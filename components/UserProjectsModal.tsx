import React, { useMemo } from 'react';
import { Project, Goal, Employee } from '../types';
import Modal from './Modal';
import { FolderKanban, Target, Calendar, Briefcase } from 'lucide-react';
import { formatTableDate } from '../utils/dateFormat';

interface UserProjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: Employee;
    projects: Project[];
    goals: Goal[];
    mode?: 'projects' | 'goals'; // NEW: Determine what to emphasize
}

const UserProjectsModal: React.FC<UserProjectsModalProps> = ({
    isOpen,
    onClose,
    user,
    projects,
    goals,
    mode = 'projects'
}) => {
    // Determine relevant projects
    // If mode is 'goals', we only care about projects where the user has active goals.
    // If mode is 'projects', we show all projects they are assigned to.

    const relevantData = useMemo(() => {
        if (mode === 'projects') {
            // Manager View: Show projects they manage/participate in
            const assignedProjects = projects.filter(p => p.assignees?.some(a => a.id === user.id));
            return assignedProjects.map(p => ({
                project: p,
                goals: [] // For now, maybe don't show goals in this view? Or just show all?
            }));
        } else {
            // Employee View: Show Active Goals grouped by Project
            // Find active goals for user
            const userGoals = goals.filter(g =>
                g.status !== 'completed' &&
                (g.assignees?.some(a => a.id === user.id) || (!g.assignees?.length && false))
            );

            // Group by project
            const projectMap = new Map<string, Goal[]>();
            userGoals.forEach(g => {
                if (!projectMap.has(g.projectId)) projectMap.set(g.projectId, []);
                projectMap.get(g.projectId)?.push(g);
            });

            return Array.from(projectMap.entries()).map(([projectId, goals]) => {
                const project = projects.find(p => p.id === projectId);
                return { project, goals };
            }).filter(item => item.project !== undefined) as { project: Project, goals: Goal[] }[];
        }
    }, [projects, goals, user.id, mode]);

    const title = mode === 'goals' ? `Active Goals for ${user.name}` : `Active Projects for ${user.name}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
            <div className="space-y-6">
                {relevantData.length > 0 ? (
                    <div className="grid gap-4">
                        {relevantData.map(({ project, goals }) => (
                            <div key={project.id} className="border border-beerus rounded-moon-s-lg p-4 bg-gohan hover:border-primary/20 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-piccolo/10 rounded-moon-s-md text-piccolo">
                                            <FolderKanban size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-bulma">{project.name}</h4>
                                            <p className="text-moon-12 text-trunks/70 capitalize">{project.category || 'General'}</p>
                                        </div>
                                    </div>
                                    <span className="text-moon-12 font-medium px-2 py-1 bg-beerus rounded-full text-trunks">
                                        {project.reportFrequency}
                                    </span>
                                </div>

                                {mode === 'goals' && (
                                    <div className="space-y-2 mt-3 pl-4 border-l-2 border-beerus/50">
                                        {goals.map(goal => (
                                            <div key={goal.id} className="flex items-center justify-between text-moon-14 p-2 bg-beerus/30 rounded-moon-s-md">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Target size={14} className="text-piccolo flex-shrink-0" />
                                                    <span className="text-bulma truncate">{goal.name}</span>
                                                </div>
                                                {goal.deadline && (
                                                    <span className="text-moon-12 text-trunks/70 flex items-center gap-1 whitespace-nowrap ml-2">
                                                        <Calendar size={10} />
                                                        {formatTableDate(goal.deadline)}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-trunks">
                        {mode === 'goals' ? <Target size={32} className="mx-auto mb-3 opacity-20" /> : <FolderKanban size={32} className="mx-auto mb-3 opacity-20" />}
                        <p>No {mode === 'goals' ? 'active goals' : 'active projects'} found.</p>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gohan hover:bg-beerus border border-beerus rounded-moon-s-md text-moon-14 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UserProjectsModal;
