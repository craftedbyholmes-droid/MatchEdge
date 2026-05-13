import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { fetchMatch, fetchMatchPreview, fetchH2H } from '@/lib/soccerDataApi'
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
      .select('*')
      .in('status', ['scheduled', 'pre-match'])
      .gte('kickoff_time', today + 'T00:00:00Z')
      .lte('kickoff_time', twoWeeks + 'T23:59:59Z')
      .order('kickoff_time', { ascending: true })
    if (!matches?.length) return NextResponse.json({ ok: true, scored: 0 })

    // Load all standings from DB once — no per-match API call needed
    const { data: allStandings } = await supabaseAdmin
      .from('league_standings')
      .select('*')
    const standingsMap = {}
    for (const row of (allStandings || [])) {
      if (!standingsMap[row.league_id]) standingsMap[row.league_id] = []
      standingsMap[row.league_id].push(row)
    }

    let scored = 0, errors = 0
    for (const match of matches) {
      try {
        const sdId = match.sd_match_id || match.fixture_id?.replace('sd_', '')
        if (!sdId) { errors++; continue }

        // Fetch match detail and preview in parallel — graceful on failure
        const [matchDetail, preview] = await Promise.allSettled([
          fetchMatch(sdId),
          fetchMatchPreview(sdId)
        ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null))

        if (!matchDetail) { errors++; continue }

        // Log sidelined players
        const today = new Date().toISOString().split('T')[0]
        const allSidelined = [
          ...(matchDetail.home_sidelined || []).map(p => ({ ...p, side: 'home', team_id: matchDetail.home_team?.id })),
          ...(matchDetail.away_sidelined || []).map(p => ({ ...p, side: 'away', team_id: matchDetail.away_team?.id }))
        ]
        for (const sl of allSidelined) {
          await supabaseAdmin.from('player_sidelined_log').upsert({
            log_id:      match.fixture_id + '_' + sl.player?.id,
            player_id:   sl.player?.id,
            player_name: sl.player?.name,
            team_id:     sl.team_id,
            fixture_id:  match.fixture_id,
            status:      sl.status,
            injury_desc: sl.desc,
            logged_date: today
          }, { onConflict: 'log_id' }).catch(() => {})
        }

        // H2H — non-blocking
        let h2h = null
        if (matchDetail.home_team?.id && matchDetail.away_team?.id) {
          h2h = await fetchH2H(matchDetail.home_team.id, matchDetail.away_team.id).catch(() => null)
        }

        // Get standings from DB cache
        const leagueId = match.sd_league_id
        const standings = standingsMap[leagueId] || []
        const homeStanding = standings.find(s =>
          s.team_id === matchDetail.home_team?.id ||
          s.team_name?.toLowerCase() === match.home_team?.toLowerCase()
        )
        const awayStanding = standings.find(s =>
          s.team_id === matchDetail.away_team?.id ||
          s.team_name?.toLowerCase() === match.away_team?.toLowerCase()
        )

        // Get weights for this league
        const weights = await getLeagueWeights(supabaseAdmin, match.league).catch(() => null)

        // Score — engine handles missing data gracefully
        const result = scoreMatch({ matchDetail, h2h, homeStanding, awayStanding, preview, weights })

        // Score state
        let scoreState = 1
        if (matchDetail.lineup_type === 'confirmed') scoreState = 4
        else if (matchDetail.lineup_type === 'projected') scoreState = 3
        else if (preview?.has_preview) scoreState = 2

        await supabaseAdmin.from('match_scores').upsert({
          score_id:           match.fixture_id + '_s' + scoreState,
          fixture_id:         match.fixture_id,
          score_state:        scoreState,
          total_home:         result.total_home,
          total_away:         result.total_away,
          momentum_direction: result.momentum_direction,
          momentum_strength:  result.momentum_strength,
          modifiers: {
            factors:           result.factors,
            weights_used:      result.weights_used,
            data_quality:      result.data_quality,
            odds: {
              match_winner: { home: matchDetail.odds_home_win, draw: matchDetail.odds_draw, away: matchDetail.odds_away_win },
              over_under:   { total: matchDetail.odds_ou_line, over: matchDetail.odds_over, under: matchDetail.odds_under },
              handicap:     { market: matchDetail.odds_hcap, home: matchDetail.odds_hcap_home, away: matchDetail.odds_hcap_away }
            },
            home_lineup:       matchDetail.home_lineup,
            away_lineup:       matchDetail.away_lineup,
            home_bench:        matchDetail.home_bench,
            away_bench:        matchDetail.away_bench,
            home_sidelined:    matchDetail.home_sidelined,
            away_sidelined:    matchDetail.away_sidelined,
            formation_home:    matchDetail.formation_home,
            formation_away:    matchDetail.formation_away,
            lineup_type:       matchDetail.lineup_type,
            excitement:        matchDetail.excitement,
            preview_prediction:preview?.prediction || null
          },
          created_at: new Date().toISOString()
        }, { onConflict: 'score_id' })

        await supabaseAdmin.from('matches').update({
          score_state: scoreState,
          status: matchDetail.status === 'pre-match' ? 'scheduled' : (matchDetail.status || match.status)
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