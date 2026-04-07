MATCHEDGE LOCKFILE FIX + EXECUTION TRACKING PATCH

WHAT THIS PATCH DOES
- Removes the extra parent package-lock.json if present
- Creates the Supabase execution tracking SQL patch
- Adds:
  - src/lib/execution.ts
  - src/lib/dashboard.ts

SUPABASE
Run:
supabase/execution_tracking_patch.sql

RESTART
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev

NEXT HOOK-UP
To log a placed bet from the planner, import:

import { logExecution } from "@/lib/execution";

Then call:

await logExecution({
  opportunityId: opportunity.id,
  eventName: opportunity.eventName,
  bookmaker: leg.bookmaker,
  stake: leg.adjustedStake ?? leg.stake,
  odds: leg.odds,
});

To settle a tracked bet later:

import { settleExecution } from "@/lib/execution";
await settleExecution(entryId, actualProfit);

DASHBOARD USE
Use getUserPerformance(userId) from src/lib/dashboard.ts to feed your graph.