'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
export default function LandingPage() {
  const [gdprDismissed, setGdprDismissed] = useState(true)
  useEffect(() => { if (!localStorage.getItem('gdpr_dismissed')) setGdprDismissed(false) }, [])
  const personas = [
    { colour: '#0F6E56', name: 'Gaffer Gordon', market: 'Match Results', bio: 'The ex-manager. Reads the game tactically.' },
    { colour: '#185FA5', name: 'Stats Stan', market: 'BTTS and Over/Under', bio: 'The data obsessive. Never watches the game.' },
    { colour: '#993C1D', name: 'Punter Pez', market: 'Player Props', bio: 'High risk, high reward. Goalscorer specialist.' }
  ]
  return (
    <div>
      <div style={{ textAlign: 'center', padding: '48px 16px 32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>Match<span style={{ color: '#0F6E56' }}>Edge</span></h1>
        <p style={{ fontSize: '18px', color: '#9ca3af', marginBottom: '8px' }}>AI-powered football analytics. EPL and SPL.</p>
        <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px' }}>Three expert tipsters. One scoring engine. Updated six times every matchday.</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href='/join' style={{ background: '#0F6E56', color: '#fff', padding: '12px 28px', borderRadius: '6px', fontWeight: 600 }}>Get Started Free</Link>
          <Link href='/dashboard' style={{ background: '#1c1c28', color: '#ccc', padding: '12px 28px', borderRadius: '6px', fontWeight: 600, border: '1px solid #2a2a3a' }}>View Todays Picks</Link>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '40px' }}>
        {personas.map(p => (
          <div key={p.name} style={{ flex: '1 1 260px', background: '#13131a', border: '1px solid ' + p.colour + '40', borderRadius: '8px', padding: '20px' }}>
            <div style={{ color: p.colour, fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>{p.name}</div>
            <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>{p.market}</div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>{p.bio}</div>
          </div>
        ))}
      </div>
      {!gdprDismissed && (
        <div style={{ position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)', background: '#1c1c28', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '16px 20px', maxWidth: '480px', width: 'calc(100% - 32px)', zIndex: 200, fontSize: '13px', color: '#9ca3af' }}>
          <p style={{ marginBottom: '10px' }}>We use cookies to improve your experience.</p>
          <button onClick={() => { localStorage.setItem('gdpr_dismissed','1'); setGdprDismissed(true) }} style={{ background: '#0F6E56', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer' }}>Accept</button>
        </div>
      )}
    </div>
  )
}