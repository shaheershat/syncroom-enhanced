import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabase.from('videos').select('*')
    if (error) return NextResponse.json({ videos: [] })
    return NextResponse.json({ videos: data || [] })
  } catch {
    return NextResponse.json({ videos: [] })
  }
}
