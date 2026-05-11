'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePlan } from '@/lib/usePlan'

export default function PricingPage() {
  const { plan } = usePlan()
  const [billing, setBilling] = useState('monthly')
  const [dayPassMsg, setDayPassMsg] = useState('')

  async function handleDayPass() {
    setDayPassMsg('Stripe coming soon - Day Pass available shortly.')
  }

  const plans = [
    {
      id: 'free',
      name: 'Free',
      monthly: 0,
      annual: 0,
      colour: 'var(--text-secondary)',
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
        'Odds movement data',
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
      monthly: 19.99,
      annual: 191.90,
      colour: '#185FA5',
      features: [
        'Unlimited picks - all 3 tipsters',
        'Full confidence score detail',
        'All English league matches',
        'Last 30 days results history',
        'Tomorrow and upcoming fixtures',
        'Competition browser',
        'World Cup tipster picks',
        'Limited odds movement data'
      ],
      missing: [
        'All 6 leagues + European',
        'Real-time alerts',
        'Full live odds data',
        'VIP tipster access'
      ],
      cta: plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      ctaHref: null,
      disabled: plan === 'pro'
    },
    {
      id: 'elite',
      name: 'Elite',
      monthly: 44.99,
      annual: 431.90,
      colour: 'var(--gold)',
      badge: 'BEST VALUE',
      features: [
        'Everything in Pro',
        'All 6 leagues + European + International',
        'Real-time score alerts',
        'Full live odds movement data',
        'All 3 tipsters + VIP picks',
        'Full results history',
        'Bench Impact flags',
        'Score history sparklines',
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
      return { display: monthly + '/mo', sub: p.annual.toFixed(2) + '/yr - 2 months free' }
    }
    return { display: p.monthly.toFixed(2) + '/mo', sub: 'billed monthly' }
  }

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ textAlign: 'center', padding: '32px 16px 24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>Choose Your Plan</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>Cancel anytime. No hidden fees.</p>

        {/* Billing toggle */}
        <div style={{ display: 'inline-flex', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', marginBottom: '8px' }}>
          <button onClick={() => setBilling('monthly')} style={{ padding: '7px 20px', background: billing === 'monthly' ? 'var(--primary)' : 'transparent', color: billing === 'monthly' ? '#0B0E11' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}>Monthly</button>
          <button onClick={() => setBilling('annual')} style={{ padding: '7px 20px', background: billing === 'annual' ? 'var(--primary)' : 'transparent', color: billing === 'annual' ? '#0B0E11' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Annual <span style={{ background: 'var(--gold)', color: '#0B0E11', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '8px' }}>-20%</span>
          </button>
        </div>
        {billing === 'annual' && <div style={{ fontSize: '12px', color: 'var(--primary)' }}>2 months free on annual plans</div>}
      </div>

      {/* Day pass */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--gold-dim)', borderRadius: '10px', padding: '16px 20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold)', marginBottom: '4px' }}>Day Pass - 1.99</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Full Elite access until midnight. See everything before you commit. No auto-renewal.</div>
        </div>
        <button onClick={handleDayPass} style={{ background: 'var(--gold)', color: '#0B0E11', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', flexShrink: 0 }}>Try Today - 1.99</button>
      </div>
      {dayPassMsg && <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{dayPassMsg}</div>}

      {/* Plan cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {plans.map(p => {
          const price = getPrice(p)
          return (
            <div key={p.id} style={{ flex: '1 1 260px', background: 'var(--card)', border: '1px solid ' + (p.colour === 'var(--gold)' ? '#F0B90B40' : p.colour === 'var(--text-secondary)' ? 'var(--border)' : p.colour + '40'), borderRadius: '10px', padding: '24px', position: 'relative' }}>
              {p.badge && <div style={{ position: 'absolute', top: '-10px', right: '16px', background: 'var(--gold)', color: '#0B0E11', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px' }}>{p.badge}</div>}
              <div style={{ color: p.colour, fontWeight: 800, fontSize: '18px', marginBottom: '4px' }}>{p.name}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, marginBottom: '2px' }}>{price.display}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>{price.sub}</div>
              <div style={{ marginBottom: '20px' }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '13px', color: 'var(--text)' }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>+</span>{f}
                  </div>
                ))}
                {p.missing.map(f => (
                  <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <span style={{ flexShrink: 0 }}>-</span>{f}
                  </div>
                ))}
              </div>
              {p.disabled ? (
                <div style={{ textAlign: 'center', padding: '10px', background: 'var(--card-raised)', borderRadius: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Current Plan</div>
              ) : p.ctaHref ? (
                <Link href={p.ctaHref} style={{ display: 'block', textAlign: 'center', padding: '10px', background: p.colour === 'var(--text-secondary)' ? 'var(--card-raised)' : p.colour, color: p.colour === 'var(--text-secondary)' ? 'var(--text)' : '#0B0E11', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>{p.cta}</Link>
              ) : (
                <button onClick={() => alert('Stripe coming soon')} style={{ width: '100%', padding: '10px', background: p.colour === 'var(--gold)' ? 'var(--gold)' : '#185FA5', color: '#0B0E11', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>{p.cta}</button>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '32px', padding: '16px', background: 'var(--card)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: '1.8' }}>
        MatchEdge does not accept bets. Tips are for information and entertainment only.<br />
        18+ only. Please gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: 'var(--text-secondary)' }}>BeGambleAware.org</a> | 0808 8020 133 (free, 24/7)
      </div>
    </div>
  )
}