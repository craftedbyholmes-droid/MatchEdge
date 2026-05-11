'use client'
import Link from 'next/link'
import { usePlan } from '@/lib/usePlan'

export default function PlanGate({ requiredPlan, currentPlan, children, leagueName = null }) {
  const { loading } = usePlan()

  const tiers = { free: 0, pro: 1, edge: 2 }
  const current = tiers[currentPlan] ?? 0
  const required = tiers[requiredPlan] ?? 1

  // While loading - show skeleton instead of upgrade prompt
  // This prevents the flash of locked content
  if (loading && current === 0) {
    return (
      <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '32px', margin: '16px 0', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #1E2530', borderTop: '3px solid #00C896', animation: 'me-spin 0.9s linear infinite' }} />
      </div>
    )
  }

  if (current >= required) return children

  const isProGate = required === 1

  return (
    <div style={{ background: '#161B22', border: '1px solid #2A3441', borderRadius: '10px', padding: '32px', textAlign: 'center', margin: '16px 0' }}>
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>{isProGate ? '📊' : '⚡'}</div>
      <div style={{ fontWeight: 700, fontSize: '17px', marginBottom: '8px' }}>
        {leagueName ? leagueName + ' is available on Edge' : isProGate ? 'Pro or Edge plan required' : 'Edge plan required'}
      </div>
      <div style={{ color: '#484F58', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
        {leagueName
          ? 'The Pro plan covers English leagues only. Upgrade to Edge for all 6 leagues, European and international competitions.'
          : isProGate
            ? 'Upgrade to Pro (9.99/mo) for English leagues, or Edge (24.99/mo) for all leagues and international competitions.'
            : 'This feature is available on the Edge plan (24.99/mo).'
        }
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {isProGate && <Link href='/pricing' style={{ background: '#185FA5', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Pro - 9.99/mo</Link>}
        <Link href='/pricing' style={{ background: '#00C896', color: '#fff', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Edge - 24.99/mo</Link>
        <Link href='/pricing' style={{ background: '#F0B90B20', color: '#F0B90B', border: '1px solid #F0B90B40', padding: '10px 22px', borderRadius: '6px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Day Pass - 1.99</Link>
      </div>
    </div>
  )
}