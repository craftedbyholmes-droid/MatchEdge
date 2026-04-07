MATCHEDGE DEV AUTH BOOTSTRAP

WHAT THIS PATCH DOES
- adds a dev-only account creation route
- uses Supabase admin createUser with email_confirm=true
- does not send an email confirmation
- signs the user in immediately with password auth

WHY THIS WORKS
- Supabase admin createUser can create a user server-side and mark the email as confirmed
- Then the browser signs in normally with signInWithPassword

REQUIRED ENV
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DEV_AUTH_BOOTSTRAP=true

HOW TO USE
1. Restart dev server
2. Go to /login
3. Click Create account
4. Enter email + password
5. Account is created and signed in immediately

IMPORTANT
- DEV_AUTH_BOOTSTRAP must be turned OFF before production
- This route is intentionally blocked in production mode