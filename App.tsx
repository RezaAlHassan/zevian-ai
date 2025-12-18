import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { projectService, organizationService, employeeService } from './services/databaseService';
import { Goal, Report, Employee, Project, ManagerSettings, ViewMode, Invitation, EmployeeRole } from './types';
import Onboarding, { OnboardingData } from './components/Onboarding';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import GoalsPage from './pages/GoalsPage';
import SubmitReportPage from './pages/SubmitReportPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import AllReportsPage from './pages/AllReportsPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import GoalDetailPage from './pages/GoalDetailPage';
import SettingsPage from './pages/SettingsPage';
import InviteAcceptPage from './pages/InviteAcceptPage';
import SetPasswordPage from './pages/SetPasswordPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import { useProjects } from './hooks/useProjects';
import { useGoals } from './hooks/useGoals';
import { useReports } from './hooks/useReports';
import { useEmployees } from './hooks/useEmployees';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { inviteService } from './services/inviteService';
import { invitationService } from './services/invitationService';

// Wrapper component to access router hooks
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, employee, loading: authLoading, refreshEmployee, signOut } = useAuth();

  // Database hooks
  const { projects, loading: projectsLoading, createProject, updateProject: updateProjectDb, deleteProject: deleteProjectDb } = useProjects();
  const { goals, loading: goalsLoading, createGoal, updateGoal: updateGoalDb, deleteGoal: deleteGoalDb } = useGoals();
  const { reports, loading: reportsLoading, createReport, updateReport: updateReportDb, deleteReport: deleteReportDb } = useReports();
  const { employees, loading: employeesLoading, createEmployee: createEmployeeDb, updateEmployee: updateEmployeeDb } = useEmployees();

  const [settings, setSettings] = useState<ManagerSettings>({
    selectedDays: [],
    globalFrequency: true,
  });

  // Use auth user if available
  const currentEmployeeId = employee?.id || '';

  // Use auth employee as current user
  const currentUser = employee;

  // Derive current manager ID (if the logged in user is a manager)
  const currentManagerId = useMemo(() => {
    return currentUser?.role === 'manager' ? currentUser.id : '';
  }, [currentUser]);

  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [scopeFilter, setScopeFilter] = useState<'direct-reports' | 'organization' | 'reporting-chain'>('direct-reports');

  // Organization ID - comes from authenticated employee record.
  // We do NOT use localStorage here as it persists stale IDs across DB resets.
  const organizationId = useMemo(() => {
    return employee?.organizationId;
  }, [employee]);

  // Organization name - in a real app, this would come from org data
  const organizationName = useMemo(() => {
    return localStorage.getItem('organizationName') || 'My Organization';
  }, []);

  // Load invitations from localStorage
  const [invitations, setInvitations] = useState<Invitation[]>(() => {
    const stored = localStorage.getItem('invitations');
    return stored ? JSON.parse(stored) : [];
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (authLoading) return;

    const publicPaths = ['/login', '/register', '/invite', '/set-password', '/forgot-password'];
    // Check if path starts with any public path (e.g. /invite/xyz)
    const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));

    if (!user && !isPublicPath) {
      navigate('/login');
    } else if (user && (location.pathname === '/login' || location.pathname === '/register')) {
      navigate('/dashboard');
    }
  }, [user, authLoading, location.pathname, navigate]);

  const viewMode: ViewMode = useMemo(() => {
    // If authenticated but no employee record yet (e.g. just created account)
    if (user && !currentUser) {
      // Check localStorage for role set during invitation acceptance
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'employee' || storedRole === 'manager') {
        return storedRole as ViewMode;
      }
      // Default to manager for organization owners during onboarding
      return 'manager';
    }
    return currentUser?.role === 'manager' ? 'manager' : 'employee';
  }, [currentUser, user]);

  // Get current page from location
  const currentPage = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/employees/')) return 'employeeDetail';
    if (path.startsWith('/projects/')) return 'projectDetail';
    if (path.startsWith('/goals/')) return 'goalDetail';
    return path.slice(1) as any;
  }, [location.pathname]);

  const addGoal = useCallback(async (goal: Goal) => {
    try {
      await createGoal(goal);
    } catch (error) {
      console.error('Failed to create goal:', error);
      alert('Failed to create goal. Please try again.');
    }
  }, [createGoal]);

  const addReport = useCallback(async (report: Report) => {
    try {
      await createReport(report);
    } catch (error) {
      console.error('Failed to create report:', error);
      alert('Failed to submit report. Please try again.');
    }
  }, [createReport]);

  const addProject = useCallback(async (project: Project) => {
    try {
      await createProject(project);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    }
  }, [createProject]);

  const updateProject = useCallback(async (updatedProject: Project) => {
    try {
      await updateProjectDb(updatedProject.id, updatedProject);
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project. Please try again.');
    }
  }, [updateProjectDb]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await deleteProjectDb(projectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project. Please try again.');
    }
  }, [deleteProjectDb]);

  const addEmployee = useCallback(async (employee: Employee) => {
    try {
      await createEmployeeDb(employee);
    } catch (error) {
      console.error('Failed to create employee:', error);
      alert('Failed to create employee. Please try again.');
    }
  }, [createEmployeeDb]);

  // Create and store an invitation
  const createInvitation = useCallback(async (email: string, role: EmployeeRole) => {
    // Validation
    if (!organizationId) {
      alert("Error: Organization ID not found. Please setup your organization first.");
      console.error("Missing organizationId", { employee });
      return;
    }
    if (!currentEmployeeId) {
      alert("Error: You must be logged in to invite users.");
      console.error("Missing currentEmployeeId", { employee });
      return;
    }

    try {
      // Create invitation via Edge Function (handles DB insert + Email)
      const response = await inviteService.sendEmail({
        email,
        role,
        organizationName,
        organizationId: organizationId,
        invitedBy: currentEmployeeId,
        invitedByText: currentUser?.name || 'A manager',
      });

      if (response && response.invitation) {
        // Update UI state with returned invitation
        setInvitations(prev => [response.invitation, ...prev]);
        return response.invitation;
      }
      return response?.invitation;
    } catch (error: any) {
      console.error('Failed to create invitation:', error);
      let msg = 'Failed to send invitation. Please try again.';
      try {
        if (error && typeof error === 'object' && error.context && typeof error.context.json === 'function') {
          const body = await error.context.json();
          if (body.error) msg = `Error: ${body.error}`;
          if (body.details) console.error("Error details:", body.details);
        } else if (error.message) {
          msg = `Error: ${error.message}`;
        }
      } catch (e) {
        // Fallback if parsing fails
      }
      alert(msg);
      throw error;
    }
  }, [organizationId, organizationName, currentEmployeeId, currentUser, employee]);

  // Accept an invitation and create the employee
  const acceptInvitation = useCallback(async (invitation: Invitation, name: string): Promise<Employee> => {
    // Mark invitation as accepted
    const updatedInvitations = invitations.map(inv =>
      inv.id === invitation.id
        ? { ...inv, status: 'accepted' as const, acceptedAt: new Date().toISOString() }
        : inv
    );
    setInvitations(updatedInvitations);
    localStorage.setItem('invitations', JSON.stringify(updatedInvitations));

    // Create new employee from invitation
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      organizationId: invitation.organizationId,
      name,
      email: invitation.email,
      role: invitation.role,
      joinDate: new Date().toISOString(),
    };

    // Add employee to the list
    await createEmployeeDb(newEmployee);

    // Note: Auth linking is handled in InviteAcceptPage / Service
    return newEmployee;
  }, [invitations, createEmployeeDb]);

  const updateEmployee = useCallback(async (updatedEmployee: Employee) => {
    try {
      await updateEmployeeDb(updatedEmployee.id, updatedEmployee);
    } catch (error) {
      console.error('Failed to update employee:', error);
      alert('Failed to update employee. Please try again.');
    }
  }, [updateEmployeeDb]);

  const updateReport = useCallback(async (updatedReport: Report) => {
    try {
      await updateReportDb(updatedReport.id, updatedReport);
    } catch (error) {
      console.error('Failed to update report:', error);
      alert('Failed to update report. Please try again.');
    }
  }, [updateReportDb]);

  const updateSettings = useCallback((newSettings: ManagerSettings) => {
    setSettings(newSettings);
  }, []);

  const updateGoal = useCallback(async (updatedGoal: Goal) => {
    try {
      await updateGoalDb(updatedGoal.id, updatedGoal);
    } catch (error) {
      console.error('Failed to update goal:', error);
      alert('Failed to update goal. Please try again.');
    }
  }, [updateGoalDb]);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      await deleteGoalDb(goalId);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      alert('Failed to delete goal. Please try again.');
    }
  }, [deleteGoalDb]);

  const viewEmployeeDetails = useCallback((employeeId: string) => {
    navigate(`/employees/${employeeId}`);
  }, [navigate]);

  const backToEmployeeList = useCallback(() => {
    navigate('/employees');
  }, [navigate]);

  const viewGoalDetails = useCallback((goalId: string) => {
    navigate(`/goals/${goalId}`);
  }, [navigate]);

  const backToGoalsList = useCallback(() => {
    navigate('/goals');
  }, [navigate]);

  const viewProjectDetails = useCallback((projectId: string) => {
    navigate(`/projects/${projectId}`);
  }, [navigate]);

  const backToProjectsList = useCallback(() => {
    navigate('/projects');
  }, [navigate]);

  const setCurrentPage = useCallback((page: string) => {
    navigate(`/${page}`);
  }, [navigate]);


  const memoizedProjects = useMemo(() => projects, [projects]);
  const memoizedGoals = useMemo(() => goals, [goals]);
  const memoizedReports = useMemo(() => reports, [reports]);
  const memoizedEmployees = useMemo(() => employees, [employees]);

  // Check if onboarding has been completed or needs repair
  useEffect(() => {
    // If user is authenticated but has no employee record, they act as a new Owner (unless recovering invite)
    // Check if onboarding was already completed in this session/device
    if (!authLoading && user) {
      // Case 1: No employee record at all -> New User flow
      if (!employee && !localStorage.getItem('onboardingCompleted')) {
        const pendingInv = localStorage.getItem('pendingInvitation');
        const role = user.user_metadata?.role || user.app_metadata?.role;

        // Only show onboarding if we are NOT explicitly an employee (i.e. we are an Owner or role is unknown)
        if (!pendingInv && role !== 'employee') {
          console.log('[Onboarding] Triggered: No employee record found and not employee role', {
            userEmail: user.email,
            userId: user.id,
            role,
            onboardingCompleted: localStorage.getItem('onboardingCompleted')
          });
          setShowOnboarding(true);
        }
      }
      // Case 2: Employee record exists but is BROKEN (Missing Org ID) -> Repair flow
      else if (employee && !employee.organizationId) {
        console.warn("[Onboarding] Repair flow triggered: Employee record found but missing Organization ID.", {
          employeeId: employee.id,
          email: employee.email,
          isAccountOwner: employee.isAccountOwner,
          organizationId: employee.organizationId
        });
        setShowOnboarding(true);
      }
      // Case 3: Valid employee with org - ensure onboarding is not shown
      else if (employee && employee.organizationId) {
        console.log('[Onboarding] Skipped: Valid employee record found', {
          employeeId: employee.id,
          organizationId: employee.organizationId,
          isAccountOwner: employee.isAccountOwner
        });
      }
    }
  }, [user, employee, authLoading]);

  // Recovery: Check for pending invitation if user is logged in but no employee record exists
  // This handles the case where email verification interrupted the flow
  useEffect(() => {
    if (user && !employee && !authLoading) {
      const pendingInv = localStorage.getItem('pendingInvitation');
      if (pendingInv) {
        try {
          const data = JSON.parse(pendingInv);
          console.log('Recovering pending invitation...', data);

          const newEmployee: Employee = {
            id: `emp-${Date.now()}`,
            organizationId: data.organizationId,
            name: data.name,
            email: data.email,
            role: data.role,
            joinDate: data.joinedAt || new Date().toISOString(),
            authUserId: user.id // Link immediately
          };

          createEmployeeDb(newEmployee).then(() => {
            localStorage.removeItem('pendingInvitation');
            localStorage.setItem('onboardingCompleted', 'true');
            refreshEmployee(); // Refresh context
            setShowOnboarding(false);
          }).catch(err => {
            console.error('Failed to recover invitation:', err);
          });
        } catch (e) {
          console.error('Invalid pending invitation data');
          localStorage.removeItem('pendingInvitation');
        }
      }
    }
  }, [user, employee, authLoading, createEmployeeDb, refreshEmployee]);

  // Handle view mode changes - redirect if needed
  useEffect(() => {
    const path = location.pathname;
    if (viewMode === 'employee') {
      if (!['/', '/dashboard', '/reports', '/submit'].includes(path) && !path.startsWith('/reports/') && !path.startsWith('/login')) {
        // Only run if user is logged in
        if (user) {
          // Simplified check for manager paths:
          if (path === '/projects' || path === '/goals' || path === '/employees' || path === '/all-reports' || path === '/settings') {
            navigate('/dashboard');
          }
        }
      }
    } else if (viewMode === 'manager') {
      if (path === '/submit' || path === '/reports') {
        navigate('/dashboard');
      }
    }
  }, [viewMode, location.pathname, navigate, user]);

  const handleSaveOrganization = useCallback(async (name: string) => {
    // Prevent duplicate creation if we already have an org
    if (organizationId || (employee?.organizationId)) return organizationId || employee?.organizationId;

    const newOrgId = `org-${Date.now()}`;
    // Create Organization
    await organizationService.create({
      id: newOrgId,
      name: name,
      planTier: 'free'
    }).catch(err => {
      console.error('Failed to create organization:', err);
      alert('Failed to create organization. Please try again.');
      throw err;
    });

    // Create Owner or Update Existing "Broken" Employee
    if (user) {
      if (!employee) {
        const ownerEmployee: Employee = {
          id: `emp-${Date.now()}`,
          organizationId: newOrgId,
          name: user.user_metadata.name || 'Organization Owner',
          email: user.email || '',
          role: 'manager',
          isAccountOwner: true,
          joinDate: new Date().toISOString(),
          authUserId: user.id
        };
        await createEmployeeDb(ownerEmployee);
      } else {
        // Repair: Update existing employee with new Org ID
        console.log("Repairing employee record with new Organization ID");
        const updatedEmployee = { ...employee, organizationId: newOrgId, isAccountOwner: true, role: 'manager' as const };
        await updateEmployeeDb(employee.id, updatedEmployee);
      }

      // Verification
      try {
        await refreshEmployee(); // Refresh to get the new Org ID
      } catch (e) {
        throw new Error('Failed to verify account setup.');
      }

      return newOrgId;
    }
    return newOrgId;
  }, [user, employee, organizationId, createEmployeeDb, updateEmployeeDb, refreshEmployee]);


  const handleOnboardingComplete = useCallback(async (data: OnboardingData) => {
    let finalOrgId = organizationId;

    // Fallback: If org wasn't created at step 1 for some reason
    if (!finalOrgId && data.organizationName) {
      finalOrgId = (await handleSaveOrganization(data.organizationName)) || '';
    }

    // By now, owner should exist.
    let ownerId = currentEmployeeId;
    if (!ownerId && user) {
      // If owner creation happened in handleSaveOrganization, we expect refreshEmployee to have run.
      // But in this same closure, 'currentEmployeeId' is stale.
      // We can try to get it from auth or trust that handleSaveOrganization did its job.
      // We'll proceed assuming the verification in handleSaveOganization passed.
      // We might need to fetch employee again if we really need the ID right here.
      // Or simpler: handleSaveOrganization could return ownerId too?
      // For now, let's assume 'emp-1' fallback is risky.
      // Ideally we fetch the employee by Auth ID.
      const fetched = await employeeService.getByAuthId(user.id);
      if (fetched) ownerId = fetched.id;
    }

    if (data.employees.length > 0) {
      for (const emp of data.employees) {
        const employeeWithOrg = {
          ...emp,
          organizationId: finalOrgId,
        };
        await createEmployeeDb(employeeWithOrg).catch(console.error);
      }
    }

    if (data.settings) {
      setSettings(data.settings);
    }

    if (data.project) {
      const projectWithOrg = {
        ...data.project,
        organizationId: finalOrgId,
        createdBy: ownerId || 'emp-1',
      };
      await addProject(projectWithOrg);
    }

    if (data.goal && data.project) {
      const goalWithCorrectProjectId = {
        ...data.goal,
        projectId: data.project.id,
        managerId: ownerId || 'emp-1',
        createdBy: ownerId || 'emp-1',
      };
      await addGoal(goalWithCorrectProjectId);
    }

    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
  }, [addProject, addGoal, createEmployeeDb, organizationId, currentEmployeeId, user, handleSaveOrganization]);

  const handleOnboardingSkip = useCallback(() => {
    localStorage.setItem('onboardingCompleted', 'true');
    setShowOnboarding(false);
  }, []);

  // Show loading state - MUST be after all hooks
  const isLoading = projectsLoading || goalsLoading || reportsLoading || employeesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-on-surface-secondary">Loading data...</p>
        </div>
      </div>
    );
  }

  // Determine if we are on an auth page (Login, Register, Invite)
  const isAuthPage = ['/login', '/register'].includes(location.pathname) || location.pathname.startsWith('/invite');

  // Fallback: If logged in but no employee record (and not onboarding), show Setup screen
  if (!authLoading && user && !employee && !showOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="text-center max-w-md space-y-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">🚀</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface">Almost There!</h2>
          <p className="text-on-surface-secondary">
            You have created your account, but we need to set up your organization or verify your profile.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowOnboarding(true)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              Set Up Organization
            </button>
            <p className="text-sm text-on-surface-secondary">
              Or ask your manager to send you an invite if you are joining an existing team.
            </p>
            <button
              onClick={signOut}
              className="text-sm text-primary hover:underline"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-background text-on-surface font-sans">
        {!isAuthPage && (
          <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            viewMode={viewMode}
            onInvite={viewMode === 'manager' ? createInvitation : undefined}
            organizationName={organizationName}
          />
        )}
        <div className={`flex-1 flex flex-col ${!isAuthPage ? 'ml-64' : ''}`}>
          {!isAuthPage && (
            <Header
              viewMode={viewMode}
              currentEmployeeId={currentEmployeeId}
              setCurrentPage={setCurrentPage}
              employees={memoizedEmployees}
              currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
              scopeFilter={scopeFilter}
              setScopeFilter={setScopeFilter}
              organizationName={organizationName}
              onLogout={async () => {
                await signOut();
                localStorage.removeItem('onboardingCompleted'); // Clear local state to prevent stale Wizard skipping
                navigate('/login');
              }}
              currentUser={employee}
              user={user}
            />
          )}
          <main className="flex-1 overflow-y-auto bg-background w-full">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={
                <DashboardPage
                  reports={memoizedReports}
                  goals={memoizedGoals}
                  projects={memoizedProjects}
                  updateReport={updateReport}
                  employees={memoizedEmployees}
                  currentEmployeeId={currentEmployeeId}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  isEmployeeView={viewMode === 'employee'}
                  viewMode={viewMode}
                  onNavigate={(page) => navigate(`/${page}`)}
                  onSelectEmployee={viewEmployeeDetails}
                  onSelectProject={viewProjectDetails}
                />
              } />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/dashboard" element={
                <DashboardPage
                  reports={memoizedReports}
                  goals={memoizedGoals}
                  projects={memoizedProjects}
                  updateReport={updateReport}
                  employees={memoizedEmployees}
                  currentEmployeeId={currentEmployeeId}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  isEmployeeView={viewMode === 'employee'}
                  viewMode={viewMode}
                  onNavigate={(page) => navigate(`/${page}`)}
                  onSelectEmployee={viewEmployeeDetails}
                  onSelectProject={viewProjectDetails}
                />
              } />
              <Route path="/projects" element={
                <ProjectsPage
                  projects={memoizedProjects}
                  addProject={addProject}
                  updateProject={updateProject}
                  deleteProject={deleteProject}
                  employees={memoizedEmployees}
                  goals={memoizedGoals}
                  reports={memoizedReports}
                  onSelectProject={viewProjectDetails}
                  currentEmployeeId={viewMode === 'employee' ? currentEmployeeId : undefined}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  viewMode={viewMode}
                  scopeFilter={scopeFilter}
                  searchQuery={searchQuery}
                />
              } />
              <Route path="/projects/:projectId" element={
                <ProjectDetailWrapper
                  projects={memoizedProjects}
                  reports={memoizedReports}
                  goals={memoizedGoals}
                  employees={memoizedEmployees}
                  updateProject={updateProject}
                  onBack={backToProjectsList}
                />
              } />
              <Route path="/goals" element={
                <GoalsPage
                  goals={memoizedGoals}
                  projects={memoizedProjects}
                  employees={memoizedEmployees}
                  addGoal={addGoal}
                  updateGoal={updateGoal}
                  deleteGoal={deleteGoal}
                  onSelectGoal={viewGoalDetails}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  currentEmployeeId={currentEmployeeId}
                  viewMode={viewMode}
                  searchQuery={searchQuery}
                />
              } />
              <Route path="/goals/:goalId" element={
                <GoalDetailWrapper
                  goals={memoizedGoals}
                  reports={memoizedReports}
                  employees={memoizedEmployees}
                  projects={memoizedProjects}
                  updateGoal={updateGoal}
                  onBack={backToGoalsList}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  viewMode={viewMode}
                />
              } />
              <Route path="/submit" element={
                <SubmitReportPage
                  goals={memoizedGoals}
                  projects={memoizedProjects}
                  addReport={addReport}
                  employees={memoizedEmployees}
                  currentEmployeeId={currentEmployeeId}
                  isEmployeeView={viewMode === 'employee'}
                  settings={settings}
                />
              } />
              <Route path="/reports" element={
                <ReportsPage
                  reports={memoizedReports}
                  goals={memoizedGoals}
                  currentEmployeeId={currentEmployeeId}
                />
              } />
              <Route path="/all-reports" element={
                <AllReportsPage
                  reports={memoizedReports}
                  goals={memoizedGoals}
                  employees={memoizedEmployees}
                  projects={memoizedProjects}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  viewMode={viewMode}
                  scopeFilter={scopeFilter}
                />
              } />
              <Route path="/employees" element={
                <EmployeesPage
                  employees={memoizedEmployees}
                  reports={memoizedReports}
                  onSelectEmployee={viewEmployeeDetails}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  viewMode={viewMode}
                  scopeFilter={scopeFilter}
                  onAddEmployee={addEmployee}
                  onUpdateEmployee={updateEmployee}
                  onInvite={createInvitation}
                  searchQuery={searchQuery}
                />
              } />
              <Route path="/employees/:employeeId" element={
                <EmployeeDetailWrapper
                  employees={memoizedEmployees}
                  reports={memoizedReports}
                  goals={memoizedGoals}
                  projects={memoizedProjects}
                  updateReport={updateReport}
                  onBack={backToEmployeeList}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  viewMode={viewMode}
                />
              } />
              <Route path="/settings" element={
                <SettingsPage
                  settings={settings}
                  employees={memoizedEmployees}
                  projects={memoizedProjects}
                  updateSettings={updateSettings}
                  updateEmployee={updateEmployee}
                  onRestartOnboarding={() => {
                    localStorage.removeItem('onboardingCompleted');
                    setShowOnboarding(true);
                  }}
                  currentManagerId={viewMode === 'manager' ? currentManagerId : undefined}
                  viewMode={viewMode}
                />
              } />
              <Route path="/invite/:token" element={<InviteAcceptPage />} />
              <Route path="/set-password/:token" element={<SetPasswordPage />} />
            </Routes>
          </main>
        </div>
      </div>
      <Onboarding
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSaveOrganization={handleSaveOrganization}
        onSkip={handleOnboardingSkip}
      />
    </>
  );
};

// Wrapper components to extract URL params
const ProjectDetailWrapper: React.FC<{
  projects: Project[];
  reports: Report[];
  goals: Goal[];
  employees: Employee[];
  updateProject: (project: Project) => void;
  onBack: () => void;
}> = ({ projects, reports, goals, employees, updateProject, onBack }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = projects.find(p => p.id === projectId);

  if (!project) {
    return <div className="p-6">Project not found</div>;
  }

  return (
    <ProjectDetailPage
      project={project}
      reports={reports}
      goals={goals}
      employees={employees}
      updateProject={updateProject}
      onBack={onBack}
    />
  );
};

const GoalDetailWrapper: React.FC<{
  goals: Goal[];
  reports: Report[];
  employees: Employee[];
  projects: Project[];
  updateGoal: (goal: Goal) => void;
  onBack: () => void;
  currentManagerId?: string;
  viewMode?: 'manager' | 'employee';
}> = ({ goals, reports, employees, projects, updateGoal, onBack, currentManagerId, viewMode }) => {
  const { goalId } = useParams<{ goalId: string }>();
  const goal = goals.find(g => g.id === goalId);

  if (!goal) {
    return <div className="p-6">Goal not found</div>;
  }

  return (
    <GoalDetailPage
      goal={goal}
      reports={reports.filter(r => r.goalId === goal.id)}
      employees={employees}
      projects={projects}
      updateGoal={updateGoal}
      onBack={onBack}
      currentManagerId={currentManagerId}
      viewMode={viewMode}
    />
  );
};

const EmployeeDetailWrapper: React.FC<{
  employees: Employee[];
  reports: Report[];
  goals: Goal[];
  projects: Project[];
  updateReport: (report: Report) => void;
  onBack: () => void;
  currentManagerId?: string;
  viewMode?: 'manager' | 'employee';
}> = ({ employees, reports, goals, projects, updateReport, onBack, currentManagerId, viewMode }) => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const employee = employees.find(e => e.id === employeeId);

  if (!employee) {
    return <div className="p-6">Employee not found</div>;
  }

  return (
    <EmployeeDetailPage
      employee={employee}
      reports={reports.filter(r => r.employeeId === employee.id)}
      goals={goals}
      projects={projects}
      employees={employees}
      allReports={reports}
      updateReport={updateReport}
      onBack={onBack}
      currentManagerId={currentManagerId}
      viewMode={viewMode}
    />
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
