'use client'
import { useLeague } from '@/context/LeagueContext'

const LEAGUE_ORDER = ['Bundesliga', 'La Liga', 'Ligue 1', 'English Premier League', 'Scottish Premiership', 'Serie A']

const LEAGUE_META = {
  'Bundesliga':            { colour: '#d00' },
  'La Liga':               { colour: '#c60' },
  'Ligue 1':               { colour: '#004494' },
  'English Premier League':{ colour: '#3d195b' },
  'Scottish Premiership':  { colour: '#005EB8' },
  'Serie A':               { colour: '#0066cc' }
}

const CATEGORY_META = {
  top_leagues:   { label: 'Top Leagues',   colour: '#00C896' },
  domestic_cups: { label: 'Domestic Cups', colour: '#993C1D' },
  european:      { label: 'European',      colour: '#001D6C' },
  international: { label: 'International', colour: '#8B0000' }
}

export default function LeagueSelector({ showCounts = {}, catCounts = {}, mode = 'full' }) {
  const { activeLeague, setActiveLeague, activeCategory, setActiveCategory } = useLeague()
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <button key={key} onClick={() => setActiveCategory(key)} style={{ padding: '6px 14px', background: activeCategory === key ? meta.colour : '#161B22', color: '#fff', border: '1px solid ' + (activeCategory === key ? meta.colour : '#2A3441'), borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {meta.label}
            {catCounts[key] > 0 && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{catCounts[key]}</span>}
          </button>
        ))}
      </div>
      {activeCategory === 'top_leagues' && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {LEAGUE_ORDER.map(l => {
            const meta = LEAGUE_META[l]
            const count = showCounts[l]
            return (
              <button key={l} onClick={() => setActiveLeague(l)} style={{ padding: '6px 14px', background: activeLeague === l ? meta.colour : '#161B22', color: '#fff', border: '1px solid ' + (activeLeague === l ? meta.colour : '#2A3441'), borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                {l}
                {count !== undefined && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 6px', fontSize: '11px' }}>{count}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}