export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type ScriptType = 'full' | 'teensy'
export type ScriptStatus = 'pending' | 'approved' | 'rejected'
export type CompetitionStatus = 'open' | 'closed' | 'brackets' | 'complete' | 'cancelled'
export type CharacterTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled' | 'loric'

export interface Database {
  public: {
    Views: Record<never, never>
    Functions: Record<never, never>
    Tables: {
      scripts: {
        Row: {
          id: string
          name: string
          author: string | null
          script_type: ScriptType
          has_carousel: boolean
          status: ScriptStatus
          submitted_by: string | null
          character_ids: string[]
          raw_json: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          author?: string | null
          script_type: ScriptType
          has_carousel?: boolean
          status?: ScriptStatus
          submitted_by?: string | null
          character_ids?: string[]
          raw_json: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          author?: string | null
          script_type?: ScriptType
          has_carousel?: boolean
          status?: ScriptStatus
          submitted_by?: string | null
          character_ids?: string[]
          raw_json?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          id: string
          name: string
          team: CharacterTeam
        }
        Insert: {
          id: string
          name: string
          team: CharacterTeam
        }
        Update: {
          id?: string
          name?: string
          team?: CharacterTeam
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      script_versions: {
        Row: {
          id: string
          script_id: string
          version_number: number
          name: string
          author: string | null
          script_type: ScriptType
          has_carousel: boolean
          character_ids: string[]
          raw_json: Json
          edited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          script_id: string
          version_number: number
          name: string
          author?: string | null
          script_type: ScriptType
          has_carousel?: boolean
          character_ids?: string[]
          raw_json: Json
          edited_by?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          author?: string | null
          script_type?: ScriptType
          has_carousel?: boolean
          character_ids?: string[]
          raw_json?: Json
        }
        Relationships: []
      }
      competitions: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          status: CompetitionStatus
          submission_deadline: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          status?: CompetitionStatus
          submission_deadline: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: CompetitionStatus
          submission_deadline?: string
        }
        Relationships: [
          {
            foreignKeyName: 'competitions_entries'
            columns: ['id']
            isOneToOne: false
            referencedRelation: 'competition_entries'
            referencedColumns: ['competition_id']
          }
        ]
      }
      competition_entries: {
        Row: {
          id: string
          competition_id: string
          script_id: string
          submitted_by: string
          seed: number | null
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          script_id: string
          submitted_by: string
          seed?: number | null
          created_at?: string
        }
        Update: {
          seed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'competition_entries_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'competition_entries_competition_id_fkey'
            columns: ['competition_id']
            isOneToOne: false
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          }
        ]
      }
      script_groups: {
        Row: {
          script_id: string
          group_id: string
        }
        Insert: {
          script_id: string
          group_id: string
        }
        Update: {
          script_id?: string
          group_id?: string
        }
        Relationships: []
      }
    }
  }
}

// Convenience types for use in components
export type Script = Database['public']['Tables']['scripts']['Row']
export type Character = Database['public']['Tables']['characters']['Row']
export type Group = Database['public']['Tables']['groups']['Row']

// Script with joined groups
export type ScriptWithGroups = Script & {
  groups: Group[]
}

export type ScriptVersion = Database['public']['Tables']['script_versions']['Row']

export type Competition = Database['public']['Tables']['competitions']['Row']
export type CompetitionEntry = Database['public']['Tables']['competition_entries']['Row']
export type CompetitionEntryWithScript = CompetitionEntry & { script: Script }
