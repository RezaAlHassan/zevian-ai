import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import { employeeService } from '../services/databaseService';
import { Employee } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    employee: Employee | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshEmployee: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchEmployeeProfile(session.user.id, session.user.email);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchEmployeeProfile(session.user.id, session.user.email);
            } else {
                setEmployee(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchEmployeeProfile = async (authUserId: string, email?: string) => {
        try {
            // 1. Try to find matched employee by Auth ID (Standard)
            let emp = await authService.getCurrentEmployee();

            // 2. Fallback: If not found by Auth ID, try to find by Email (Owner Recovery)
            if (!emp && email) {
                console.log('[AuthContext] No match by Auth ID. Attempting recovery by email:', email);
                const empByEmail = await employeeService.getByEmail(email);

                if (empByEmail) {
                    console.log('[AuthContext] Found unlinked employee record by email:', empByEmail.id);
                    // Match found! Attempt to link Auth ID to this employee record
                    try {
                        await authService.linkEmployeeToAuth(empByEmail.id, authUserId);
                        console.log('[AuthContext] Successfully linked employee to Auth User ID. Retrying fetch...');
                        // Retry fetch by ID
                        emp = await authService.getCurrentEmployee();
                    } catch (linkError) {
                        console.error('[AuthContext] Failed to auto-link employee:', linkError);
                        // If RLS blocks update, we might still want to return the employee if possible (but RLS likely hides data)
                        // For now, let's just log and continue
                    }
                }
            }

            setEmployee(emp);
        } catch (error) {
            console.error('Error fetching employee profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshEmployee = async () => {
        if (user) {
            await fetchEmployeeProfile(user.id);
        }
    };

    const signOut = async () => {
        await authService.signOut();
        setSession(null);
        setUser(null);
        setEmployee(null);
    };

    return (
        <AuthContext.Provider value={{ session, user, employee, loading, signOut, refreshEmployee }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
