'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/usePlan'

const GBP = String.fromCharCode(163)

export default function PricingPage() {
  const { plan } = usePlan()
  const [billing, setBilling] = useState('monthly')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      monthly: 0,
      annual: 0,
      colour: '#8B949E',
      features: [
        '2 top picks per day',
        'Basic confidence score',
        '1 tipster access',
        'Bookmaker links',
        'World Cup page access'
      ],
      missing: [
        'All matches and scores',
        'Full tipster picks',
        'Results history',
        'Competition browser'
      ],
      cta: plan === 'free' ? 'Current Plan' : 'Get Started',
      ctaHref: '/join',
      disabled: plan === 'free'
    },
    {
      id: 'pro',
      name: 'Pro',
      monthly: 9.99,
      annual: 95.90,
      colour: '#185FA5',
      features: [
        'All 3 tipsters — unlimited picks',
        'Full confidence score detail',
        'All English league matches',
        'Last 30 days results history',
        'Tomorrow and upcoming fixtures',
        'Competition browser',
        'World Cup tipster picks'
      ],
      missing: [
        'All 6 leagues + European',
        'Real-time alerts',
        'Full live odds data'
      ],
      cta: plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      ctaHref: null,
      disabled: plan === 'pro'
    },
    {
      id: 'elite',
      name: 'Elite',
      monthly: 19.99,
      annual: 191.90,
      colour: '#F0B90B',
      badge: 'BEST VALUE',
      features: [
        'Everything in Pro',
        'All 6 leagues + European + International',
        'Real-time score alerts',
        'Full live odds data',
        'Full results history',
        'Bench Impact flags',
        'Live refresh button',
        'Player and block pitch analysis'
      ],
      missing: [],
      cta: plan === 'edge' || plan === 'elite' ? 'Current Plan' : 'Upgrade to Elite',
      ctaHref: null,
      disabled: plan === 'edge' || plan === 'elite'
    }
  ]

  function getPrice(p) {
    if (p.monthly === 0) return { display: 'Free', sub: 'forever' }
    if (billing === 'annual') {
      const monthly = (p.annual / 12).toFixed(2)
      return { display: GBP + monthly + '/mo', sub: GBP + p.annual.toFixed(2) + '/yr \u2014 2 months free' }
    }
    return { display: GBP + p.monthly.toFixed(2) + '/mo', sub: 'billed monthly' }
  }

  return (
    <div className='me-page'>
      <div style={{ textAlign: 'center', padding: '24px 0 20px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>Choose Your Plan</h1>
        <p className='me-sub' style={{ marginBottom: '20px' }}>Cancel anytime. No hidden fees.</p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: '#161B22', border: '1px solid #2A3441', borderRadius: '8px', padding: '4px', marginBottom: '8px' }}>
          <button onClick={() => setBilling('monthly')} className={'me-btn' + (billing === 'monthly' ? ' me-btn-primary' : '')} style={{ border: 'none', borderRadius: '6px' }}>Monthly</button>
          <button onClick={() => setBilling('annual')} className={'me-btn' + (billing === 'annual' ? ' me-btn-primary' : '')} style={{ border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Annual <span className='me-badge' style={{ background: '#F0B90B', color: '#0B0E11' }}>-20%</span>
          </button>
        </div>
        {billing === 'annual' && <div style={{ fontSize: '12px', color: '#00C896' }}>2 months free on annual plans</div>}
      </div>

      {/* Day pass */}
      <div className='me-card' style={{ borderColor: '#F0B90B40', marginBottom: '28px' }}>
        <div className='me-flex-between' style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#F0B90B', marginBottom: '4px' }}>Day Pass {GBP}1.99</div>
            <div className='me-sub'>Full Elite access until midnight. No auto-renewal.</div>
          </div>
          <button onClick={() => alert('Stripe coming soon')} style={{ background: '#F0B90B', color: '#0B0E11', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}>
            Try Today {GBP}1.99
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'start' }}>
        {plans.map(p => {
          const price = getPrice(p)
          return (
            <div key={p.id} className='me-card' style={{ borderColor: p.colour === '#F0B90B' ? '#F0B90B40' : p.colour === '#8B949E' ? '#2A3441' : p.colour + '40', position: 'relative' }}>
              {p.badge && (
                <div style={{ position: 'absolute', top: '-10px', right: '16px', background: '#F0B90B', color: '#0B0E11', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' }}>{p.badge}</div>
              )}
              <div style={{ color: p.colour, fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>{p.name}</div>
              <div style={{ fontSize: '26px', fontWeight: 800, marginBottom: '2px' }}>{price.display}</div>
              <div className='me-muted' style={{ marginBottom: '20px' }}>{price.sub}</div>

              <div style={{ marginBottom: '20px' }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#00C896', flexShrink: 0, marginTop: '1px' }}>+</span>
                    <span>{f}</span>
                  </div>
                ))}
                {p.missing.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '13px', color: '#484F58' }}>
                    <span style={{ flexShrink: 0 }}>-</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              {p.disabled ? (
                <div style={{ textAlign: 'center', padding: '10px', background: '#1E2530', borderRadius: '6px', fontSize: '13px', color: '#8B949E' }}>Current Plan</div>
              ) : p.ctaHref ? (
                <Link href={p.ctaHref} style={{ display: 'block', textAlign: 'center', padding: '11px', background: p.colour === '#8B949E' ? '#1E2530' : p.colour, color: p.colour === '#8B949E' ? '#E6EDF3' : '#0B0E11', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>{p.cta}</Link>
              ) : (
                <button onClick={() => alert('Stripe coming soon')} style={{ width: '100%', padding: '11px', background: p.colour === '#F0B90B' ? '#F0B90B' : '#185FA5', color: '#0B0E11', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>{p.cta}</button>
              )}
            </div>
          )
        })}
      </div>

      <div className='me-card' style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: '#484F58', lineHeight: '1.8' }}>
        MatchEdge does not accept bets. Tips are for information and entertainment only.<br />
        18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#8B949E' }}>BeGambleAware.org</a> | 0808 8020 133 (free, 24/7)
      </div>
    </div>
  )
}