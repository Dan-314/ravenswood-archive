import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { transcodeImage, MAX_INPUT_BYTES } from '@/lib/images/transcode'

export const runtime = 'nodejs'
export const maxDuration = 30

const BUCKET = 'script-images'

// Per-user sliding window: 50 uploads / 24h. In-memory; leaky across instances but
// matches the existing api-auth rate limiter pattern. Good enough for v1.
const WINDOW_MS = 24 * 60 * 60 * 1000
const MAX_UPLOADS = 50
const windows = new Map<string, number[]>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const recent = (windows.get(userId) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_UPLOADS) return false
  recent.push(now)
  windows.set(userId, recent)
  return true
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: 'Upload limit reached. Try again later.' }, { status: 429 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }
  if (file.size > MAX_INPUT_BYTES) {
    return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 413 })
  }

  const input = Buffer.from(await file.arrayBuffer())
  const result = await transcodeImage(input)
  if (!result.ok) {
    const msg =
      result.error.kind === 'too-large' ? 'File too large (max 2 MB)' :
      result.error.kind === 'bad-format' ? 'Unsupported image format. Use PNG, JPEG, or WebP.' :
      'Could not decode image'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { buffer, hash } = result.value
  const path = `${hash}.webp`

  const service = createServiceClient()
  const { error: uploadError } = await service.storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000, immutable',
  })
  if (uploadError) {
    console.error('script-image upload failed', uploadError)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = service.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: publicUrl, hash })
}
