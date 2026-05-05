import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabase'
export async function POST(request) {
  try {
    const { email, action, expires_at } = await request.json()
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)
    if (!user) return NextResponse.json({ error: 'User not found' },{ status:404 })
    const plan = action === 'grant' ? 'edge' : 'free'
    const { error } = await supabaseAdmin.from('subscriptions').upsert({ user_id: user.id, plan, expires_at: action==='grant'?(expires_at||null):null, created_at: new Date().toISOString() },{ onConflict:'user_id' })
    if (error) throw error
    return NextResponse.json({ ok:true, message: (plan==='edge'?'Edge access granted to ':'Access revoked for ') + email })
  } catch(err) { return NextResponse.json({ error: err.message },{ status:500 }) }
}