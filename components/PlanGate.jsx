'use client'
import Link from 'next/link'

export default function PlanGate({ requiredPlan, currentPlan, children, leagueName = null }) {
  const tiers = { free: 0, pro: 1, edge: 2 }
  const current = tiers[currentPlan] ?? 0
  const required = tiers[requiredPlan] ?? 1

  if (current >= required) return children

  const isProGate = required === 1

  return (
    <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '10px', padding: '32px', textAlign: 'center', margin: '16px 0' }}>
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>{isProGate ? '\uD83D\uDCCA' : '\u26A1'}</div>
      <div style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>
        {leagueName
          ? leagueName + ' is available on Edge'
          : isProGate ? 'Pro or Edge plan required' : 'Edge plan required'
        }
      </div>
      <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
        {leagueName
          ? 'The Pro plan covers English leagues only. Upgrade to Edge for all 6 leagues, European and international competitions.'
          : isProGate
            ? 'Upgrade to Pro (\u00a39.99/mo) for English leagues, or Edge (\u00a324.99/mo) for all leagues and international competitions.'
            : 'This feature is available on the Edge plan (\u00a324.99/mo).'
        }
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {isProGate && <Link href='/pricing' style={{ background: '#185FA5', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Pro \u2014 \u00a39.99/mo</Link>}
        <Link href='/pricing' style={{ background: '#0F6E56', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Edge \u2014 \u00a324.99/mo</Link>
        <Link href='/pricing' style={{ background: '#f0c04020', color: '#f0c040', border: '1px solid #f0c04040', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Day Pass \u2014 \u00a31.99</Link>
      </div>
    </div>
  )
}