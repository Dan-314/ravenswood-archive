import SubmitForm from './SubmitForm'

export const dynamic = 'force-dynamic'

export default function SubmitPage() {
  // Key forces remount when navigating to /submit again (e.g. from success state)
  return <SubmitForm key={Date.now()} />
}
