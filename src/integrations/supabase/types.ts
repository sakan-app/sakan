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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          context: Json
          created_at: string
          event: string
          id: string
          level: Database["public"]["Enums"]["log_level"]
          user_id: string | null
        }
        Insert: {
          context?: Json
          created_at?: string
          event: string
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          user_id?: string | null
        }
        Update: {
          context?: Json
          created_at?: string
          event?: string
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          user_id?: string | null
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      compatibility_scores: {
        Row: {
          candidate_id: string
          considerations: string[]
          created_at: string
          id: string
          language: Database["public"]["Enums"]["language_code"]
          score: number
          strengths: string[]
          summary: string | null
          user_id: string
        }
        Insert: {
          candidate_id: string
          considerations?: string[]
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["language_code"]
          score: number
          strengths?: string[]
          summary?: string | null
          user_id: string
        }
        Update: {
          candidate_id?: string
          considerations?: string[]
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["language_code"]
          score?: number
          strengths?: string[]
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at: string
          granted: boolean
          id: string
          user_id: string
          version: string
        }
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          granted: boolean
          id?: string
          user_id: string
          version?: string
        }
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"]
          created_at?: string
          granted?: boolean
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          updated_at: string
          user_high: string
          user_low: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
          user_high: string
          user_low: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          updated_at?: string
          user_high?: string
          user_low?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          favorite_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          is_active: boolean
          matched_at: string
          user_high: string
          user_low: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          matched_at?: string
          user_high: string
          user_low: string
        }
        Update: {
          id?: string
          is_active?: boolean
          matched_at?: string
          user_high?: string
          user_low?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_mime: string | null
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          delivered_at: string | null
          edited_at: string | null
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          moderation: Database["public"]["Enums"]["moderation_verdict"]
          read_at: string | null
          sender_id: string
          source_language: Database["public"]["Enums"]["language_code"] | null
          translations: Json
        }
        Insert: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          body: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          moderation?: Database["public"]["Enums"]["moderation_verdict"]
          read_at?: string | null
          sender_id: string
          source_language?: Database["public"]["Enums"]["language_code"] | null
          translations?: Json
        }
        Update: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          moderation?: Database["public"]["Enums"]["moderation_verdict"]
          read_at?: string | null
          sender_id?: string
          source_language?: Database["public"]["Enums"]["language_code"] | null
          translations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_flags: {
        Row: {
          categories: string[]
          created_at: string
          excerpt: string | null
          id: string
          reason: string | null
          score: number | null
          subject_id: string | null
          subject_type: string
          user_id: string
          verdict: Database["public"]["Enums"]["moderation_verdict"]
        }
        Insert: {
          categories?: string[]
          created_at?: string
          excerpt?: string | null
          id?: string
          reason?: string | null
          score?: number | null
          subject_id?: string | null
          subject_type: string
          user_id: string
          verdict?: Database["public"]["Enums"]["moderation_verdict"]
        }
        Update: {
          categories?: string[]
          created_at?: string
          excerpt?: string | null
          id?: string
          reason?: string | null
          score?: number | null
          subject_id?: string | null
          subject_type?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["moderation_verdict"]
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          data: Json
          id: string
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          provider: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          byte_size: number | null
          created_at: string
          height: number | null
          id: string
          is_approved: boolean
          is_primary: boolean
          kind: Database["public"]["Enums"]["photo_kind"]
          mime_type: string | null
          position: number
          storage_path: string
          thumb_path: string | null
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          byte_size?: number | null
          created_at?: string
          height?: number | null
          id?: string
          is_approved?: boolean
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["photo_kind"]
          mime_type?: string | null
          position?: number
          storage_path: string
          thumb_path?: string | null
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          byte_size?: number | null
          created_at?: string
          height?: number | null
          id?: string
          is_approved?: boolean
          is_primary?: boolean
          kind?: Database["public"]["Enums"]["photo_kind"]
          mime_type?: string | null
          position?: number
          storage_path?: string
          thumb_path?: string | null
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          completeness: number
          country_code: string | null
          created_at: string
          display_name: string
          education: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          height_cm: number | null
          id: string
          interests: string[]
          is_active: boolean
          is_hidden: boolean
          is_verified: boolean
          last_seen_at: string
          looking_for: Database["public"]["Enums"]["gender"] | null
          marital_status: Database["public"]["Enums"]["marital_status"] | null
          occupation: string | null
          onboarding_complete: boolean
          preferred_language: Database["public"]["Enums"]["language_code"]
          religiosity: Database["public"]["Enums"]["religiosity_level"] | null
          spoken_languages: string[]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          completeness?: number
          country_code?: string | null
          created_at?: string
          display_name: string
          education?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height_cm?: number | null
          id: string
          interests?: string[]
          is_active?: boolean
          is_hidden?: boolean
          is_verified?: boolean
          last_seen_at?: string
          looking_for?: Database["public"]["Enums"]["gender"] | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          occupation?: string | null
          onboarding_complete?: boolean
          preferred_language?: Database["public"]["Enums"]["language_code"]
          religiosity?: Database["public"]["Enums"]["religiosity_level"] | null
          spoken_languages?: string[]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          completeness?: number
          country_code?: string | null
          created_at?: string
          display_name?: string
          education?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          height_cm?: number | null
          id?: string
          interests?: string[]
          is_active?: boolean
          is_hidden?: boolean
          is_verified?: boolean
          last_seen_at?: string
          looking_for?: Database["public"]["Enums"]["gender"] | null
          marital_status?: Database["public"]["Enums"]["marital_status"] | null
          occupation?: string | null
          onboarding_complete?: boolean
          preferred_language?: Database["public"]["Enums"]["language_code"]
          religiosity?: Database["public"]["Enums"]["religiosity_level"] | null
          spoken_languages?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          message_id: string | null
          reason: string
          reported_id: string
          reporter_id: string
          resolved_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string | null
          reason: string
          reported_id: string
          reporter_id: string
          resolved_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          message_id?: string | null
          reason?: string
          reported_id?: string
          reporter_id?: string
          resolved_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          criteria: Json
          id: string
          label: string
          user_id: string
        }
        Insert: {
          created_at?: string
          criteria?: Json
          id?: string
          label: string
          user_id: string
        }
        Update: {
          created_at?: string
          criteria?: Json
          id?: string
          label?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_code: string
          provider: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_code: string
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_code?: string
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          created_at: string
          document_path: string | null
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          selfie_path: string | null
          status: Database["public"]["Enums"]["verification_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_path?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selfie_path?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_path?: string | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selfie_path?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_or_create_conversation: {
        Args: { other_user: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_between: { Args: { _a: string; _b: string }; Returns: boolean }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      touch_last_seen: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin"
      consent_type: "terms" | "privacy" | "marketing" | "cookies"
      gender: "male" | "female"
      language_code: "ar" | "en" | "de" | "ru"
      log_level: "debug" | "info" | "warn" | "error"
      marital_status: "single" | "divorced" | "widowed"
      message_kind: "text" | "image" | "file"
      moderation_verdict: "pending" | "approved" | "flagged" | "rejected"
      notification_type:
        | "like"
        | "match"
        | "message"
        | "profile_view"
        | "verification"
        | "system"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      photo_kind: "avatar" | "gallery" | "verification"
      religiosity_level:
        | "practicing"
        | "moderate"
        | "cultural"
        | "prefer_not_say"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "expired"
      verification_status: "pending" | "approved" | "rejected"
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
      app_role: ["user", "moderator", "admin"],
      consent_type: ["terms", "privacy", "marketing", "cookies"],
      gender: ["male", "female"],
      language_code: ["ar", "en", "de", "ru"],
      log_level: ["debug", "info", "warn", "error"],
      marital_status: ["single", "divorced", "widowed"],
      message_kind: ["text", "image", "file"],
      moderation_verdict: ["pending", "approved", "flagged", "rejected"],
      notification_type: [
        "like",
        "match",
        "message",
        "profile_view",
        "verification",
        "system",
      ],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      photo_kind: ["avatar", "gallery", "verification"],
      religiosity_level: [
        "practicing",
        "moderate",
        "cultural",
        "prefer_not_say",
      ],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "expired",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
