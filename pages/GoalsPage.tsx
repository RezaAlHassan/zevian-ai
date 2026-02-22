import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Goal, Criterion, Project, Employee, Report } from '../types';
import { Plus, Trash2, AlertTriangle, CheckCircle, Search, Eye, Target, MoreHorizontal, Edit2, Info, Calendar, User, UserPlus, Users } from 'lucide-react';
import Table from '../components/Table';
import { StackedAvatars, ProfilePicture } from '../components/Avatar';
import Input from '../components/Input';
import Select from '../components/Select';
import MultiSelect from '../components/MultiSelect';
import Textarea from '../components/Textarea';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Dropdown, { DropdownItem, DropdownDivider } from '../components/Dropdown';
import { filterGoalsByManager } from '../utils/goalFilter';
import { isAccountOwner } from '../utils/managerPermissions';
import { formatTableDate } from '../utils/dateFormat';
import { calculateNextReportDate, getReportStatusLabel } from '../utils/reportDueDate';

interface GoalsPageProps {
  goals: Goal[];
  projects: Project[];
  employees: Employee[];
  reports: Report[];
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal?: (goalId: string) => void;
  onSelectGoal: (goalId: string) => void;
  currentManagerId?: string;
  currentEmployeeId?: string;
  viewMode?: 'manager' | 'employee';
  searchQuery?: string;
}


const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  projects,
  employees,
  reports,
  addGoal,
  updateGoal,
  deleteGoal,
  onSelectGoal,
  currentManagerId,
  currentEmployeeId,
  viewMode = 'manager',
  searchQuery
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);


  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [assignProjectModal, setAssignProjectModal] = useState<{ goal: Goal | null; isOpen: boolean }>({ goal: null, isOpen: false });
  const [selectedProjectForAssign, setSelectedProjectForAssign] = useState<string>('');

  const [assignEmployeeModal, setAssignEmployeeModal] = useState<{ goal: Goal | null; isOpen: boolean }>({ goal: null, isOpen: false });
  const [tempAssigneeIds, setTempAssigneeIds] = useState<string[]>([]);
  const [viewingAssigneesGoal, setViewingAssigneesGoal] = useState<Goal | null>(null);

  const [showInfoModal, setShowInfoModal] = useState(false);

  // Form state
  const [goalName, setGoalName] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [criterionName, setCriterionName] = useState('');
  const [criterionWeight, setCriterionWeight] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [deadline, setDeadline] = useState<string>('');

  // Handle actionable toasts
  useEffect(() => {
    const action = searchParams.get('action');
    const pid = searchParams.get('projectId');
    if (action === 'create-goal' && pid) {
      setProjectId(pid);
      setShowCreateModal(true);
      // Clean up params so it doesn't reopen on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('action');
      newParams.delete('projectId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);


  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const selectedProject = projects.find(p => p.id === projectId);

  // Filter goals by manager if in manager mode
  const currentFilteredGoals = useMemo(() => {
    if (viewMode === 'manager' && currentManagerId) {
      return filterGoalsByManager(goals, projects, employees, currentManagerId);
    }
    if (viewMode === 'employee' && currentEmployeeId) {
      // Employees see:
      // 1. Goals for projects they are assigned to
      const assignedProjectIds = new Set(
        projects
          .filter(p => p.assignees?.some(a => a.id === currentEmployeeId))
          .map(p => p.id)
      );

      return goals.filter(g =>
        assignedProjectIds.has(g.projectId) ||
        g.assignees?.some(a => a.id === currentEmployeeId)
      );
    }
    return goals;
  }, [goals, projects, employees, currentManagerId, currentEmployeeId, viewMode]);

  // Filter goals based on search
  const filteredGoals = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    if (!query) return currentFilteredGoals;

    return currentFilteredGoals.filter(goal => {
      const project = projects.find(p => p.id === goal.projectId);
      return goal.name.toLowerCase().includes(query) ||
        project?.name.toLowerCase().includes(query);
    });
  }, [currentFilteredGoals, projects, searchQuery]);

  const handleAddCriterion = () => {
    const weight = parseInt(criterionWeight, 10);
    if (criterionName && weight > 0 && weight <= 100) {
      setCriteria([...criteria, { id: `crit-${Date.now()}`, name: criterionName, weight }]);
      setCriterionName('');
      setCriterionWeight('');
    }
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleAddGoal = () => {
    if (goalName && projectId && criteria.length > 0 && totalWeight === 100 && instructions.trim().length >= 10) {
      // Convert datetime-local to ISO string if deadline is provided
      let deadlineISO: string | undefined = undefined;
      if (deadline) {
        deadlineISO = new Date(deadline).toISOString();
      }

      if (editingGoal) {
        // Update existing goal
        updateGoal({
          ...editingGoal,
          name: goalName,
          projectId,
          criteria,
          instructions,
          deadline: deadlineISO,
        });
      } else {
        // Create new goal
        addGoal({
          id: `goal-${Date.now()}`,
          name: goalName,
          projectId,
          criteria,
          instructions,
          deadline: deadlineISO,
          managerId: currentManagerId,
          createdBy: currentManagerId,
          createdAt: new Date().toISOString(),
        } as any);
      }

      // Reset form
      setGoalName('');
      setProjectId('');
      setCriteria([]);
      setInstructions('');
      setDeadline('');
      setEditingGoal(null);
      setShowCreateModal(false);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setGoalName(goal.name);
    setProjectId(goal.projectId);
    setCriteria(goal.criteria);
    setInstructions(goal.instructions);
    setDeadline(goal.deadline ? new Date(goal.deadline).toISOString().slice(0, 16) : '');
    setEditingGoal(goal);
    setShowCreateModal(true);
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  // Get current user for permission checks
  const currentUser = useMemo(() => {
    if (currentEmployeeId) {
      return employees.find(emp => emp.id === currentEmployeeId);
    }
    return null;
  }, [employees, currentEmployeeId]);

  // Check if user can delete a goal (admin or creator)
  const canDeleteGoal = (goal: Goal): boolean => {
    if (!currentUser) return false;
    if (isAccountOwner(currentUser)) return true;
    if (goal.createdBy === currentManagerId) return true;
    return false;
  };

  const handleOpenAssignProject = (goal: Goal) => {
    setSelectedProjectForAssign(goal.projectId);
    setAssignProjectModal({ goal, isOpen: true });
  };

  const handleSaveAssignProject = () => {
    if (assignProjectModal.goal && selectedProjectForAssign) {
      updateGoal({ ...assignProjectModal.goal, projectId: selectedProjectForAssign });
      setAssignProjectModal({ goal: null, isOpen: false });
      setSelectedProjectForAssign('');
    }
  };

  const handleCloseAssignProjectModal = () => {
    setAssignProjectModal({ goal: null, isOpen: false });
    setSelectedProjectForAssign('');
  };

  const handleOpenAssignEmployees = (goal: Goal) => {
    setTempAssigneeIds(goal.assignees?.map(a => a.id) || []);
    setAssignEmployeeModal({ goal, isOpen: true });
  };

  const handleSaveAssignEmployees = () => {
    if (assignEmployeeModal.goal) {
      const newAssignees = tempAssigneeIds.map(id => {
        const emp = employees.find(e => e.id === id);
        return {
          id,
          type: (emp?.role === 'manager' ? 'manager' : 'employee') as 'manager' | 'employee',
          assignedAt: new Date().toISOString()
        };
      });
      updateGoal({ ...assignEmployeeModal.goal, assignees: newAssignees });
      setAssignEmployeeModal({ goal: null, isOpen: false });
      setTempAssigneeIds([]);
    }
  };

  const handleCloseAssignEmployeesModal = () => {
    setAssignEmployeeModal({ goal: null, isOpen: false });
    setTempAssigneeIds([]);
  };

  const handleDeleteGoal = (goal: Goal) => {
    if (deleteGoal && window.confirm(`Are you sure you want to delete "${goal.name}"? This action cannot be undone.`)) {
      deleteGoal(goal.id);
    }
  };

  const weightStatus = totalWeight === 100
    ? { color: 'text-success', icon: <CheckCircle size={20} />, message: 'Total weight is 100%' }
    : { color: 'text-warning', icon: <AlertTriangle size={20} />, message: `Total weight must be 100% (currently ${totalWeight}%)` };



  const goalTableHeaders = viewMode === 'manager'
    ? ['Goal', 'Parent Project', 'Assignees', 'Next Report', 'Created By', 'Created', 'Actions']
    : ['Goal', 'Parent Project', 'Assignees', 'Next Report', 'Created By', 'Created'];

  const goalTableRows = filteredGoals.map(goal => {
    const assignedEmployees = goal.assignees
      ?.map(a => employees.find(e => e.id === a.id))
      .filter((e): e is Employee => !!e) || [];

    const row = [
      <div className="flex items-center gap-2">
        {goal.status === 'completed' && <CheckCircle size={14} className="text-success" />}
        <span className={`capitalize ${goal.status === 'completed' ? 'text-on-surface-tertiary line-through' : 'text-on-surface-secondary'}`}>{goal.name}</span>
      </div>,
      <span className="capitalize text-on-surface-secondary">{getProjectName(goal.projectId)}</span>,
      <div className="flex items-center">
        {assignedEmployees.length > 0 ? (
          <StackedAvatars
            employees={assignedEmployees}
            maxVisible={3}
            size={32}
            onSeeMore={() => setViewingAssigneesGoal(goal)}
          />
        ) : (
          <span className="text-on-surface-tertiary text-sm">Unassigned</span>
        )}
      </div>,
      <span className="text-on-surface-secondary">{employees.find(e => e.id === goal.createdBy)?.name || 'Unknown'}</span>,
      <span className="text-on-surface-secondary text-sm">
        {goal.createdAt ? formatTableDate(goal.createdAt) : '—'}
      </span>
    ];

    // Calculate Next Report for this goal
    const project = projects.find(p => p.id === goal.projectId);
    const frequency = project?.reportFrequency || 'weekly';
    const goalReports = reports
      .filter(r => r.goalId === goal.id && (viewMode === 'employee' ? String(r.employeeId) === String(currentEmployeeId) : true))
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

    const lastReport = goalReports[0];
    const status = getReportStatusLabel(lastReport?.submissionDate || null, frequency);

    const nextReportCell = (
      <div className="flex flex-col">
        <span className={`text-xs font-bold ${status.isOverdue ? 'text-red-500' : status.isImminent ? 'text-amber-500' : 'text-primary'}`}>
          {status.label}
        </span>
        <span className="text-[10px] text-on-surface-tertiary">
          Freq: {frequency}
        </span>
      </div>
    );

    // Insert Next Report cell at index 3
    row.splice(3, 0, nextReportCell);

    if (viewMode === 'manager') {
      row.push(
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectGoal(goal.id)}
            className="p-1.5 text-trunks hover:text-piccolo hover:bg-piccolo/10 rounded-lg transition-all duration-200 group"
            title="View Details"
          >
            <Eye size={18} strokeWidth={2} className="transition-transform group-hover:scale-110" />
          </button>
          <button
            onClick={() => handleOpenAssignEmployees(goal)}
            className="p-1.5 text-trunks hover:text-piccolo hover:bg-piccolo/10 rounded-lg transition-all duration-200 group"
            title="Assign Members"
          >
            <UserPlus size={18} strokeWidth={2} className="transition-transform group-hover:scale-110" />
          </button>
          <button
            onClick={() => handleEditGoal(goal)}
            className="p-1.5 text-trunks hover:text-piccolo hover:bg-piccolo/10 rounded-lg transition-all duration-200 group"
            title="Edit Goal"
          >
            <Edit2 size={18} strokeWidth={2} className="transition-transform group-hover:scale-110" />
          </button>
          {deleteGoal && canDeleteGoal(goal) && (
            <button
              onClick={() => handleDeleteGoal(goal)}
              className="p-1.5 text-trunks hover:text-dodoria hover:bg-dodoria/10 rounded-lg transition-all duration-200 group"
              title="Delete Goal"
            >
              <Trash2 size={18} strokeWidth={2} className="transition-transform group-hover:scale-110" />
            </button>
          )}
        </div>
      );
    }

    return row;
  });

  return (
    <>
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header with Search and Create Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-on-surface">Goals</h2>
            {viewMode === 'manager' && (
              <button
                onClick={() => setShowInfoModal(true)}
                className="text-on-surface-secondary hover:text-primary transition-colors p-1 rounded hover:bg-surface-hover"
                title="Learn more about Goals"
              >
                <Info size={20} />
              </button>
            )}
          </div>
          {viewMode === 'manager' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              icon={Plus}
            >
              Create New Goal
            </Button>
          )}
        </div>

        {/* Search - Removed local search, now global */}

        {/* Goals Table */}
        <div className="bg-surface-elevated rounded-lg p-6 border border-border">
          {filteredGoals.length > 0 ? (
            <Table
              headers={goalTableHeaders}
              rows={goalTableRows}
              onRowClick={(index) => onSelectGoal(filteredGoals[index].id)}
            />
          ) : (
            <div className="text-center py-12">
              <Target size={48} className="text-on-surface-tertiary mx-auto mb-4" />
              <p className="text-lg text-on-surface-secondary mb-2">
                {searchQuery ? 'No goals found matching your search' : 'No goals created yet'}
              </p>
              {viewMode === 'manager' && !searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  className="mt-4"
                  icon={Plus}
                >
                  Create Your First Goal
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Goal Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          // Reset form when closing
          setGoalName('');
          setProjectId('');
          setCriteria([]);
          setInstructions('');
          setDeadline('');
          setEditingGoal(null);
        }}
        title={editingGoal ? "Edit Goal" : "Create New Goal"}
        maxWidth="xl"
        maxHeight="95vh"
        closeOnOutsideClick={false}
        scrollable={true}
      >
        <div className="space-y-4 pr-2">
          <Input
            id="goalName"
            type="text"
            label="Goal"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder="e.g., Improve Code Quality"
            required
          />

          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Parent Project <span className="text-error">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full py-2 px-3 border border-border rounded-lg text-sm bg-white text-on-surface focus:border-primary focus:ring-primary focus:ring-1"
            >
              <option value="">-- Select Project --</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {selectedProject && (
              <p className="mt-1 text-sm text-on-surface-secondary">
                Project: {selectedProject.name} | Frequency: {selectedProject.reportFrequency}
              </p>
            )}
          </div>

          <Input
            id="deadline"
            type="datetime-local"
            label="Deadline (Optional)"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            helperText="Optional: Set a deadline for this goal. Reports may not be submitted after the deadline if late submissions are disabled in settings."
          />

          <div className="border-t border-border pt-4">
            <h3 className="text-lg font-semibold mb-2 text-on-surface">Scoring Criteria</h3>
            <div className="flex gap-2 items-start">
              <Input
                type="text"
                value={criterionName}
                onChange={(e) => setCriterionName(e.target.value)}
                placeholder="Criterion Name (e.g., Quality, Scale, Speed)"
                className="flex-grow min-w-[250px]"
              />
              <Input
                type="number"
                value={criterionWeight}
                onChange={(e) => setCriterionWeight(e.target.value)}
                placeholder="Weight %"
                className="w-24"
                min="1"
                max="100"
              />
              <Button
                onClick={handleAddCriterion}
                variant="primary"
                size="md"
                icon={Plus}
                className="h-[38px]"
              />
            </div>
          </div>

          <ul className="space-y-2 mt-2">
            {criteria.map((c) => (
              <li key={c.id} className="flex justify-between items-center bg-surface p-2 rounded-lg border border-border">
                <span>{c.name} - <span className="font-semibold text-primary">{c.weight}%</span></span>
                <button onClick={() => handleRemoveCriterion(c.id)} className="text-error hover:text-error-hover">
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>

          {criteria.length > 0 && (
            <div className={`flex items-center gap-2 p-2 rounded-lg ${weightStatus.color} bg-opacity-20 ${totalWeight === 100 ? 'bg-success/20' : 'bg-warning/20'}`}>
              {weightStatus.icon}
              <span className="text-sm font-medium">{weightStatus.message}</span>
            </div>
          )}

          <div className="border-t border-border pt-4">
            <h3 className="text-lg font-semibold mb-2 text-on-surface">Instructions</h3>
            <p className="text-sm text-on-surface-secondary mb-3">
              Specific, objective instructions for Zevian to follow during evaluation.
            </p>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Ensure all code is commented. \nDesigns must follow the new design system. \nReports must address all challenges faced."
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              onClick={() => {
                setShowCreateModal(false);
                setGoalName('');
                setProjectId('');
                setCriteria([]);
                setInstructions('');
                setDeadline('');
                setEditingGoal(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddGoal}
              disabled={
                !goalName ||
                !projectId ||
                criteria.length === 0 ||
                totalWeight !== 100 ||
                instructions.trim().length < 10
              }
              variant="primary"
            >
              {editingGoal ? 'Update Goal' : 'Save Goal'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Project Modal */}
      <Modal
        isOpen={assignProjectModal.isOpen}
        onClose={handleCloseAssignProjectModal}
        title={assignProjectModal.goal ? `Assign Goal to Project - ${assignProjectModal.goal.name}` : 'Assign Goal to Project'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Select Project <span className="text-error">*</span>
            </label>
            <select
              value={selectedProjectForAssign}
              onChange={(e) => setSelectedProjectForAssign(e.target.value)}
              className="w-full py-2 px-3 border border-border rounded-lg text-sm bg-white text-on-surface focus:border-primary focus:ring-primary focus:ring-1"
            >
              <option value="">-- Select Project --</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
            {selectedProjectForAssign && (
              <p className="mt-1 text-sm text-on-surface-secondary">
                Project: {projects.find(p => p.id === selectedProjectForAssign)?.name} | Frequency: {projects.find(p => p.id === selectedProjectForAssign)?.reportFrequency}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleCloseAssignProjectModal}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAssignProject}
              disabled={!selectedProjectForAssign}
              variant="primary"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Employees to Goal Modal */}
      <Modal
        isOpen={assignEmployeeModal.isOpen}
        onClose={handleCloseAssignEmployeesModal}
        title={`Assign Members to ${assignEmployeeModal.goal?.name}`}
        scrollable={false}
      >
        <div className="space-y-6">
          <p className="text-sm text-on-surface-secondary">
            Select members to assign to this goal. Only assigned members (and managers) will see this goal during reporting.
          </p>

          <MultiSelect
            label="Select Members"
            options={employees
              .filter(emp => emp.role === 'employee')
              .map(emp => ({
                value: emp.id,
                label: emp.name,
                sublabel: emp.title || 'Employee'
              }))}
            selectedValues={tempAssigneeIds}
            onChange={setTempAssigneeIds}
            placeholder="Search and select members..."
            searchable
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={handleCloseAssignEmployeesModal}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAssignEmployees}
            >
              Save Assignments
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Assignees Modal */}
      <Modal
        isOpen={!!viewingAssigneesGoal}
        onClose={() => setViewingAssigneesGoal(null)}
        title={`Assigned Members - ${viewingAssigneesGoal?.name}`}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {viewingAssigneesGoal?.assignees && viewingAssigneesGoal.assignees.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {viewingAssigneesGoal.assignees
                .map(a => employees.find(e => e.id === a.id))
                .filter((e): e is Employee => !!e)
                .map(employee => (
                  <div key={employee.id} className="flex items-center gap-3 p-2 hover:bg-surface-hover rounded-lg border border-transparent hover:border-border transition-colors">
                    <ProfilePicture name={employee.name} size={40} />
                    <div>
                      <div className="font-medium text-on-surface">{employee.name}</div>
                      <div className="text-xs text-on-surface-secondary capitalize">{employee.role}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <p className="text-on-surface-secondary text-center py-4">No members assigned.</p>
          )}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setViewingAssigneesGoal(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Info Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Understanding Goals"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-on-surface mb-2">What are Goals?</h4>
            <p className="text-on-surface-secondary text-sm mb-3">
              Goals are tied to projects and are used to submit reports against. Each goal has specific criteria and instructions that help evaluate performance.
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-on-surface mb-2">Instructions vs Criteria</h4>
            <p className="text-on-surface-secondary text-sm mb-3">
              <strong className="text-on-surface">Instructions</strong> are specific, objective rules that Zevian follows to evaluate the report (e.g., "Code must be commented", "Designs must use the design system").
            </p>
            <p className="text-on-surface-secondary text-sm">
              <strong className="text-on-surface">Criteria</strong> are the broad categories on which performance is scored (e.g., "Code Quality", "Creativity", "Speed") and given a weight.
            </p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
            <p className="text-sm text-on-surface">
              <strong>Tip:</strong> Use simple and clear instructions to get the best evaluation from Zevian.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default GoalsPage;
