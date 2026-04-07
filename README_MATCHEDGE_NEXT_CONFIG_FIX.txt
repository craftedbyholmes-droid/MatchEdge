NEXT.CONFIG FIX APPLIED

Now run these in PowerShell:

npm run build

If build passes, push it:

git add next.config.ts README_MATCHEDGE_NEXT_CONFIG_FIX.txt
git commit -m "Fix next.config.ts for Vercel build"
git push

Then let Vercel auto-deploy or click Redeploy.
