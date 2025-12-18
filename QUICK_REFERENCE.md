# Performance Tracker - Quick Reference Guide

## 🚀 Quick Start

### Installation
```bash
npm install
```

### Environment Setup
Create `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Run Development Server
```bash
npm run dev
```

---

## 📊 Core Features at a Glance

| Feature | Description | Key Benefit |
|---------|-------------|-------------|
| 🤖 **AI Evaluation** | Automated report scoring using Google Gemini | Objective, consistent performance assessment |
| 📈 **Analytics Dashboard** | Visual performance trends and insights | Data-driven decision making |
| 👥 **Hierarchy Management** | Multi-level organizational structure | Scalable team management |
| 🎯 **Goals & Projects** | Structured goal tracking with criteria | Clear performance expectations |
| ⚙️ **Flexible Reporting** | Customizable frequencies (daily/weekly/etc.) | Adaptable to team needs |
| 📧 **Invitation System** | Secure token-based user onboarding | Easy team expansion |

---

## 🎭 User Roles

### Account Owner
- ✅ Full system access
- ✅ Organization-wide visibility
- ✅ All permissions enabled

### Manager
- ✅ Team management
- ✅ Project & goal creation
- ✅ Report review & override
- ⚙️ Configurable permissions

### Employee
- ✅ Submit reports
- ✅ View own performance
- ✅ Track assigned goals
- ❌ No management access

---

## 🗂️ Main Pages

### 1. Dashboard (`/dashboard`)
**Purpose**: Performance overview and analytics

**Features**:
- Performance trend charts
- Team member overview table
- AI-generated insights
- Filters: date range, employee, project

### 2. Projects (`/projects`)
**Purpose**: Manage projects and assignments

**Features**:
- Create/edit/delete projects
- Assign team members
- Set reporting frequencies
- View project analytics

### 3. Goals (`/goals`)
**Purpose**: Define performance goals

**Features**:
- Create goals with custom criteria
- Set weights for each criterion
- Define AI evaluation instructions
- Track deadlines

### 4. Submit Report (`/submit`)
**Purpose**: Employee report submission

**Features**:
- Rich text editor
- Real-time AI feedback
- Goal selection
- Draft saving

### 5. All Reports (`/reports`)
**Purpose**: View and manage all reports

**Features**:
- Filter by employee/project/goal
- Sort by score/date
- Manager override
- Export functionality

### 6. Employees (`/employees`)
**Purpose**: Team member management

**Features**:
- Employee directory
- Invite new members
- View performance history
- Manage roles

### 7. Settings (`/settings`)
**Purpose**: System configuration

**Features**:
- Reporting frequency settings
- Permission management
- Notification preferences
- Late submission control

---

## 🔄 Common Workflows

### Creating a New Project
```
1. Navigate to Projects page
2. Click "Add Project"
3. Fill in project details
4. Assign team members
5. Set reporting frequency
6. Save project
```

### Creating a Goal
```
1. Navigate to Goals page
2. Click "Add Goal"
3. Select parent project
4. Define evaluation criteria
5. Set weights (must total 100%)
6. Add AI evaluation instructions
7. Set deadline (optional)
8. Save goal
```

### Submitting a Report
```
1. Navigate to Submit Report page
2. Select goal
3. Write report in editor
4. (Optional) Get AI feedback
5. Refine report
6. Submit
7. View AI evaluation
```

### Inviting a Team Member
```
1. Navigate to Employees page
2. Click "Invite User"
3. Enter email and role
4. Send invitation
5. User receives email with link
6. User accepts and completes onboarding
```

### Reviewing Reports (Manager)
```
1. Navigate to Dashboard or All Reports
2. Filter by employee/project
3. Click on report to view details
4. Review AI evaluation
5. (Optional) Override score with reasoning
6. Save changes
```

---

## 🤖 AI Features

### Report Evaluation
**Model**: Gemini 2.5 Flash
**Function**: Scores reports against criteria (1-10 scale)
**Output**: Overall score + criterion breakdown + reasoning

### Report Feedback
**Model**: Gemini 2.5 Flash
**Function**: Provides writing suggestions before submission
**Output**: Constructive feedback on report quality

### Performance Insights
**Model**: Gemini 2.5 Pro
**Function**: Analyzes multiple reports for trends
**Output**: Strengths and improvement areas

### Performance Summary
**Model**: Gemini 2.5 Pro
**Function**: Generates comprehensive performance summaries
**Output**: Narrative summary of performance period

---

## 📊 Database Tables

### Core Tables
- `organizations` - Multi-tenant organization data
- `employees` - User accounts and hierarchy
- `projects` - Project definitions
- `goals` - Performance goals
- `criteria` - Goal evaluation criteria
- `reports` - Submitted performance reports
- `report_criterion_scores` - Detailed criterion scores
- `invitations` - User invitation tokens

### Supporting Tables
- `employee_permissions` - Granular permissions
- `project_assignees` - Project-employee assignments
- `manager_settings` - Manager configurations
- `*_frequency_*` - Reporting frequency overrides

---

## 🔌 Key API Functions

### Database Service
```typescript
// Projects
projectService.getAll()
projectService.create(project)
projectService.update(id, updates)

// Goals
goalService.getByProjectId(projectId)
goalService.create(goal)

// Reports
reportService.getByEmployeeId(employeeId)
reportService.create(report)

// Employees
employeeService.getTeamMembers(managerId)
employeeService.create(employee)
```

### Gemini Service
```typescript
// Evaluate report
const evaluation = await evaluateReport(reportText, criteria)

// Get feedback
const feedback = await getReportFeedback(reportText, criteria)

// Generate insights
const insights = await generateInsights(reports)
```

---

## ⚙️ Settings Configuration

### Reporting Frequency Precedence
```
Global Settings < Project Settings < Employee Settings
```

### Example Configuration
```typescript
// Global: Weekly (Monday, Wednesday, Friday)
globalFrequency: true
selectedDays: ['Monday', 'Wednesday', 'Friday']

// Project Override: Daily (Mon-Fri)
projectFrequencies: {
  'project-1': {
    selectedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  }
}

// Employee Override: Bi-weekly (Monday)
employeeFrequencies: {
  'emp-1': {
    selectedDays: ['Monday']
  }
}
```

---

## 🎯 Evaluation Criteria Example

```typescript
Goal: "Improve Code Quality"

Criteria:
[
  { name: "Code Quality", weight: 40 },      // 40%
  { name: "Test Coverage", weight: 30 },     // 30%
  { name: "Documentation", weight: 20 },     // 20%
  { name: "Timeliness", weight: 10 }         // 10%
]

Instructions:
"Code should follow established style guidelines.
All functions must have proper error handling.
Code must be reviewed before merging.
Documentation should be updated for new features."

AI Evaluation Result:
- Code Quality: 9.0/10 (weighted: 3.6)
- Test Coverage: 9.5/10 (weighted: 2.85)
- Documentation: 8.0/10 (weighted: 1.6)
- Timeliness: 7.0/10 (weighted: 0.7)
Final Score: 8.75/10
```

---

## 🔒 Permission Matrix

| Action | Account Owner | Manager (Full) | Manager (Limited) | Employee |
|--------|---------------|----------------|-------------------|----------|
| View Org Data | ✅ | ✅ | ❌ | ❌ |
| View Team Data | ✅ | ✅ | ✅ | ❌ |
| Create Projects | ✅ | ✅ | ✅ | ❌ |
| Create Goals | ✅ | ✅ | ✅ | ❌ |
| Submit Reports | ✅ | ✅ | ✅ | ✅ |
| Override Scores | ✅ | ✅ | ✅ | ❌ |
| Manage Settings | ✅ | ✅ | ❌ | ❌ |
| Invite Users | ✅ | ✅ | ✅ | ❌ |

---

## 🛠️ Tech Stack Summary

### Frontend
- React 19.2.0
- TypeScript 5.8.2
- Vite 6.2.0
- React Router DOM 7.9.6

### Backend
- Supabase (PostgreSQL)
- Google Gemini AI

### UI Libraries
- Lucide React (icons)
- Recharts (charts)
- Preline (components)

---

## 📁 Project Structure

```
performance-tracker/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── services/           # API & business logic
│   ├── databaseService.ts
│   ├── geminiService.ts
│   └── invitationService.ts
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types.ts            # TypeScript definitions
├── constants.ts        # Sample data
└── schema.sql          # Database schema
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue**: AI evaluation fails
- ✅ Check `VITE_GEMINI_API_KEY` in `.env.local`
- ✅ Verify API key is valid
- ✅ Check network connectivity

**Issue**: Database connection fails
- ✅ Verify Supabase credentials
- ✅ Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Ensure schema is properly set up

**Issue**: Reports not showing
- ✅ Check user role and permissions
- ✅ Verify organization_id matches
- ✅ Check filters on dashboard

---

## 📞 Quick Links

- **Full Documentation**: [COMPREHENSIVE_DOCUMENTATION.md](./COMPREHENSIVE_DOCUMENTATION.md)
- **Database Schema**: [schema.sql](./schema.sql)
- **Type Definitions**: [types.ts](./types.ts)
- **AI Studio App**: https://ai.studio/apps/drive/1q4zRFNt5dAJYeJ_5BWs8_rpxyuD_tihn

---

## 🎓 Best Practices

### For Employees
1. Write detailed, specific reports
2. Include metrics and outcomes
3. Request AI feedback before submitting
4. Submit reports on time

### For Managers
1. Set clear, measurable criteria
2. Provide specific evaluation instructions
3. Review AI scores before overriding
4. Give constructive feedback
5. Regularly review team performance

### For Administrators
1. Set up proper organizational hierarchy
2. Configure appropriate permissions
3. Establish consistent reporting frequencies
4. Monitor system usage and performance

---

<div align="center">

**Quick Reference Guide v1.0**

For detailed information, see [COMPREHENSIVE_DOCUMENTATION.md](./COMPREHENSIVE_DOCUMENTATION.md)

</div>
