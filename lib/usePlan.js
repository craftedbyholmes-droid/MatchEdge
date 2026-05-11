'use client'
import { useState, useEffect } from 'react'
import { createAuthClient } from '@/lib/supabaseAuth'
import { PRO_LEAGUE_IDS } from '@/lib/soccerDataApi'

// Read plan from cookie synchronously - no flash
function getPlanFromCookie() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\\s*)me_plan=([^;]+)/)
  return match ? match[1] : null
}

function setPlanCookie(plan) {
  if (typeof document === 'undefined') return
  // Cookie expires in 24 hours - refreshed on every visit
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = 'me_plan=' + plan + '; expires=' + expires + '; path=/; SameSite=Lax'
}

function clearPlanCookie() {
  if (typeof document === 'undefined') return
  document.cookie = 'me_plan=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
}

export function usePlan() {
  // Initialise from cookie immediately - prevents flash
  const [plan, setPlan] = useState(() => getPlanFromCookie() || 'free')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createAuthClient()

    async function loadPlan(session) {
      if (!session) {
        setPlan('free')
        clearPlanCookie()
        setLoading(false)
        return
      }
      setUser(session.user)

      // Check localStorage cache first - avoid API call if fresh
      const cached = localStorage.getItem('me_plan_cache')
      if (cached) {
        try {
          const { plan: cachedPlan, ts, uid } = JSON.parse(cached)
          const age = Date.now() - ts
          // Use cache if less than 30 minutes old and same user
          if (age < 30 * 60 * 1000 && uid === session.user.id && cachedPlan) {
            setPlan(cachedPlan)
            setPlanCookie(cachedPlan)
            setLoading(false)
            // Still verify in background but don't block render
            verifyPlan(session, cachedPlan)
            return
          }
        } catch(e) { localStorage.removeItem('me_plan_cache') }
      }

      // No valid cache - fetch from API
      await verifyPlan(session, null)
    }

    async function verifyPlan(session, currentPlan) {
      try {
        const res = await fetch('/api/user/plan', {
          headers: { Authorization: 'Bearer ' + session.access_token }
        })
        const data = await res.json()
        const freshPlan = data.plan || 'free'
        setPlan(freshPlan)
        setPlanCookie(freshPlan)
        // Update localStorage cache
        localStorage.setItem('me_plan_cache', JSON.stringify({
          plan: freshPlan,
          ts: Date.now(),
          uid: session.user.id
        }))
      } catch(err) {
        // Keep current plan on error - don't downgrade
        if (currentPlan) setPlan(currentPlan)
      } finally {
        setLoading(false)
      }
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadPlan(session)
    })

    // Listen for auth changes - sign in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') {
        setPlan('free')
        setUser(null)
        clearPlanCookie()
        localStorage.removeItem('me_plan_cache')
        setLoading(false)
      } else if (session) {
        setUser(session.user)
        loadPlan(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  function canAccessLeague(sdLeagueId) {
    if (plan === 'edge') return true
    if (plan === 'pro') return PRO_LEAGUE_IDS.includes(sdLeagueId)
    return false
  }

  function canAccessCategory(category) {
    if (plan === 'edge') return true
    if (plan === 'pro') return category === 'domestic_leagues' || category === 'domestic_cups'
    return false
  }

  return { plan, user, loading, canAccessLeague, canAccessCategory }
}

export default usePlan