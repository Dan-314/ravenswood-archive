import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ravenswoodarchive.com'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const resend = new Resend(process.env.RESEND_API_KEY!)

  const { data: scripts, error } = await supabase
    .from('scripts')
    .select('id, name, submitted_by')
    .is('author', null)
    .not('submitted_by', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!scripts || scripts.length === 0) {
    return NextResponse.json({ message: 'No orphan scripts found' })
  }

  const byUser: Record<string, typeof scripts> = {}
  for (const script of scripts) {
    if (!byUser[script.submitted_by]) byUser[script.submitted_by] = []
    byUser[script.submitted_by].push(script)
  }

  const results: { email: string; status: string; scriptCount: number }[] = []

  for (const [userId, userScripts] of Object.entries(byUser)) {
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user?.email) {
      results.push({ email: userId, status: `Failed to fetch user: ${userError?.message ?? 'no email'}`, scriptCount: userScripts.length })
      continue
    }

    const scriptList = userScripts
      .map((s) => `  - ${s.name} (${SITE_URL}/scripts/${s.id})`)
      .join('\n')

    const { error: sendError } = await resend.emails.send({
      from: 'Ravenswood Archive <support@ravenswoodarchive.com>',
      to: user.email,
      subject: 'Action required: your scripts are missing author metadata',
      text: `Hi,

We're writing to let you know that the following scripts you uploaded to Ravenswood Archive are missing author information in their metadata:

${scriptList}

Scripts without a name and author in their _meta block will be removed from the archive on June 22, 2026. You can update your scripts by visiting the links above, clicking "Edit", and filling in the author field.

If these scripts are duplicates of existing scripts on the archive (for example, translations of official scripts), you don't need to re-upload them. Ravenswood Archive supports translated PDFs natively:

  - Visit any script page and click "Customise" to set your preferred language, then download a translated PDF.
  - You can also download the raw JSON from any script page using the download button.

If you have any questions, reply to this email and we'll be happy to help.

Thanks,
Ravenswood Archive
${SITE_URL}`,
    })

    if (sendError) {
      results.push({ email: user.email, status: `Send failed: ${sendError.message}`, scriptCount: userScripts.length })
    } else {
      results.push({ email: user.email, status: 'sent', scriptCount: userScripts.length })
    }
  }

  return NextResponse.json({ results })
}
