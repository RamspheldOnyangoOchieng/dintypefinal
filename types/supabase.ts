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
          name: string
          description: string | null
          personality: string | null
          avatar_url: string | null
          video_url: string | null
          image_url: string | null
          voice: string | null
          metadata: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          personality?: string | null
          avatar_url?: string | null
          video_url?: string | null
          image_url?: string | null
          voice?: string | null
          metadata?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          personality?: string | null
          avatar_url?: string | null
          video_url?: string | null
          image_url?: string | null
          voice?: string | null
          metadata?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
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
