MATCHEDGE WEEKLY PLANNER FIX APPLIED

What this script does:
- backs up weekly-plan-client.tsx
- adds a getLegStake helper if missing
- replaces direct leg.stake references with a safe getter

Now run:

npm run build

If build passes, push it:

git add src/components/planner/weekly-plan-client.tsx README_MATCHEDGE_WEEKLY_PLANNER_FIX.txt
git commit -m "Fix weekly planner leg stake typing"
git push

IMPORTANT
Do not paste terminal output back into PowerShell.
Only paste the command blocks themselves.
