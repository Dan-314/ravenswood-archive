import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/** Cookie-free client for ISR/static pages. Public data only — no auth context. */
export function createAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
