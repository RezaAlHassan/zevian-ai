# 🌐 Hosting Guide: Performance Tracker

This guide takes you through the step-by-step process of hosting your Performance Tracker application online using **Vercel** (for the frontend) and **Supabase** (for the backend and Edge Functions).

---

## 🏗️ 1. Prepare Your Repository

Ensure your code is pushed to a Git provider like **GitHub**, **GitLab**, or **Bitbucket**.

1. Create a new repository (e.g., `performance-tracker`).
2. Push your local code to this repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

---

## 🗄️ 2. Supabase Cloud Setup

If you are already using a Supabase Cloud project, ensure all tables are created.

1. Go to the [Supabase Dashboard](https://app.supabase.com/).
2. Select your project (or create a new one).
3. **SQL Schema**: Run the contents of `schema.sql` and `secure_invite_acceptance.sql` in the **SQL Editor** if you haven't already.
4. **API Keys**: Go to **Settings > API** and copy:
   - `Project URL`
   - `anon` (public) key
   - `service_role` key (keep this secret!)

---

## ⚡ 3. Deploy Edge Functions

You have a `send-invite` function that needs to be live to handle emails.

1. Install the Supabase CLI if you haven't: `npm install supabase --save-dev`
2. Login to Supabase: `npx supabase login`
3. Link your project: `npx supabase link --project-ref <your-project-ref>`
4. Set secrets for the Cloud Function:
   ```powershell
   npx supabase secrets set RESEND_API_KEY=your_resend_api_key
   npx supabase secrets set SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
5. Deploy the function:
   ```powershell
   npx supabase functions deploy send-invite --project-ref <your-project-ref>
   ```

---

## 🚀 4. Host Frontend on Vercel

Vercel is the best platform for Vite/React apps.

1. Sign in to [Vercel](https://vercel.com/) with your GitHub account.
2. Click **Add New > Project**.
3. Import your `performance-tracker` repository.
4. **Environment Variables**: Expand the "Environment Variables" section and add the following:
   - `VITE_SUPABASE_URL`: (Your Supabase Project URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Supabase Anon Key)
   - `VITE_GEMINI_API_KEY`: (Your Google Gemini API Key)
5. **Build Settings**: Vercel should automatically detect Vite. The defaults are:
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Click **Deploy**.

---

## 📧 5. Email Service (Resend)

Your application uses **Resend** to send invitation emails via Supabase Edge Functions.

1. Create an account at [Resend](https://resend.com/).
2. Create an API Key.
3. (Recommended) Add your domain to Resend to ensure emails aren't marked as spam.
4. Ensure this key is set in your Supabase secrets (see Step 3).

---

## 🔗 6. Custom Domain (Optional)

1. In Vercel, go to **Settings > Domains**.
2. Add your domain (e.g., `app.yourcompany.com`).
3. Follow the DNS instructions provided by Vercel (CNAME/A records).

---

## ✅ Final Checklist

- [ ] Is the database schema applied in Supabase Cloud?
- [ ] Are Edge Functions deployed?
- [ ] Are all 3 Environment Variables set in Vercel?
- [ ] Is the `RESEND_API_KEY` set in Supabase Secrets?
- [ ] Is the site accessible at the Vercel URL?

Your Performance Tracker should now be live! 🎯
