# Invitation System - Fixed ✅

## Issue Resolved
The invitation system was failing with a database error: `null value in column "id" of relation "invitations" violates not-null constraint`. This has been fixed by updating the Edge Function to automatically generate a UUID for each invitation.

## What Was Fixed
- **Edge Function (`send-invite/index.ts`)**: Now generates a unique `id` and supports `initial_project_id` and `initial_manager_id` for auto-assignments.
- **Deployment Status**: Updated locally. Needs redeployment to Supabase to support auto-assignments natively.

## How to Deploy Updates (If Needed)

If you make future changes to the Edge Function, deploy using:

```bash
powershell -ExecutionPolicy Bypass -Command "npx supabase functions deploy send-invite --project-ref aactkegmfwsjefzlhnoi"
```

**Note:** Use the PowerShell bypass command if you encounter execution policy errors.

## Set Environment Variables

The function now needs access to your database to insert the invitation. Set the Service Role Key.
You previously ran `npx supabase secrets set SERVICE_ROLE_KEY=...`. 
I have updated the code to accept `SERVICE_ROLE_KEY` as well, so **you do not need to rename it**.

Ensure `RESEND_API_KEY` is set if you haven't already:
```bash
npx supabase secrets set RESEND_API_KEY=re_123...
```

## Summary of Changes
1. **Edge Function (`send-invite`)**: now handles creating the database record (including project/team assignments) and sending the email.
2. **Frontend**: Delegates the process to the Edge Function, with a fallback "patch" mechanism in `App.tsx` if the deployed function is an older version.

## Troubleshooting
If you still see "No API Key found", verify that:
1. You have deployed the function successfully.
2. Your `.env.local` contains the correct `VITE_SUPABASE_ANON_KEY`.
