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

export function FilterPanel({ characters, filters, onChange }: FilterPanelProps) {
  return (
    <aside className="flex flex-col gap-5">
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

      <Separator />

      {/* Script type */}
      <div className="flex flex-col gap-2">
        <Label>Script type</Label>
        <Select
          value={filters.scriptType === 'full' ? 'Full' : filters.scriptType === 'teensy' ? 'Teensy' : 'All types'}
          onValueChange={(v) => onChange({ scriptType: (v === 'Full' ? 'full' : v === 'Teensy' ? 'teensy' : 'all') as SearchParams['scriptType'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All types">All types</SelectItem>
            <SelectItem value="Full">Full</SelectItem>
            <SelectItem value="Teensy">Teensy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Homebrew filter */}
      <div className="flex flex-col gap-2">
        <Label>Homebrew</Label>
        <Select
          value={filters.hasHomebrew === undefined ? 'All scripts' : filters.hasHomebrew ? 'Homebrew only' : 'Exclude homebrew'}
          onValueChange={(v) =>
            onChange({ hasHomebrew: v === 'Exclude homebrew' ? false : v === 'Homebrew only' ? true : undefined })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All scripts">All scripts</SelectItem>
            <SelectItem value="Exclude homebrew">Exclude homebrew</SelectItem>
            <SelectItem value="Homebrew only">Homebrew only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </aside>
  )
}
