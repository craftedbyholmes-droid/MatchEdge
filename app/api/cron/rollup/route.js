import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchMatch, parseMatchEvents, buildPlayerStatFromEvents } from '@/lib/soccerDataApi'

export const maxDuration = 60

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Get matches that finished yesterday and haven't been rolled up
    const { data: finished } = await supabaseAdmin.from('matches')
      .select('*')
      .eq('status', 'FT')
      .gte('kickoff_time', yesterday + 'T00:00:00Z')
      .lt('kickoff_time', today + 'T00:00:00Z')

    let processed = 0
    for (const match of (finished || [])) {
      try {
        const sdId = match.sd_match_id || match.fixture_id?.replace('sd_', '')
        if (!sdId) continue
        const matchDetail = await fetchMatch(sdId)
        if (!matchDetail) continue

        const { goals, cards, subs } = parseMatchEvents(
          matchDetail.events || [],
          matchDetail.home_team?.id,
          matchDetail.away_team?.id
        )

        // Log all events
        const allEvents = [
          ...goals.map(e => ({ ...e, fixture_id: match.fixture_id, match_date: yesterday, league_id: match.sd_league_id, event_type: e.type })),
          ...cards.map(e => ({ ...e, fixture_id: match.fixture_id, match_date: yesterday, league_id: match.sd_league_id, event_type: e.type })),
          ...subs.map(e => ({ player_id: e.player_out_id, fixture_id: match.fixture_id, match_date: yesterday, league_id: match.sd_league_id, event_type: 'sub_off', minute: e.minute, side: e.side }))
        ]
        for (const ev of allEvents) {
          if (!ev.player_id) continue
          await supabaseAdmin.from('match_event_log').upsert({
            event_id: match.fixture_id + '_' + ev.event_type + '_' + ev.player_id + '_' + (ev.minute || 0),
            fixture_id: ev.fixture_id,
            match_date: ev.match_date,
            league_id: ev.league_id,
            player_id: ev.player_id,
            player_name: ev.player_name,
            team_id: ev.side === 'home' ? matchDetail.home_team?.id : matchDetail.away_team?.id,
            side: ev.side,
            event_type: ev.event_type,
            minute: ev.minute
          }, { onConflict: 'event_id' }).catch(() => {})
        }

        // Update player season stats
        const playerStats = buildPlayerStatFromEvents({ goals, cards, subs })
        for (const ps of playerStats) {
          const teamId = match.sd_league_id
          const statId = ps.player_id + '_' + match.sd_league_id + '_2025'
          const { data: existing } = await supabaseAdmin.from('player_season_stats').select('*').eq('stat_id', statId).single()
          const updated = {
            stat_id: statId,
            player_id: ps.player_id,
            player_name: ps.player_name || existing?.player_name,
            league_id: match.sd_league_id,
            season: '2025/26',
            appearances: (existing?.appearances || 0) + 1,
            goals: (existing?.goals || 0) + (ps.goals || 0),
            own_goals: (existing?.own_goals || 0) + (ps.own_goals || 0),
            penalties: (existing?.penalties || 0) + (ps.penalties || 0),
            yellow_cards: (existing?.yellow_cards || 0) + (ps.yellow_cards || 0),
            red_cards: (existing?.red_cards || 0) + (ps.red_cards || 0),
            subs_on: (existing?.subs_on || 0) + (ps.subs_on || 0),
            subs_off: (existing?.subs_off || 0) + (ps.subs_off || 0),
            updated_at: new Date().toISOString()
          }
          const apps = updated.appearances
          updated.goals_per_90 = apps > 0 ? Math.round((updated.goals / apps) * 90 * 100) / 100 : 0
          updated.cards_per_90 = apps > 0 ? Math.round(((updated.yellow_cards + updated.red_cards) / apps) * 90 * 100) / 100 : 0
          await supabaseAdmin.from('player_season_stats').upsert(updated, { onConflict: 'stat_id' }).catch(() => {})
        }
        processed++
      } catch(err) { console.error('Rollup error', match.fixture_id, err.message) }
    }
    return NextResponse.json({ ok: true, processed })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}