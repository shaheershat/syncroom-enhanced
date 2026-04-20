import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const roomId = request.nextUrl.searchParams.get('roomId')
    if (!roomId) return NextResponse.json({ messages: [] })

    const { data: messagesData, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ messages: [] })

    const userIds = [...new Set((messagesData || []).map((m: any) => m.user_id))]
    let usersMap: Record<string, any> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds)
      for (const u of usersData || []) {
        usersMap[u.id] = u
      }
    }

    const messages = (messagesData || []).map((m: any) => ({
      ...m,
      user: usersMap[m.user_id] || { id: m.user_id, name: 'Unknown User', email: '' },
    }))

    return NextResponse.json({ messages })
  } catch (e: any) {
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { room_id, user_id, message } = await request.json()
    if (!room_id || !user_id || !message) {
      return NextResponse.json({ error: 'room_id, user_id, message required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id, user_id, message })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const { data: userData } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user_id)
      .single()

    return NextResponse.json({
      message: {
        ...data,
        user: userData || { id: user_id, name: 'Unknown User', email: '' },
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
