MATCHEDGE SUPABASE FINALISER

WHAT THIS PATCH DOES
- Adds Supabase client helpers
- Adds schema.sql with RLS
- Adds user account support through Supabase Auth
- Restricts admin page to allowlisted email
- Adds user settings for qualifying / profit / hybrid mode
- Adds multi-chat with invite acceptance guard
- Persists saved bets and alert rules

WHAT YOU MUST DO NEXT
1. Fill in .env.local:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - ADMIN_ALLOWLIST_EMAILS
2. Run supabase/schema.sql in Supabase SQL editor
3. Enable Auth > Email in Supabase
4. Restart dev server

ADMIN EMAIL CHANGE LATER
- Update public.platform_config.admin_allowlist_emails
- Update ADMIN_ALLOWLIST_EMAILS in .env.local

IMPORTANT ASSUMPTION
- This patch assumes you want email-based auth and username-based chat invites.

START DEV
npm run dev