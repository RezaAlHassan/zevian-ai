
import React, { useState, useRef } from 'react';
import { X, CheckCircle, ArrowRight, ArrowLeft, Rocket, Info, File, Paperclip, BarChart3 } from 'lucide-react'; // Added BarChart3
import { Employee, Project, Goal, Criterion, ManagerSettings } from '../types';
import { STANDARD_METRICS } from '../constants';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Select from './Select';
import Textarea from './Textarea';
import MultiSelect from './MultiSelect';
import RichTextEditor from './RichTextEditor';
import Modal from './Modal';
import FileInput from './FileInput';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  organizationName: string;
  selectedMetrics: string[];
  employees: Employee[];
  settings: ManagerSettings;
  project: Project | null;
  projectFiles: File[];
  goal: Goal | null;
}

const Onboarding: React.FC<OnboardingProps> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Step 1: Welcome
  const [organizationName, setOrganizationName] = useState('');

  // Step 2: Metrics
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['quality', 'reliability', 'business-value', 'documentation', 'collaboration']);

  // Step 3: Employees
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeeRole, setNewEmployeeRole] = useState<'manager' | 'employee'>('employee');

  // Step 4: Accountability
  const [globalFrequency, setGlobalFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly'); // Default to weekly
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Step 5: Project
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectCategory, setProjectCategory] = useState('');
  const [projectFiles, setProjectFiles] = useState<File[]>([]);

  // Step 6: Goal
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
        return selectedMetrics.length > 0;
      case 3:
        return true; // Frequency is always valid
      case 4:
        return projectName.trim().length > 0 &&
          projectCategory.trim().length > 0 &&
          projectDescription.trim().length > 0;
      case 5:
        return goalName.trim().length > 0 &&
          criteria.length > 0 &&
          totalWeight === 100 &&
          instructions.trim().length >= 10;
      case 6:
        return true; // Invite step can be skipped
      case 7:
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
      selectedMetrics,
      employees,
      settings,
      project,
      projectFiles, // Pass uploaded files
      goal,
    });
  };

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const stepLabels = [
    'Welcome',
    'Metrics',
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
            <div className="text-center space-y-1">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center p-2 border border-border">
                  <img src="/logo.png" alt="Performance Tracker Logo" className="w-10 h-10 object-contain" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-foreground">Zevian</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                Track performance with Zevian-powered evaluations. Create projects, set goals with criteria, and generate objective reports that reduce bias and save time.
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Organization Name</label>
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
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">Select Organizational Metrics</h3>
              <p className="text-muted-foreground text-sm">
                Choose the metrics your organization values most. These will be used to track progress and generate insights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {STANDARD_METRICS.map((metric) => (
                <div
                  key={metric.id}
                  onClick={() => {
                    if (selectedMetrics.includes(metric.id)) {
                      setSelectedMetrics(selectedMetrics.filter(id => id !== metric.id));
                    } else {
                      setSelectedMetrics([...selectedMetrics, metric.id]);
                    }
                  }}
                  className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${selectedMetrics.includes(metric.id)
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-card hover:border-on-surface-tertiary'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                      ${selectedMetrics.includes(metric.id) ? 'bg-primary border-primary' : 'border-border'}
                    `}>
                      {selectedMetrics.includes(metric.id) && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{metric.friendlyName}</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">Set Reporting Frequency</h3>
              <p className="text-muted-foreground text-sm">
                Configure how often reports should be submitted. You can customize this per project later.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Reporting Frequency</label>
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
                <label className="block text-sm font-medium text-foreground">Select Days</label>
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
                          : 'bg-background text-foreground border-border hover:border-primary'
                        }
                      `}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reports will be generated on these days each week.
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">Create Your First Project</h3>
              <p className="text-muted-foreground text-sm">
                Projects act as containers to organize related goals and track collective analytics. Think of them as folders for your work.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Project Name *</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Q4 Product Development"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category *</label>
                <Input
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value)}
                  placeholder="e.g., Software Development, Marketing"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Project Description *</label>
                <RichTextEditor
                  value={projectDescription}
                  onChange={setProjectDescription}
                  placeholder="Describe the project objectives, scope, technical requirements, and expected outcomes..."
                  minLength={10}
                  onAttach={handleAttachClick}
                />

                {/* File List */}
                {projectFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {projectFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-foreground bg-muted border border-border px-3 py-2 rounded-md">
                        <File size={14} className="text-primary" />
                        <span className="truncate flex-1">{file.name}</span>
                        <button
                          onClick={() => handleRemoveFile(index)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
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

                <div className="mt-2 flex gap-2 items-start bg-primary/5 border border-primary/20 rounded-lg p-2">
                  <Info size={14} className="text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-tight text-muted-foreground">
                    This description, along with goal instructions and criteria, will be used by Zevian to generate a comprehensive Knowledge Base for evaluating employee reports.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">Create Your First Goal</h3>
              <p className="text-muted-foreground text-sm">
                Goals are what employees submit reports against. Define objective rules (instructions) and scoring categories (criteria) for Zevian evaluation.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Goal Name *</label>
                <Input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g., Improve Code Quality"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Deadline (Optional)</label>
                <Input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">Evaluation Criteria *</label>
                <p className="text-xs text-muted-foreground">
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
                  <Button onClick={handleAddCriterion}>
                    Add
                  </Button>
                </div>
                {criteria.length > 0 && (
                  <div className="space-y-2">
                    {criteria.map(crit => (
                      <div key={crit.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{crit.name}</p>
                          <p className="text-sm text-muted-foreground">{crit.weight}%</p>
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
                <label className="block text-sm font-medium text-foreground">Instructions *</label>
                <p className="text-xs text-muted-foreground">
                  Specific, objective instructions for Zevian to follow during evaluation.
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

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-foreground">Invite Users</h3>
              <p className="text-muted-foreground text-sm">
                Invite users to your organization. Managers can read reports, employees send reports. You can skip this step and invite users later.
              </p>
            </div>
            <div className="space-y-4">
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
                  <Button onClick={handleAddEmployee}>
                    Add
                  </Button>
                </div>
              </div>
              {employees.length > 0 && (
                <div className="space-y-2">
                  {employees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-sm text-muted-foreground">{emp.email}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-1">
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

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-foreground">You're Ready to Go Live!</h3>
              <p className="text-muted-foreground text-sm">Review your configuration before completing the setup.</p>
            </div>

            <div className="bg-muted rounded-lg p-6 space-y-4 text-sm overflow-y-auto max-h-[400px]">
              <h4 className="font-semibold text-foreground">Setup Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-medium text-foreground">{organizationName}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2 mb-2">
                  <span className="text-muted-foreground">Metrics:</span>
                  <span className="font-medium text-foreground">{selectedMetrics.length} selected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employees:</span>
                  <span className="font-medium text-foreground">{employees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Report Frequency:</span>
                  <span className="font-medium text-foreground capitalize">{globalFrequency}</span>
                </div>
                {projectName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project:</span>
                    <span className="font-medium text-foreground">{projectName}</span>
                  </div>
                )}
                {goalName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Goal:</span>
                    <span className="font-medium text-foreground">{goalName}</span>
                  </div>
                )}
                {goalName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Criteria:</span>
                    <span className="font-medium text-foreground">{criteria.length}</span>
                  </div>
                )}
                {goalName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instructions:</span>
                    <span className="font-medium text-foreground">{instructions ? 'Yes' : 'No'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-foreground">
                <strong>Next Steps:</strong> Start creating reports against your goal. Zevian will evaluate them based on your criteria and objective rules.
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
        className="bg-card rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card px-6 py-4 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-foreground">Setup your Organization</h2>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>

        <div className="p-6">
          {/* Progress Bar with Labels */}
          <div className="mb-6">
            <div className="flex gap-2 mb-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 rounded-full transition-colors ${index + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
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
                      : 'text-muted-foreground'
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


        <div className="sticky bottom-0 bg-card px-6 py-4 border-t border-border flex justify-between items-center">
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
              {currentStep === 6 && (
                <Button
                  onClick={handleNext}
                  variant="outline"
                >
                  Skip
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          ) : (
            <Button onClick={handleFinish}>
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

