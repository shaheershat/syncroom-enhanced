import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data, error } = await supabase.from('users').select('*')
    if (error) return NextResponse.json({ users: [] })
    return NextResponse.json({ users: data || [] })
  } catch {
    return NextResponse.json({ users: [] })
  }
}
