import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ScriptRow } from '@/components/ScriptCard'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import type { ScriptWithCollections, Collection, ScriptClaimWithScript } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

const claimStatusLabel: Record<string, string> = {
  pending: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
}

const claimStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [{ data: scriptsRaw }, { data: claimsRaw }] = await Promise.all([
    supabase
      .from('scripts')
      .select('*, collections:script_collections(collection:collections(*))')
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('script_claims')
      .select('*, scripts(id, name, author)')
      .eq('claimant_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const scripts: ScriptWithCollections[] = ((scriptsRaw ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>
    const rawCollections = (r.collections as { collection: Collection }[] | null) ?? []
    return { ...r, collections: rawCollections.map((c) => c.collection).filter(Boolean) } as ScriptWithCollections
  })

  const claims = (claimsRaw ?? []) as unknown as ScriptClaimWithScript[]

  const username = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{username as string}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {scripts.length} script{scripts.length !== 1 ? 's' : ''} submitted
            </p>
          </div>
          <Link
            href="/preferences"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Preferences
          </Link>
        </div>

        {scripts.length === 0 ? (
          <p className="text-muted-foreground">You haven&apos;t submitted any scripts yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-left">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Author</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 font-medium">Collections</th>
              </tr>
            </thead>
            <tbody>
              {scripts.map((script) => (
                <ScriptRow key={script.id} script={script} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {claims.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold">Script claims</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Ownership requests you&apos;ve submitted
            </p>
          </div>
          <div className="flex flex-col divide-y text-sm">
            {claims.map((claim) => (
              <div key={claim.id} className="flex items-center gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/scripts/${claim.script_id}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {claim.scripts.name}
                  </Link>
                  {claim.message && (
                    <p className="text-muted-foreground truncate mt-0.5">{claim.message}</p>
                  )}
                </div>
                <Badge variant={claimStatusVariant[claim.status] ?? 'outline'}>
                  {claimStatusLabel[claim.status] ?? claim.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
