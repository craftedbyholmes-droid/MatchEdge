import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { PERSONAS } from '@/lib/personas'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(request) {
  if (request.headers.get('authorization') !== 'Bearer ' + process.env.CRON_SECRET)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data: matches } = await supabaseAdmin.from('matches')
      .select('*').gte('kickoff_time', today + 'T00:00:00Z').lt('kickoff_time', today + 'T23:59:59Z')
      .in('status', ['scheduled','live'])
    if (!matches?.length) return NextResponse.json({ ok: true, picks: 0 })
    let totalPicks = 0
    for (const [personaId, persona] of Object.entries(PERSONAS)) {
      const candidates = []
      for (const match of matches) {
        const { data: score } = await supabaseAdmin.from('match_scores')
          .select('*').eq('fixture_id', match.fixture_id)
          .order('created_at', { ascending: false }).limit(1).single()
        if (!score) continue
        const homeScore = score.total_home || 50
        const awayScore = score.total_away || 50
        const gap = Math.abs(homeScore - awayScore)
        if (personaId === 'gordon' && gap < persona.minGap) continue
        const isHomeAdvantage = homeScore > awayScore
        const selection = personaId === 'gordon'
          ? (isHomeAdvantage ? match.home_team + ' Win' : match.away_team + ' Win')
          : personaId === 'stan' ? 'BTTS Yes' : match.home_team + ' Anytime Scorer'
        const engineScore = Math.round(Math.max(homeScore, awayScore))
        candidates.push({ match, score, selection, engineScore, gap, isHomeAdvantage })
      }
      candidates.sort((a,b) => b.engineScore - a.engineScore)
      const picks = candidates.slice(0, persona.maxPicks)
      if (picks.length < persona.minPicks) continue
      for (let i = 0; i < picks.length; i++) {
        const c = picks[i]
        const isBest = i === 0
        const stake = isBest ? persona.bestPickStake : persona.standardStake
        const pickId = personaId + '_' + c.match.fixture_id + '_' + today
        const prompt = 'You are ' + persona.name + '. ' + persona.bio + ' Write a SHORT punchy 2-sentence tip for: ' + c.match.home_team + ' vs ' + c.match.away_team + ', pick: ' + c.selection + ', engine score: ' + c.engineScore + '/100. Stay in character. No hashtags. No emojis.'
        let tipText = ''
        try {
          const ai = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 120, messages: [{ role: 'user', content: prompt }] })
          tipText = ai.content[0].text
        } catch { tipText = 'Strong engine signal on this one.' }
        await supabaseAdmin.from('persona_picks').upsert({
          pick_id: pickId,
          persona: personaId,
          fixture_id: c.match.fixture_id,
          market: personaId === 'gordon' ? 'match_result' : personaId === 'stan' ? 'btts' : 'anytime_scorer',
          selection: c.selection,
          odds_fractional: '6/4',
          odds_decimal: 2.5,
          engine_score: c.engineScore,
          score_state: c.match.score_state || 1,
          is_best_pick: isBest,
          stake,
          tip_text: tipText,
          pick_date: today
        }, { onConflict: 'pick_id' })
        totalPicks++
      }
    }
    return NextResponse.json({ ok: true, picks: totalPicks })
  } catch(err) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}