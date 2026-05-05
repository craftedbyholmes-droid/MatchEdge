import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
import { createAuthClient } from '@/lib/supabaseAuth'
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ plan: 'free' })
    const { data: { user } } = await createAuthClient().auth.getUser(authHeader.replace('Bearer ',''))
    if (!user) return NextResponse.json({ plan: 'free' })
    const { data: sub } = await supabaseAdmin.from('subscriptions').select('plan,expires_at').eq('user_id',user.id).single()
    if (!sub) return NextResponse.json({ plan: 'free' })
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) return NextResponse.json({ plan: 'free' })
    return NextResponse.json({ plan: sub.plan })
  } catch { return NextResponse.json({ plan: 'free' }) }
}