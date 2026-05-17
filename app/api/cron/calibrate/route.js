import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { LEAGUE_TACTICAL_PRIORS, DEFAULT_WEIGHTS } from '@/lib/engineWeights'

const MIN_SAMPLE = 20

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

    // Pull all finished scored matches in last 90 days
    const { data: matches } = await supabaseAdmin
      .from('matches')
      .select('fixture_id, league, home_score, away_score')
      .eq('status', 'FT')
      .not('home_score', 'is', null)
      .gte('kickoff_time', cutoff)

    if (!matches?.length) {
      return NextResponse.json({ ok: true, message: 'No finished matches found' })
    }

    const fixtureIds = matches.map(m => m.fixture_id)

    // Get latest score per fixture
    const { data: scores } = await supabaseAdmin
      .from('match_scores')
      .select('fixture_id, total_home, total_away, modifiers')
      .in('fixture_id', fixtureIds)
      .order('score_state', { ascending: false })

    // Build map of fixture_id -> best score
    const scoreMap = {}
    for (const s of (scores || [])) {
      if (!scoreMap[s.fixture_id]) scoreMap[s.fixture_id] = s
    }

    // Group by league and calculate accuracy
    const leagueStats = {}
    for (const match of matches) {
      const score = scoreMap[match.fixture_id]
      if (!score || score.total_home == null || score.total_away == null) continue

      const league = match.league
      if (!leagueStats[league]) {
        leagueStats[league] = {
          total: 0, correct: 0,
          homeWins: 0, homeWinCorrect: 0,
          awayWins: 0, awayWinCorrect: 0,
          draws: 0, drawCorrect: 0,
          bigGapCorrect: 0, bigGapTotal: 0,
          smallGapCorrect: 0, smallGapTotal: 0,
          oddsAlignCorrect: 0, oddsAlignTotal: 0
        }
      }

      const s = leagueStats[league]
      const gap = Math.abs(score.total_home - score.total_away)
      const pred = score.total_home > score.total_away ? 'home'
                 : score.total_away > score.total_home ? 'away' : 'draw'
      const actual = match.home_score > match.away_score ? 'home'
                   : match.away_score > match.home_score ? 'away' : 'draw'
      const isCorrect = pred === actual

      s.total++
      if (isCorrect) s.correct++

      // Track by actual outcome type
      if (actual === 'home') { s.homeWins++; if (isCorrect) s.homeWinCorrect++ }
      if (actual === 'away') { s.awayWins++; if (isCorrect) s.awayWinCorrect++ }
      if (actual === 'draw') { s.draws++;    if (isCorrect) s.drawCorrect++ }

      // Track gap confidence
      if (gap >= 12) { s.bigGapTotal++; if (isCorrect) s.bigGapCorrect++ }
      else           { s.smallGapTotal++; if (isCorrect) s.smallGapCorrect++ }

      // Track odds alignment
      const odds = score.modifiers?.odds?.match_winner
      if (odds) {
        const oddsHome = odds.home || 0
        const oddsAway = odds.away || 0
        const oddsFavour = oddsHome < oddsAway ? 'home' : oddsAway < oddsHome ? 'away' : 'draw'
        if (oddsFavour === pred) {
          s.oddsAlignTotal++
          if (isCorrect) s.oddsAlignCorrect++
        }
      }
    }

    const updates = []
    const suggestions = []

    for (const [league, s] of Object.entries(leagueStats)) {
      if (s.total < MIN_SAMPLE) continue

      const overallAcc    = s.correct / s.total
      const bigGapAcc     = s.bigGapTotal > 5 ? s.bigGapCorrect / s.bigGapTotal : null
      const oddsAlignAcc  = s.oddsAlignTotal > 5 ? s.oddsAlignCorrect / s.oddsAlignTotal : null
      const drawRate      = s.draws / s.total
      const drawDetectAcc = s.draws > 3 ? s.drawCorrect / s.draws : null

      // Start from tactical priors or current DB weights
      const { data: existing } = await supabaseAdmin
        .from('league_weights')
        .select('*')
        .eq('league_name', league)
        .single()
        .catch(() => ({ data: null }))

      const base = existing || LEAGUE_TACTICAL_PRIORS[league] || DEFAULT_WEIGHTS
      let w = {
        standing:     base.standing_weight     || base.standing     || DEFAULT_WEIGHTS.standing,
        h2h:          base.h2h_weight          || base.h2h          || DEFAULT_WEIGHTS.h2h,
        home_adv:     base.home_adv_weight     || base.home_adv     || DEFAULT_WEIGHTS.home_adv,
        odds:         base.odds_weight         || base.odds         || DEFAULT_WEIGHTS.odds,
        ai_pred:      base.ai_pred_weight      || base.ai_pred      || DEFAULT_WEIGHTS.ai_pred,
        form:         base.form_weight         || base.form         || DEFAULT_WEIGHTS.form,
        sidelined:    base.sidelined_weight    || base.sidelined    || DEFAULT_WEIGHTS.sidelined,
        intl_synergy: base.intl_synergy_weight || base.intl_synergy || DEFAULT_WEIGHTS.intl_synergy
      }

      let changed = false
      const reasoning = []

      // If odds align well with correct predictions, boost odds weight
      if (oddsAlignAcc !== null && oddsAlignAcc > 0.68) {
        w.odds = Math.min(w.odds * 1.10, 0.40)
        reasoning.push('Odds signal strong (' + Math.round(oddsAlignAcc * 100) + '%) - boosted odds weight')
        changed = true
      } else if (oddsAlignAcc !== null && oddsAlignAcc < 0.50) {
        w.odds = Math.max(w.odds * 0.90, 0.08)
        reasoning.push('Odds signal weak (' + Math.round(oddsAlignAcc * 100) + '%) - reduced odds weight')
        changed = true
      }

      // If big gap picks are highly accurate, boost standing/form signal
      if (bigGapAcc !== null && bigGapAcc > 0.72) {
        w.standing = Math.min(w.standing * 1.08, 0.40)
        w.form     = Math.min(w.form * 1.08, 0.20)
        reasoning.push('High confidence picks accurate (' + Math.round(bigGapAcc * 100) + '%) - boosted standing/form')
        changed = true
      }

      // If draw rate is high but we rarely detect draws, reduce gap sensitivity
      if (drawRate > 0.28 && drawDetectAcc !== null && drawDetectAcc < 0.15) {
        w.home_adv = Math.max(w.home_adv * 0.85, 0.04)
        reasoning.push('High draw rate (' + Math.round(drawRate * 100) + '%) poorly detected - reduced home_adv to tighten gaps')
        changed = true
      }

      if (!changed) continue

      // Normalise weights to sum to 1
      const total = Object.values(w).reduce((a, b) => a + b, 0)
      for (const k of Object.keys(w)) {
        w[k] = Math.round((w[k] / total) * 1000) / 1000
      }

      updates.push({
        league_name:       league,
        standing_weight:   w.standing,
        h2h_weight:        w.h2h,
        home_adv_weight:   w.home_adv,
        odds_weight:       w.odds,
        ai_pred_weight:    w.ai_pred,
        form_weight:       w.form,
        sidelined_weight:  w.sidelined,
        intl_synergy_weight: w.intl_synergy,
        sample_size:       s.total,
        accuracy:          Math.round(overallAcc * 100) / 100,
        updated_at:        new Date().toISOString()
      })

      suggestions.push({
        league,
        sample: s.total,
        accuracy: Math.round(overallAcc * 100) + '%',
        draws: Math.round(drawRate * 100) + '%',
        reasoning: reasoning.join('; ')
      })
    }

    // Upsert updated weights
    for (const u of updates) {
      await supabaseAdmin
        .from('league_weights')
        .upsert(u, { onConflict: 'league_name' })
    }

    return NextResponse.json({
      ok: true,
      leagues_analysed: Object.keys(leagueStats).length,
      leagues_updated: updates.length,
      min_sample: MIN_SAMPLE,
      suggestions
    })

  } catch(err) {
    console.error('[calibrate] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}