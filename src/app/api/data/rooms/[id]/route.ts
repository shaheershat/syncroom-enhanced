import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabase()
    const { id: roomId } = await params

    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) return NextResponse.json({ error: roomError.message }, { status: 404 })
    if (!roomData) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const [videoRes, creatorRes, membersRes] = await Promise.all([
      supabase.from('videos').select('*').eq('id', roomData.video_id).single(),
      supabase.from('users').select('*').eq('id', roomData.created_by).single(),
      supabase.from('room_members').select('user_id, role').eq('room_id', roomId),
    ])

    const video = videoRes.data
      ? { ...videoRes.data, video_url: videoRes.data.video_url || '' }
      : { title: 'Unknown Video', video_url: '' }

    // Find the invited member (non-creator)
    const invitedMemberId = (membersRes.data || [])
      .find((m: any) => m.role !== 'creator')?.user_id

    let invitedUser = { id: '', name: 'Unknown User', email: '' }
    if (invitedMemberId) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', invitedMemberId)
        .single()
      if (data) invitedUser = data
    }

    return NextResponse.json({
      room: {
        ...roomData,
        video,
        creator: creatorRes.data || { id: roomData.created_by, name: 'Unknown User' },
        invited_user: invitedUser,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
