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
        if (error) {
            if (error.status === 429) {
                console.error("Signup Rate Limit hit:", error);
                throw new Error("Too many signup attempts. Please wait a while before trying again.");
            }
            throw error;
        }
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
    acceptInvite: async (token: string, password: string, name: string) => {
        const { data, error } = await supabase.functions.invoke('accept-invitation', {
            body: { token, password, name }
        });

        if (error) {
            // Attempt to extract the error message from the response body
            try {
                const errorContext = (error as any).context;
                if (errorContext && typeof errorContext.json === 'function') {
                    const errorBody = await errorContext.json();
                    if (errorBody && errorBody.error) {
                        throw new Error(errorBody.error);
                    }
                }
            } catch (e) {
                console.error('Failed to parse function error body', e);
            }
            throw error;
        }
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
