import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'
import { PERSONAS } from '@/lib/personas'
import { generatePosts } from '@/lib/postTemplates'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export async function POST(request) {
  try {
    const { persona: pid, fixtureId, market, selection, oddsFractional, oddsDecimal, engineScore, stake } = await request.json()
    const persona = PERSONAS[pid]
    if (!persona) return NextResponse.json({ error: 'Invalid persona' },{ status:400 })
    const { data: match } = await supabaseAdmin.from('matches').select('*').eq('fixture_id',fixtureId).single()
    if (!match) return NextResponse.json({ error: 'Match not found' },{ status:404 })
    const { data: season } = await supabaseAdmin.from('persona_social_season').select('*').eq('persona',pid).single()
    const ai = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 150, messages: [{ role: 'user', content: 'You are ' + persona.name + '. ' + persona.bio + ' Write a SHORT punchy 2-sentence tip for: ' + match.home_team + ' vs ' + match.away_team + ', pick ' + selection + ' at ' + oddsFractional + ', engine score ' + engineScore + '/100. Stay in character. No hashtags.' }] })
    const tipText = ai.content[0].text
    const posts = generatePosts({ persona, match, selection, oddsFractional, oddsDecimal, engineScore, seasonRecord: season })
    const today = new Date().toISOString().split('T')[0]
    await supabaseAdmin.from('social_posts').upsert({ post_id: pid+'_'+fixtureId+'_'+today, persona: pid, posted_date: today, fixture_id: fixtureId, home_team: match.home_team, away_team: match.away_team, market, selection, odds_fractional: oddsFractional, odds_decimal: oddsDecimal, engine_score: engineScore, stake: stake||10, post_text_short: posts.short, post_text_long: posts.long, post_text_fb: posts.fb, tip_text: tipText },{ onConflict:'post_id' })
    return NextResponse.json({ ok:true, posts, tipText })
  } catch(err) { return NextResponse.json({ error: err.message },{ status:500 }) }
}