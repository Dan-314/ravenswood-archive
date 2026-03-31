import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClaimsQueue } from './AdminClaimsQueue'
import type { ScriptClaimWithScript } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (user?.app_metadata?.role !== 'admin') redirect('/')

  const { data: claimsRaw } = await supabase
    .from('script_claims')
    .select('*, scripts(id, name, author)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const claims = (claimsRaw ?? []) as unknown as ScriptClaimWithScript[]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Claim requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {claims.length} claim{claims.length !== 1 ? 's' : ''} pending review
        </p>
      </div>
      <AdminClaimsQueue claims={claims} adminId={user?.id ?? ''} />
    </div>
  )
}
