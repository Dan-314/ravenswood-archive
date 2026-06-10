import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ravenswoodarchive.com'
const MAX_MESSAGE_LENGTH = 2000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function sendClaimNotification(params: {
  scriptId: string
  scriptName: string
  claimantName: string
  message: string | null
}): Promise<void> {
  if (!process.env.ADMIN_EMAIL || !process.env.RESEND_API_KEY) {
    console.warn('claim notification skipped: ADMIN_EMAIL or RESEND_API_KEY not set')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: 'Ravenswood Archive <support@ravenswoodarchive.com>',
      to: process.env.ADMIN_EMAIL,
      subject: `New script claim: ${params.scriptName}`,
      text: `Hi,

${params.claimantName} has submitted a claim for the script "${params.scriptName}".

${params.message ? `Their message:\n\n${params.message}` : 'They did not include a message.'}

Review this claim in the admin queue:

  ${SITE_URL}/admin

Script page:

  ${SITE_URL}/scripts/${params.scriptId}

Thanks,
Ravenswood Archive
${SITE_URL}`,
    })
    if (error) {
      console.error('claim notification failed', error)
    }
  } catch (err) {
    console.error('claim notification failed', err)
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { scriptId, message } = (body ?? {}) as { scriptId?: unknown; message?: unknown }
  if (typeof scriptId !== 'string' || !UUID_RE.test(scriptId)) {
    return NextResponse.json({ error: 'Invalid script id' }, { status: 400 })
  }
  if (message != null && typeof message !== 'string') {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
  }
  if (typeof message === 'string' && message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { data: script } = await supabase
    .from('scripts')
    .select('name')
    .eq('id', scriptId)
    .maybeSingle()
  if (!script) {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('user_id', user.id)
    .maybeSingle()

  const claimantName =
    profile?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    'Unknown'

  const trimmedMessage = typeof message === 'string' ? message.trim() : ''

  const { error: insertError } = await supabase.from('script_claims').insert({
    script_id: scriptId,
    claimant_id: user.id,
    claimant_display_name: claimantName,
    message: trimmedMessage || null,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ error: 'You have already claimed this script' }, { status: 409 })
    }
    if (insertError.code === '42501') {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }
    console.error('claim insert failed', insertError)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  await sendClaimNotification({
    scriptId,
    scriptName: script.name,
    claimantName,
    message: trimmedMessage || null,
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
