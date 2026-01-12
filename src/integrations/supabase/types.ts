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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      backup_schedules: {
        Row: {
          created_at: string
          enabled: boolean
          folder_paths: string[] | null
          frequency: string
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          folder_paths?: string[] | null
          frequency?: string
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          folder_paths?: string[] | null
          frequency?: string
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          file_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          created_at: string
          folder_path: string | null
          id: string
          is_deleted: boolean
          mime_type: string | null
          name: string
          size: number
          storage_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_path?: string | null
          id?: string
          is_deleted?: boolean
          mime_type?: string | null
          name: string
          size?: number
          storage_path: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_path?: string | null
          id?: string
          is_deleted?: boolean
          mime_type?: string | null
          name?: string
          size?: number
          storage_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offline_files: {
        Row: {
          cache_size: number
          cached_at: string
          file_id: string
          id: string
          user_id: string
        }
        Insert: {
          cache_size?: number
          cached_at?: string
          file_id: string
          id?: string
          user_id: string
        }
        Update: {
          cache_size?: number
          cached_at?: string
          file_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      passkey_credentials: {
        Row: {
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          public_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          public_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          storage_limit: number
          storage_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          storage_limit?: number
          storage_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          storage_limit?: number
          storage_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recent_files: {
        Row: {
          accessed_at: string
          file_id: string
          id: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          file_id: string
          id?: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          file_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      share_link_attempts: {
        Row: {
          attempted_at: string | null
          client_ip: string | null
          id: string
          share_token: string
          success: boolean | null
        }
        Insert: {
          attempted_at?: string | null
          client_ip?: string | null
          id?: string
          share_token: string
          success?: boolean | null
        }
        Update: {
          attempted_at?: string | null
          client_ip?: string | null
          id?: string
          share_token?: string
          success?: boolean | null
        }
        Relationships: []
      }
      shared_links: {
        Row: {
          created_at: string
          download_count: number
          expires_at: string | null
          file_id: string
          id: string
          max_downloads: number | null
          password_hash: string | null
          share_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          download_count?: number
          expires_at?: string | null
          file_id: string
          id?: string
          max_downloads?: number | null
          password_hash?: string | null
          share_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          download_count?: number
          expires_at?: string | null
          file_id?: string
          id?: string
          max_downloads?: number | null
          password_hash?: string | null
          share_token?: string
          user_id?: string
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          created_at: string
          id: string
          is_syncing: boolean
          last_sync_at: string | null
          synced_files: number
          total_files: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_syncing?: boolean
          last_sync_at?: string | null
          synced_files?: number
          total_files?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_syncing?: boolean
          last_sync_at?: string | null
          synced_files?: number
          total_files?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trash: {
        Row: {
          deleted_at: string
          expires_at: string
          id: string
          mime_type: string | null
          name: string
          original_file_id: string | null
          original_folder_path: string | null
          size: number
          storage_path: string
          user_id: string
        }
        Insert: {
          deleted_at?: string
          expires_at?: string
          id?: string
          mime_type?: string | null
          name: string
          original_file_id?: string | null
          original_folder_path?: string | null
          size?: number
          storage_path: string
          user_id: string
        }
        Update: {
          deleted_at?: string
          expires_at?: string
          id?: string
          mime_type?: string | null
          name?: string
          original_file_id?: string | null
          original_folder_path?: string | null
          size?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_trash: { Args: never; Returns: undefined }
      create_secure_share_link: {
        Args: {
          p_expires_at?: string
          p_file_id: string
          p_max_downloads?: number
          p_password?: string
          p_share_token: string
        }
        Returns: {
          created_at: string
          download_count: number
          expires_at: string
          file_id: string
          has_password: boolean
          id: string
          max_downloads: number
          share_token: string
        }[]
      }
      increment_shared_link_download: {
        Args: { p_link_id: string }
        Returns: boolean
      }
      verify_shared_link_access: {
        Args: { p_password?: string; p_share_token: string }
        Returns: {
          download_count: number
          file_id: string
          file_mime_type: string
          file_name: string
          file_size: number
          file_storage_path: string
          link_id: string
          max_downloads: number
          rate_limited: boolean
          requires_password: boolean
          valid: boolean
        }[]
      }
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
