import { dbUtils, projectService, goalService, reportService, employeeService } from '../services/databaseService';

/**
 * Test Supabase Connection
 * 
 * This utility tests the connection to Supabase and displays database statistics.
 * Import and call this function from your App.tsx or any component to verify the connection.
 * 
 * Usage:
 * import { testSupabaseConnection } from './utils/testConnection';
 * 
 * // In your component
 * useEffect(() => {
 *   testSupabaseConnection();
 * }, []);
 */
export async function testSupabaseConnection() {
    console.log('🔄 Testing Supabase connection...');

    try {
        // Test basic connection
        const connectionTest = await dbUtils.testConnection();

        if (connectionTest.success) {
            console.log('✅ ' + connectionTest.message);

            // Get database statistics
            const stats = await dbUtils.getStats();
            console.log('📊 Database Statistics:');
            console.log(`   - Projects: ${stats.projectsCount}`);
            console.log(`   - Goals: ${stats.goalsCount}`);
            console.log(`   - Reports: ${stats.reportsCount}`);
            console.log(`   - Employees: ${stats.employeesCount}`);

            return { success: true, stats };
        } else {
            console.error('❌ ' + connectionTest.message);
            return { success: false, error: connectionTest.message };
        }
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        return { success: false, error };
    }
}

/**
 * Example: Fetch all projects
 */
export async function exampleFetchProjects() {
    try {
        console.log('📁 Fetching all projects...');
        const projects = await projectService.getAll();
        console.log(`✅ Found ${projects.length} projects:`, projects);
        return projects;
    } catch (error) {
        console.error('❌ Error fetching projects:', error);
        throw error;
    }
}

/**
 * Example: Fetch all employees
 */
export async function exampleFetchEmployees() {
    try {
        console.log('👥 Fetching all employees...');
        const employees = await employeeService.getAll();
        console.log(`✅ Found ${employees.length} employees:`, employees);
        return employees;
    } catch (error) {
        console.error('❌ Error fetching employees:', error);
        throw error;
    }
}

/**
 * Example: Fetch all goals
 */
export async function exampleFetchGoals() {
    try {
        console.log('🎯 Fetching all goals...');
        const goals = await goalService.getAll();
        console.log(`✅ Found ${goals.length} goals:`, goals);
        return goals;
    } catch (error) {
        console.error('❌ Error fetching goals:', error);
        throw error;
    }
}

/**
 * Example: Fetch all reports
 */
export async function exampleFetchReports() {
    try {
        console.log('📝 Fetching all reports...');
        const reports = await reportService.getAll();
        console.log(`✅ Found ${reports.length} reports:`, reports);
        return reports;
    } catch (error) {
        console.error('❌ Error fetching reports:', error);
        throw error;
    }
}
