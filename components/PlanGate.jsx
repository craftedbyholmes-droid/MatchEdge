'use client'
import Link from 'next/link'

export default function PlanGate({ requiredPlan, currentPlan, children }) {
  const levels = { free: 0, pro: 1, edge: 2 }
  const has = levels[currentPlan] >= levels[requiredPlan]
  if (has) return children
  return (
    <div style={{ background: '#13131a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '24px', textAlign: 'center', margin: '16px 0' }}>
      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
        {requiredPlan === 'pro' ? 'Pro or Edge required' : 'Edge required'}
      </div>
      <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
        Upgrade to unlock this feature.
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href='/pricing?highlight=daypass' style={{ background: '#f0c040', color: '#0a0a0f', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, fontSize: '13px' }}>
          Try Today £1.99
        </Link>
        <Link href='/pricing' style={{ background: '#1c1c28', color: '#ccc', padding: '8px 18px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', border: '1px solid #2a2a3a' }}>
          View Plans
        </Link>
      </div>
    </div>
  )
}