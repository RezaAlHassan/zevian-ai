import { supabase } from './supabaseClient';
import { Employee } from '../types';
import { employeeService } from './databaseService';

export const authService = {
    /**
     * Sign in with email and password
     */
    signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) throw error;
        return data;
    },


    /**
     * Sign up a new user (Organization Owner)
     */
    signUp: async (email: string, password: string, metadata: { name: string }) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata,
            },
        });
        if (error) throw error;
        return data;
    },

    /**
     * Sign out the current user
     */
    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get the current authenticated session
     */
    getSession: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    /**
     * Get the employee profile associated with the current auth user
     */
    getCurrentEmployee: async (): Promise<Employee | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Use employeeService to get correctly camelCase transformed data
        return employeeService.getByAuthId(user.id);
    },

    /**
     * Accept an invitation and set password
     * This actually signs up the user with the provided token email and password
     * In a real invite system, this might use `verifyOtp` or similar, 
     * but for this flow we are treating "Accept" as "SignUp with pre-verified email logic"
     * OR we use the standard signUp if the user doesn't exist in Auth yet.
     */
    acceptInvite: async (email: string, password: string, name: string, role?: string) => {
        // 1. Sign up the user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role },
                emailRedirectTo: undefined // Auto-confirm if possible or require email verification
            }
        });

        if (error) throw error;
        return data;
    },

    /**
     * Link an existing Employee record to an Auth User ID
     * @param employeeId The ID of the employee to link
     * @param authUserId The UUID from Supabase Auth
     */
    linkEmployeeToAuth: async (employeeId: string, authUserId: string) => {
        const { error } = await supabase
            .from('employees')
            .update({ auth_user_id: authUserId })
            .eq('id', employeeId);

        if (error) throw error;
    }
};
