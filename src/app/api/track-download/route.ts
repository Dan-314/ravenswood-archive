import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getRealIp, hashIp } from '@/lib/tracking'

export async function POST(request: NextRequest) {
  try {
    const { scriptId } = await request.json()
    if (!scriptId) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const supabase = createServiceClient()
    await supabase.rpc('track_download', {
      p_script_id: scriptId,
      p_ip_hash: hashIp(getRealIp(request)),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
