MATCHEDGE DASHBOARD + COMPARE + PROFIT PLAN RESTRUCTURE PATCH

WHAT THIS PATCH DOES
- Compare now shows:
  - bonus/welcome/qualifying opportunities
  - profit bets
- Compare hides used welcome bookmakers from the welcome side
- Profit Plan now shows profit bets only
- Dashboard now shows:
  - used offer count
  - used offer bookmakers
  - total staked
  - total returned
  - net position
  - loss warning highlight
  - cumulative performance chart

SUPABASE
Run:
supabase/dashboard_compare_profitplan_patch.sql

THEN
1. Restart npm run dev
2. Check /dashboard
3. Check /compare
4. Check /plan

NOTE
To populate dashboard performance properly, you will later want to write completed bet activity into public.user_execution_log and used welcome offers into public.offer_usage.