import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
    email: string;
    role: string;
    organizationName: string;
    organizationId: string;
    invitedBy: string; // User ID
    invitedByText: string;
    token?: string; // Optional, can be generated here
    initialProjectId?: string;
    initialManagerId?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload: InviteRequest = await req.json();
        const {
            email,
            role,
            organizationName,
            organizationId,
            invitedBy,
            invitedByText,
            initialProjectId,
            initialManagerId
        } = payload;

        let token = payload.token;
        if (!token) {
            token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        }

        // 1. Insert Invitation into Database using Service Role (Bypasses RLS)
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const invitation = {
            id: crypto.randomUUID(),
            token,
            email,
            role,
            organization_id: organizationId,
            invited_by: invitedBy,
            invited_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            status: 'pending',
            initial_project_id: initialProjectId,
            initial_manager_id: initialManagerId,
        };

        const { data: dbData, error: dbError } = await supabase
            .from('invitations')
            .insert(invitation)
            .select()
            .single();

        if (dbError) {
            console.error("Database Insert Error:", dbError);
            return new Response(JSON.stringify({ error: "Failed to create invitation record", details: dbError }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // 2. Send Email
        const origin = req.headers.get("origin") || "http://localhost:5173";
        const inviteLink = `${origin}/invite/${token}`;

        const { data: emailData, error: emailError } = await resend.emails.send({
            from: "Performance Tracker <onboarding@resend.dev>", // Change this if you have a verified domain
            to: [email],
            subject: `Join ${organizationName} on Performance Tracker`,
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You've been invited!</h2>
          <p><strong>${invitedByText}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
          <p>Click the button below to accept your invitation:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Accept Invitation</a>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">Or copy this link to your browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;">${inviteLink}</p>
          <p style="margin-top: 40px; color: #999; font-size: 12px;">This invitation will expire in 7 days.</p>
        </div>
      `,
        });

        if (emailError) {
            console.error("Resend Error Details:", JSON.stringify(emailError, null, 2));
            return new Response(JSON.stringify({ error: "Invitation created but email failed", details: emailError, invitation: dbData }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 206, // Partial Content
            });
        }

        return new Response(JSON.stringify({ success: true, invitation: dbData, emailId: emailData?.id }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
