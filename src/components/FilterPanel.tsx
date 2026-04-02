'use client'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { CharacterPicker } from './CharacterPicker'
import type { Character, Collection } from '@/lib/supabase/types'
import type { SearchParams } from '@/lib/search'

interface FilterPanelProps {
  characters: Character[]
  collections: Collection[]
  filters: SearchParams
  onChange: (filters: Partial<SearchParams>) => void
  hideCollections?: boolean
}

export function FilterPanel({ characters, collections, filters, onChange, hideCollections }: FilterPanelProps) {
  return (
    <aside className="flex flex-col gap-5">
      {/* Script type */}
      <div className="flex items-center gap-2">
        <Label>Script type</Label>
        <Select
          value={filters.scriptType ?? 'all'}
          onValueChange={(v) => onChange({ scriptType: v as SearchParams['scriptType'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="full">Full</SelectItem>
            <SelectItem value="teensy">Teensy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Base 3 only */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="base3only"
          checked={filters.hasCarousel === false}
          onCheckedChange={(checked) =>
            onChange({ hasCarousel: checked === true ? false : undefined })
          }
        />
        <Label htmlFor="base3only" className="cursor-pointer">Base 3 characters only</Label>
      </div>

      {!hideCollections && collections.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <Label>Collection</Label>
            <div className="flex flex-col gap-1.5">
              {collections.map((collection) => (
                <div key={collection.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`collection-${collection.id}`}
                    checked={(filters.collectionIds ?? []).includes(collection.id)}
                    onCheckedChange={(checked) => {
                      const current = filters.collectionIds ?? []
                      onChange({
                        collectionIds: checked
                          ? [...current, collection.id]
                          : current.filter((id) => id !== collection.id),
                      })
                    }}
                  />
                  <Label htmlFor={`collection-${collection.id}`} className="cursor-pointer font-normal">
                    {collection.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Include characters */}
      <div className="flex flex-col gap-2">
        <Label>Must include characters</Label>
        <CharacterPicker
          characters={characters}
          selected={filters.includeCharacters ?? []}
          onChange={(ids) => onChange({ includeCharacters: ids })}
          placeholder="Add characters to require..."
          variant="include"
        />
      </div>

      {/* Exclude characters */}
      <div className="flex flex-col gap-2">
        <Label>Must exclude characters</Label>
        <CharacterPicker
          characters={characters}
          selected={filters.excludeCharacters ?? []}
          onChange={(ids) => onChange({ excludeCharacters: ids })}
          placeholder="Add characters to ban..."
          variant="exclude"
        />
      </div>
    </aside>
  )
}
