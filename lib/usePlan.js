'use client'
import { useState, useEffect } from 'react'
import { createAuthClient } from '@/lib/supabaseAuth'
import { PRO_LEAGUE_IDS } from '@/lib/soccerDataApi'

export function usePlan() {
  const [plan, setPlan] = useState('free')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createAuthClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { setLoading(false); return }
      setUser(session.user)
      fetch('/api/user/plan', { headers: { Authorization: 'Bearer ' + session.access_token } })
        .then(r => r.json()).then(d => { setPlan(d.plan || 'free'); setLoading(false) })
        .catch(() => setLoading(false))
    })
  }, [])

  // Check if this plan can access a given league
  function canAccessLeague(sdLeagueId) {
    if (plan === 'edge') return true
    if (plan === 'pro') return PRO_LEAGUE_IDS.includes(sdLeagueId)
    return false
  }

  // Check if this plan can access a competition category
  function canAccessCategory(category) {
    if (plan === 'edge') return true
    if (plan === 'pro') return category === 'domestic_leagues' || category === 'domestic_cups'
    return false
  }

  return { plan, user, loading, canAccessLeague, canAccessCategory }
}

export default usePlan