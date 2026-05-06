import { LogoFull } from '@/components/Logo'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ paddingBottom: '40px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '48px 16px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <LogoFull size={64} linkTo={null} />
        </div>
        <p style={{ color: '#6b7280', fontSize: '16px', maxWidth: '560px', margin: '0 auto 32px', lineHeight: '1.7' }}>
          AI-powered engine scores, three expert tipsters and real bookmaker odds across 6 leagues — updated automatically every match day.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href='/join' style={{ background: '#0F6E56', color: '#fff', padding: '12px 28px', borderRadius: '6px', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>Get Started Free</Link>
          <Link href='/dashboard' style={{ background: '#1c1c28', color: '#9ca3af', padding: '12px 28px', borderRadius: '6px', fontWeight: 600, fontSize: '15px', textDecoration: 'none', border: '1px solid #2a2a3a' }}>See Today\u0027s Picks</Link>
        </div>
      </div>

      {/* World Cup banner */}
      <div style={{ background: 'linear-gradient(135deg, #0a2463 0%, #1b4332 100%)', borderRadius: '10px', padding: '20px 24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0c040', letterSpacing: '2px', marginBottom: '4px' }}>LIVE NOW</div>
          <div style={{ fontSize: '18px', fontWeight: 800 }}>World Cup 2026</div>
          <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>48 teams \u00b7 104 matches \u00b7 Engine scores on every game</div>
        </div>
        <Link href='/worldcup' style={{ background: '#f0c040', color: '#0a0a0f', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none', flexShrink: 0 }}>View World Cup \u2192</Link>
      </div>

      {/* Persona cards */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#9ca3af', letterSpacing: '1px' }}>THE TIPSTERS</h2>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
        {[
          { name: 'Gaffer Gordon', market: 'Match Results', bio: 'The ex-manager. Reads the game tactically. Trusts the unit scores.', colour: '#0F6E56' },
          { name: 'Stats Stan',    market: 'BTTS / Over-Under', bio: 'The data obsessive. Lives for BTTS and over/under. Never watches the game.', colour: '#185FA5' },
          { name: 'Punter Pez',   market: 'Player Props', bio: 'The instinctive one. Props, cards, goalscorers. High risk, high reward.', colour: '#993C1D' }
        ].map(p => (
          <div key={p.name} style={{ flex: '1 1 240px', background: '#13131a', border: '1px solid ' + p.colour + '40', borderRadius: '8px', padding: '20px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.colour, marginBottom: '10px' }} />
            <div style={{ fontWeight: 700, fontSize: '15px', color: p.colour, marginBottom: '2px' }}>{p.name}</div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', letterSpacing: '0.5px' }}>{p.market.toUpperCase()}</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.6' }}>{p.bio}</div>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#9ca3af', letterSpacing: '1px' }}>THE ENGINE</h2>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
        {[
          { title: 'Six-state scoring', desc: 'Scores update from fixture release through to kick-off as lineups and injuries are confirmed.' },
          { title: 'Per-league weights', desc: 'Serie A is not the Bundesliga. Separate calibration for each league, blended for European and international matches.' },
          { title: 'Real bookmaker odds', desc: 'Live odds from Bet365, William Hill and more, built into every match prediction.' },
          { title: 'Self-adapting', desc: 'The engine reviews its own accuracy weekly and suggests weight adjustments automatically.' }
        ].map(f => (
          <div key={f.title} style={{ flex: '1 1 200px', background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '18px' }}>
            <div style={{ width: '6px', height: '6px', background: '#0F6E56', borderRadius: '50%', marginBottom: '10px' }} />
            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>{f.title}</div>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '32px', background: '#13131a', borderRadius: '10px', border: '1px solid #2a2a3a' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>Start free. Upgrade when you\u0027re ready.</div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Free tier \u00b7 Pro \u00a39.99/mo \u00b7 Edge \u00a324.99/mo \u00b7 Day Pass \u00a31.99</div>
        <Link href='/join' style={{ background: '#0F6E56', color: '#fff', padding: '12px 32px', borderRadius: '6px', fontWeight: 700, fontSize: '15px', textDecoration: 'none' }}>Create Free Account</Link>
      </div>

    </div>
  )
}