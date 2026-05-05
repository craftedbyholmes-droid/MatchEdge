'use client'
import { useState, useEffect } from 'react'
import supabaseClient from './supabaseClient'
export function usePlan() {
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  useEffect(() => {
    async function fetchPlan() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (!session) { setLoading(false); return }
        setUser(session.user)
        const res = await fetch('/api/user/plan', { headers: { 'Authorization': 'Bearer ' + session.access_token } })
        const data = await res.json()
        setPlan(data.plan || 'free')
      } catch { setPlan('free') } finally { setLoading(false) }
    }
    fetchPlan()
  }, [])
  return { plan, loading, user }
}