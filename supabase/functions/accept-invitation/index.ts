import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { token, password, name } = payload;

        if (!token || !password || !name) {
            throw new Error("Missing required fields: token, password, and name are required.");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error("Missing Supabase configuration environment variables.");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Get and Validate Invitation
        console.log(`[AcceptInvite] Validating token: ${token}`);
        const { data: invite, error: inviteError } = await supabase
            .from('invitations')
            .select('*')
            .eq('token', token)
            .single();

        if (inviteError || !invite) {
            console.error("[AcceptInvite] Invitation check failed:", inviteError);
            return new Response(JSON.stringify({ error: "Invalid or expired invitation token." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        if (invite.status === 'accepted') {
            return new Response(JSON.stringify({ error: "This invitation has already been accepted." }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // 2. Auth User Handling
        console.log(`[AcceptInvite] Checking if auth user exists for ${invite.email}...`);

        let userId: string;

        // Try to find existing user first
        const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
        const existingUser = listData?.users.find(u => u.email === invite.email);

        if (existingUser) {
            console.log(`[AcceptInvite] User exists (${existingUser.id}). Updating password and confirming...`);
            const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
                existingUser.id,
                {
                    password: password,
                    email_confirm: true,
                    user_metadata: { name: name, role: invite.role }
                }
            );

            if (updateError) {
                console.error("[AcceptInvite] Auth user update failed:", updateError);
                return new Response(JSON.stringify({ error: `Update failed: ${updateError.message}` }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
                });
            }
            userId = updateData.user.id;
        } else {
            console.log(`[AcceptInvite] Creating new auth user...`);
            const { data: userData, error: userError } = await supabase.auth.admin.createUser({
                email: invite.email,
                password: password,
                email_confirm: true,
                user_metadata: { name: name, role: invite.role }
            });

            if (userError) {
                console.error("[AcceptInvite] Auth user creation failed:", userError);
                return new Response(JSON.stringify({ error: `Creation failed: ${userError.message}` }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400,
                });
            }
            userId = userData.user.id;
        }

        console.log(`[AcceptInvite] User ID ready: ${userId}. Linking assignments via RPC...`);

        // 3. Complete Flow via RPC
        // IMPORTANT: Ensure you have run the latest SQL migration for 'complete_invitation_flow'
        const { data: rpcData, error: rpcError } = await supabase.rpc('complete_invitation_flow', {
            token_input: token,
            user_name: name,
            auth_user_id_input: userId,
            email_input: invite.email
        });

        if (rpcError) {
            console.error("[AcceptInvite] RPC flow failed:", rpcError);
            return new Response(JSON.stringify({ error: "Database setup failed. Make sure you applied the latest SQL migration. Error: " + rpcError.message }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        console.log(`[AcceptInvite] Success! Invitation accepted for ${invite.email}`);

        return new Response(JSON.stringify({
            success: true,
            employee_id: rpcData.employee_id
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("[AcceptInvite] Server Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
