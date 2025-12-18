# Troubleshooting "No API key found in request"

If you are seeing the error `{"message":"No API key found in request","hint":"No apikey request header or url param was found."}` when sending an invitation, it often means the Supabase Edge Function is rejecting the request because it lacks authentication headers.

## Common Causes & Fixes

### 1. Missing or Invalid Supabase Keys
Ensure your `.env.local` file contains the correct Supabase URL and Anon Key.
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
If you recently rotated your keys, you must update this file and restart your development server (`npm run dev`).

### 2. Edge Function Deployment (if using Cloud)
If you are running against a cloud Supabase instance, ensure the `send-invite` function is deployed:
```bash
npx supabase functions deploy send-invite --project-ref your-project-ref
```
And that you have set the `RESEND_API_KEY` secret for the function:
```bash
npx supabase secrets set RESEND_API_KEY=re_123456...
```

### 3. Local Development (if using local Supabase)
If you are running locally (`npx supabase start`), ensure the function is being served.
The error might occur if the client tries to hit a function that isn't running or if the local gateway isn't routing correctly.

### 4. Client Side Invocation
The application uses `supabase.functions.invoke('send-invite')`. This automatically attaches the existing auth token and API key. 
If the user is **NOT** logged in (unlikely for "sending" an invite, as you must be a manager), the `Authorization` header might be missing, but the `apikey` header should still be present.

Since the error explicitly says `No apikey request header`, it strongly suggests the `supabase-js` client is not configured with the Anon Key or the request is being stripped by a proxy/network issue.

**Recommendation:**
1. Apply the RLS fix (`fix_invitations_rls.sql`) first, as the `42501` error is a definite blocker code in your application logic.
2. If the "No API Key" error persists after fixing RLS:
   - Check the Network tab in your browser dev tools.
   - Look for the request to `.../functions/v1/send-invite`.
   - Check the **Request Headers**. Does it have the `apikey` header?
   - If missing, check `services/supabaseClient.ts` and your env vars.
