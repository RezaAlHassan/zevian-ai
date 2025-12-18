import { supabase } from './supabaseClient';

interface InviteParams {
    email: string;
    role: 'manager' | 'employee';
    organizationName: string;
    organizationId: string;
    invitedBy: string;
    invitedByText: string;
    token?: string;
}

export const inviteService = {
    /**
     * Send an invitation email using the 'send-invite' Edge Function (wrapping Resend)
     * @param params Invite details
     */
    sendEmail: async (params: InviteParams) => {
        console.log('Invoking send-invite Edge Function for:', params.email);

        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        // Even if no session (anon), we should pass the anon key if not logged in, 
        // but for invitations manager is logged in.
        // supabase-js invoke should do this, but we force it here.
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const { data, error } = await supabase.functions.invoke('send-invite', {
            body: params,
            headers: headers
        });

        if (error) {
            console.error('Failed to send invite email:', error);
            throw error;
        }

        return data;
    },

    /**
     * Generate a unique token for the invitation
     */
    generateToken: () => {
        return crypto.randomUUID();
    }
};
