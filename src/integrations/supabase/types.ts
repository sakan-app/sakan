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
      ad_placements: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          label: string
          min_height: number
          network: string | null
          slot_key: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          label: string
          min_height?: number
          network?: string | null
          slot_key: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          min_height?: number
          network?: string | null
          slot_key?: string
          unit_id?: string | null
          updated_at?: string
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
      admin_notes: {
        Row: {
          author_id: string
          created_at: string
          id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          note: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          actor_id: string | null
          amount_cents: number | null
          created_at: string
          currency: string
          detail: Json
          from_plan_code: string | null
          id: string
          payment_id: string | null
          plan_code: string | null
          subscription_id: string | null
          type: Database["public"]["Enums"]["billing_event_type"]
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          amount_cents?: number | null
          created_at?: string
          currency?: string
          detail?: Json
          from_plan_code?: string | null
          id?: string
          payment_id?: string | null
          plan_code?: string | null
          subscription_id?: string | null
          type: Database["public"]["Enums"]["billing_event_type"]
          user_id: string
        }
        Update: {
          actor_id?: string | null
          amount_cents?: number | null
          created_at?: string
          currency?: string
          detail?: Json
          from_plan_code?: string | null
          id?: string
          payment_id?: string | null
          plan_code?: string | null
          subscription_id?: string | null
          type?: Database["public"]["Enums"]["billing_event_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
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
      chat_wallpapers: {
        Row: {
          blur: number
          brightness: number
          conversation_id: string | null
          created_at: string
          custom_image: string | null
          id: string
          opacity: number
          overlay: number
          updated_at: string
          user_id: string
          wallpaper_id: string
          wallpaper_type: string
        }
        Insert: {
          blur?: number
          brightness?: number
          conversation_id?: string | null
          created_at?: string
          custom_image?: string | null
          id?: string
          opacity?: number
          overlay?: number
          updated_at?: string
          user_id: string
          wallpaper_id?: string
          wallpaper_type?: string
        }
        Update: {
          blur?: number
          brightness?: number
          conversation_id?: string | null
          created_at?: string
          custom_image?: string | null
          id?: string
          opacity?: number
          overlay?: number
          updated_at?: string
          user_id?: string
          wallpaper_id?: string
          wallpaper_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_wallpapers_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
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
      featured_ads: {
        Row: {
          amount_cents: number
          clicks: number
          created_at: string
          currency: string
          ends_at: string | null
          headline: string | null
          id: string
          image_path: string
          impressions: number
          paid_at: string | null
          provider: string | null
          provider_ref: string | null
          review_note: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["featured_ad_status"]
          subtitle: string | null
          target_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          clicks?: number
          created_at?: string
          currency?: string
          ends_at?: string | null
          headline?: string | null
          id?: string
          image_path: string
          impressions?: number
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          review_note?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["featured_ad_status"]
          subtitle?: string | null
          target_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          clicks?: number
          created_at?: string
          currency?: string
          ends_at?: string | null
          headline?: string | null
          id?: string
          image_path?: string
          impressions?: number
          paid_at?: string | null
          provider?: string | null
          provider_ref?: string | null
          review_note?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["featured_ad_status"]
          subtitle?: string | null
          target_url?: string | null
          updated_at?: string
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
      message_reactions: {
        Row: {
          conversation_id: string
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
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
          deleted_for: string[]
          delivered_at: string | null
          edited_at: string | null
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          moderation: Database["public"]["Enums"]["moderation_verdict"]
          pinned_at: string | null
          pinned_by: string | null
          read_at: string | null
          reply_to_id: string | null
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
          deleted_for?: string[]
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          moderation?: Database["public"]["Enums"]["moderation_verdict"]
          pinned_at?: string | null
          pinned_by?: string | null
          read_at?: string | null
          reply_to_id?: string | null
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
          deleted_for?: string[]
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          moderation?: Database["public"]["Enums"]["moderation_verdict"]
          pinned_at?: string | null
          pinned_by?: string | null
          read_at?: string | null
          reply_to_id?: string | null
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
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          description: string | null
          failure_reason: string | null
          id: string
          invoice_number: string | null
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          provider: string | null
          provider_ref: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          provider_ref?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          failure_reason?: string | null
          id?: string
          invoice_number?: string | null
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          provider?: string | null
          provider_ref?: string | null
          refunded_at?: string | null
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
      plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          features: Json
          is_public: boolean
          limits: Json
          name: Json
          price_annual_cents: number
          price_monthly_cents: number
          sort_order: number
          tagline: Json
          tier: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          features?: Json
          is_public?: boolean
          limits?: Json
          name?: Json
          price_annual_cents?: number
          price_monthly_cents?: number
          sort_order?: number
          tagline?: Json
          tier?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          features?: Json
          is_public?: boolean
          limits?: Json
          name?: Json
          price_annual_cents?: number
          price_monthly_cents?: number
          sort_order?: number
          tagline?: Json
          tier?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          allowed_image_types: string[]
          created_at: string
          default_language: Database["public"]["Enums"]["language_code"]
          id: boolean
          maintenance_mode: boolean
          max_gallery_photos: number
          max_image_mb: number
          notify_defaults: Json
          registration_enabled: boolean
          support_email: string
          updated_at: string
          updated_by: string | null
          verification_required: boolean
        }
        Insert: {
          allowed_image_types?: string[]
          created_at?: string
          default_language?: Database["public"]["Enums"]["language_code"]
          id?: boolean
          maintenance_mode?: boolean
          max_gallery_photos?: number
          max_image_mb?: number
          notify_defaults?: Json
          registration_enabled?: boolean
          support_email?: string
          updated_at?: string
          updated_by?: string | null
          verification_required?: boolean
        }
        Update: {
          allowed_image_types?: string[]
          created_at?: string
          default_language?: Database["public"]["Enums"]["language_code"]
          id?: boolean
          maintenance_mode?: boolean
          max_gallery_photos?: number
          max_image_mb?: number
          notify_defaults?: Json
          registration_enabled?: boolean
          support_email?: string
          updated_at?: string
          updated_by?: string | null
          verification_required?: boolean
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
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_until: string | null
          id: string
          note: string | null
          plan_code: string
          previous_plan_code: string | null
          provider: string | null
          provider_ref: string | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_until?: string | null
          id?: string
          note?: string | null
          plan_code: string
          previous_plan_code?: string | null
          provider?: string | null
          provider_ref?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          grace_until?: string | null
          id?: string
          note?: string | null
          plan_code?: string
          previous_plan_code?: string | null
          provider?: string | null
          provider_ref?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
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
      current_subscription: {
        Args: { _user_id: string }
        Returns: {
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          grace_until: string | null
          id: string
          note: string | null
          plan_code: string
          previous_plan_code: string | null
          provider: string | null
          provider_ref: string | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      expire_due_subscriptions: { Args: never; Returns: number }
      get_or_create_conversation: {
        Args: { other_user: string }
        Returns: string
      }
      has_premium: { Args: { _user_id: string }; Returns: boolean }
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
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      touch_last_seen: { Args: never; Returns: undefined }
      user_plan: { Args: { _user_id: string }; Returns: string }
      user_plan_tier: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "user" | "moderator" | "admin" | "super_admin"
      billing_event_type:
        | "checkout"
        | "activated"
        | "upgraded"
        | "downgraded"
        | "canceled"
        | "resumed"
        | "renewed"
        | "payment_succeeded"
        | "payment_failed"
        | "grace_started"
        | "expired"
        | "refunded"
      billing_interval: "monthly" | "annual"
      consent_type: "terms" | "privacy" | "marketing" | "cookies"
      featured_ad_status:
        | "pending_payment"
        | "pending_review"
        | "active"
        | "expired"
        | "rejected"
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
      verification_status: "pending" | "approved" | "rejected" | "expired"
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
      app_role: ["user", "moderator", "admin", "super_admin"],
      billing_event_type: [
        "checkout",
        "activated",
        "upgraded",
        "downgraded",
        "canceled",
        "resumed",
        "renewed",
        "payment_succeeded",
        "payment_failed",
        "grace_started",
        "expired",
        "refunded",
      ],
      billing_interval: ["monthly", "annual"],
      consent_type: ["terms", "privacy", "marketing", "cookies"],
      featured_ad_status: [
        "pending_payment",
        "pending_review",
        "active",
        "expired",
        "rejected",
      ],
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
      verification_status: ["pending", "approved", "rejected", "expired"],
    },
  },
} as const
