MATCHEDGE ADMIN PLAN GRANTS PATCH

WHAT THIS PATCH DOES
- Adds admin_plan_grants table with RLS
- Lets admin manually grant Free / Premium / Pro access
- Supports:
  - permanent access
  - time-limited access
- Adds revoke support
- Adds effective-plan resolution function:
  admin grants override paid billing while active
- Adds admin UI for grants on the Admin page

SUPABASE
Run:
supabase/admin_plan_grants_patch.sql

THEN
1. Restart npm run dev
2. Go to /admin
3. Use Manual Plan Access
4. Grant Premium or Pro permanently or with an expiry
5. Revoke grants when needed

IMPORTANT
This patch creates the admin override system and effective plan resolution function. The next sensible step is to wire feature gating to public.get_effective_plan_key(user_id) everywhere premium/pro access matters.