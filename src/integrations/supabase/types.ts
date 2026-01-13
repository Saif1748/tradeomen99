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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          context: string | null
          created_at: string | null
          est_cost: number | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          output_tokens: number | null
          provider: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          est_cost?: number | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          output_tokens?: number | null
          provider: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          est_cost?: number | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          output_tokens?: number | null
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      broker_accounts: {
        Row: {
          api_key_last_digits: string | null
          broker_name: string
          created_at: string | null
          encrypted_credentials: string
          id: string
          is_active: boolean
          last_sync_time: string | null
          user_id: string
        }
        Insert: {
          api_key_last_digits?: string | null
          broker_name: string
          created_at?: string | null
          encrypted_credentials: string
          id?: string
          is_active?: boolean
          last_sync_time?: string | null
          user_id: string
        }
        Update: {
          api_key_last_digits?: string | null
          broker_name?: string
          created_at?: string | null
          encrypted_credentials?: string
          id?: string
          is_active?: boolean
          last_sync_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string | null
          encrypted_content: string
          id: number
          model_name: string | null
          role: string
          session_id: string
          usage_tokens: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_content: string
          id?: number
          model_name?: string | null
          role: string
          session_id: string
          usage_tokens?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_content?: string
          id?: number
          model_name?: string | null
          role?: string
          session_id?: string
          usage_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          topic: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          topic?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_insights: {
        Row: {
          id: string
          last_calculated_at: string | null
          metric_name: string
          metric_value: string
          region_segment: string
          sample_size: number
          strategy_segment: string
        }
        Insert: {
          id?: string
          last_calculated_at?: string | null
          metric_name: string
          metric_value: string
          region_segment: string
          sample_size: number
          strategy_segment: string
        }
        Update: {
          id?: string
          last_calculated_at?: string | null
          metric_name?: string
          metric_value?: string
          region_segment?: string
          sample_size?: number
          strategy_segment?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_path: string | null
          id: string
          job_type: string
          processed_records: number | null
          status: Database["public"]["Enums"]["import_status"]
          total_records: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          job_type: string
          processed_records?: number | null
          status?: Database["public"]["Enums"]["import_status"]
          total_records?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          job_type?: string
          processed_records?: number | null
          status?: Database["public"]["Enums"]["import_status"]
          total_records?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          email: string | null
          full_name: string | null
          id: string
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      strategies: {
        Row: {
          color_hex: string | null
          created_at: string | null
          description: string | null
          emoji: string | null
          id: string
          instrument_types: string[] | null
          name: string
          rules: Json | null
          style: string | null
          track_missed_trades: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          instrument_types?: string[] | null
          name: string
          rules?: Json | null
          style?: string | null
          track_missed_trades?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string | null
          description?: string | null
          emoji?: string | null
          id?: string
          instrument_types?: string[] | null
          name?: string
          rules?: Json | null
          style?: string | null
          track_missed_trades?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          trade_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          trade_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          trade_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_embeddings_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          broker_account_id: string | null
          created_at: string | null
          direction: string
          emotion: string | null
          encrypted_notes: string | null
          encrypted_screenshots: string | null
          entry_price: number | null
          entry_time: string
          exit_price: number | null
          exit_time: string | null
          fees: number | null
          id: string
          import_batch_id: string | null
          instrument_type: string | null
          metadata: Json | null
          pnl: number | null
          quantity: number | null
          source_type: string | null
          status: string
          stop_loss: number | null
          strategy_id: string | null
          symbol: string
          tags: string[] | null
          target: number | null
          user_id: string
        }
        Insert: {
          broker_account_id?: string | null
          created_at?: string | null
          direction: string
          emotion?: string | null
          encrypted_notes?: string | null
          encrypted_screenshots?: string | null
          entry_price?: number | null
          entry_time: string
          exit_price?: number | null
          exit_time?: string | null
          fees?: number | null
          id?: string
          import_batch_id?: string | null
          instrument_type?: string | null
          metadata?: Json | null
          pnl?: number | null
          quantity?: number | null
          source_type?: string | null
          status?: string
          stop_loss?: number | null
          strategy_id?: string | null
          symbol: string
          tags?: string[] | null
          target?: number | null
          user_id: string
        }
        Update: {
          broker_account_id?: string | null
          created_at?: string | null
          direction?: string
          emotion?: string | null
          encrypted_notes?: string | null
          encrypted_screenshots?: string | null
          entry_price?: number | null
          entry_time?: string
          exit_price?: number | null
          exit_time?: string | null
          fees?: number | null
          id?: string
          import_batch_id?: string | null
          instrument_type?: string | null
          metadata?: Json | null
          pnl?: number | null
          quantity?: number | null
          source_type?: string | null
          status?: string
          stop_loss?: number | null
          strategy_id?: string | null
          symbol?: string
          tags?: string[] | null
          target?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          category: string | null
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          path: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          path?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          active_plan_id: string
          ai_chat_quota_used: number
          consent_ai_training: boolean
          created_at: string | null
          current_period_end: string | null
          daily_chat_count: number | null
          default_currency: string
          gateway_customer_id: string | null
          id: string
          last_active_at: string | null
          last_chat_reset_at: string | null
          monthly_ai_tokens_used: number | null
          monthly_import_count: number | null
          plan_tier: string | null
          preferences: Json | null
          quota_reset_at: string | null
          region_code: string
          total_trades_count: number | null
          updated_at: string | null
        }
        Insert: {
          active_plan_id?: string
          ai_chat_quota_used?: number
          consent_ai_training?: boolean
          created_at?: string | null
          current_period_end?: string | null
          daily_chat_count?: number | null
          default_currency?: string
          gateway_customer_id?: string | null
          id: string
          last_active_at?: string | null
          last_chat_reset_at?: string | null
          monthly_ai_tokens_used?: number | null
          monthly_import_count?: number | null
          plan_tier?: string | null
          preferences?: Json | null
          quota_reset_at?: string | null
          region_code?: string
          total_trades_count?: number | null
          updated_at?: string | null
        }
        Update: {
          active_plan_id?: string
          ai_chat_quota_used?: number
          consent_ai_training?: boolean
          created_at?: string | null
          current_period_end?: string | null
          daily_chat_count?: number | null
          default_currency?: string
          gateway_customer_id?: string | null
          id?: string
          last_active_at?: string | null
          last_chat_reset_at?: string | null
          monthly_ai_tokens_used?: number | null
          monthly_import_count?: number | null
          plan_tier?: string | null
          preferences?: Json | null
          quota_reset_at?: string | null
          region_code?: string
          total_trades_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_user_id: { Args: never; Returns: string }
      get_analytics_overview: { Args: never; Returns: Json }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_strategies_overview: {
        Args: never
        Returns: {
          color_hex: string
          created_at: string
          description: string
          emoji: string
          id: string
          instrument_types: string[]
          name: string
          stats: Json
          style: string
          user_id: string
        }[]
      }
    }
    Enums: {
      import_status:
        | "PENDING"
        | "PROCESSING"
        | "FAILED"
        | "COMPLETED"
        | "CANCELLED"
      trade_status: "OPEN" | "CLOSED" | "CANCELED"
      trading_direction: "LONG" | "SHORT" | "OTHER"
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
    Enums: {
      import_status: [
        "PENDING",
        "PROCESSING",
        "FAILED",
        "COMPLETED",
        "CANCELLED",
      ],
      trade_status: ["OPEN", "CLOSED", "CANCELED"],
      trading_direction: ["LONG", "SHORT", "OTHER"],
    },
  },
} as const
