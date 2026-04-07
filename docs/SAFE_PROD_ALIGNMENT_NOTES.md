# Safe production alignment notes

This patch was designed to avoid overwriting your current:
- app shell
- sidebar
- login page
- pricing page
- compare page
- plan page
- dashboard page

## What it added
- src/lib/access.ts
- src/lib/execution.ts
- src/lib/dashboard.ts
- src/components/dashboard/execution-log-manager.tsx
- supabase/safe_prod_alignment_patch.sql

## What you can wire manually next

### Premium-gate the Profit Plan page
Inside src/app/plan/page.tsx:

```ts
import { requirePlanAccess } from "@/lib/access";
...
const user = await requireUser();
await requirePlanAccess(user.id, "premium");
```

### Premium-gate the Alerts page
Inside src/app/alerts/page.tsx:

```ts
import { requirePlanAccess } from "@/lib/access";
...
const user = await requireUser();
await requirePlanAccess(user.id, "premium");
```

### Log executions from Compare or Plan
Import:

```ts
import { logExecution } from "@/lib/execution";
```

Then call:

```ts
await logExecution({
  opportunityId: opportunity.id,
  eventName: opportunity.eventName,
  kind: opportunity.kind,
  sourcePage: "compare",
  notes: opportunity.notes,
  legs: opportunity.stakePlan.map((leg) => ({
    bookmaker: leg.bookmaker,
    bookmakerKey: leg.bookmakerKey,
    stake: leg.adjustedStake ?? leg.stake,
    odds: leg.odds,
  })),
});
```

### Feed dashboard graph
Import:

```ts
import { getUserPerformance, getExecutionLogRows } from "@/lib/dashboard";
```

Use:
- getUserPerformance(user.id) for graph data
- getExecutionLogRows(user.id) for execution log management UI