MATCHEDGE SUPABASE SSR AUTH PATCH

WHAT THIS PATCH FIXES
- Missing-session crashes on protected pages
- SSR cookie refresh via middleware
- Redirects unauthenticated users to /login instead of exploding
- Adds basic login/signup page
- Adds sign-out action in sidebar

NEXT STEPS
1. Make sure .env.local contains:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ADMIN_ALLOWLIST_EMAILS=craftedbyholmes@gmail.com

2. Restart dev server:
   npm run dev

3. Create your account or sign in at:
   http://localhost:3000/login

4. Then test:
   /dashboard
   /settings
   /plan
   /chat
   /admin

ADMIN ACCESS
- /admin only works when the signed-in email is in ADMIN_ALLOWLIST_EMAILS

IMPORTANT
- If Supabase email confirmation is enabled, confirm the email before signing in.
- If you later change the admin email, update both:
  - ADMIN_ALLOWLIST_EMAILS in .env.local
  - public.platform_config.admin_allowlist_emails in Supabase