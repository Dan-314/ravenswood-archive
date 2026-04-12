import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateCompetitionForm } from './CreateCompetitionForm'

export const dynamic = 'force-dynamic'

export default async function CreateCompetitionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-lg flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Create a competition</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Set up a script tournament for the community.
        </p>
      </div>
      <CreateCompetitionForm />
    </div>
  )
}
