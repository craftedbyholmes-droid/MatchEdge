MATCHEDGE ADMIN REFRESH CONTROL + CACHE PATCH

WHAT THIS PATCH DOES
- Adds admin refresh mode selector:
  - manual
  - hourly
  - live
- Adds refresh interval selector for hourly mode
- Adds force refresh button
- Stores provider data in provider_cache_snapshots
- Updates compare and plan pages to read through the cache-aware event wrapper

SUPABASE
Run:
supabase/refresh_control_patch.sql

THEN
1. Restart npm run dev
2. Go to /admin
3. Set refresh mode to hourly
4. Set interval to 60 minutes
5. Use Force Refresh Now once
6. Then test /compare and /plan

RECOMMENDED PRE-LAUNCH SETTING
- Refresh mode: hourly
- Refresh interval: 60 minutes