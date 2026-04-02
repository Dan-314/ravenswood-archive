'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { searchScripts } from '@/lib/search'
import type { Collection } from '@/lib/supabase/types'

type CollectionWithCount = Collection & { scriptCount: number }

interface ScriptInCollection {
  script_id: string
  scripts: { id: string; name: string; author: string | null }
}

interface CollectionsManagerProps {
  initial: CollectionWithCount[]
}

export function CollectionsManager({ initial }: CollectionsManagerProps) {
  const supabase = React.useMemo(() => createClient(), [])

  const [collections, setCollections] = React.useState(initial)
  const [creating, setCreating] = React.useState(false)
  const [editing, setEditing] = React.useState<CollectionWithCount | null>(null)
  const [managingId, setManagingId] = React.useState<string | null>(null)

  // Form state
  const [formName, setFormName] = React.useState('')
  const [formDescription, setFormDescription] = React.useState('')
  const [formLoading, setFormLoading] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // Script management state
  const [managedScripts, setManagedScripts] = React.useState<ScriptInCollection[]>([])
  const [scriptSearch, setScriptSearch] = React.useState('')
  const [scriptResults, setScriptResults] = React.useState<{ id: string; name: string; author: string | null }[]>([])
  const [scriptSearchLoading, setScriptSearchLoading] = React.useState(false)
  const [scriptLoading, setScriptLoading] = React.useState(false)

  function openCreate() {
    setEditing(null)
    setFormName('')
    setFormDescription('')
    setFormError(null)
    setCreating(true)
  }

  function openEdit(collection: CollectionWithCount) {
    setCreating(false)
    setFormName(collection.name)
    setFormDescription(collection.description ?? '')
    setFormError(null)
    setEditing(collection)
  }

  function cancelForm() {
    setCreating(false)
    setEditing(null)
    setFormError(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setFormLoading(true)
    setFormError(null)

    const { data, error } = await supabase
      .from('collections')
      .insert({ name: formName.trim(), description: formDescription.trim() || null })
      .select()
      .single()

    if (error) {
      setFormError(error.message)
    } else if (data) {
      setCollections((prev) => [{ ...data, scriptCount: 0 }, ...prev])
      setCreating(false)
    }
    setFormLoading(false)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editing || !formName.trim()) return
    setFormLoading(true)
    setFormError(null)

    const { data, error } = await supabase
      .from('collections')
      .update({ name: formName.trim(), description: formDescription.trim() || null })
      .eq('id', editing.id)
      .select()
      .single()

    if (error) {
      setFormError(error.message)
    } else if (data) {
      setCollections((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...data, scriptCount: c.scriptCount } : c))
      )
      setEditing(null)
    }
    setFormLoading(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('collections').delete().eq('id', id)
    if (!error) {
      setCollections((prev) => prev.filter((c) => c.id !== id))
      if (managingId === id) setManagingId(null)
    }
  }

  async function openManage(collection: CollectionWithCount) {
    setManagingId(collection.id)
    setScriptSearch('')
    setScriptResults([])

    const { data } = await supabase
      .from('script_collections')
      .select('script_id, scripts(id, name, author)')
      .eq('collection_id', collection.id)

    setManagedScripts((data ?? []) as unknown as ScriptInCollection[])
  }

  async function handleScriptSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!scriptSearch.trim()) return
    setScriptSearchLoading(true)

    const { data } = await searchScripts(supabase, { query: scriptSearch, pageSize: 10 })
    setScriptResults(data.map((s) => ({ id: s.id, name: s.name, author: s.author })))
    setScriptSearchLoading(false)
  }

  async function addScript(scriptId: string, scriptName: string, scriptAuthor: string | null) {
    if (!managingId) return
    setScriptLoading(true)

    const { error } = await supabase
      .from('script_collections')
      .insert({ collection_id: managingId, script_id: scriptId })

    if (!error) {
      setManagedScripts((prev) => [
        ...prev,
        { script_id: scriptId, scripts: { id: scriptId, name: scriptName, author: scriptAuthor } },
      ])
      setCollections((prev) =>
        prev.map((c) => (c.id === managingId ? { ...c, scriptCount: c.scriptCount + 1 } : c))
      )
    }
    // Silently ignore unique-violation errors (script already in collection)
    setScriptLoading(false)
  }

  async function removeScript(scriptId: string) {
    if (!managingId) return
    setScriptLoading(true)

    const { error } = await supabase
      .from('script_collections')
      .delete()
      .eq('collection_id', managingId)
      .eq('script_id', scriptId)

    if (!error) {
      setManagedScripts((prev) => prev.filter((s) => s.script_id !== scriptId))
      setCollections((prev) =>
        prev.map((c) => (c.id === managingId ? { ...c, scriptCount: Math.max(0, c.scriptCount - 1) } : c))
      )
    }
    setScriptLoading(false)
  }

  const managedScriptIds = new Set(managedScripts.map((s) => s.script_id))
  const managingCollection = collections.find((c) => c.id === managingId)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button onClick={openCreate} disabled={creating || !!editing}>
          New collection
        </Button>
      </div>

      {/* Create / Edit form */}
      {(creating || editing) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{creating ? 'New collection' : 'Edit collection'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={creating ? handleCreate : handleUpdate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="col-name">Name</Label>
                <Input
                  id="col-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="col-desc">Description</Label>
                <Textarea
                  id="col-desc"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional description shown to players..."
                  rows={3}
                />
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={formLoading}>
                  {creating ? 'Create' : 'Save'}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Collections list */}
      {collections.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">No collections yet.</p>
      ) : (
        <div className="flex flex-col divide-y">
          {collections.map((collection) => (
            <div key={collection.id} className="flex flex-col gap-3 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <p className="font-medium">{collection.name}</p>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground truncate">{collection.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {collection.scriptCount} script{collection.scriptCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => managingId === collection.id ? setManagingId(null) : openManage(collection)}
                  >
                    {managingId === collection.id ? 'Done' : 'Scripts'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(collection)}
                    disabled={!!editing && editing.id !== collection.id}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(collection.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Script management panel */}
              {managingId === collection.id && managingCollection && (
                <Card className="mt-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Scripts in &quot;{managingCollection.name}&quot;</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    {/* Current scripts */}
                    {managedScripts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No scripts in this collection yet.</p>
                    ) : (
                      <div className="flex flex-col divide-y text-sm">
                        {managedScripts.map((entry) => (
                          <div key={entry.script_id} className="flex items-center justify-between gap-2 py-2">
                            <div className="min-w-0">
                              <span className="font-medium">{entry.scripts.name}</span>
                              {entry.scripts.author && (
                                <span className="text-muted-foreground ml-1.5">by {entry.scripts.author}</span>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive shrink-0"
                              onClick={() => removeScript(entry.script_id)}
                              disabled={scriptLoading}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add scripts */}
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      <p className="text-sm font-medium">Add scripts</p>
                      <form onSubmit={handleScriptSearch} className="flex gap-2">
                        <Input
                          value={scriptSearch}
                          onChange={(e) => setScriptSearch(e.target.value)}
                          placeholder="Search by name or author..."
                          className="flex-1"
                        />
                        <Button type="submit" size="sm" disabled={scriptSearchLoading}>
                          Search
                        </Button>
                      </form>
                      {scriptResults.length > 0 && (
                        <div className="flex flex-col divide-y text-sm border rounded-md">
                          {scriptResults.map((script) => (
                            <div key={script.id} className="flex items-center justify-between gap-2 px-3 py-2">
                              <div className="min-w-0">
                                <span className="font-medium">{script.name}</span>
                                {script.author && (
                                  <span className="text-muted-foreground ml-1.5">by {script.author}</span>
                                )}
                              </div>
                              {managedScriptIds.has(script.id) ? (
                                <span className="text-xs text-muted-foreground shrink-0">Already added</span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="shrink-0"
                                  onClick={() => addScript(script.id, script.name, script.author)}
                                  disabled={scriptLoading}
                                >
                                  Add
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
