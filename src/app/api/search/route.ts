import { NextRequest, NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'
import { searchScripts, type SearchParams, type SortBy } from '@/lib/search'
import { validateApiKey, checkRateLimit } from '@/lib/api-auth'

const VALID_TYPES = new Set(['full', 'teensy', 'all'])
const VALID_SORTS = new Set<SortBy>(['newest', 'downloads', 'favourites'])
const MAX_PAGE_SIZE = 100

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'X-API-Key, Content-Type',
}

function json(body: unknown, status: number, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status,
    headers: { ...corsHeaders, ...extraHeaders },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  // --- Auth ---
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return json({ error: 'Missing X-API-Key header' }, 401)
  }

  const auth = await validateApiKey(apiKey)
  if (!auth.valid) {
    return json({ error: 'Invalid API key' }, 401)
  }

  // --- Rate limit ---
  const limit = checkRateLimit(auth.keyId)
  if (!limit.allowed) {
    return json({ error: 'Rate limit exceeded' }, 429, {
      'Retry-After': String(Math.ceil((limit.retryAfterMs ?? 60000) / 1000)),
    })
  }

  // --- Parse query params ---
  const sp = request.nextUrl.searchParams

  const query = sp.get('q') ?? undefined
  const scriptType = sp.get('type') ?? 'all'
  const base3 = sp.get('base3')
  const homebrew = sp.get('homebrew')
  const include = sp.get('include')
  const exclude = sp.get('exclude')
  const collections = sp.get('collections')
  const sort = sp.get('sort') ?? 'newest'
  const asc = sp.get('asc')
  const pageRaw = sp.get('page')
  const pageSizeRaw = sp.get('pageSize')

  // --- Validate ---
  if (!VALID_TYPES.has(scriptType)) {
    return json({ error: 'Invalid type. Must be one of: full, teensy, all' }, 400)
  }

  if (!VALID_SORTS.has(sort as SortBy)) {
    return json({ error: 'Invalid sort. Must be one of: newest, downloads, favourites' }, 400)
  }

  const page = pageRaw ? parseInt(pageRaw, 10) : 1
  let pageSize = pageSizeRaw ? parseInt(pageSizeRaw, 10) : 24

  if (isNaN(page) || page < 1) {
    return json({ error: 'page must be a positive integer' }, 400)
  }
  if (isNaN(pageSize) || pageSize < 1) {
    return json({ error: 'pageSize must be a positive integer' }, 400)
  }
  pageSize = Math.min(pageSize, MAX_PAGE_SIZE)

  // --- Build search params ---
  const params: SearchParams = {
    query,
    scriptType: scriptType as SearchParams['scriptType'],
    sortBy: sort as SortBy,
    sortAscending: asc === 'true',
    page,
    pageSize,
  }

  if (base3 === 'true') {
    params.hasCarousel = false
  }

  if (homebrew === 'true') {
    params.hasHomebrew = true
  } else if (homebrew === 'false') {
    params.hasHomebrew = false
  }

  if (include) {
    params.includeCharacters = include.split(',').filter(Boolean)
  }
  if (exclude) {
    params.excludeCharacters = exclude.split(',').filter(Boolean)
  }
  if (collections) {
    params.collectionIds = collections.split(',').filter(Boolean)
  }

  // --- Execute search ---
  const supabase = createAnonClient()
  const { data, count, error } = await searchScripts(supabase, params)

  if (error) {
    return json({ error }, 500)
  }

  return json({ data, count, page, pageSize }, 200)
}
