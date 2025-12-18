import { supabase } from './supabaseClient';
import type { Invitation, EmployeeRole } from '../types';

// ============================================================================
// INVITATIONS SERVICE
// ============================================================================
export const invitationService = {
    async getAll() {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .order('invited_at', { ascending: false });
        if (error) throw error;
        return data as Invitation[];
    },

    async getByToken(token: string) {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('token', token)
            .single();
        if (error) throw error;

        return {
            ...data,
            organizationId: data.organization_id,
            invitedBy: data.invited_by,
            invitedAt: data.invited_at,
            expiresAt: data.expires_at,
            acceptedAt: data.accepted_at,
        } as Invitation;
    },

    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .eq('email', email)
            .order('invited_at', { ascending: false });
        if (error) throw error;

        return data.map((inv: any) => ({
            ...inv,
            organizationId: inv.organization_id,
            invitedBy: inv.invited_by,
            invitedAt: inv.invited_at,
            expiresAt: inv.expires_at,
            acceptedAt: inv.accepted_at,
        })) as Invitation[];
    },

    async create(
        email: string,
        role: EmployeeRole,
        organizationId: string,
        invitedBy: string
    ) {
        const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const invitedAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

        const invitation = {
            id: `inv-${Date.now()}`,
            token,
            email,
            role,
            organization_id: organizationId,
            invited_by: invitedBy,
            invited_at: invitedAt,
            expires_at: expiresAt,
            status: 'pending' as const,
        };

        const { data, error } = await supabase
            .from('invitations')
            .insert(invitation)
            .select()
            .single();
        if (error) throw error;

        return {
            ...data,
            organizationId: data.organization_id,
            invitedBy: data.invited_by,
            invitedAt: data.invited_at,
            expiresAt: data.expires_at,
            acceptedAt: data.accepted_at,
        } as Invitation;
    },

    async accept(token: string) {
        // Use RPC function for secure acceptance (bypasses RLS issues and prevents field tampering)
        const { data, error } = await supabase
            .rpc('accept_invitation', { token_input: token })
            .single();

        if (error) throw error;

        // Cast data to any to access snake_case properties returned by RPC
        const invite = data as any;

        return {
            ...invite,
            organizationId: invite.organization_id,
            invitedBy: invite.invited_by,
            invitedAt: invite.invited_at,
            expiresAt: invite.expires_at,
            acceptedAt: invite.accepted_at,
        } as Invitation;
    },

    async expireOldInvitations() {
        const now = new Date().toISOString();
        const { error } = await supabase
            .from('invitations')
            .update({ status: 'expired' })
            .eq('status', 'pending')
            .lt('expires_at', now);
        if (error) throw error;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('invitations')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },
};

// ============================================================================
// EMAIL SERVICE (Simple Implementation)
// ============================================================================
export const emailService = {
    /**
     * Generate invitation link
     */
    generateInvitationLink(token: string): string {
        return `${window.location.origin}/invite/${token}`;
    },

    /**
     * Send invitation email (placeholder - integrate with actual email service)
     * For now, this just logs the invitation details
     */
    async sendInvitationEmail(
        email: string,
        token: string,
        role: EmployeeRole,
        organizationName: string
    ): Promise<{ success: boolean; inviteLink: string }> {
        const inviteLink = this.generateInvitationLink(token);

        // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
        // For now, just log the invitation
        console.log('📧 Invitation Email:', {
            to: email,
            subject: `You're invited to join ${organizationName}`,
            role,
            inviteLink,
            message: `
        You've been invited to join ${organizationName} as a ${role}.
        
        Click the link below to accept your invitation:
        ${inviteLink}
        
        This invitation will expire in 7 days.
      `,
        });

        // In production, you would call your email service here:
        // await fetch('/api/send-email', {
        //   method: 'POST',
        //   body: JSON.stringify({ email, token, role, organizationName }),
        // });

        return { success: true, inviteLink };
    },
};
