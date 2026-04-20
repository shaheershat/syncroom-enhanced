import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabase()
    const roomId = params.id

    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (roomError) return NextResponse.json({ error: roomError.message }, { status: 404 })
    if (!roomData) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const [videoRes, creatorRes] = await Promise.all([
      supabase.from('videos').select('*').eq('id', roomData.video_id).single(),
      supabase.from('users').select('*').eq('id', roomData.created_by).single(),
    ])

    const video = videoRes.data
      ? { ...videoRes.data, video_url: videoRes.data.video_url || '' }
      : { title: 'Unknown Video', video_url: '' }

    return NextResponse.json({
      room: {
        ...roomData,
        video,
        creator: creatorRes.data || { name: 'Unknown User' },
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
