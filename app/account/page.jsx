'use client'
import { useState, useEffect } from 'react'
import { createAuthClient } from '@/lib/supabaseAuth'
import Link from 'next/link'

const PLAN_LABELS = { free: 'Free', pro: 'Pro', edge: 'Edge' }
const PLAN_COLOURS = { free: '#6b7280', pro: '#185FA5', edge: '#f0c040' }

export default function AccountPage() {
  const [user, setUser] = useState(null)
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [mode, setMode] = useState('signin')

  useEffect(() => {
    const supabase = createAuthClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        const res = await fetch('/api/user/plan', { headers: { Authorization: 'Bearer ' + session.access_token } })
        const data = await res.json()
        const p = data.plan || 'free'
        setPlan(p)
        // Set cookie and cache
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
        document.cookie = 'me_plan=' + p + '; expires=' + expires + '; path=/; SameSite=Lax'
        localStorage.setItem('me_plan_cache', JSON.stringify({ plan: p, ts: Date.now(), uid: session.user.id }))
      }
      setLoading(false)
    })
  }, [])

  async function signIn() {
    const supabase = createAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMsg(error.message); return }
    setUser(data.user)
    // Fetch and cache plan immediately on sign in
    const res = await fetch('/api/user/plan', { headers: { Authorization: 'Bearer ' + data.session.access_token } })
    const planData = await res.json()
    const p = planData.plan || 'free'
    setPlan(p)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = 'me_plan=' + p + '; expires=' + expires + '; path=/; SameSite=Lax'
    localStorage.setItem('me_plan_cache', JSON.stringify({ plan: p, ts: Date.now(), uid: data.user.id }))
    setMsg('Signed in successfully')
  }

  async function signOut() {
    const supabase = createAuthClient()
    await supabase.auth.signOut()
    document.cookie = 'me_plan=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    localStorage.removeItem('me_plan_cache')
    setUser(null)
    setPlan('free')
    setMsg('Signed out')
  }

  async function resetPassword() {
    const supabase = createAuthClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setMsg(error ? error.message : 'Reset email sent - check your inbox')
  }

  const inputStyle = { width: '100%', padding: '10px 14px', background: '#1c1c28', border: '1px solid #2a2a3a', borderRadius: '6px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }
  const btnStyle = (colour) => ({ width: '100%', padding: '11px', background: colour || '#0F6E56', color: colour === '#1c1c28' ? '#9ca3af' : '#fff', border: '1px solid ' + (colour === '#1c1c28' ? '#2a2a3a' : 'transparent'), borderRadius: '6px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', marginBottom: '10px' })

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>

  if (user) return (
    <div style={{ maxWidth: '480px', margin: '0 auto', paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>Your Account</h1>
      <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Signed in as</div>
        <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>{user.email}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#1c1c28', borderRadius: '6px', marginBottom: '20px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PLAN_COLOURS[plan] || '#6b7280' }} />
          <div>
            <div style={{ fontWeight: 700, color: PLAN_COLOURS[plan] || '#6b7280' }}>{PLAN_LABELS[plan] || plan} Plan</div>
            {plan === 'free' && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Upgrade to Pro or Edge for full access</div>}
          </div>
          {plan === 'free' && <Link href='/pricing' style={{ marginLeft: 'auto', background: '#0F6E56', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>Upgrade</Link>}
        </div>
        <button onClick={signOut} style={btnStyle('#1c1c28')}>Sign Out</button>
      </div>
      {msg && <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>{msg}</div>}
    </div>
  )

  return (
    <div style={{ maxWidth: '420px', margin: '0 auto', paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '24px' }}>
        {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
      </h1>
      <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '24px' }}>
        <div style={{ marginBottom: '14px' }}><input style={inputStyle} type='email' placeholder='Email address' value={email} onChange={e => setEmail(e.target.value)} /></div>
        {mode !== 'reset' && <div style={{ marginBottom: '20px' }}><input style={inputStyle} type='password' placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} /></div>}
        {mode === 'signin' && <button onClick={signIn} style={btnStyle()}>Sign In</button>}
        {mode === 'reset' && <button onClick={resetPassword} style={btnStyle()}>Send Reset Email</button>}
        {msg && <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginBottom: '12px' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' }}>
          {mode !== 'signin' && <button onClick={() => setMode('signin')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px' }}>Sign In</button>}
          {mode !== 'reset' && <button onClick={() => setMode('reset')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '13px' }}>Forgot password?</button>}
          <Link href='/join' style={{ color: '#0F6E56', fontWeight: 600 }}>Create account</Link>
        </div>
      </div>
    </div>
  )
}