import { headers } from 'next/headers'
import SubmitForm from './SubmitForm'

export const dynamic = 'force-dynamic'

export default async function SubmitPage() {
  // Unique key per request forces remount when navigating to /submit again
  const h = await headers()
  const requestId = h.get('x-request-id') ?? h.get('x-vercel-id') ?? crypto.randomUUID()
  return <SubmitForm key={requestId} />
}
