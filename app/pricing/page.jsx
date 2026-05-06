'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/usePlan'

export default function PricingPage() {
  const { plan, user } = usePlan()
  const [dayPassMsg, setDayPassMsg] = useState('')

  async function handleDayPass() {
    if (!user) { window.location.href = '/join'; return }
    setDayPassMsg('Stripe not yet connected. Day pass coming soon.')
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '£0',
      period: 'forever',
      colour: '#6b7280',
      features: [
        'Top 1 pick of the day',
        'Bookmaker links',
        'Results ticker',
        'World Cup page access'
      ],
      missing: [
        'All matches and scores',
        'Full tipster picks',
        'Results history',
        'Upcoming fixtures',
        'Competitions browser'
      ],
      cta: user ? 'Current Plan' : 'Get Started',
      ctaHref: user ? null : '/join',
      disabled: plan === 'free' && !!user
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '£9.99',
      period: 'per month',
      colour: '#4d9fff',
      features: [
        'All matches grouped by league',
        'Top 2 runners per match',
        'Paginated top picks',
        'Last 30 days results history',
        'All tipster picks visible',
        'Tomorrow and upcoming fixtures',
        'Competitions browser — all 30+ competitions',
        'World Cup tipster picks'
      ],
      missing: [
        'Live refresh button',
        'Full results history',
        'Bench Impact flags'
      ],
      cta: plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      ctaHref: null,
      disabled: plan === 'pro'
    },
    {
      id: 'edge',
      name: 'Edge',
      price: '£24.99',
      period: 'per month',
      colour: '#f0c040',
      badge: 'BEST VALUE',
      features: [
        'Everything in Pro',
        'Live refresh button',
        'Full results history',
        'Bench Impact flags',
        'Score history sparklines',
        'All tipster picks and full history',
        'Player and block pitch analysis',
        'Engine weight transparency'
      ],
      missing: [],
      cta: plan === 'edge' ? 'Current Plan' : 'Upgrade to Edge',
      ctaHref: null,
      disabled: plan === 'edge'
    }
  ]

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ textAlign: 'center', padding: '32px 16px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Choose Your Plan</h1>
        <p style={{ color: '#9ca3af', fontSize: '15px' }}>Cancel anytime. No hidden fees.</p>
      </div>

      <div style={{ background: '#13131a', border: '1px solid #f0c04040', borderRadius: '10px', padding: '16px 20px', marginBottom: '28px', textAlign: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f0c040', marginBottom: '4px' }}>Day Pass — £1.99</div>
        <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '12px' }}>Full Edge access until midnight today. See everything before you commit.</div>
        <button onClick={handleDayPass} style={{ background: '#f0c040', color: '#0a0a0f', border: 'none', padding: '10px 28px', borderRadius: '6px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}>
          Try Today for £1.99
        </button>
        {dayPassMsg && <div style={{ marginTop: '10px', fontSize: '13px', color: '#9ca3af' }}>{dayPassMsg}</div>}
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {plans.map(p => (
          <div key={p.id} style={{ flex: '1 1 260px', background: '#13131a', border: '1px solid ' + p.colour + '40', borderRadius: '10px', padding: '24px', position: 'relative' }}>
            {p.badge && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: p.colour, color: '#0a0a0f', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' }}>{p.badge}</div>}
            <div style={{ color: p.colour, fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>{p.name}</div>
            <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '2px' }}>{p.price}</div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>{p.period}</div>
            <div style={{ marginBottom: '20px' }}>
              {p.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '13px', color: '#e8e8f0' }}>
                  <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
              {p.missing.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '13px', color: '#4b5563' }}>
                  <span style={{ flexShrink: 0 }}>✗</span>{f}
                </div>
              ))}
            </div>
            {p.disabled ? (
              <div style={{ textAlign: 'center', padding: '10px', background: '#1c1c28', borderRadius: '6px', fontSize: '13px', color: '#6b7280' }}>Current Plan</div>
            ) : p.ctaHref ? (
              <a href={p.ctaHref} style={{ display: 'block', textAlign: 'center', padding: '10px', background: p.colour, color: p.id === 'free' ? '#fff' : '#0a0a0f', borderRadius: '6px', fontWeight: 700, fontSize: '14px' }}>{p.cta}</a>
            ) : (
              <button onClick={() => alert('Stripe coming soon')} style={{ width: '100%', padding: '10px', background: p.colour, color: '#0a0a0f', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>{p.cta}</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', padding: '16px', background: '#13131a', borderRadius: '8px', fontSize: '12px', color: '#4b5563', textAlign: 'center', lineHeight: '1.8' }}>
        MatchEdge does not accept bets. Tips are for information and entertainment only.<br />
        18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a> | 0808 8020 133 (free, 24/7)
      </div>
    </div>
  )
}