import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PreferencesView } from './PreferencesView'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Preferences', robots: { index: false, follow: false } }

export default async function PreferencesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-4">
      <PreferencesView />
    </div>
  )
}
