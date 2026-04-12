import { createClient } from '@/lib/supabase/server'
import type { UserPreferences } from './useUserPreferences'

/**
 * Fetch the current user's saved PDF preferences server-side.
 * Returns null if user is not authenticated or has no saved preferences.
 */
export async function getUserPreferences(): Promise<Partial<UserPreferences> | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_preferences')
    .select('preferences')
    .eq('user_id', user.id)
    .single()

  return (data?.preferences as Partial<UserPreferences>) ?? null
}
