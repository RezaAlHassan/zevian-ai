import React from 'react';
import { Goal, Project, Employee } from '../types';
import Modal from './Modal';
import { Target, Calendar, User, CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { formatTableDate } from '../utils/dateFormat';

interface ProjectGoalsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    goals: Goal[];
    employees: Employee[];
}

const ProjectGoalsModal: React.FC<ProjectGoalsModalProps> = ({
    isOpen,
    onClose,
    project,
    goals,
    employees
}) => {
    if (!project) return null;

    // Filter goals for this project
    const projectGoals = goals.filter(g => g.projectId === project.id);

    // Sort goals: active first, then by deadline
    const sortedGoals = [...projectGoals].sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} className="text-roshi" />;
            case 'in-progress': return <Circle size={16} className="text-piccolo" />; // Or a spinner icon
            case 'at-risk': return <AlertCircle size={16} className="text-dodoria" />;
            default: return <Clock size={16} className="text-trunks" />;
        }
    };

    const getStatusText = (status: string) => {
        return status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Goals for ${project.name}`} size="lg">
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-4 text-sm text-trunks">
                    <p>{project.description || "No description provided."}</p>
                    <span className="px-2 py-1 bg-gohan rounded text-xs">{project.category}</span>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {sortedGoals.length > 0 ? (
                        sortedGoals.map(goal => (
                            <div key={goal.id} className="p-3 bg-goku border border-beerus rounded-lg hover:border-piccolo/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Target size={18} className="text-piccolo" />
                                        <h4 className="font-medium text-bulma">{goal.name}</h4>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gohan text-xs font-medium">
                                        {getStatusIcon(goal.status)}
                                        <span className="text-trunks">{getStatusText(goal.status)}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-trunks mt-1">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} />
                                        <span>Due: {formatTableDate(goal.deadline)}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <User size={14} />
                                        <span>
                                            {goal.assignees && goal.assignees.length > 0
                                                ? goal.assignees.map(a => (a.name ? a.name.split(' ')[0] : 'Unknown')).join(', ')
                                                : 'Unassigned'}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-trunks">
                                    {goal.description}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-trunks">
                            <Target size={32} className="mx-auto mb-2 opacity-50" />
                            <p>No goals found for this project.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-beerus">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-goku hover:bg-gohan border border-beerus rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ProjectGoalsModal;
