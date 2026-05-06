import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchStandings, COVERED_LEAGUES } from '@/lib/soccerDataApi'

export const maxDuration = 60

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    let written = 0, errors = 0
    // Only fetch standings for leagues that have standing tables (not cups/international)
    const leaguesWithStandings = COVERED_LEAGUES.filter(l => l.tier > 0)
    for (const league of leaguesWithStandings) {
      try {
        const rows = await fetchStandings(league.sd_id)
        if (!rows?.length) continue
        for (const row of rows) {
          await supabaseAdmin.from('league_standings').upsert({
            standing_id:   league.sd_id + '_' + row.team_id,
            league_id:     league.sd_id,
            season:        '2025/26',
            stage_name:    row.stage_name,
            position:      row.position,
            team_id:       row.team_id,
            team_name:     row.team_name,
            games_played:  row.games_played,
            points:        row.points,
            wins:          row.wins,
            draws:         row.draws,
            losses:        row.losses,
            goals_for:     row.goals_for,
            goals_against: row.goals_against,
            goal_diff:     row.goal_diff,
            updated_at:    new Date().toISOString()
          }, { onConflict: 'standing_id' })
          written++
        }
        console.log('Standings written:', league.name, rows.length, 'teams')
      } catch(err) {
        console.error('Standings error:', league.name, err.message)
        errors++
      }
    }
    return NextResponse.json({ ok: true, written, errors, leagues: leaguesWithStandings.length })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}