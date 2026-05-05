'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import supabaseClient from '@/lib/supabaseClient'
import { usePlan } from '@/lib/usePlan'

export default function AccountPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [session, setSession] = useState(null)
  const { plan } = usePlan()

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  async function handleSignIn() {
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password })
    if (signInError) { setError(signInError.message); setLoading(false); return }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabaseClient.auth.signOut()
    setSession(null)
  }

  async function handleResetPassword() {
    if (!email) { setError('Enter your email address above first.'); return }
    const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: process.env.NEXT_PUBLIC_SITE_URL + '/account' })
    if (resetError) { setError(resetError.message); return }
    setMessage('Password reset email sent. Check your inbox.')
  }

  const inputStyle = { width: '100%', padding: '10px 12px', background: '#1c1c28', border: '1px solid #2a2a3a', borderRadius: '6px', color: '#e8e8f0', fontSize: '16px', marginBottom: '12px' }
  const planColour = plan === 'edge' ? '#f0c040' : plan === 'pro' ? '#4d9fff' : '#6b7280'
  const planLabel = plan === 'edge' ? 'Edge' : plan === 'pro' ? 'Pro' : 'Free'

  if (session) {
    return (
      <div style={{ maxWidth: '420px', margin: '40px auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>My Account</h1>
        <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Signed in as</div>
          <div style={{ fontWeight: 600, marginBottom: '16px' }}>{session.user.email}</div>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Current plan</div>
          <div style={{ fontWeight: 700, color: planColour, fontSize: '18px', marginBottom: '16px' }}>{planLabel}</div>
          {plan === 'free' && (
            <Link href='/pricing' style={{ display: 'block', textAlign: 'center', background: '#0F6E56', color: '#fff', padding: '10px', borderRadius: '6px', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Upgrade to Pro or Edge</Link>
          )}
          <button onClick={handleSignOut} style={{ width: '100%', padding: '10px', background: '#1c1c28', color: '#9ca3af', border: '1px solid #2a2a3a', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Sign Out</button>
        </div>
        <div style={{ fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.6' }}>
          18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Sign In</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Welcome back to MatchEdge.</p>
      {message && <div style={{ color: '#22c55e', fontSize: '13px', marginBottom: '12px', padding: '10px', background: '#22c55e10', borderRadius: '6px' }}>{message}</div>}
      {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', padding: '10px', background: '#ef444410', borderRadius: '6px' }}>{error}</div>}
      <input style={inputStyle} type='email' placeholder='Email address' value={email} onChange={e => setEmail(e.target.value)} autoComplete='email' />
      <input style={inputStyle} type='password' placeholder='Password' value={password} onChange={e => setPassword(e.target.value)} autoComplete='current-password' />
      <button onClick={handleSignIn} disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#1c1c28' : '#0F6E56', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '10px' }}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
      <button onClick={handleResetPassword} style={{ width: '100%', padding: '10px', background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontSize: '13px', marginBottom: '16px' }}>Forgot password?</button>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280' }}>
        No account? <Link href='/join' style={{ color: '#0F6E56' }}>Create one free</Link>
      </p>
      <div style={{ marginTop: '32px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.6' }}>
        18+ only. Please gamble responsibly.<br /><a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a> | 0808 8020 133 (free, 24/7)
      </div>
    </div>
  )
}