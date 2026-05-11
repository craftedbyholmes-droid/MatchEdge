'use client'
import { useLeague } from '@/context/LeagueContext'

const LEAGUE_ORDER = ['Bundesliga', 'La Liga', 'Ligue 1', 'Premier League', 'Premiership', 'Serie A']

const LEAGUE_META = {
  'Bundesliga':     { colour: '#d00',    label: 'Bundesliga' },
  'La Liga':        { colour: '#c60',    label: 'La Liga' },
  'Ligue 1':        { colour: '#004494', label: 'Ligue 1' },
  'Premier League': { colour: '#3d195b', label: 'Premier League' },
  'Premiership':    { colour: '#005EB8', label: 'Premiership' },
  'Serie A':        { colour: '#0066cc', label: 'Serie A' }
}

const CATEGORY_META = {
  top_leagues:   { label: 'Top Leagues',    colour: '#0F6E56' },
  domestic_cups: { label: 'Domestic Cups',  colour: '#993C1D' },
  european:      { label: 'European',       colour: '#001D6C' },
  international: { label: 'International',  colour: '#8B0000' }
}

export default function LeagueSelector({ showCounts = {}, mode = 'full' }) {
  const { activeLeague, setActiveLeague, activeCategory, setActiveCategory } = useLeague()

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <button key={key} onClick={() => setActiveCategory(key)} style={{ padding: '6px 14px', background: activeCategory === key ? meta.colour : '#1c1c28', color: '#fff', border: '1px solid ' + (activeCategory === key ? meta.colour : '#2a2a3a'), borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
            {meta.label}
          </button>
        ))}
      </div>

      {/* League tabs - only shown for top_leagues */}
      {activeCategory === 'top_leagues' && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {LEAGUE_ORDER.map(l => {
            const meta = LEAGUE_META[l]
            const count = showCounts[l]
            return (
              <button key={l} onClick={() => setActiveLeague(l)} style={{ padding: '6px 14px', background: activeLeague === l ? meta.colour : '#1c1c28', color: '#fff', border: '1px solid ' + (activeLeague === l ? meta.colour : '#2a2a3a'), borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{meta.label}</span>
              {count !== undefined && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{count}</span>}
            </button>
            )
          })}
        </div>
      )}
    </div>
  )
}