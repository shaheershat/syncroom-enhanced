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

    const [createdRes, membersRes] = await Promise.all([
      userId
        ? supabase.from('rooms').select('*').eq('created_by', userId)
        : supabase.from('rooms').select('*'),
      userId
        ? supabase.from('room_members').select('room_id').eq('user_id', userId).neq('role', 'creator')
        : Promise.resolve({ data: [] }),
    ])

    // Fetch rooms the user was invited to (via room_members)
    const invitedRoomIds = ((membersRes as any).data || []).map((m: any) => m.room_id)
    let invitedRooms: any[] = []
    if (invitedRoomIds.length > 0) {
      const { data } = await supabase.from('rooms').select('*').in('id', invitedRoomIds)
      invitedRooms = data || []
    }

    return NextResponse.json({
      created: createdRes.data || [],
      invited: invitedRooms,
    })
  } catch {
    return NextResponse.json({ created: [], invited: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { created_by, invited_user_id, video_id, status } = await request.json()

    // Create the room (no invited_user_id column — members go in room_members)
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name: 'Watch Party',
        created_by,
        video_id,
        status: status || 'active',
      })
      .select()
      .single()

    if (roomError) return NextResponse.json({ error: roomError.message }, { status: 400 })

    // Add creator and invited user to room_members
    await supabase.from('room_members').insert([
      { room_id: room.id, user_id: created_by, role: 'creator', invited_by: created_by },
      ...(invited_user_id ? [{ room_id: room.id, user_id: invited_user_id, role: 'member', invited_by: created_by }] : []),
    ])

    return NextResponse.json({ room: { ...room, invited_user_id } })
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
