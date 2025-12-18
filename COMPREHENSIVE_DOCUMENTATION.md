# Performance Tracker - Comprehensive Documentation

<div align="center">

![Performance Tracker](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

**AI-Powered Performance Management System**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Modules](#key-modules)
- [Database Schema](#database-schema)
- [AI Integration](#ai-integration)
- [API Services](#api-services)
- [User Interface](#user-interface)
- [Workflows](#workflows)
- [Multi-Tenancy](#multi-tenancy)
- [Security](#security)
- [Future Enhancements](#future-enhancements)

---

## 🎯 Overview

**Performance Tracker** is a modern, AI-powered performance management system designed for B2B SaaS environments. It enables organizations to track employee performance through structured reporting, automated AI evaluations, and comprehensive analytics dashboards.

### Key Objectives

- **Automated Performance Evaluation**: Leverage Google Gemini AI to evaluate employee reports objectively
- **Hierarchical Management**: Support multi-level organizational structures with managers and employees
- **Flexible Reporting**: Customizable reporting frequencies (daily, weekly, bi-weekly, monthly)
- **Data-Driven Insights**: Rich analytics and performance trends visualization
- **Multi-Tenancy Ready**: Built with organization-level isolation for B2B SaaS deployment

---

## ✨ Core Features

### 🤖 1. AI-Powered Evaluation System

The system integrates **Google Gemini AI** to provide:

- **Automated Report Scoring**: AI evaluates employee reports against predefined criteria
- **Weighted Criteria Evaluation**: Each criterion can have custom weights (e.g., Code Quality: 40%, Communication: 25%)
- **Detailed Reasoning**: AI provides comprehensive explanations for scores
- **Real-time Feedback**: Employees receive instant feedback on report quality before submission
- **Performance Insights**: AI generates strengths and improvement recommendations

**Example Evaluation:**
```
Report: "Completed User Auth endpoints with 95% test coverage..."
AI Score: 9.2/10
Criteria Breakdown:
  - Code Quality: 9.0/10 (40% weight)
  - Test Coverage: 9.5/10 (30% weight)
  - Documentation: 9.0/10 (30% weight)
Reasoning: "Strong work on testing coverage. Documentation update was crucial..."
```

### 📊 2. Comprehensive Dashboard

**Manager Dashboard Features:**
- Performance trends visualization with interactive charts
- Team performance overview with sortable tables
- Individual employee performance tracking
- Project-based performance analytics
- Customizable date range filtering
- Export capabilities for reports

**Employee Dashboard Features:**
- Personal performance metrics
- Goal progress tracking
- Historical report submissions
- AI-generated performance insights
- Upcoming deadlines and reminders

### 👥 3. Hierarchical Organization Management

**Multi-Level Hierarchy:**
```
VP of Engineering (Account Owner)
  ├── Senior Engineering Manager
  │   ├── Engineering Manager
  │   │   ├── Software Engineer 1
  │   │   └── Software Engineer 2
  │   └── Frontend Team Lead
  │       ├── Frontend Developer 1
  │       └── Frontend Developer 2
  └── Senior Product Manager
      └── Product Manager
          ├── Product Analyst 1
          └── Product Analyst 2
```

**Features:**
- Unlimited hierarchy depth
- Manager delegation and permissions
- Organization-wide or team-specific views
- Role-based access control

### 🎯 4. Projects & Goals Management

**Project Features:**
- Create and manage projects with descriptions and categories
- Assign multiple employees and managers to projects
- Set project-specific reporting frequencies
- Link knowledge base documentation
- AI context for project-specific evaluations

**Goal Features:**
- Define goals linked to projects
- Custom evaluation criteria with weights
- Specific instructions for AI evaluation
- Deadline tracking
- Progress monitoring

### 📝 5. Flexible Reporting System

**Report Submission:**
- Rich text editor for detailed reports
- Real-time AI feedback before submission
- File attachments support
- Draft saving capabilities
- Mobile-responsive interface

**Report Management:**
- View all reports by employee, project, or goal
- Filter by date range, score, or status
- Manager override capabilities with reasoning
- Historical report tracking
- Bulk export functionality

### ⚙️ 6. Advanced Settings & Customization

**Manager Settings:**
- **Global Frequency**: Set default reporting days for all employees
- **Per-Employee Overrides**: Customize reporting schedules for specific employees
- **Per-Project Overrides**: Set project-specific reporting frequencies
- **Late Submission Control**: Allow or restrict late submissions
- **Notification Preferences**: Configure email and in-app notifications

**Frequency Precedence:**
```
Global Settings < Project Settings < Per-Employee Settings
```

### 👤 7. Employee Management

**Features:**
- Invite employees via email with unique tokens
- Onboarding workflow for new employees
- Employee profile management
- Performance history tracking
- Team member assignment
- Role and permission management

### 📧 8. Invitation System

**Invitation Workflow:**
1. Manager sends invitation with role (employee/manager)
2. Unique token generated with expiration
3. Invitee receives email with acceptance link
4. Onboarding process upon acceptance
5. Automatic organization assignment

**Security:**
- Token-based authentication
- Expiration handling
- Status tracking (pending, accepted, expired)
- Email verification

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │ Projects │  │  Goals   │  │ Reports  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Employees │  │ Settings │  │Onboarding│  │Invitations│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │Database Service│  │ Gemini Service │  │Invitation Svc│  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐   ┌──────────────────────┐
│   Supabase (PostgreSQL)   │   │  Google Gemini AI    │
│  - Organizations          │   │  - Report Evaluation │
│  - Employees              │   │  - Feedback          │
│  - Projects               │   │  - Insights          │
│  - Goals                  │   │  - Summarization     │
│  - Reports                │   └──────────────────────┘
│  - Invitations            │
└───────────────────────────┘
```

### Component Structure

```
performance-tracker/
├── components/           # Reusable UI components
│   ├── Button.tsx
│   ├── Dropdown.tsx
│   ├── Header.tsx
│   ├── Modal.tsx
│   ├── MultiSelect.tsx
│   ├── Onboarding.tsx
│   ├── RichTextEditor.tsx
│   ├── Sidebar.tsx
│   ├── Table.tsx
│   └── ...
├── pages/               # Main application pages
│   ├── DashboardPage.tsx
│   ├── ProjectsPage.tsx
│   ├── GoalsPage.tsx
│   ├── ReportsPage.tsx
│   ├── AllReportsPage.tsx
│   ├── EmployeesPage.tsx
│   ├── SettingsPage.tsx
│   └── ...
├── services/            # Business logic & API integration
│   ├── databaseService.ts
│   ├── geminiService.ts
│   ├── invitationService.ts
│   └── supabaseClient.ts
├── hooks/               # Custom React hooks
│   ├── useProjects.ts
│   ├── useGoals.ts
│   ├── useReports.ts
│   └── useEmployees.ts
├── utils/               # Utility functions
│   ├── employeeFilter.ts
│   ├── managerPermissions.ts
│   └── testConnection.ts
├── types.ts             # TypeScript type definitions
├── constants.ts         # Sample data & constants
└── schema.sql           # Database schema
```

---

## 🛠️ Technology Stack

### Frontend
- **React 19.2.0**: Modern UI library with hooks
- **TypeScript 5.8.2**: Type-safe development
- **React Router DOM 7.9.6**: Client-side routing
- **Vite 6.2.0**: Fast build tool and dev server
- **Lucide React 0.548.0**: Icon library
- **Recharts 3.3.0**: Data visualization
- **Preline 3.2.3**: UI component library

### Backend Services
- **Supabase 2.87.0**: PostgreSQL database with real-time capabilities
- **Google Gemini AI 1.28.0**: AI-powered evaluation and insights
  - Models: `gemini-2.5-flash` (evaluation), `gemini-2.5-pro` (insights)

### Development Tools
- **@vitejs/plugin-react**: React support for Vite
- **@types/node**: Node.js type definitions

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **Supabase Account** (for database)
- **Google Gemini API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd performance-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase project:
   ```bash
   # Copy the contents of schema.sql and run in Supabase SQL Editor
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   
   Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

---

## 👥 User Roles & Permissions

### Role Types

#### 1. **Account Owner**
- **Full System Access**: Complete control over the organization
- **Permissions**:
  - `canSetGlobalFrequency`: ✅
  - `canViewOrganizationWide`: ✅
  - `canManageSettings`: ✅
- **Capabilities**:
  - Create and manage all projects, goals, and employees
  - View all reports across the organization
  - Configure global settings
  - Invite managers and employees
  - Override AI evaluations

#### 2. **Manager**
- **Team Management**: Manage assigned team members
- **Permissions** (configurable by Account Owner):
  - `canSetGlobalFrequency`: Optional
  - `canViewOrganizationWide`: Optional
  - `canManageSettings`: Optional
- **Capabilities**:
  - Create projects and goals
  - View direct reports' performance
  - Override AI scores with reasoning
  - Set team-specific reporting frequencies
  - Invite employees to their team

#### 3. **Employee**
- **Self-Service**: Submit reports and track own performance
- **Capabilities**:
  - Submit performance reports
  - View own performance metrics
  - Receive AI feedback
  - Track assigned goals and projects
  - View personal dashboard

### Permission Matrix

| Feature | Account Owner | Manager (Full) | Manager (Limited) | Employee |
|---------|---------------|----------------|-------------------|----------|
| View Organization Data | ✅ | ✅ | ❌ | ❌ |
| View Team Data | ✅ | ✅ | ✅ | ❌ |
| View Own Data | ✅ | ✅ | ✅ | ✅ |
| Create Projects | ✅ | ✅ | ✅ | ❌ |
| Create Goals | ✅ | ✅ | ✅ | ❌ |
| Submit Reports | ✅ | ✅ | ✅ | ✅ |
| Override AI Scores | ✅ | ✅ | ✅ | ❌ |
| Manage Settings | ✅ | ✅ | ❌ | ❌ |
| Invite Users | ✅ | ✅ | ✅ | ❌ |

---

## 🔑 Key Modules

### 1. Dashboard Module

**Purpose**: Central hub for performance visualization and analytics

**Key Components**:
- `DashboardPage.tsx`: Main dashboard container
- `StatCard.tsx`: Performance metric cards
- Chart components using Recharts

**Features**:
- **Performance Trends**: Line charts showing score trends over time
- **Team Overview**: Table of all team members with latest scores
- **Project Analytics**: Performance breakdown by project
- **Goal Progress**: Visual indicators of goal completion
- **Filters**: Date range, employee, project, and goal filters
- **AI Insights**: Strengths and improvement areas

**Data Flow**:
```
Reports → Aggregation → Charts/Tables → User Interface
                ↓
         AI Analysis → Insights Panel
```

### 2. Projects Module

**Purpose**: Manage projects and their assignments

**Key Components**:
- `ProjectsPage.tsx`: Project listing and management
- `ProjectDetailPage.tsx`: Detailed project view

**Features**:
- Create/Edit/Delete projects
- Assign multiple employees and managers
- Set reporting frequencies
- Link knowledge base documentation
- View project-specific reports and analytics
- AI context for project evaluations

**Project Lifecycle**:
```
Create Project → Assign Team → Create Goals → Track Reports → Analyze Performance
```

### 3. Goals Module

**Purpose**: Define and track performance goals

**Key Components**:
- `GoalsPage.tsx`: Goal listing and management
- `GoalDetailPage.tsx`: Detailed goal view with reports

**Features**:
- Create goals linked to projects
- Define custom evaluation criteria with weights
- Set specific instructions for AI evaluation
- Track deadlines
- View goal-specific reports
- Monitor progress

**Goal Structure**:
```typescript
Goal {
  name: "Improve Code Quality"
  projectId: "project-1"
  criteria: [
    { name: "Code Quality", weight: 40 },
    { name: "Test Coverage", weight: 30 },
    { name: "Documentation", weight: 30 }
  ]
  instructions: "Code should follow style guidelines..."
  deadline: "2025-12-31"
}
```

### 4. Reports Module

**Purpose**: Submit and evaluate performance reports

**Key Components**:
- `SubmitReportPage.tsx`: Report submission interface
- `ReportsPage.tsx`: Employee's report history
- `AllReportsPage.tsx`: Manager's view of all reports

**Features**:
- Rich text editor for report writing
- Real-time AI feedback
- Automated AI evaluation
- Manager override capabilities
- Detailed criterion scores
- Historical tracking
- Export functionality

**Report Submission Flow**:
```
1. Employee writes report
2. AI provides feedback (optional)
3. Employee refines and submits
4. AI evaluates against criteria
5. Manager reviews and can override
6. Report stored with full history
```

### 5. Employees Module

**Purpose**: Manage team members and organizational structure

**Key Components**:
- `EmployeesPage.tsx`: Employee directory
- `EmployeeDetailPage.tsx`: Individual employee performance view
- `InviteUserModal.tsx`: User invitation interface

**Features**:
- Employee directory with search
- Hierarchical organization view
- Performance history per employee
- Invitation management
- Role and permission assignment
- Team structure visualization

### 6. Settings Module

**Purpose**: Configure system-wide and team-specific settings

**Key Components**:
- `SettingsPage.tsx`: Comprehensive settings interface

**Features**:
- **Frequency Settings**:
  - Global reporting days
  - Per-employee overrides
  - Per-project overrides
- **Notification Settings**:
  - Email notifications
  - In-app alerts
  - Reminder schedules
- **Permission Management**:
  - Grant/revoke manager permissions
  - Configure access levels
- **Late Submission Control**:
  - Allow/disallow late reports
  - Grace period configuration

### 7. Onboarding Module

**Purpose**: Guide new users through initial setup

**Key Components**:
- `Onboarding.tsx`: Multi-step onboarding wizard

**Features**:
- **Step 1**: Organization setup
- **Step 2**: Add team members
- **Step 3**: Configure settings
- **Step 4**: Create first project (optional)
- **Step 5**: Create first goal (optional)
- Progress tracking
- Skip option for quick start

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│ Organizations   │
│ ─────────────── │
│ id (PK)         │
│ name            │
│ plan_tier       │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────────────────┐
    │                                     │
┌───▼──────────┐                   ┌─────▼────────┐
│ Employees    │                   │ Projects     │
│ ──────────── │                   │ ──────────── │
│ id (PK)      │                   │ id (PK)      │
│ org_id (FK)  │◄──────────────────┤ org_id (FK)  │
│ name         │                   │ name         │
│ email        │                   │ description  │
│ role         │                   │ category     │
│ manager_id   │                   │ frequency    │
└──────┬───────┘                   └──────┬───────┘
       │                                  │
       │ 1:N                              │ 1:N
       │                                  │
┌──────▼──────────┐              ┌────────▼──────┐
│ Reports         │              │ Goals         │
│ ─────────────── │              │ ───────────── │
│ id (PK)         │              │ id (PK)       │
│ goal_id (FK)    │◄─────────────┤ project_id    │
│ employee_id (FK)│              │ name          │
│ report_text     │              │ instructions  │
│ eval_score      │              │ deadline      │
│ eval_reasoning  │              └───────┬───────┘
└─────────────────┘                      │
                                         │ 1:N
                                         │
                                  ┌──────▼────────┐
                                  │ Criteria      │
                                  │ ───────────── │
                                  │ id (PK)       │
                                  │ goal_id (FK)  │
                                  │ name          │
                                  │ weight        │
                                  └───────────────┘
```

### Core Tables

#### 1. **organizations**
```sql
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    plan_tier TEXT DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. **employees**
```sql
CREATE TABLE employees (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    title TEXT,
    role TEXT CHECK (role IN ('manager', 'employee', 'admin')),
    manager_id TEXT REFERENCES employees(id),
    is_account_owner BOOLEAN DEFAULT FALSE,
    join_date DATE,
    UNIQUE(email, organization_id)
);
```

#### 3. **projects**
```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    organization_id TEXT REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    report_frequency TEXT CHECK (report_frequency IN 
        ('daily', 'weekly', 'bi-weekly', 'monthly')),
    knowledge_base_link TEXT,
    ai_context TEXT,
    created_by TEXT
);
```

#### 4. **goals**
```sql
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    instructions TEXT NOT NULL,
    deadline DATE,
    manager_id TEXT REFERENCES employees(id),
    created_by TEXT REFERENCES employees(id)
);
```

#### 5. **criteria**
```sql
CREATE TABLE criteria (
    id TEXT PRIMARY KEY,
    goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    weight INTEGER CHECK (weight >= 0 AND weight <= 100),
    display_order INTEGER DEFAULT 0
);
```

#### 6. **reports**
```sql
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    report_text TEXT NOT NULL,
    submission_date TIMESTAMPTZ NOT NULL,
    evaluation_score NUMERIC(4,2) CHECK (evaluation_score >= 0 AND evaluation_score <= 10),
    manager_overall_score NUMERIC(4,2),
    manager_override_reasoning TEXT,
    evaluation_reasoning TEXT NOT NULL
);
```

#### 7. **report_criterion_scores**
```sql
CREATE TABLE report_criterion_scores (
    id SERIAL PRIMARY KEY,
    report_id TEXT REFERENCES reports(id) ON DELETE CASCADE,
    criterion_name TEXT NOT NULL,
    score NUMERIC(4,2) CHECK (score >= 0 AND score <= 10)
);
```

#### 8. **invitations**
```sql
CREATE TABLE invitations (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    role TEXT CHECK (role IN ('manager', 'employee')),
    organization_id TEXT REFERENCES organizations(id),
    invited_by TEXT REFERENCES employees(id),
    invited_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'accepted', 'expired'))
);
```

### Supporting Tables

- **employee_permissions**: Granular permission control
- **project_assignees**: Many-to-many project assignments
- **manager_settings**: Manager-specific configurations
- **manager_selected_days**: Global reporting day settings
- **employee_frequency_settings**: Per-employee frequency overrides
- **project_frequency_settings**: Per-project frequency overrides

---

## 🤖 AI Integration

### Google Gemini AI Services

#### 1. **Report Evaluation**

**Function**: `evaluateReport(reportText, criteria)`

**Purpose**: Automatically score employee reports against defined criteria

**Model**: `gemini-2.5-flash`

**Input**:
```typescript
{
  reportText: "Completed User Auth endpoints with 95% test coverage...",
  criteria: [
    { name: "Code Quality", weight: 40 },
    { name: "Test Coverage", weight: 30 },
    { name: "Documentation", weight: 30 }
  ]
}
```

**Output**:
```typescript
{
  reasoning: "Strong work on testing coverage. Documentation update was crucial...",
  criteriaScores: [
    { name: "Code Quality", score: 9.0 },
    { name: "Test Coverage", score: 9.5 },
    { name: "Documentation", score: 9.0 }
  ]
}
```

**Configuration**:
- Temperature: 0.2 (low for consistency)
- Response format: Structured JSON
- System instruction: Unbiased evaluator

#### 2. **Report Feedback**

**Function**: `getReportFeedback(reportText, criteria)`

**Purpose**: Provide real-time feedback to employees before submission

**Model**: `gemini-2.5-flash`

**Example**:
```
Input: "Fixed some bugs"
Output: "Your report is quite brief. Consider adding:
- Specific bug descriptions
- Impact of the fixes
- Testing performed
- Any challenges encountered"
```

#### 3. **Performance Summarization**

**Function**: `summarizePerformance(reasonings, averageScores)`

**Purpose**: Generate comprehensive performance summaries

**Model**: `gemini-2.5-pro`

**Use Case**: Dashboard insights and periodic reviews

#### 4. **Insights Generation**

**Function**: `generateInsights(reports)`

**Purpose**: Identify strengths and improvement areas

**Model**: `gemini-2.5-pro`

**Output**:
```typescript
{
  strengths: "The employee consistently excels in code quality and problem-solving...",
  improvements: "An opportunity for growth lies in communication and documentation..."
}
```

### AI Evaluation Flow

```
┌─────────────────────┐
│ Employee Submits    │
│ Report              │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Gemini AI Evaluates │
│ Against Criteria    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Generate Scores &   │
│ Reasoning           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Store in Database   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Manager Reviews     │
│ (Optional Override) │
└─────────────────────┘
```

---

## 🔌 API Services

### Database Service (`databaseService.ts`)

Provides CRUD operations for all entities:

#### Organization Service
```typescript
organizationService.getById(id)
organizationService.create(organization)
organizationService.update(id, updates)
```

#### Project Service
```typescript
projectService.getAll()
projectService.getById(id)
projectService.create(project)
projectService.update(id, updates)
projectService.delete(id)
projectService.getAssignees(projectId)
projectService.assignEmployee(projectId, employeeId, type)
```

#### Goal Service
```typescript
goalService.getAll()
goalService.getById(id)
goalService.getByProjectId(projectId)
goalService.create(goal)
goalService.update(id, updates)
goalService.delete(id)
```

#### Report Service
```typescript
reportService.getAll()
reportService.getById(id)
reportService.getByEmployeeId(employeeId)
reportService.getByGoalId(goalId)
reportService.create(report)
reportService.update(id, updates)
reportService.delete(id)
```

#### Employee Service
```typescript
employeeService.getAll()
employeeService.getById(id)
employeeService.getByEmail(email)
employeeService.getManagers()
employeeService.getTeamMembers(managerId)
employeeService.create(employee)
employeeService.update(id, updates)
employeeService.delete(id)
```

### Gemini Service (`geminiService.ts`)

AI-powered evaluation and insights:

```typescript
// Evaluate a report
const evaluation = await evaluateReport(reportText, criteria);

// Get feedback before submission
const feedback = await getReportFeedback(reportText, criteria);

// Generate performance summary
const summary = await summarizePerformance(reasonings, scores);

// Generate insights
const insights = await generateInsights(reports);
```

### Invitation Service (`invitationService.ts`)

Manage user invitations:

```typescript
invitationService.create(invitation)
invitationService.getByToken(token)
invitationService.accept(token, employeeData)
invitationService.expire(token)
```

---

## 🎨 User Interface

### Design System

**Color Palette**:
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Neutral: Gray scale

**Typography**:
- Headings: System font stack
- Body: System font stack
- Monospace: For code snippets

**Components**:
- Buttons: Primary, Secondary, Danger variants
- Inputs: Text, Textarea, Select, MultiSelect
- Tables: Sortable, filterable, responsive
- Modals: Centered, backdrop, accessible
- Cards: Stat cards, info cards
- Charts: Line, bar, pie (Recharts)

### Responsive Design

- **Desktop**: Full-featured dashboard with sidebar
- **Tablet**: Collapsible sidebar, optimized tables
- **Mobile**: Bottom navigation, stacked layouts

### Accessibility

- ARIA labels on interactive elements
- Keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Focus indicators

---

## 🔄 Workflows

### 1. New Employee Onboarding

```
1. Account Owner/Manager sends invitation
2. Employee receives email with unique link
3. Employee clicks link and lands on acceptance page
4. Employee fills in profile information
5. System creates employee record
6. Employee completes onboarding wizard
7. Employee gains access to dashboard
```

### 2. Report Submission & Evaluation

```
1. Employee navigates to Submit Report page
2. Selects goal to report on
3. Writes report in rich text editor
4. (Optional) Requests AI feedback
5. Refines report based on feedback
6. Submits report
7. AI evaluates report against criteria
8. Scores and reasoning stored in database
9. Manager receives notification
10. Manager reviews and can override score
11. Employee sees final evaluation
```

### 3. Project & Goal Creation

```
1. Manager creates new project
2. Sets project details and frequency
3. Assigns team members
4. Creates goals linked to project
5. Defines evaluation criteria with weights
6. Sets instructions for AI evaluation
7. Team members receive notifications
8. Goals appear in employee dashboards
```

### 4. Performance Review

```
1. Manager navigates to Dashboard
2. Selects employee or project filter
3. Views performance trends and charts
4. Reviews individual reports
5. Generates AI insights
6. Exports data for formal review
7. Discusses with employee
8. Sets new goals or adjusts criteria
```

---

## 🏢 Multi-Tenancy

### Organization Isolation

**Database Level**:
- All core tables have `organization_id` foreign key
- Row-level security policies (to be implemented)
- Unique constraints scoped to organization

**Application Level**:
- Organization context in all queries
- User authentication tied to organization
- Data filtering by organization ID

**Scalability**:
- Supports unlimited organizations
- Isolated data per organization
- Shared infrastructure

### Plan Tiers

**Free Tier**:
- Up to 10 employees
- Basic features
- Limited AI evaluations

**Business Tier**:
- Up to 100 employees
- Advanced analytics
- Unlimited AI evaluations
- Priority support

**Enterprise Tier**:
- Unlimited employees
- Custom integrations
- Dedicated support
- SLA guarantees

---

## 🔒 Security

### Authentication
- Supabase Auth integration (ready for implementation)
- Email/password authentication
- OAuth providers support
- Session management

### Authorization
- Role-based access control (RBAC)
- Permission-based feature access
- Manager hierarchy enforcement
- Organization-level isolation

### Data Protection
- Encrypted data at rest (Supabase)
- Encrypted data in transit (HTTPS)
- API key protection
- Environment variable security

### Best Practices
- Input validation
- SQL injection prevention (Supabase ORM)
- XSS protection
- CSRF tokens
- Rate limiting (to be implemented)

---

## 🚀 Future Enhancements

### Planned Features

1. **Real-time Notifications**
   - WebSocket integration
   - Push notifications
   - Email digests

2. **Advanced Analytics**
   - Predictive performance trends
   - Anomaly detection
   - Comparative analytics

3. **Integrations**
   - Slack notifications
   - JIRA project sync
   - GitHub commit tracking
   - Calendar integration

4. **Mobile App**
   - React Native application
   - Offline report drafting
   - Push notifications

5. **Customization**
   - Custom evaluation criteria templates
   - Branded dashboards
   - Custom report templates

6. **AI Enhancements**
   - Multi-language support
   - Voice-to-text reports
   - Automated goal suggestions
   - Sentiment analysis

7. **Compliance & Export**
   - GDPR compliance tools
   - Data export utilities
   - Audit logs
   - Compliance reports

---

## 📞 Support & Resources

### Documentation
- [Getting Started Guide](#getting-started)
- [API Reference](#api-services)
- [Database Schema](#database-schema)

### Links
- AI Studio App: https://ai.studio/apps/drive/1q4zRFNt5dAJYeJ_5BWs8_rpxyuD_tihn
- GitHub Repository: [Your Repository URL]

### Contact
- Support Email: support@performance-tracker.com
- Documentation: docs.performance-tracker.com

---

## 📄 License

[Your License Here]

---

<div align="center">

**Built with ❤️ using React, TypeScript, Supabase, and Google Gemini AI**

</div>
