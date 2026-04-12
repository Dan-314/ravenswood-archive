import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

export const maxDuration = 60

const MAX_LIMIT = 500
const DEFAULT_LIMIT = 100

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const cursor = params.get('cursor')
  const limit = Math.min(
    Math.max(1, Number(params.get('limit')) || DEFAULT_LIMIT),
    MAX_LIMIT
  )

  const supabase = createServiceClient()

  let q = supabase
    .from('scripts')
    .select('id, raw_json')
    .eq('status', 'approved')
    .order('id', { ascending: true })
    .limit(limit)

  if (cursor) {
    q = q.gt('id', cursor)
  }

  const { data, error } = await q

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch scripts' }, { status: 500 })
  }

  const scripts = (data ?? []).map((row) => ({
    hash: createHash('md5').update(JSON.stringify(row.raw_json)).digest('hex'),
    raw_json: row.raw_json,
    source_id: row.id,
    source_url: `https://ravenswoodarchive.com/scripts/${row.id}`,
  }))

  const nextCursor = scripts.length === limit ? scripts[scripts.length - 1].source_id : null

  return NextResponse.json(
    { data: scripts, next_cursor: nextCursor },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    }
  )
}
