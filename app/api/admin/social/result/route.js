import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { PERSONAS } from '@/lib/personas'
import { generateResultPost } from '@/lib/postTemplates'
export async function POST(request) {
  try {
    const { postId, outcome, finalScore } = await request.json()
    const { data: post } = await supabaseAdmin.from('social_posts').select('*').eq('post_id',postId).single()
    if (!post) return NextResponse.json({ error: 'Post not found' },{ status:404 })
    const stake = post.stake || 10
    const pl = outcome==='win' ? stake*(post.odds_decimal-1) : outcome==='loss' ? -stake : 0
    await supabaseAdmin.from('social_posts').update({ outcome, final_score: finalScore, profit_loss: pl }).eq('post_id',postId)
    const { data: cur } = await supabaseAdmin.from('persona_social_season').select('*').eq('persona',post.persona).single()
    const c = cur || { total_posted:0,wins:0,losses:0,voids:0,total_staked:0,total_returned:0,profit_loss:0 }
    const isVoid = outcome==='void'
    const upd = { persona:post.persona, total_posted:c.total_posted+(isVoid?0:1), wins:c.wins+(outcome==='win'?1:0), losses:c.losses+(outcome==='loss'?1:0), voids:c.voids+(isVoid?1:0), total_staked:c.total_staked+(isVoid?0:stake), total_returned:c.total_returned+(outcome==='win'?stake*post.odds_decimal:isVoid?stake:0), profit_loss:c.profit_loss+pl, updated_at:new Date().toISOString() }
    await supabaseAdmin.from('persona_social_season').upsert(upd,{ onConflict:'persona' })
    const rp = generateResultPost({ persona:PERSONAS[post.persona], match:{home_team:post.home_team,away_team:post.away_team}, selection:post.selection, oddsFractional:post.odds_fractional, outcome, finalScore, profitLoss:pl, seasonRecord:upd })
    await supabaseAdmin.from('social_posts').update({ result_text_short: rp.short }).eq('post_id',postId)
    return NextResponse.json({ ok:true, profitLoss:pl, resultPost:rp.short, season:upd })
  } catch(err) { return NextResponse.json({ error: err.message },{ status:500 }) }
}