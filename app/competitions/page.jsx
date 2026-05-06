'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { COMPETITIONS, COUNTRY_LABELS } from '@/lib/competitions'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/PlanGate'

const COUNTRY_FLAGS = {
  england: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', germany: '🇩🇪',
  spain: '🇪🇸', france: '🇫🇷', italy: '🇮🇹',
  europe: '🇪🇺', world: '🌍', 'south america': '🌎',
  'north america': '🌎', asia: '🌏', africa: '🌍', oceania: '🌏'
}

export default function CompetitionsPage() {
  const { plan } = usePlan()
  const router = useRouter()
  const [activeCategory, setActiveCategory] = useState('domestic_leagues')

  const categories = Object.entries(COMPETITIONS)

  function goToFixtures(comp) {
    router.push('/competitions/' + comp.id + '?name=' + encodeURIComponent(comp.name))
  }

  if (plan === 'free') return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Competitions</h1>
      <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Browse fixtures, scores and predictions across 30+ competitions.</p>
      <PlanGate requiredPlan='pro' currentPlan={plan}><div /></PlanGate>
    </div>
  )

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>Competitions</h1>
      <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '20px' }}>Select a competition to view this week's fixtures, engine scores and predictions.</p>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {categories.map(([key, cat]) => (
          <button key={key} onClick={() => setActiveCategory(key)} style={{ padding: '7px 14px', background: activeCategory === key ? '#0F6E56' : '#1c1c28', color: '#fff', border: '1px solid ' + (activeCategory === key ? '#0F6E56' : '#2a2a3a'), borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Competition grid */}
      {categories.filter(([key]) => key === activeCategory).map(([key, cat]) => (
        <div key={key}>
          {/* Group by country for domestic */}
          {['domestic_leagues', 'domestic_cups'].includes(key) ? (
            Object.entries(
              cat.competitions.reduce((acc, c) => {
                if (!acc[c.country]) acc[c.country] = []
                acc[c.country].push(c)
                return acc
              }, {})
            ).sort(([a], [b]) => a.localeCompare(b)).map(([country, comps]) => (
              <div key={country} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '18px' }}>{COUNTRY_FLAGS[country] || '🏆'}</span>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#e8e8f0' }}>{COUNTRY_LABELS[country] || country}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {comps.map(comp => (
                    <button key={comp.id} onClick={() => goToFixtures(comp)} style={{ background: '#13131a', border: '1px solid ' + comp.colour + '60', borderRadius: '8px', padding: '12px 16px', cursor: 'pointer', textAlign: 'left', minWidth: '160px', flex: '1 1 160px', maxWidth: '220px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8e8f0', marginBottom: '4px' }}>{comp.name}</div>
                      {comp.tier && <div style={{ fontSize: '11px', color: '#6b7280' }}>Tier {comp.tier}</div>}
                      <div style={{ marginTop: '8px', fontSize: '11px', color: comp.colour, fontWeight: 600 }}>View fixtures →</div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {cat.competitions.map(comp => (
                <button key={comp.id} onClick={() => goToFixtures(comp)} style={{ background: '#13131a', border: '1px solid ' + comp.colour + '60', borderRadius: '8px', padding: '16px', cursor: 'pointer', textAlign: 'left', flex: '1 1 200px', maxWidth: '280px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8e8f0', marginBottom: '4px' }}>{comp.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px' }}>{COUNTRY_LABELS[comp.country] || comp.country}</div>
                  {comp.hasGroups && <div style={{ fontSize: '10px', color: comp.colour, fontWeight: 600, marginBottom: '6px' }}>GROUP STAGE</div>}
                  <div style={{ fontSize: '11px', color: comp.colour, fontWeight: 600 }}>View fixtures →</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: '32px', fontSize: '12px', color: '#4b5563', textAlign: 'center' }}>
        18+ only. Gamble responsibly. <a href='https://www.begambleaware.org' target='_blank' rel='noopener noreferrer' style={{ color: '#6b7280' }}>BeGambleAware.org</a>
      </div>
    </div>
  )
}