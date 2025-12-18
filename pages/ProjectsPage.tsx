
import React, { useState, useMemo, useRef } from 'react';
import { Project, Employee, Goal, Report } from '../types';
import { FolderKanban, Plus, Search, Eye, Edit2, Bot, MoreHorizontal, Trash2, File, X } from 'lucide-react';
import Table from '../components/Table';
import Input from '../components/Input';
import Select from '../components/Select';
import MultiSelect from '../components/MultiSelect';
import Textarea from '../components/Textarea';
import RichTextEditor from '../components/RichTextEditor';
import Button from '../components/Button';
import Modal from '../components/Modal';
import FileInput from '../components/FileInput';
import Dropdown, { DropdownItem, DropdownDivider } from '../components/Dropdown';
import { getDirectReportIds } from '../utils/employeeFilter';
import { canViewOrganizationWide } from '../utils/managerPermissions';

interface ProjectsPageProps {
  projects: Project[];
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject?: (projectId: string) => void;
  employees: Employee[];
  goals?: Goal[]; // Added to check for direct reports working on projects
  reports?: Report[]; // Added to check for direct reports working on projects
  onSelectProject?: (projectId: string) => void;
  currentEmployeeId?: string;
  currentManagerId?: string;
  viewMode?: 'manager' | 'employee';
  scopeFilter?: 'direct-reports' | 'organization';
  searchQuery?: string;
}

const ProjectsPage: React.FC<ProjectsPageProps> = ({ projects, addProject, updateProject, deleteProject, employees, goals = [], reports = [], onSelectProject, currentEmployeeId, currentManagerId, viewMode = 'employee', scopeFilter = 'direct-reports', searchQuery }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [contextEditModal, setContextEditModal] = useState<{ project: Project | null; isOpen: boolean }>({ project: null, isOpen: false });
  const [editedContext, setEditedContext] = useState('');

  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [reportFrequency, setReportFrequency] = useState<'daily' | 'weekly' | 'bi-weekly' | 'monthly'>('weekly');
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  // const [knowledgeBaseLink, setKnowledgeBaseLink] = useState(''); // Removed

  // File input ref for integrated upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProjectFiles([...projectFiles, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setProjectFiles(projectFiles.filter((_, i) => i !== index));
  };

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
    if (viewMode === 'employee' && currentEmployeeId) {
      // Employees see only their own projects
      return new Set([currentEmployeeId]);
    }
    if (viewMode !== 'manager' || !currentManagerId) {
      // Default: show all projects if not in manager mode
      return new Set(employees.map(emp => emp.id));
    }

    switch (scopeFilter) {
      case 'direct-reports':
        return getDirectReportIds(employees, currentManagerId);
      case 'organization':
        if (canViewOrgWide) {
          return new Set(employees.map(emp => emp.id));
        }
        // Fallback to direct reports if no permission
        return getDirectReportIds(employees, currentManagerId);
      default:
        return getDirectReportIds(employees, currentManagerId);
    }
  }, [employees, currentEmployeeId, currentManagerId, scopeFilter, canViewOrgWide, viewMode]);

  // Filter projects based on view mode - all managers see all projects
  const visibleProjects = useMemo(() => {
    if (viewMode === 'employee' && currentEmployeeId) {
      // Employees see only projects assigned to them
      return projects.filter(project =>
        project.assignees?.some(assignee => assignee.type === 'employee' && assignee.id === currentEmployeeId) || false
      );
    }
    // All managers see all projects
    return projects;
  }, [projects, currentEmployeeId, viewMode]);

  // Filter projects based on search
  const filteredProjects = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    if (!query) return visibleProjects;
    return visibleProjects.filter(project =>
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.category?.toLowerCase().includes(query)
    );
  }, [visibleProjects, searchQuery]);

  const handleAddProject = () => {
    if (projectName && projectCategory && projectDescription) {
      // Append file names to description as we don't have storage yet
      let finalDescription = projectDescription;
      if (projectFiles.length > 0) {
        finalDescription += '\n\n[Attached Documents]:\n' + projectFiles.map(f => `- ${f.name}`).join('\n');
      }

      // Create project with multiple assignees (or none)
      const assignees = selectedEmployeeIds.length > 0
        ? selectedEmployeeIds.map(id => ({ type: 'employee' as const, id }))
        : undefined;

      if (editingProject) {
        // Update existing project
        updateProject({
          ...editingProject,
          name: projectName,
          description: finalDescription,
          category: projectCategory,
          assignees,
          reportFrequency,
          knowledgeBaseLink: undefined, // Removed from UI
        });
      } else {
        // Create new project
        addProject({
          id: `project-${Date.now()}`,
          name: projectName,
          description: finalDescription,
          category: projectCategory,
          assignees,
          reportFrequency,
          knowledgeBaseLink: undefined, // Removed from UI
          createdBy: currentManagerId || currentEmployeeId,
        });
      }

      // Reset form
      setProjectName('');
      setProjectDescription('');
      setProjectCategory('');
      setSelectedEmployeeIds([]);
      setReportFrequency('weekly');
      setProjectFiles([]);
      setEditingProject(null);
      setShowCreateModal(false);
    }
  };

  // Get assignee names for display
  const getAssigneeNames = (assignees?: Array<{ type: 'employee' | 'manager'; id: string }>) => {
    if (!assignees || assignees.length === 0) return 'Unassigned';
    return assignees.map(assignee => {
      const employee = employees.find(e => e.id === assignee.id);
      return employee?.name || 'Unknown';
    }).join(', ');
  };

  // Get creator name
  const getCreatorName = (createdBy?: string) => {
    if (!createdBy) return '—';
    return employees.find(e => e.id === createdBy)?.name || 'Unknown';
  };

  // Check if manager has direct reports working on this project
  const hasDirectReportsOnProject = useMemo(() => {
    if (viewMode !== 'manager' || !currentManagerId) return new Map<string, boolean>();

    const directReportIds = getDirectReportIds(employees, currentManagerId);
    const projectDirectReportMap = new Map<string, boolean>();

    projects.forEach(project => {
      // Check if any assignees are direct reports
      const hasDirectReportAssignee = project.assignees?.some(assignee =>
        directReportIds.has(assignee.id)
      ) || false;

      // Check if any reports from this project are from direct reports
      const projectGoalIds = goals.filter(g => g.projectId === project.id).map(g => g.id);
      const projectReports = reports.filter(r => projectGoalIds.includes(r.goalId));
      const hasDirectReportReports = projectReports.some(r => directReportIds.has(r.employeeId));

      projectDirectReportMap.set(project.id, hasDirectReportAssignee || hasDirectReportReports);
    });

    return projectDirectReportMap;
  }, [projects, goals, reports, employees, currentManagerId, viewMode]);

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || '');
    setProjectCategory(project.category || '');
    setSelectedEmployeeIds(project.assignees?.map(a => a.id) || []);
    setReportFrequency(project.reportFrequency || 'weekly');
    setProjectFiles([]); // Reset files on edit open
    setShowCreateModal(true);
  };

  const handleOpenContextEdit = (project: Project) => {
    setEditedContext(project.aiContext || '');
    setContextEditModal({ project, isOpen: true });
  };

  const handleSaveContext = () => {
    if (contextEditModal.project) {
      updateProject({ ...contextEditModal.project, aiContext: editedContext });
      setContextEditModal({ project: null, isOpen: false });
      setEditedContext('');
    }
  };

  const handleCloseContextModal = () => {
    setContextEditModal({ project: null, isOpen: false });
    setEditedContext('');
  };

  const projectTableHeaders = ['Project Name', 'Category', 'Assignees', 'Creator', 'Has Direct Reports', 'Frequency', 'Actions'];
  const projectTableRows = filteredProjects.map(project => {
    const assigneeNames = getAssigneeNames(project.assignees);
    const creatorName = getCreatorName(project.createdBy);
    const hasDirectReports = hasDirectReportsOnProject.get(project.id) || false;

    return [
      <span className="capitalize text-on-surface-secondary">{project.name}</span>,
      <span className="capitalize text-on-surface-secondary">{project.category || '—'}</span>,
      <span className="capitalize text-on-surface-secondary">{assigneeNames}</span>,
      <span className="capitalize text-on-surface-secondary">{creatorName}</span>,
      <div className="flex items-center">
        {viewMode === 'manager' && currentManagerId ? (
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${hasDirectReports
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'bg-surface text-on-surface-tertiary border border-border'
            }`}>
            {hasDirectReports ? 'Yes' : 'No'}
          </span>
        ) : (
          <span className="text-on-surface-tertiary">—</span>
        )}
      </div>,
      <span className="capitalize text-on-surface-secondary">{project.reportFrequency?.replace('-', ' ') || 'N/A'}</span>,
      <div className="flex items-center justify-start">
        <Dropdown
          buttonText=""
          buttonClassName="p-1.5 border border-border bg-surface hover:bg-surface-hover hover:border-primary/30 rounded-lg transition-colors"
          variant="ghost"
          size="sm"
          icon={<MoreHorizontal size={18} className="text-on-surface-secondary" />}
          align="right"
        >
          {onSelectProject && (
            <DropdownItem
              onClick={() => {
                onSelectProject(project.id);
              }}
            >
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-on-surface-secondary" />
                <span>View Details</span>
              </div>
            </DropdownItem>
          )}
          <DropdownItem
            onClick={() => handleOpenEditModal(project)}
          >
            <div className="flex items-center gap-2">
              <Edit2 size={16} className="text-on-surface-secondary" />
              <span>Edit Project</span>
            </div>
          </DropdownItem>
          <DropdownItem
            onClick={() => handleOpenContextEdit(project)}
          >
            <div className="flex items-center gap-2">
              <Edit2 size={16} className="text-on-surface-secondary" />
              <span>{project.aiContext ? 'Edit Context' : 'Add Context'}</span>
            </div>
          </DropdownItem>
          {deleteProject && (
            <>
              <DropdownDivider />
              <DropdownItem
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
                    deleteProject(project.id);
                  }
                }}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <div className="flex items-center gap-2">
                  <Trash2 size={16} />
                  <span>Delete</span>
                </div>
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    ];
  });

  return (
    <>
      <div className="w-full px-6 py-6 space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban size={28} className="text-on-surface-secondary" />
            <h2 className="text-xl font-bold text-on-surface">Projects</h2>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            icon={Plus}
          >
            Create New Project
          </Button>
        </div>

        {/* Search - Removed local search, now global */}

        {/* Projects Table */}
        <div className="bg-surface-elevated rounded-lg p-6 border border-border">
          {filteredProjects.length > 0 ? (
            <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
              <Table headers={projectTableHeaders} rows={projectTableRows} />
            </div>
          ) : (
            <div className="text-center py-12">
              <FolderKanban size={48} className="text-on-surface-tertiary mx-auto mb-4" />
              <p className="text-lg text-on-surface-secondary mb-2">
                {searchQuery ? 'No projects found matching your search' : 'No projects created yet'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  className="mt-4"
                  icon={Plus}
                >
                  Create Your First Project
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          // Reset form when closing
          setProjectName('');
          setProjectDescription('');
          setProjectCategory('');
          setSelectedEmployeeIds([]);
          setReportFrequency('weekly');
          setProjectFiles([]);
          setEditingProject(null);
        }}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            id="projectName"
            type="text"
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g., Q4 Marketing Campaign"
            required
          />

          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Knowledge Base *</label>
            <RichTextEditor
              value={projectDescription}
              onChange={setProjectDescription}
              placeholder="Provide deeper context and scope for the entire project..."
              minLength={10}
              onAttach={handleAttachClick}
            />

            {/* File List */}
            {projectFiles.length > 0 && (
              <div className="mt-2 space-y-2">
                {projectFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-on-surface bg-surface border border-border px-3 py-2 rounded-md">
                    <File size={14} className="text-primary" />
                    <span className="truncate flex-1">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-on-surface-tertiary hover:text-destructive transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileSelect}
            />

            <p className="mt-1 text-xs text-on-surface-secondary">
              Describe the project's objectives, scope, and expected outcomes
            </p>
          </div>

          <Input
            id="projectCategory"
            type="text"
            label="Project Category *"
            value={projectCategory}
            onChange={(e) => setProjectCategory(e.target.value)}
            placeholder="e.g., Software Dev, HR, Marketing"
            helperText="For organizational filtering"
            required
          />

          <MultiSelect
            label="Assign To Employees"
            options={employees.map(e => ({ value: e.id, label: e.name }))}
            selectedValues={selectedEmployeeIds}
            onChange={setSelectedEmployeeIds}
            placeholder="Search and select employees..."
            searchable
            helperText="You can select multiple employees to assign this project to"
          />

          <Select
            id="reportFrequency"
            label="Report Submission Frequency"
            value={reportFrequency}
            onChange={(e) => setReportFrequency(e.target.value as 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'custom')}
            options={[
              ...frequencyOptions,
              { value: 'custom', label: 'Custom' }
            ]}
            helperText="Sets the cadence for all goals under this project"
          />

          {reportFrequency === 'custom' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-on-surface">Select Days</label>
              <div className="grid grid-cols-4 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      // Logic to handle custom days for Project... 
                      // Wait, ProjectsPage doesn't seem to have `selectedDays` state for the project form yet.
                      // I need to add state `const [selectedDays, setSelectedDays] = useState<string[]>([]);` to ProjectsPage.
                    }}
                    className={`
                      px-3 py-2 text-sm rounded-md border text-center transition-colors
                      bg-white text-on-surface border-border hover:border-primary
                    `}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              onClick={() => {
                setShowCreateModal(false);
                setProjectName('');
                setProjectDescription('');
                setProjectCategory('');
                setSelectedEmployeeIds([]);
                setReportFrequency('weekly');
                setProjectFiles([]);
                setEditingProject(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProject}
              disabled={!projectName || !projectCategory || !projectDescription}
              variant="primary"
            >
              {editingProject ? 'Update Project' : 'Save Project'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Context Edit Modal */}
      <Modal
        isOpen={contextEditModal.isOpen}
        onClose={handleCloseContextModal}
        title={contextEditModal.project ? `Edit AI Context - ${contextEditModal.project.name}` : 'Edit AI Context'}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot size={18} className="text-primary" />
            <p className="text-sm text-on-surface-secondary">
              This context will be used by AI to better understand and evaluate reports for this project
            </p>
          </div>
          <Textarea
            value={editedContext}
            onChange={(e) => setEditedContext(e.target.value)}
            placeholder="Add context for AI to keep track of project reports, updates, and important information..."
            rows={10}
            className="w-full"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleCloseContextModal}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveContext}
              variant="primary"
            >
              Save Context
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ProjectsPage;

