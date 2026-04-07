# Lock UI to effective plan

This patch updates visible plan UI to follow the same source of truth as access control:

- App shell plan label now uses getEffectivePlanKey(user.id)
- Pricing page highlights the resolved effective plan
- Pricing page no longer relies on stale billing-style display logic

If a user has a manual admin override to PRO, the UI should now show PRO in:
- sidebar/account area
- pricing page current plan state