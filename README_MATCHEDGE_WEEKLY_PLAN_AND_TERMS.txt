MATCHEDGE WEEKLY PLAN + TERMS CHECKBOX PATCH

WHAT THIS PATCH DOES
- Replaces the simple plan page with a weekly execution planner
- Shows all loaded opportunities for the coming week
- Adds mode switching:
  - Profit Only
  - Welcome Only
  - Hybrid
- Adds per-combination maximum outlay
- Recalculates min/max weekly profit range live
- Lets users exclude stale selections
- Shows current odds in decimal and fractional format
- Shows last profitable price for each leg
- Marks a row complete when all bookmaker links on that row have been opened
- Adds a required Terms & Conditions checkbox to account creation

HOW TO USE
1. Run the patch
2. Restart the dev server
3. Open /plan
4. Adjust mode and outlay values
5. Open bookmaker links to mark rows complete
6. Exclude dead rows and use refresh remaining selections

NOTE
The completion tick is link-open based for testing convenience. You can later change that to an explicit "Placed" action backed by Supabase if wanted.