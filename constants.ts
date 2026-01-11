import { Goal, Report, Employee, Project } from './types';

export const STANDARD_METRICS = [
  { id: 'cycle-time', name: 'Cycle Time', friendlyName: 'Delivery Speed', description: 'How quickly work goes from "started" to "submitted".' },
  { id: 'mttr', name: 'MTTR', friendlyName: 'Fix-it Rate', description: 'How fast the person resolves bugs or errors mentioned in reports.' },
  { id: 'scope-completion', name: 'Scope Completion', friendlyName: 'Goal Progress', description: 'The percentage of the assigned goal or task actually finished.' },
  { id: 'innovation-velocity', name: 'Innovation Velocity', friendlyName: 'New Value', description: 'Frequency of mentions of "new features," "ideas," or "improvements".' },
  { id: 'business-value', name: 'Business Value', friendlyName: 'Impact Level', description: "The AI's estimate of how much this work helps the company's bottom line." },
  { id: 'documentation', name: 'Documentation', friendlyName: 'Clarity', description: 'How well the report explains the work (extracted from rich text quality).' },
  { id: 'collaboration', name: 'Collaboration', friendlyName: 'Teamwork', description: 'Mentions of helping others, code reviews, or cross-department syncs.' },
  { id: 'compliance', name: 'Compliance', friendlyName: 'Policy Adherence', description: 'Following specific instructions or brand guidelines set in the goal.' },
  { id: 'quality', name: 'Quality', friendlyName: 'Work Excellence', description: 'The raw AI score based on technical or descriptive accuracy.' },
  { id: 'reliability', name: 'Reliability', friendlyName: 'Consistency', description: 'How often they submit reports on the required schedule without gaps.' },
];

export const sampleEmployees: Employee[] = [
  // Account Owner / Top Level Manager
  {
    id: 'emp-1',
    organizationId: 'org-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    title: 'VP of Engineering',
    role: 'manager',
    managerId: undefined,
    isAccountOwner: true,
    permissions: {
      canSetGlobalFrequency: true,
      canViewOrganizationWide: true,
      canManageSettings: true,
    }
  },
  // Senior Managers (report to Alice)
  {
    id: 'emp-2',
    organizationId: 'org-1',
    name: 'Bob Williams',
    email: 'bob@example.com',
    title: 'Senior Engineering Manager',
    role: 'manager',
    managerId: 'emp-1',
    permissions: {
      canSetGlobalFrequency: true,
      canManageSettings: true,
    }
  },
  {
    id: 'emp-4',
    organizationId: 'org-1',
    name: 'Diana Martinez',
    email: 'diana@example.com',
    title: 'Senior Product Manager',
    role: 'manager',
    managerId: 'emp-1',
    permissions: {
      canSetGlobalFrequency: true,
      canViewOrganizationWide: true,
      canManageSettings: true,
    }
  },
  {
    id: 'emp-5',
    organizationId: 'org-1',
    name: 'Ethan Chen',
    email: 'ethan@example.com',
    title: 'Senior Design Manager',
    role: 'manager',
    managerId: 'emp-1',
    permissions: {
      canManageSettings: true,
    }
  },
  // Junior Managers (report to Bob)
  {
    id: 'emp-3',
    organizationId: 'org-1',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    title: 'Engineering Manager',
    role: 'manager',
    managerId: 'emp-2',
    permissions: {
      canManageSettings: true,
    }
  },
  {
    id: 'emp-6',
    organizationId: 'org-1',
    name: 'Fiona O\'Brien',
    email: 'fiona@example.com',
    title: 'Frontend Team Lead',
    role: 'manager',
    managerId: 'emp-2',
  },
  // Junior Manager (reports to Diana)
  {
    id: 'emp-7',
    organizationId: 'org-1',
    name: 'George Kumar',
    email: 'george@example.com',
    title: 'Product Manager',
    role: 'manager',
    managerId: 'emp-4',
  },
  // Regular Employees (report to managers)
  {
    id: 'emp-8',
    organizationId: 'org-1',
    name: 'Hannah Lee',
    email: 'hannah@example.com',
    title: 'Software Engineer',
    role: 'employee',
    managerId: 'emp-3',
  },
  {
    id: 'emp-9',
    organizationId: 'org-1',
    name: 'Ian Thompson',
    email: 'ian@example.com',
    title: 'Software Engineer',
    role: 'employee',
    managerId: 'emp-3',
  },
  {
    id: 'emp-10',
    organizationId: 'org-1',
    name: 'Julia Rodriguez',
    email: 'julia@example.com',
    title: 'Frontend Developer',
    role: 'employee',
    managerId: 'emp-6',
  },
  {
    id: 'emp-11',
    organizationId: 'org-1',
    name: 'Kevin Park',
    email: 'kevin@example.com',
    title: 'Frontend Developer',
    role: 'employee',
    managerId: 'emp-6',
  },
  {
    id: 'emp-12',
    organizationId: 'org-1',
    name: 'Lisa Anderson',
    email: 'lisa@example.com',
    title: 'UX Designer',
    role: 'employee',
    managerId: 'emp-5',
  },
  {
    id: 'emp-13',
    organizationId: 'org-1',
    name: 'Michael Zhang',
    email: 'michael@example.com',
    title: 'Product Analyst',
    role: 'employee',
    managerId: 'emp-7',
  },
  {
    id: 'emp-14',
    organizationId: 'org-1',
    name: 'Nina Patel',
    email: 'nina@example.com',
    title: 'Product Analyst',
    role: 'employee',
    managerId: 'emp-7',
  },
];


export const sampleProjects: Project[] = [
  {
    id: 'project-1',
    organizationId: 'org-1',
    name: 'Q3 Frontend Development',
    description: 'Complete frontend development for Q3 including authentication, dashboard, and user management features.',
    category: 'Software Dev',
    assignees: [{ type: 'employee', id: 'emp-6' }],
    reportFrequency: 'weekly',
    knowledgeBaseLink: 'https://docs.example.com/q3-frontend',
    createdBy: 'emp-1',
  },
  {
    id: 'project-2',
    organizationId: 'org-1',
    name: 'Q3 UX/UI Design',
    description: 'Design and implement user interface improvements for the main application.',
    category: 'Design',
    assignees: [{ type: 'employee', id: 'emp-3' }],
    reportFrequency: 'bi-weekly',
    createdBy: 'emp-1',
  },
];

export const sampleGoals: Goal[] = [
  {
    id: 'goal-1',
    name: 'Improve Code Quality',
    projectId: 'project-1',
    criteria: [
      { id: 'c1-1', name: 'Code Quality', weight: 40 },
      { id: 'c1-2', name: 'Communication', weight: 25 },
      { id: 'c1-3', name: 'Timeliness', weight: 20 },
      { id: 'c1-4', name: 'Problem Solving', weight: 15 },
    ],
    instructions: 'Code should follow established style guidelines and best practices.\nAll functions must have proper error handling and input validation.\nCode must be reviewed by at least one team member before merging.\nDocumentation should be updated for any new features or significant changes.',
    managerId: 'emp-1', // Created by emp-1 (Alice)
    createdBy: 'emp-1',
  },
  {
    id: 'goal-2',
    name: 'Increase User Engagement',
    projectId: 'project-2',
    criteria: [
      { id: 'c2-1', name: 'Creativity', weight: 50 },
      { id: 'c2-2', name: 'User Feedback Incorporation', weight: 50 },
    ],
    instructions: 'Designs must align with user research findings and feedback.\nAll UI components should be accessible and meet WCAG 2.1 AA standards.\nDesign iterations should demonstrate clear improvement over previous versions.\nUser testing results should show positive feedback on usability.',
    managerId: 'emp-1', // Created by emp-1 (Alice)
    createdBy: 'emp-1',
  }
];

export const sampleReports: Report[] = [
  {
    id: 'report-1',
    goalId: 'goal-1',
    employeeId: 'emp-1',
    reportText: 'Completed the user authentication flow, including JWT implementation and protected routes. Wrote unit tests and updated documentation. The main challenge was integrating with the legacy identity provider, but I resolved it by creating an adapter.',
    submissionDate: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
    evaluationScore: 8.8,
    managerOverallScore: 9.0,
    evaluationReasoning: 'The report demonstrates strong technical execution and problem-solving skills. The proactive approach to documentation and testing is commendable, indicating high code quality.',
    criterionScores: [
      { criterionName: 'Code Quality', score: 9 },
      { criterionName: 'Communication', score: 8 },
      { criterionName: 'Timeliness', score: 9 },
      { criterionName: 'Problem Solving', score: 10 },
    ],
  },
  {
    id: 'report-2',
    goalId: 'goal-1',
    employeeId: 'emp-2',
    reportText: 'Refactored the main dashboard components to use the new state management library. This improved performance by about 15%. I also collaborated with the design team to ensure the UI was consistent. Some delays were encountered due to shifting requirements.',
    submissionDate: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(),
    evaluationScore: 8.2,
    evaluationReasoning: 'The work shows a solid understanding of performance optimization and collaborative skills. The mention of delays slightly impacts the timeliness score, but the overall contribution is positive.',
    criterionScores: [
      { name: 'Code Quality', score: 9 },
      { name: 'Communication', score: 9 },
      { name: 'Timeliness', score: 7 },
      { name: 'Problem Solving', score: 8 },
    ],
  },
  {
    id: 'report-3',
    goalId: 'goal-1',
    employeeId: 'emp-1',
    reportText: 'This week I fixed several critical bugs reported by QA and deployed a hotfix to production. I also started research on the upcoming internationalization feature, providing a technical brief to the team.',
    submissionDate: new Date().toISOString(),
    evaluationScore: 9.1,
    evaluationReasoning: 'Excellent work in addressing critical issues promptly and taking initiative on future tasks. This demonstrates strong ownership and proactive communication.',
    criterionScores: [
      { name: 'Code Quality', score: 9 },
      { name: 'Communication', score: 10 },
      { name: 'Timeliness', score: 9 },
      { name: 'Problem Solving', score: 9 },
    ],
  },
  {
    id: 'report-4',
    goalId: 'goal-1',
    employeeId: 'emp-2',
    reportText: 'Worked on the authentication module but encountered several issues. The implementation is incomplete and needs more work. Some tests are failing and documentation is missing.',
    submissionDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    evaluationScore: 4.5,
    evaluationReasoning: 'The report indicates incomplete work with failing tests and missing documentation. This suggests the work does not meet the expected quality standards and requires significant improvement.',
    criterionScores: [
      { name: 'Code Quality', score: 4 },
      { name: 'Communication', score: 5 },
      { name: 'Timeliness', score: 5 },
      { name: 'Problem Solving', score: 4 },
    ],
  },
  {
    id: 'report-5',
    goalId: 'goal-2',
    employeeId: 'emp-3',
    reportText: 'Started working on the new design system but progress has been slow. The initial mockups were not well received and need to be redone. Still working on understanding the requirements better.',
    submissionDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    evaluationScore: 5.2,
    evaluationReasoning: 'The work shows limited progress and indicates a need for better understanding of requirements. The quality of initial deliverables was below expectations.',
    evaluationCriteriaScores: [
      { name: 'Creativity', score: 5 },
      { name: 'User Feedback Incorporation', score: 5.5 },
    ],
  },
];