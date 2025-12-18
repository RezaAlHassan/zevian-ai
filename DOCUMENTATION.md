# Performance Tracker - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [View Modes](#view-modes)
3. [Core Flows](#core-flows)
4. [Inputs and Forms](#inputs-and-forms)
5. [Data Flow](#data-flow)
6. [Pages and Features](#pages-and-features)

---

## Overview

The Performance Tracker is a comprehensive employee performance management system that uses AI (Google Gemini) to evaluate work reports. The application supports two distinct view modes: **Manager View** and **Employee View**, each with different capabilities and access levels.

### Key Technologies
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS with Datadog Design System (Dark Theme)
- **AI Integration**: Google Gemini API for report evaluation and insights
- **Charts**: Recharts for data visualization

---

## View Modes

### Manager View
Managers have access to:
- **Employees**: View all employees, search, see average scores
- **Teams**: Create and manage teams
- **Goals**: Create goals with criteria and assign to employees/teams
- **Settings**: Configure report submission frequency (Daily, Weekly, Bi-weekly, Monthly)

### Employee View
Employees have access to:
- **Dashboard**: Personal performance overview with charts and insights
- **Submit Report**: Create and submit work reports with rich text editor
- **My Reports**: View all submitted reports in table format

---

## Core Flows

### 1. Report Submission Flow (Employee)

```
1. Employee clicks "Submit Report" button in header
   ↓
2. Select Goal (from available goals assigned to employee)
   ↓
3. Write Report using Rich Text Editor
   - Supports: Bold, Italic, Underline, Lists, Alignment
   - Minimum 50 characters required
   ↓
4. Click "Preview Evaluation"
   ↓
5. AI Evaluation Process:
   - Report text is sent to Gemini API
   - AI evaluates against goal criteria
   - Returns scores for each criterion + overall reasoning
   ↓
6. Preview Modal Shows:
   - Overall Evaluation Score (out of 10)
   - Evaluation Summary/Reasoning
   - Criteria Breakdown with scores and progress bars
   ↓
7. Employee Options:
   - "Revise Report" → Returns to editor
   - "Submit Report" → Final submission
   ↓
8. Report Saved:
   - Report stored with HTML formatting
   - Evaluation scores and reasoning saved
   - Appears in "My Reports" page
```

### 2. Goal Creation Flow (Manager)

```
1. Manager navigates to Goals page
   ↓
2. Fill Goal Form:
   - Goal Name (text input)
   - Assign To: Employee or Team (dropdown)
   - Select specific employee/team (dropdown)
   ↓
3. Add Scoring Criteria:
   - Criterion Name (text input)
   - Weight % (number input, 1-100)
   - Click "+" to add
   - Total weight must equal 100%
   ↓
4. Validation:
   - Goal name required
   - At least one criterion required
   - Total criteria weight = 100%
   - Assignee must be selected
   ↓
5. Click "Save Goal"
   ↓
6. Goal appears in "Existing Goals" table
   - Available for report assignment
```

### 3. Team Creation Flow (Manager)

```
1. Manager navigates to Teams page
   ↓
2. Fill Team Form:
   - Team Name (text input)
   ↓
3. Select Team Members:
   - Checkbox list of all employees
   - Select multiple employees
   ↓
4. Click "Create Team"
   ↓
5. Team appears in "Existing Teams" table
   - Can be assigned goals
```

### 4. Settings Configuration Flow (Manager)

```
1. Manager navigates to Settings page
   ↓
2. Choose Frequency Scope:
   - "Global (All Employees)" OR
   - "Per-Employee"
   ↓
3. If Global:
   - Select frequency: Daily/Weekly/Bi-weekly/Monthly
   - Applies to all employees
   ↓
4. If Per-Employee:
   - Individual dropdown for each employee
   - Set custom frequency per employee
   ↓
5. Click "Save Settings"
   ↓
6. Settings persisted and applied
```

### 5. Report Evaluation Flow (AI)

```
1. Report text submitted to Gemini API
   ↓
2. AI receives:
   - Report text (plain text, HTML stripped)
   - Goal criteria with weights
   ↓
3. AI Evaluation:
   - Scores each criterion (1-10 scale)
   - Generates overall reasoning
   - Returns structured JSON response
   ↓
4. System calculates:
   - Weighted overall score
   - Criteria breakdown
   ↓
5. Results displayed in preview modal
```

### 6. Dashboard Insights Flow (Employee/Manager)

```
1. User navigates to Dashboard
   ↓
2. Select Date Range:
   - From Date (date picker)
   - To Date (date picker)
   ↓
3. System filters reports by date range
   ↓
4. Automatic Insights Generation:
   - AI analyzes all reports in period
   - Generates strengths and improvements
   ↓
5. Dashboard displays:
   - Stat cards (Reports count, Average score, etc.)
   - Radar chart (Criteria performance)
   - Overall score display
   - Career Coach insights
   - Report history table
   ↓
6. Optional: Click "Generate Summary"
   - AI creates comprehensive performance summary
```

---

## Inputs and Forms

### 1. Submit Report Form (`SubmitReportPage`)

**Inputs:**
- **Employee Selector** (Manager view only)
  - Type: Dropdown select
  - Options: All employees
  - Required: Yes
  - Action: Filters available goals

- **Goal Selector**
  - Type: Dropdown select
  - Options: Goals assigned to selected employee
  - Required: Yes
  - Disabled: Until employee selected

- **Report Text Editor**
  - Type: Rich Text Editor (contentEditable)
  - Features: Bold, Italic, Underline, Lists, Alignment
  - Validation: Minimum 50 characters (HTML stripped for count)
  - Placeholder: "Describe the work you've completed..."
  - Stores: HTML formatted text

**Actions:**
- **Preview Evaluation Button**
  - Triggers: AI evaluation
  - Validates: Goal selected, employee selected, 50+ characters
  - Shows: Loading spinner during processing

- **Submit Report Button** (in preview modal)
  - Saves: Report with evaluation scores
  - Clears: Form after submission

### 2. Goal Creation Form (`GoalsPage`)

**Inputs:**
- **Goal Name**
  - Type: Text input
  - Required: Yes
  - Placeholder: "e.g., Q4 Marketing Campaign"

- **Assignee Type**
  - Type: Dropdown select
  - Options: "Employee" or "Team"
  - Required: Yes

- **Assignee Selection**
  - Type: Dropdown select
  - Options: Filtered by assignee type
  - Required: Yes

- **Criterion Name**
  - Type: Text input
  - Placeholder: "Criterion Name (e.g., Quality)"
  - Required: For each criterion

- **Criterion Weight**
  - Type: Number input
  - Range: 1-100
  - Required: For each criterion
  - Validation: Total must equal 100%

**Actions:**
- **Add Criterion Button** (+)
  - Adds: New criterion to list
  - Validates: Name and weight provided

- **Remove Criterion Button** (Trash icon)
  - Removes: Criterion from list

- **Save Goal Button**
  - Validates: All fields, total weight = 100%
  - Creates: New goal with criteria

### 3. Team Creation Form (`TeamsPage`)

**Inputs:**
- **Team Name**
  - Type: Text input
  - Required: Yes
  - Placeholder: "e.g., Core Platform Squad"

- **Team Members**
  - Type: Checkboxes
  - Options: All employees
  - Multiple: Yes
  - Required: At least one

**Actions:**
- **Create Team Button**
  - Validates: Team name and at least one member
  - Creates: New team

### 4. Settings Form (`SettingsPage`)

**Inputs:**
- **Frequency Scope Toggle**
  - Type: Button group (Global vs Per-Employee)
  - Options: "Global (All Employees)" or "Per-Employee"
  - Default: Global

- **Global Frequency** (if Global selected)
  - Type: Dropdown select
  - Options: Daily (1), Weekly (7), Bi-weekly (14), Monthly (30)
  - Default: Daily

- **Per-Employee Frequencies** (if Per-Employee selected)
  - Type: Dropdown select per employee
  - Options: Daily, Weekly, Bi-weekly, Monthly
  - Individual: Each employee can have different frequency

**Actions:**
- **Save Settings Button**
  - Persists: Settings to application state
  - Shows: Success notification

### 5. Employee Search (`EmployeesPage`)

**Inputs:**
- **Search Query**
  - Type: Text input with search icon
  - Searches: Employee name and email
  - Real-time: Filters as you type
  - Case-insensitive

### 6. Date Range Filters (`DashboardPage`)

**Inputs:**
- **Start Date**
  - Type: Date picker
  - Default: 30 days ago
  - Filters: Reports from this date

- **End Date**
  - Type: Date picker
  - Default: Today
  - Filters: Reports until this date

**Actions:**
- **Generate Summary Button**
  - Triggers: AI summary generation
  - Input: All report reasonings + criteria averages
  - Output: Comprehensive performance summary

### 7. Report Sorting (`ReportsPage`)

**Inputs:**
- **Sort Order**
  - Type: Dropdown select
  - Options: "Newest First" or "Oldest First"
  - Default: Newest First
  - Action: Re-sorts report table

---

## Data Flow

### Data Models

#### Employee
```typescript
{
  id: string;
  name: string;
  email: string;
  managerId?: string;
}
```

#### Team
```typescript
{
  id: string;
  name: string;
  memberIds: string[];
}
```

#### Goal
```typescript
{
  id: string;
  name: string;
  criteria: Criterion[];
  assignee: {
    type: 'employee' | 'team';
    id: string;
  };
}
```

#### Criterion
```typescript
{
  id: string;
  name: string;
  weight: number; // Percentage (1-100)
}
```

#### Report
```typescript
{
  id: string;
  goalId: string;
  employeeId: string;
  reportText: string; // HTML formatted
  submissionDate: string; // ISO 8601
  evaluationScore: number; // 1-10
  managerOverallScore?: number; // Manager override (1-10)
  evaluationReasoning: string; // AI generated
  evaluationCriteriaScores: ReportCriterionScore[];
}
```

#### ReportCriterionScore
```typescript
{
  name: string;
  score: number; // 1-10
}
```

#### ManagerSettings
```typescript
{
  reportFrequency: number; // Days between reports
  globalFrequency: boolean;
  employeeFrequencies?: { [employeeId: string]: number };
}
```

### State Management

All state is managed in `App.tsx` using React hooks:
- `useState` for local state
- `useCallback` for memoized functions
- `useMemo` for computed values
- State includes: goals, reports, employees, teams, settings, view mode, current page

### Data Persistence

Currently, data is stored in component state (in-memory). On page refresh, data resets to sample data from `constants.ts`.

---

## Pages and Features

### Manager View Pages

#### 1. Employees Page
**Purpose**: View and manage all employees

**Features:**
- Total employees count
- Average score across all employees (calculated from reports)
- Search functionality (name/email)
- Employee table with actions
- Click "View Details" → Employee Detail Page

**Inputs:**
- Search query (text input)

**Outputs:**
- Filtered employee list
- Average score calculation

#### 2. Teams Page
**Purpose**: Create and manage teams

**Features:**
- Create new teams
- Assign employees to teams
- View existing teams
- Team member lists

**Inputs:**
- Team name
- Employee checkboxes

#### 3. Goals Page
**Purpose**: Create and manage performance goals

**Features:**
- Create goals with criteria
- Assign to employees or teams
- Define scoring criteria with weights
- View all existing goals

**Inputs:**
- Goal name
- Assignee type and selection
- Multiple criteria (name + weight)

#### 4. Settings Page
**Purpose**: Configure report submission frequency

**Features:**
- Global or per-employee frequency settings
- Frequency options: Daily, Weekly, Bi-weekly, Monthly
- Save and persist settings

**Inputs:**
- Frequency scope toggle
- Frequency dropdown(s)

### Employee View Pages

#### 1. Dashboard Page
**Purpose**: Personal performance overview

**Features:**
- Date range filtering
- Stat cards (Reports count, Average score)
- Radar chart (Criteria performance)
- Overall score display
- AI-generated insights (Career Coach)
- Report history table
- Generate summary button

**Inputs:**
- Start date
- End date
- Generate summary button (triggers AI)

**Outputs:**
- Filtered reports
- Performance metrics
- Visualizations
- AI insights

#### 2. Submit Report Page
**Purpose**: Create and submit work reports

**Features:**
- Rich text editor
- Goal selection
- AI evaluation preview
- Report submission

**Inputs:**
- Goal selector
- Rich text editor
- Preview evaluation button
- Submit button

#### 3. My Reports Page
**Purpose**: View all submitted reports

**Features:**
- Table format
- Sort by date
- Report preview
- View full report modal
- AI analysis display (no scores)

**Inputs:**
- Sort order dropdown

**Outputs:**
- Sorted report table
- Report detail modal

### Shared Components

#### Modal
- Reusable modal component
- Backdrop blur
- Close button
- Scrollable content

#### Table
- Reusable table component
- Headers and rows
- Hover effects
- Responsive

#### StatCard
- Display statistics
- Icon support
- Value display

#### RichTextEditor
- ContentEditable-based
- Toolbar with formatting
- Character count
- HTML output

#### Spinner
- Loading indicator
- Animated

---

## AI Integration

### Gemini API Services (`services/geminiService.ts`)

#### 1. `evaluateReport(reportText, criteria)`
**Purpose**: Evaluate a report against goal criteria

**Inputs:**
- `reportText`: Plain text (HTML stripped)
- `criteria`: Array of Criterion objects

**Process:**
1. Sends prompt to Gemini with report and criteria
2. Requests JSON response with scores and reasoning
3. Validates all criteria are scored

**Output:**
```typescript
{
  reasoning: string;
  criteriaScores: ReportCriterionScore[];
}
```

#### 2. `summarizePerformance(reasonings, averageScores)`
**Purpose**: Generate comprehensive performance summary

**Inputs:**
- `reasonings`: Array of evaluation reasonings
- `averageScores`: Criteria averages

**Output:**
- Comprehensive paragraph summary

#### 3. `generateInsights(reports)`
**Purpose**: Generate career coaching insights

**Inputs:**
- `reports`: Array of Report objects

**Output:**
```typescript
{
  strengths: string;
  improvements: string;
}
```

---

## Key Validations

### Report Submission
- Minimum 50 characters (HTML stripped)
- Goal must be selected
- Employee must be selected (manager view)

### Goal Creation
- Goal name required
- At least one criterion required
- Total criteria weight must equal 100%
- Assignee must be selected

### Team Creation
- Team name required
- At least one member required

### Settings
- Frequency must be selected
- If per-employee, each employee needs frequency

---

## User Interactions

### Manager Interactions
1. **Create Goals** → Assign to employees/teams
2. **Create Teams** → Add employees
3. **View Employees** → Search, view details
4. **Configure Settings** → Set report frequencies
5. **View Reports** → Adjust manager scores

### Employee Interactions
1. **Submit Reports** → Write, preview, submit
2. **View Dashboard** → See performance metrics
3. **View Reports** → Review submitted reports
4. **Switch Views** → Toggle between manager/employee

---

## Error Handling

### Form Validation
- Real-time validation feedback
- Error messages displayed
- Disabled buttons when invalid

### API Errors
- Error messages shown to user
- Fallback values provided
- Console logging for debugging

### Empty States
- "No data" messages
- Helpful guidance text
- Empty state illustrations

---

## Future Enhancements

Potential improvements:
- Backend API integration
- Database persistence
- User authentication
- Email notifications
- Report reminders based on frequency
- Export functionality
- Advanced analytics
- Team performance comparisons

---

## Environment Variables

Required:
- `GEMINI_API_KEY`: Google Gemini API key for AI evaluation

Set in `.env` file or environment.

---

## File Structure

```
performance-tracker/
├── components/          # Reusable UI components
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Modal.tsx
│   ├── Table.tsx
│   ├── StatCard.tsx
│   ├── Spinner.tsx
│   ├── UserDropdown.tsx
│   └── RichTextEditor.tsx
├── pages/              # Page components
│   ├── DashboardPage.tsx
│   ├── SubmitReportPage.tsx
│   ├── ReportsPage.tsx
│   ├── EmployeesPage.tsx
│   ├── TeamsPage.tsx
│   ├── GoalsPage.tsx
│   ├── SettingsPage.tsx
│   └── EmployeeDetailPage.tsx
├── services/           # API services
│   └── geminiService.ts
├── types.ts            # TypeScript types
├── constants.ts         # Sample data
├── App.tsx             # Main app component
├── index.tsx           # Entry point
├── index.html          # HTML template
├── index.css           # Global styles
└── vite.config.ts      # Vite configuration
```

---

## Conclusion

This Performance Tracker application provides a comprehensive solution for managing employee performance through AI-powered report evaluation. The dual-view system (Manager/Employee) ensures appropriate access control while maintaining a seamless user experience with the Datadog design system's dark theme.

