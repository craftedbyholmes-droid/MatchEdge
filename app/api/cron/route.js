import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchUpcomingFixtures, sdDateToISO, fetchTransfers } from '@/lib/soccerDataApi'

export const maxDuration = 60

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const fixtures = await fetchUpcomingFixtures()
    let inserted = 0, updated = 0, skipped = 0
    const teamIds = new Set()

    for (const f of fixtures) {
      if (!f.kickoff_iso) { skipped++; continue }
      if (!f.home_team || !f.away_team) { skipped++; continue }
      const fixtureId = 'sd_' + f.sd_match_id
      teamIds.add(f.home_team_id)
      teamIds.add(f.away_team_id)
      const { error } = await supabaseAdmin.from('matches').upsert({
        fixture_id:   fixtureId,
        home_team:    f.home_team,
        away_team:    f.away_team,
        league:       f.league_name,
        league_code:  f.league_code,
        sd_league_id: f.sd_league_id,
        season:       '2025/26',
        kickoff_time: f.kickoff_iso,
        status:       'scheduled',
        score_state:  1,
        sd_match_id:  f.sd_match_id,
        home_team_id: f.home_team_id,
        away_team_id: f.away_team_id
      }, { onConflict: 'fixture_id', ignoreDuplicates: false })
      if (error) { console.error('Upsert error', fixtureId, error.message); skipped++ }
      else inserted++
    }

    // Fetch transfers for all teams seen today — runs async, non-blocking
    const teamArr = [...teamIds].filter(Boolean).slice(0, 20)
    Promise.all(teamArr.map(async tid => {
      try {
        const data = await fetchTransfers(tid)
        if (!data?.recent_transfers_in?.length) return
        for (const t of data.recent_transfers_in) {
          await supabaseAdmin.from('player_transfers').upsert({
            transfer_id:    t.player_id + '_' + tid + '_' + (t.date || 'unknown'),
            player_id:      t.player_id,
            player_name:    t.player_name,
            to_team_id:     tid,
            from_team_name: t.from_team,
            transfer_date:  t.date ? (() => { const p = t.date.split('-'); return p.length === 3 ? p[2]+'-'+p[1]+'-'+p[0] : null })() : null,
            fee_eur:        t.fee_eur || 0,
            days_since:     t.days_since || 0,
            adaptation_mult: Math.round((0.65 + 0.35 * Math.min(1, (t.days_since || 0) / 90)) * 100) / 100
          }, { onConflict: 'transfer_id' }).catch(() => {})
        }
      } catch(err) { console.error('Transfer fetch error', tid, err.message) }
    })).catch(() => {})

    return NextResponse.json({ ok: true, fixtures: fixtures.length, inserted, updated, skipped })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}