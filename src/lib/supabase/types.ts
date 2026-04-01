export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type ScriptType = 'full' | 'teensy'
export type ScriptStatus = 'pending' | 'approved' | 'rejected'
export type ClaimStatus = 'pending' | 'approved' | 'rejected'
export type CompetitionStatus = 'open' | 'closed' | 'brackets' | 'complete' | 'cancelled'
export type CharacterTeam = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled' | 'loric'

export interface Database {
  public: {
    Views: Record<never, never>
    Functions: {
      generate_bracket: {
        Args: { p_competition_id: string; p_seed_order: string[] }
        Returns: undefined
      }
      advance_winner: {
        Args: { p_matchup_id: string; p_winner_entry_id: string }
        Returns: undefined
      }
      track_download: {
        Args: { p_script_id: string; p_ip_hash: string }
        Returns: undefined
      }
    }
    Tables: {
      scripts: {
        Row: {
          id: string
          name: string
          author: string | null
          description: string | null
          script_type: ScriptType
          has_carousel: boolean
          status: ScriptStatus
          submitted_by: string | null
          character_ids: string[]
          raw_json: Json
          download_count: number
          favourite_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          author?: string | null
          description?: string | null
          script_type: ScriptType
          has_carousel?: boolean
          status?: ScriptStatus
          submitted_by?: string | null
          character_ids?: string[]
          raw_json: Json
          download_count?: number
          favourite_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          author?: string | null
          description?: string | null
          script_type?: ScriptType
          has_carousel?: boolean
          status?: ScriptStatus
          submitted_by?: string | null
          character_ids?: string[]
          raw_json?: Json
          download_count?: number
          favourite_count?: number
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
          bracket_published: boolean
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
          bracket_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: CompetitionStatus
          submission_deadline?: string
          bracket_published?: boolean
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
      bracket_matchups: {
        Row: {
          id: string
          competition_id: string
          round: number
          position: number
          entry_a_id: string | null
          entry_b_id: string | null
          winner_entry_id: string | null
          voting_open: boolean
          created_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          round: number
          position: number
          entry_a_id?: string | null
          entry_b_id?: string | null
          winner_entry_id?: string | null
          voting_open?: boolean
          created_at?: string
        }
        Update: {
          entry_a_id?: string | null
          entry_b_id?: string | null
          winner_entry_id?: string | null
          voting_open?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'bracket_matchups_entry_a_id_fkey'
            columns: ['entry_a_id']
            isOneToOne: false
            referencedRelation: 'competition_entries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bracket_matchups_entry_b_id_fkey'
            columns: ['entry_b_id']
            isOneToOne: false
            referencedRelation: 'competition_entries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bracket_matchups_competition_id_fkey'
            columns: ['competition_id']
            isOneToOne: false
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          }
        ]
      }
      matchup_votes: {
        Row: {
          id: string
          matchup_id: string
          user_id: string
          entry_id: string
          created_at: string
        }
        Insert: {
          id?: string
          matchup_id: string
          user_id: string
          entry_id: string
          created_at?: string
        }
        Update: Record<never, never>
        Relationships: [
          {
            foreignKeyName: 'matchup_votes_matchup_id_fkey'
            columns: ['matchup_id']
            isOneToOne: false
            referencedRelation: 'bracket_matchups'
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
      script_favourites: {
        Row: { user_id: string; script_id: string; created_at: string }
        Insert: { user_id: string; script_id: string; created_at?: string }
        Update: Record<never, never>
        Relationships: [
          {
            foreignKeyName: 'script_favourites_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          }
        ]
      }
      script_downloads: {
        Row: {
          id: string
          script_id: string
          ip_hash: string
          day_bucket: string
          created_at: string
        }
        Insert: {
          id?: string
          script_id: string
          ip_hash: string
          day_bucket?: string
          created_at?: string
        }
        Update: Record<never, never>
        Relationships: [
          {
            foreignKeyName: 'script_downloads_script_id_fkey'
            columns: ['script_id']
            isOneToOne: false
            referencedRelation: 'scripts'
            referencedColumns: ['id']
          }
        ]
      }
      script_claims: {
        Row: {
          id: string
          script_id: string
          claimant_id: string
          claimant_display_name: string
          message: string | null
          status: ClaimStatus
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          script_id: string
          claimant_id: string
          claimant_display_name: string
          message?: string | null
          status?: ClaimStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          status?: ClaimStatus
          reviewed_by?: string | null
          reviewed_at?: string | null
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
export type BracketMatchup = Database['public']['Tables']['bracket_matchups']['Row']
export type MatchupVote = Database['public']['Tables']['matchup_votes']['Row']
export type MatchupWithEntries = BracketMatchup & {
  entry_a: CompetitionEntryWithScript | null
  entry_b: CompetitionEntryWithScript | null
}

export type ScriptClaim = Database['public']['Tables']['script_claims']['Row']
export type ScriptClaimWithScript = ScriptClaim & { scripts: Pick<Script, 'id' | 'name' | 'author'> }
