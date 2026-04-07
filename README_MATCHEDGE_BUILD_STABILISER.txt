MATCHEDGE BUILD STABILISER APPLIED

This patch rewrites or patches the known build blockers surfaced so far:
- next.config.ts
- tsconfig.json
- account delete route cookies handling
- offers page typing
- weekly planner leg stake access
- alerts manager stale import

Now run:

npm run build

If build passes, push everything:

git add .
git commit -m "Apply MatchEdge build stabiliser"
git push

If build still fails, copy ONLY the next error block.