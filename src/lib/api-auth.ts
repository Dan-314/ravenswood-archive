import { createServiceClient } from './supabase/service'

// --- API key validation ---

export async function validateApiKey(
  key: string
): Promise<{ valid: true; keyId: string } | { valid: false }> {
  const hash = await hashKey(key)
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('api_keys')
    .select('id')
    .eq('key_hash', hash)
    .single()

  if (error || !data) return { valid: false }

  // Best-effort last_used_at update; failures are non-critical
  void supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(undefined, () => {})

  return { valid: true, keyId: data.id }
}

async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// --- In-memory sliding-window rate limiter ---

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 60

const windows = new Map<string, number[]>()

export function checkRateLimit(keyId: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const timestamps = windows.get(keyId) ?? []

  // Drop entries outside window
  const recent = timestamps.filter((t) => now - t < WINDOW_MS)

  if (recent.length >= MAX_REQUESTS) {
    const oldestInWindow = recent[0]
    return { allowed: false, retryAfterMs: WINDOW_MS - (now - oldestInWindow) }
  }

  recent.push(now)
  windows.set(keyId, recent)
  return { allowed: true }
}
