
import React, { useState, useRef } from 'react';
import { X, CheckCircle, ArrowRight, ArrowLeft, Rocket, Info, File, Paperclip } from 'lucide-react'; // Added File, Paperclip
import { Employee, Project, Goal, Criterion, ManagerSettings } from '../types';
import Input from './Input';
import Button from './Button';
import Select from './Select';
import Textarea from './Textarea';
import MultiSelect from './MultiSelect';
import RichTextEditor from './RichTextEditor';
import Modal from './Modal';
import FileInput from './FileInput';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

export interface OnboardingData {
  organizationName: string;
  employees: Employee[];
  settings: ManagerSettings;
  project: Project | null;
  goal: Goal | null;
}

const Onboarding: React.FC<OnboardingProps> = ({ isOpen, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  // Step 1: Welcome
  const [organizationName, setOrganizationName] = useState('');

  // Step 2: Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState<'manager' | 'employee'>('employee');

  // Step 3: Accountability
  const [globalFrequency, setGlobalFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly'); // Default to weekly
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Step 3: Project
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectFiles, setProjectFiles] = useState<File[]>([]);
  // const [knowledgeBaseLink, setKnowledgeBaseLink] = useState(''); // Removed
  const [showProjectInfoModal, setShowProjectInfoModal] = useState(false);

  // Step 4: Goal
  // Step 5: Invite Users (moved from step 2, second last step)
  const [goalName, setGoalName] = useState('');
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [criterionName, setCriterionName] = useState('');
  const [criterionWeight, setCriterionWeight] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [deadline, setDeadline] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddEmployee = () => {
    if (newEmployeeName && newEmployeeEmail) {
      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        organizationId: '', // Placeholder, will be set on creation
        name: newEmployeeName,
        email: newEmployeeEmail,
        role: newEmployeeRole,
      };
      setEmployees([...employees, newEmployee]);
      setNewEmployeeName('');
      setNewEmployeeEmail('');
      setNewEmployeeRole('employee');
    }
  };

  const handleRemoveEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

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



  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return organizationName.trim().length > 0;
      case 2:
        return true; // Frequency is always valid
      case 3:
        return projectName.trim().length > 0 &&
          projectCategory.trim().length > 0 &&
          projectDescription.trim().length > 0;
      case 4:
        return goalName.trim().length > 0 &&
          criteria.length > 0 &&
          totalWeight === 100 &&
          instructions.trim().length >= 10;
      case 5:
        return true; // Invite step can be skipped
      case 6:
        return true;
      default:
        return false;
    }
  };



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

  const handleNext = () => {
    if (currentStep < totalSteps && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    let deadlineISO: string | undefined = undefined;
    if (deadline) {
      deadlineISO = new Date(deadline).toISOString();
    }

    const project: Project | null = projectName ? {
      id: `project-${Date.now()}`,
      organizationId: '', // Placeholder
      name: projectName,
      description: projectDescription || undefined,
      category: projectCategory || undefined,
      reportFrequency: globalFrequency,
      knowledgeBaseLink: undefined, // Removed
      createdBy: 'emp-1', // Default creator - in real app this would come from auth
    } : null;

    const goal: Goal | null = goalName && project ? {
      id: `goal-${Date.now()}`,
      name: goalName,
      projectId: project.id,
      criteria,
      instructions,
      deadline: deadlineISO,
    } : null;

    const settings: ManagerSettings = {
      selectedDays: selectedDays.length > 0 ? selectedDays : undefined,
      globalFrequency: true,
    };

    onComplete({
      organizationName,
      employees,
      settings,
      project,
      goal,
    });
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const stepLabels = [
    'Welcome',
    'Frequency',
    'Project',
    'Goal',
    'Invite',
    'Summary'
  ];

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2 shadow-sm border border-border">
                  <img src="/logo.png" alt="Performance Tracker Logo" className="w-10 h-10 object-contain" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-on-surface">Zevian</h3>
              <p className="text-on-surface-secondary max-w-md mx-auto">
                Track performance with AI-powered evaluations. Create projects, set goals with criteria, and generate objective reports that reduce bias and save time.
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface">Organization Name</label>
              <Input
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Enter your organization name"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-on-surface">Set Reporting Frequency</h3>
              <p className="text-on-surface-secondary text-sm">
                Configure how often reports should be submitted. You can customize this per project later.
              </p>
              <Select
                value={globalFrequency}
                onChange={(e) => setGlobalFrequency(e.target.value as any)}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'custom', label: 'Custom' },
                ]}
              />
            </div>

            {globalFrequency === 'custom' && (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-on-surface">Select Days</label>
                <div className="grid grid-cols-4 gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day}
                      onClick={() => {
                        if (selectedDays.includes(day)) {
                          setSelectedDays(selectedDays.filter(d => d !== day));
                        } else {
                          setSelectedDays([...selectedDays, day]);
                        }
                      }}
                      className={`
                        px-3 py-2 text-sm rounded-md border text-center transition-colors
                        ${selectedDays.includes(day)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-on-surface border-border hover:border-primary'
                        }
                      `}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-on-surface-secondary">
                  Reports will be generated on these days each week.
                </p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-on-surface">Create Your First Project</h3>
                <button
                  onClick={() => setShowProjectInfoModal(true)}
                  className="text-on-surface-secondary hover:text-primary transition-colors p-1 rounded hover:bg-surface-hover"
                  title="Learn more about Projects and Goals"
                >
                  <Info size={20} />
                </button>
              </div>
              <p className="text-on-surface-secondary text-sm">
                Projects organize your work and help track progress across teams and individuals.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Project Name *</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Q4 Product Development"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Category *</label>
                <Input
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value)}
                  placeholder="e.g., Software Development, Marketing"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Knowledge Base *</label>
                <RichTextEditor
                  value={projectDescription}
                  onChange={setProjectDescription}
                  placeholder="Provide details about the project's goals, scope, and key information. You can format text and add information from other sources."
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
                  Acts as AI context when reports are not available.
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-on-surface">Create Your First Goal</h3>
              <p className="text-on-surface-secondary text-sm">
                Goals define what success looks like. Add criteria with weights and objective rules for AI evaluation.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Goal Name *</label>
                <Input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g., Improve Code Quality"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-2">Deadline (Optional)</label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-on-surface">Evaluation Criteria *</label>
                <p className="text-xs text-on-surface-secondary">
                  Add criteria with weights. Total must equal 100%.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={criterionName}
                    onChange={(e) => setCriterionName(e.target.value)}
                    placeholder="Criterion Name (e.g., Quality, Scale, Speed)"
                    className="flex-grow min-w-[250px]"
                  />
                  <Input
                    value={criterionWeight}
                    onChange={(e) => setCriterionWeight(e.target.value)}
                    placeholder="Weight %"
                    type="number"
                    className="w-24"
                  />
                  <Button onClick={handleAddCriterion} variant="primary">
                    Add
                  </Button>
                </div>
                {criteria.length > 0 && (
                  <div className="space-y-2">
                    {criteria.map(crit => (
                      <div key={crit.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                        <div>
                          <p className="font-medium text-on-surface">{crit.name}</p>
                          <p className="text-sm text-on-surface-secondary">{crit.weight}%</p>
                        </div>
                        <button
                          onClick={() => handleRemoveCriterion(crit.id)}
                          className="text-destructive hover:text-destructive-dark"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className={`text-sm ${totalWeight === 100 ? 'text-success' : 'text-warning'}`}>
                      Total Weight: {totalWeight}%
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-on-surface">Instructions *</label>
                <p className="text-xs text-on-surface-secondary">
                  Specific, objective instructions for the AI to follow during evaluation.
                </p>
                <Textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Ensure all code is commented. \nDesigns must follow the new design system. \nReports must address all challenges faced."
                  rows={5}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-on-surface">Invite Users</h3>
              <p className="text-on-surface-secondary text-sm">
                Invite users to your organization. Managers can read reports, employees send reports. You can skip this step and invite users later.
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newEmployeeName}
                    onChange={(e) => setNewEmployeeName(e.target.value)}
                    placeholder="Name"
                    className="flex-1"
                  />
                  <Input
                    value={newEmployeeEmail}
                    onChange={(e) => setNewEmployeeEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="flex-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={newEmployeeRole}
                    onChange={(e) => setNewEmployeeRole(e.target.value as 'manager' | 'employee')}
                    options={[
                      { value: 'employee', label: 'Employee (Sends Reports)' },
                      { value: 'manager', label: 'Manager (Reads Reports)' },
                    ]}
                    className="flex-1"
                  />
                  <Button onClick={handleAddEmployee} variant="primary">
                    Add
                  </Button>
                </div>
              </div>
              {employees.length > 0 && (
                <div className="space-y-2">
                  {employees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                      <div>
                        <p className="font-medium text-on-surface">{emp.name}</p>
                        <p className="text-sm text-on-surface-secondary">{emp.email}</p>
                        <p className="text-xs text-on-surface-tertiary capitalize mt-1">
                          {emp.role === 'manager' ? 'Manager (Reads Reports)' : 'Employee (Sends Reports)'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveEmployee(emp.id)}
                        className="text-destructive hover:text-destructive-dark"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-on-surface">You're Ready to Go Live!</h3>
            </div>

            <div className="bg-surface rounded-lg p-6 space-y-4">
              <h4 className="font-semibold text-on-surface">Setup Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">Organization:</span>
                  <span className="font-medium text-on-surface">{organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">Employees:</span>
                  <span className="font-medium text-on-surface">{employees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-secondary">Report Frequency:</span>
                  <span className="font-medium text-on-surface capitalize">{globalFrequency}</span>
                </div>
                {projectName && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Project:</span>
                    <span className="font-medium text-on-surface">{projectName}</span>
                  </div>
                )}
                {goalName && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Goal:</span>
                    <span className="font-medium text-on-surface">{goalName}</span>
                  </div>
                )}
                {goalName && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Criteria:</span>
                    <span className="font-medium text-on-surface">{criteria.length}</span>
                  </div>
                )}
                {goalName && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-secondary">Instructions:</span>
                    <span className="font-medium text-on-surface">{instructions ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-on-surface">
                <strong>Next Steps:</strong> Start creating reports against your goal. The AI will evaluate them based on your criteria and objective rules.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className="bg-surface-elevated rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface-elevated px-6 py-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-on-surface">Setup your Organization</h2>
            <span className="text-sm text-on-surface-secondary">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          {onSkip && (
            <button
              onClick={onSkip}
              className="text-on-surface-secondary hover:text-on-surface transition-colors p-1 rounded hover:bg-surface-hover"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Progress Bar with Labels */}
          <div className="mb-6">
            <div className="flex gap-2 mb-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 rounded-full transition-colors ${index + 1 <= currentStep ? 'bg-primary' : 'bg-surface'
                    }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {stepLabels.map((label, index) => (
                <div
                  key={index}
                  className="flex-1 text-center"
                >
                  <span
                    className={`text-xs font-medium transition-colors ${index + 1 <= currentStep
                      ? 'text-primary'
                      : 'text-on-surface-tertiary'
                      }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {renderStep()}
        </div>

        {/* Project Info Modal */}
        <Modal
          isOpen={showProjectInfoModal}
          onClose={() => setShowProjectInfoModal(false)}
          title="Understanding Projects and Goals"
        >
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-on-surface mb-2">What are Projects?</h4>
              <p className="text-on-surface-secondary text-sm mb-3">
                Projects act as an anchor point for several goals. Think of a project as a container that holds multiple related goals together.
              </p>
              <p className="text-on-surface-secondary text-sm">
                Projects help you organize your work and measure analytics separately. For example, you might have a "Q4 Marketing Campaign" project that contains multiple goals like "Increase Website Traffic" and "Improve Social Media Engagement".
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold text-on-surface mb-2">What are Goals?</h4>
              <p className="text-on-surface-secondary text-sm mb-3">
                Goals are tied to projects and are used to submit reports against. Each goal has specific criteria and rules that help evaluate performance.
              </p>
              <p className="text-on-surface-secondary text-sm">
                When employees submit reports, they do so against a specific goal. The AI evaluates these reports based on the criteria and objective rules you define for each goal.
              </p>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-on-surface">
                <strong>Simple Summary:</strong> Projects are like folders that organize multiple goals. Goals are what employees submit reports against. You can track analytics for entire projects or individual goals.
              </p>
            </div>
            <div className="border-t border-border pt-4">
              <h4 className="font-semibold text-on-surface mb-2">Instructions vs Criteria</h4>
              <p className="text-on-surface-secondary text-sm mb-3">
                <strong className="text-on-surface">Instructions</strong> are specific, objective rules that the AI follows to evaluate the report (e.g., "Code must be commented", "Designs must use the design system").
              </p>
              <p className="text-on-surface-secondary text-sm">
                <strong className="text-on-surface">Criteria</strong> are the broad categories on which performance is scored (e.g., "Code Quality", "Creativity", "Speed") and given a weight.
              </p>
            </div>
          </div>
        </Modal>

        <div className="sticky bottom-0 bg-surface-elevated px-6 py-4 border-t border-border flex justify-between items-center">
          <Button
            onClick={handleBack}
            variant="secondary"
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {currentStep < totalSteps ? (
            <>
              {currentStep === 5 && (
                <Button
                  onClick={handleNext}
                  variant="outline"
                >
                  Skip
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                variant="primary"
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <Button
              onClick={handleFinish}
              variant="primary"
            >
              Complete Setup
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

