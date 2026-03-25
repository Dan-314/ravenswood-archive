'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

export function CreateCompetitionForm() {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])

  const [name, setName] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [deadline, setDeadline] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const deadlineDate = new Date(deadline)
    if (deadlineDate <= new Date()) {
      setError('Deadline must be in the future.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in.')
      setLoading(false)
      return
    }

    const { data, error: insertError } = await supabase
      .from('competitions')
      .insert({
        name,
        description: description || null,
        created_by: user.id,
        submission_deadline: deadlineDate.toISOString(),
      })
      .select('id')
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      router.push(`/competitions/${data.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Competition name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spring Script Showdown 2026"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the theme, rules, or any requirements for submitted scripts."
          rows={4}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="deadline">Submission deadline</Label>
        <Input
          id="deadline"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create competition'}
      </Button>
    </form>
  )
}
