// Generated from the hosted Supabase project (supabase gen types / MCP).
// Regenerate after schema migrations — do not edit by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      backlog_items: {
        Row: {
          category_id: string
          created_at: string
          deleted_at: string | null
          description: string | null
          external_id: string | null
          external_source: string | null
          id: string
          image_url: string | null
          item_type: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backlog_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_matchups: {
        Row: {
          battle_id: string
          completed_at: string | null
          created_at: string
          id: string
          item_a_id: string
          item_b_id: string
          match_number: number
          round_number: number
          updated_at: string
          winner_item_id: string | null
        }
        Insert: {
          battle_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          item_a_id: string
          item_b_id: string
          match_number: number
          round_number: number
          updated_at?: string
          winner_item_id?: string | null
        }
        Update: {
          battle_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          item_a_id?: string
          item_b_id?: string
          match_number?: number
          round_number?: number
          updated_at?: string
          winner_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "battle_matchups_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_matchups_item_a_id_fkey"
            columns: ["item_a_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_matchups_item_b_id_fkey"
            columns: ["item_b_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_matchups_winner_item_id_fkey"
            columns: ["winner_item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_rankings: {
        Row: {
          battle_id: string
          category_id: string
          created_at: string
          id: string
          item_id: string
          rank: number
        }
        Insert: {
          battle_id: string
          category_id: string
          created_at?: string
          id?: string
          item_id: string
          rank: number
        }
        Update: {
          battle_id?: string
          category_id?: string
          created_at?: string
          id?: string
          item_id?: string
          rank?: number
        }
        Relationships: [
          {
            foreignKeyName: "battle_rankings_battle_id_fkey"
            columns: ["battle_id"]
            isOneToOne: false
            referencedRelation: "battles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_rankings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "battle_rankings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "backlog_items"
            referencedColumns: ["id"]
          },
        ]
      }
      battles: {
        Row: {
          algorithm: string
          category_id: string
          completed_at: string | null
          created_at: string
          id: string
          participant_item_ids: string[]
          seed: number | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          algorithm?: string
          category_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          participant_item_ids: string[]
          seed?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          algorithm?: string
          category_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          participant_item_ids?: string[]
          seed?: number | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "battles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
