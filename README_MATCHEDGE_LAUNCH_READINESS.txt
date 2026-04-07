MATCHEDGE LAUNCH READINESS + STRIPE + FINAL CONTENT PATCH

WHAT THIS PATCH DOES
- Adds Stripe environment placeholders to .env.local
- Installs Stripe packages
- Adds a Stripe checkout route stub for paid plans
- Replaces the pricing page with GBP plans tied to real workflow differences
- Shows unavailable features as clearly faded
- Polishes launch-facing page copy for Offers, Alerts, and Saved Bets
- Keeps the app ready for your Stripe keys and price IDs

ENV VARS ADDED
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_FREE_GBP
- STRIPE_PRICE_PREMIUM_GBP
- STRIPE_PRICE_PRO_GBP
- NEXT_PUBLIC_STRIPE_SUCCESS_URL
- NEXT_PUBLIC_STRIPE_CANCEL_URL

NEXT STEPS
1. Add your real Stripe keys and price IDs to .env.local
2. Restart npm run dev
3. Check /pricing /offers /alerts /saved
4. Test the checkout route after Stripe is configured

SUGGESTION
Before launch, add a Stripe webhook handler so plan upgrades can automatically update user tier data after payment succeeds.