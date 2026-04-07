# Offers automation readiness

This patch prepares MatchEdge for an automated offers pipeline without forcing unsafe auto-publishing.

What it adds:
- offers table
- offer_sources table
- offer_import_runs table
- offer_change_log table
- public offers page reading from structured offer rows
- admin offers manager for manual verified publishing
- admin create-offer API route
- future-ready source model for:
  - CSV uploads
  - affiliate network feeds
  - reviewed URL extraction / scraping

Recommended rollout:
1. use manual admin entry first
2. add CSV import second
3. add feed / scrape review flow later
4. only auto-publish after you trust the pipeline

Admin page:
- /admin/offers

User page:
- /offers