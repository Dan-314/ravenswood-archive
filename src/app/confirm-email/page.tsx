'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmEmailPage() {
  const supabase = React.useMemo(() => createClient(), [])
  const [email, setEmail] = React.useState<string | null>(null)
  const [resent, setResent] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [supabase])

  async function handleResend() {
    if (!email) return
    setLoading(true)
    await supabase.auth.resend({ type: 'signup', email })
    setResent(true)
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to <strong>{email ?? 'your email address'}</strong>. Click the link to activate your account.
          </p>
          {resent ? (
            <p className="text-sm text-muted-foreground">Confirmation email resent.</p>
          ) : (
            <Button variant="outline" onClick={handleResend} disabled={loading || !email}>
              {loading ? 'Sending…' : 'Resend confirmation email'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
