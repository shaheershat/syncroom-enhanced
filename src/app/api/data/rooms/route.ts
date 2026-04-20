import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const userId = request.nextUrl.searchParams.get('userId')

    const [createdRes, invitedRes] = await Promise.all([
      userId
        ? supabase.from('rooms').select('*').eq('created_by', userId)
        : supabase.from('rooms').select('*'),
      userId
        ? supabase.from('rooms').select('*').eq('invited_user_id', userId)
        : Promise.resolve({ data: [] }),
    ])

    return NextResponse.json({
      created: createdRes.data || [],
      invited: (invitedRes as any).data || [],
    })
  } catch {
    return NextResponse.json({ created: [], invited: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const body = await request.json()
    const { data, error } = await supabase
      .from('rooms')
      .insert(body)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ room: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const roomId = request.nextUrl.searchParams.get('roomId')
    if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 })
    await Promise.all([
      supabase.from('messages').delete().eq('room_id', roomId),
      supabase.from('room_state').delete().eq('room_id', roomId),
    ])
    await supabase.from('rooms').delete().eq('id', roomId)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
