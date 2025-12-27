export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      banned_users: {
        Row: {
          id: string
          user_id: string
          banned_at: string
          banned_until: string | null
          reason: string | null
          is_active: boolean
          banned_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          banned_at?: string
          banned_until?: string | null
          reason?: string | null
          is_active?: boolean
          banned_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          banned_at?: string
          banned_until?: string | null
          reason?: string | null
          is_active?: boolean
          banned_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          personality: string | null
          avatar_url: string | null
          video_url: string | null
          image_url: string | null
          image: string | null
          voice: string | null
          metadata: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
          age: number | null
          system_prompt: string | null
          share_revenue: boolean | null
          ethnicity: string | null
          relationship: string | null
          body: string | null
          occupation: string | null
          hobbies: string | null
          language: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          personality?: string | null
          avatar_url?: string | null
          video_url?: string | null
          image_url?: string | null
          image?: string | null
          voice?: string | null
          metadata?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          age?: number | null
          system_prompt?: string | null
          share_revenue?: boolean | null
          ethnicity?: string | null
          relationship?: string | null
          body?: string | null
          occupation?: string | null
          hobbies?: string | null
          language?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          personality?: string | null
          avatar_url?: string | null
          video_url?: string | null
          image_url?: string | null
          image?: string | null
          voice?: string | null
          metadata?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          age?: number | null
          system_prompt?: string | null
          share_revenue?: boolean | null
          ethnicity?: string | null
          relationship?: string | null
          body?: string | null
          occupation?: string | null
          hobbies?: string | null
          language?: string | null
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_sessions: {
        Row: {
          id: string
          user_id: string
          character_id: string
          title: string | null
          last_message_at: string | null
          message_count: number
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          character_id: string
          title?: string | null
          last_message_at?: string | null
          message_count?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          character_id?: string
          title?: string | null
          last_message_at?: string | null
          message_count?: number
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          session_id: string
          user_id: string
          role: string
          content: string
          is_image: boolean
          image_url: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          role: string
          content: string
          is_image?: boolean
          image_url?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          role?: string
          content?: string
          is_image?: boolean
          image_url?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          is_admin: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          is_admin?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      generation_tasks: {
        Row: {
          id: string
          user_id: string
          task_id: string
          prompt: string
          negative_prompt: string | null
          model: string
          image_count: number
          width: number
          height: number
          status: string
          tokens_deducted: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string
          prompt: string
          negative_prompt?: string | null
          model: string
          image_count?: number
          width?: number
          height?: number
          status?: string
          tokens_deducted?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          prompt?: string
          negative_prompt?: string | null
          model?: string
          image_count?: number
          width?: number
          height?: number
          status?: string
          tokens_deducted?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      premium_profiles: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: any[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_user_banned: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      [key: string]: {
        Args: Record<string, any>
        Returns: any
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
