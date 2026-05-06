import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchMatch, fetchMatchPreview, fetchH2H, fetchStandings, getLeagueMeta } from '@/lib/soccerDataApi'
import { scoreMatch } from '@/lib/scorer'
import { getLeagueWeights } from '@/lib/engineWeights'

export const maxDuration = 60

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    const { data: matches } = await supabaseAdmin.from('matches')
      .select('*').in('status', ['scheduled', 'pre-match'])
      .gte('kickoff_time', today + 'T00:00:00Z')
      .lte('kickoff_time', twoWeeks + 'T23:59:59Z')
      .order('kickoff_time', { ascending: true })
    if (!matches?.length) return NextResponse.json({ ok: true, scored: 0 })

    // Cache standings per league to avoid repeat calls
    const standingsCache = {}
    async function getStandings(leagueId) {
      if (standingsCache[leagueId]) return standingsCache[leagueId]
      const rows = await fetchStandings(leagueId)
      standingsCache[leagueId] = rows
      // Upsert to league_standings table
      for (const row of rows) {
        await supabaseAdmin.from('league_standings').upsert({
          standing_id: leagueId + '_' + row.team_id,
          league_id: leagueId,
          ...row,
          updated_at: new Date().toISOString()
        }, { onConflict: 'standing_id' }).catch(() => {})
      }
      return rows
    }

    let scored = 0, errors = 0
    for (const match of matches) {
      try {
        const sdId = match.sd_match_id || match.fixture_id?.replace('sd_', '')
        if (!sdId) continue

        // Fetch match detail and preview in parallel
        const [matchDetail, preview] = await Promise.all([
          fetchMatch(sdId),
          fetchMatchPreview(sdId)
        ])
        if (!matchDetail) continue

        // Log sidelined players
        const allSidelined = [
          ...(matchDetail.home_sidelined || []).map(p => ({ ...p, side: 'home', team_id: matchDetail.home_team?.id })),
          ...(matchDetail.away_sidelined || []).map(p => ({ ...p, side: 'away', team_id: matchDetail.away_team?.id }))
        ]
        for (const sl of allSidelined) {
          await supabaseAdmin.from('player_sidelined_log').upsert({
            log_id: match.fixture_id + '_' + sl.player?.id,
            player_id: sl.player?.id,
            player_name: sl.player?.name,
            team_id: sl.team_id,
            fixture_id: match.fixture_id,
            status: sl.status,
            injury_desc: sl.desc,
            logged_date: today
          }, { onConflict: 'log_id' }).catch(() => {})
        }

        // Fetch H2H if we have team IDs
        let h2h = null
        if (matchDetail.home_team?.id && matchDetail.away_team?.id) {
          h2h = await fetchH2H(matchDetail.home_team.id, matchDetail.away_team.id)
        }

        // Get standings for this league
        const leagueId = match.sd_league_id
        const standings = leagueId ? await getStandings(leagueId) : []
        const homeStanding = standings.find(s => s.team_id === matchDetail.home_team?.id || s.team_name === match.home_team)
        const awayStanding = standings.find(s => s.team_id === matchDetail.away_team?.id || s.team_name === match.away_team)

        // Get league weights
        const leagueMeta = getLeagueMeta(leagueId)
        const weights = await getLeagueWeights(supabaseAdmin, leagueMeta?.name || match.league)

        // Score the match
        const result = scoreMatch({
          matchDetail,
          h2h,
          homeStanding,
          awayStanding,
          preview,
          weights
        })

        // Determine score state
        let scoreState = 1
        if (matchDetail.lineup_type === 'confirmed') scoreState = 4
        else if (matchDetail.lineup_type === 'projected') scoreState = 3
        else if (preview?.has_preview) scoreState = 2

        // Upsert match score with full modifiers
        await supabaseAdmin.from('match_scores').upsert({
          score_id: match.fixture_id + '_s' + scoreState,
          fixture_id: match.fixture_id,
          score_state: scoreState,
          total_home: result.total_home,
          total_away: result.total_away,
          momentum_direction: result.momentum_direction,
          momentum_strength: result.momentum_strength,
          modifiers: {
            factors:        result.factors,
            weights_used:   result.weights_used,
            odds: {
              match_winner: { home: matchDetail.odds_home_win, draw: matchDetail.odds_draw, away: matchDetail.odds_away_win },
              over_under:   { total: matchDetail.odds_ou_line, over: matchDetail.odds_over, under: matchDetail.odds_under },
              handicap:     { market: matchDetail.odds_hcap, home: matchDetail.odds_hcap_home, away: matchDetail.odds_hcap_away }
            },
            home_lineup:    matchDetail.home_lineup,
            away_lineup:    matchDetail.away_lineup,
            home_bench:     matchDetail.home_bench,
            away_bench:     matchDetail.away_bench,
            home_sidelined: matchDetail.home_sidelined,
            away_sidelined: matchDetail.away_sidelined,
            formation_home: matchDetail.formation_home,
            formation_away: matchDetail.formation_away,
            lineup_type:    matchDetail.lineup_type,
            excitement:     matchDetail.excitement,
            preview_prediction: preview?.prediction || null
          },
          created_at: new Date().toISOString()
        }, { onConflict: 'score_id' })

        // Update match score state
        await supabaseAdmin.from('matches').update({
          score_state: scoreState,
          status: matchDetail.status === 'pre-match' ? 'scheduled' : matchDetail.status
        }).eq('fixture_id', match.fixture_id)

        scored++
      } catch(err) {
        console.error('Score error', match.fixture_id, err.message)
        errors++
      }
    }
    return NextResponse.json({ ok: true, scored, errors, total: matches.length })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}