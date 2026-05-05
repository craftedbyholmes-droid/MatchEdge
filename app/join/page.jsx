'use client'
import { useState } from 'react'
import Link from 'next/link'
import supabaseClient from '@/lib/supabaseClient'

export default function JoinPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [age, setAge] = useState(false)
  const [terms, setTerms] = useState(false)
  const [aware, setAware] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSignUp() {
    setError('')
    if (!age) { setError('You must confirm you are 18 or over to use MatchEdge.'); return }
    if (!terms) { setError('You must accept the Terms and Conditions.'); return }
    if (!aware) { setError('You must acknowledge our responsible gambling commitment.'); return }
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const { error: signUpError } = await supabaseClient.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    setMessage('Account created. Please check your email to confirm your address before signing in.')
    setLoading(false)
  }

  const inputStyle = { width: '100%', padding: '10px 12px', background: '#1c1c28', border: '1px solid #2a2a3a', borderRadius: '6px', color: '#e8e8f0', fontSize: '16px', marginBottom: '12px' }
  const checkRow = { display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '14px', fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }

  return (
    <div style={{ maxWidth: '420px', margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Create Account</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Free to join. No card required.</p>

      <div style={{ background: '#13131a', border: '1px solid #f59e0b40', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: '#f59e0b' }}>
        MatchEdge is for information and entertainment purposes only. Tips and analysis do not constitute financial advice. Please gamble responsibly.
      </div>

      {message ? (
        <div style={{ background: '#0F6E5620', border: '1px solid #0F6E56', borderRadius: '8px', padding: '16px', color: '#0F6E56', fontSize: '14px' }}>{message}</div>
      ) : (
        <>
          <input style={inputStyle} type='email' placeholder='Email address' value={email} onChange={e => setEmail(e.target.value)} autoComplete='email' />
          <input style={inputStyle} type='password' placeholder='Password (min 8 characters)' value={password} onChange={e => setPassword(e.target.value)} autoComplete='new-password' />

          <div style={{ margin: '8px 0 16px' }}>
            <label style={checkRow}>
              <input type='checkbox' checked={age} onChange={e => setAge(e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>I confirm I am <strong>18 years of age or older</strong>. MatchEdge is strictly for adults only. Underage gambling is illegal.</span>
            </label>
            <label style={checkRow}>
              <input type='checkbox' checked={terms} onChange={e => setTerms(e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>I have read and accept the <Link href='/terms' style={{ color: '#0F6E56', textDecoration: 'underline' }}>Terms and Conditions</Link> and <Link href='/privacy' style={{ color: '#0F6E56', textDecoration: 'underline' }}>Privacy Policy</Link>.</span>
            </label>
            <label style={checkRow}>
              <input type='checkbox' checked={aware} onChange={e => setAware(e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span>I understand that sports betting involves risk. MatchEdge promotes responsible gambling. If gambling is causing you harm, please visit <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#0F6E56', textDecoration: 'underline' }}>BeGambleAware.org</a> or call <strong>0808 8020 133</strong> (free, 24/7).</span>
            </label>
          </div>

          {error && <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '12px', padding: '10px', background: '#ef444410', borderRadius: '6px' }}>{error}</div>}

          <button onClick={handleSignUp} disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#1c1c28' : '#0F6E56', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creating account...' : 'Create Free Account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
            Already have an account? <Link href='/account' style={{ color: '#0F6E56' }}>Sign in</Link>
          </p>
        </>
      )}

      <div style={{ marginTop: '32px', padding: '14px 16px', background: '#13131a', borderRadius: '8px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.6' }}>
        MatchEdge does not accept bets. We provide analysis and tipster content only.<br />
        18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}