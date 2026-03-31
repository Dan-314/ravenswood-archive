import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EditForm } from './EditForm'

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function EditScriptPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: script } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', id)
    .single()

  if (!script) notFound()

  const isAdmin = user?.app_metadata?.role === 'admin'
  const isOwner = user?.id === script.submitted_by

  if (!user || (!isAdmin && !isOwner)) {
    redirect(`/scripts/${id}`)
  }

  return <EditForm script={script} />
}
