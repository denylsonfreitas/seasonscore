// Tipos gerados a partir do banco do Supabase (não editar à mão).
// Para regenerar: npx supabase gen types typescript --project-id jitudssddqheithrduij

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      follows: {
        Row: { created_at: string; follower_id: string; following_id: string };
        Insert: { created_at?: string; follower_id: string; following_id: string };
        Update: { created_at?: string; follower_id?: string; following_id?: string };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      last_notified_episodes: {
        Row: {
          episode_number: number;
          notified_at: string;
          season_number: number;
          series_id: number;
          user_id: string;
        };
        Insert: {
          episode_number: number;
          notified_at?: string;
          season_number: number;
          series_id: number;
          user_id: string;
        };
        Update: {
          episode_number?: number;
          notified_at?: string;
          season_number?: number;
          series_id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      list_comment_likes: {
        Row: { comment_id: string; created_at: string; user_id: string };
        Insert: { comment_id: string; created_at?: string; user_id: string };
        Update: { comment_id?: string; created_at?: string; user_id?: string };
        Relationships: [];
      };
      list_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          list_id: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          list_id: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          list_id?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "list_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      list_items: {
        Row: {
          added_at: string;
          list_id: string;
          name: string;
          poster_path: string | null;
          series_id: number;
        };
        Insert: {
          added_at?: string;
          list_id: string;
          name: string;
          poster_path?: string | null;
          series_id: number;
        };
        Update: {
          added_at?: string;
          list_id?: string;
          name?: string;
          poster_path?: string | null;
          series_id?: number;
        };
        Relationships: [];
      };
      list_likes: {
        Row: { created_at: string; list_id: string; user_id: string };
        Insert: { created_at?: string; list_id: string; user_id: string };
        Update: { created_at?: string; list_id?: string; user_id?: string };
        Relationships: [];
      };
      lists: {
        Row: {
          access_by_link: boolean;
          created_at: string;
          description: string;
          id: string;
          is_public: boolean;
          tags: string[];
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_by_link?: boolean;
          created_at?: string;
          description?: string;
          id?: string;
          is_public?: boolean;
          tags?: string[];
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_by_link?: boolean;
          created_at?: string;
          description?: string;
          id?: string;
          is_public?: boolean;
          tags?: string[];
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string;
          episode_number: number | null;
          id: string;
          message: string;
          read: boolean;
          season_number: number | null;
          sender_id: string | null;
          series_id: number | null;
          series_name: string | null;
          series_poster: string | null;
          target_id: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          episode_number?: number | null;
          id?: string;
          message: string;
          read?: boolean;
          season_number?: number | null;
          sender_id?: string | null;
          series_id?: number | null;
          series_name?: string | null;
          series_poster?: string | null;
          target_id?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          episode_number?: number | null;
          id?: string;
          message?: string;
          read?: boolean;
          season_number?: number | null;
          sender_id?: string | null;
          series_id?: number | null;
          series_name?: string | null;
          series_poster?: string | null;
          target_id?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          cover_url: string | null;
          created_at: string;
          description: string | null;
          display_name: string | null;
          favorite_series: Json | null;
          id: string;
          notification_settings: Json;
          photo_url: string | null;
          updated_at: string;
          username: string;
        };
        Insert: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          display_name?: string | null;
          favorite_series?: Json | null;
          id: string;
          notification_settings?: Json;
          photo_url?: string | null;
          updated_at?: string;
          username: string;
        };
        Update: {
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          display_name?: string | null;
          favorite_series?: Json | null;
          id?: string;
          notification_settings?: Json;
          photo_url?: string | null;
          updated_at?: string;
          username?: string;
        };
        Relationships: [];
      };
      review_comment_likes: {
        Row: { comment_id: string; created_at: string; user_id: string };
        Insert: { comment_id: string; created_at?: string; user_id: string };
        Update: { comment_id?: string; created_at?: string; user_id?: string };
        Relationships: [];
      };
      review_comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          review_id: string;
          season_number: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          review_id: string;
          season_number: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          review_id?: string;
          season_number?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          created_at: string;
          id: string;
          series_id: number;
          series_name: string;
          series_poster: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          series_id: number;
          series_name?: string;
          series_poster?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          series_id?: number;
          series_name?: string;
          series_poster?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      season_review_likes: {
        Row: { created_at: string; review_id: string; season_number: number; user_id: string };
        Insert: { created_at?: string; review_id: string; season_number: number; user_id: string };
        Update: {
          created_at?: string;
          review_id?: string;
          season_number?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      season_reviews: {
        Row: {
          comment: string;
          created_at: string;
          has_spoiler: boolean;
          rating: number;
          review_id: string;
          season_number: number;
          updated_at: string;
        };
        Insert: {
          comment?: string;
          created_at?: string;
          has_spoiler?: boolean;
          rating: number;
          review_id: string;
          season_number: number;
          updated_at?: string;
        };
        Update: {
          comment?: string;
          created_at?: string;
          has_spoiler?: boolean;
          rating?: number;
          review_id?: string;
          season_number?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "season_reviews_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      watchlist: {
        Row: {
          added_at: string;
          first_air_date: string | null;
          poster_path: string | null;
          series_id: number;
          series_name: string;
          user_id: string;
        };
        Insert: {
          added_at?: string;
          first_air_date?: string | null;
          poster_path?: string | null;
          series_id: number;
          series_name: string;
          user_id: string;
        };
        Update: {
          added_at?: string;
          first_air_date?: string | null;
          poster_path?: string | null;
          series_id?: number;
          series_name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      list_summaries: {
        Row: {
          access_by_link: boolean | null;
          comments_count: number | null;
          created_at: string | null;
          description: string | null;
          display_name: string | null;
          id: string | null;
          is_public: boolean | null;
          items_count: number | null;
          likes_count: number | null;
          tags: string[] | null;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
          user_photo_url: string | null;
          username: string | null;
        };
        Relationships: [];
      };
      profile_stats: {
        Row: {
          cover_url: string | null;
          created_at: string | null;
          description: string | null;
          display_name: string | null;
          followers_count: number | null;
          following_count: number | null;
          id: string | null;
          lists_count: number | null;
          photo_url: string | null;
          reviews_count: number | null;
          username: string | null;
        };
        Relationships: [];
      };
      season_review_feed: {
        Row: {
          comment: string | null;
          comments_count: number | null;
          created_at: string | null;
          display_name: string | null;
          has_spoiler: boolean | null;
          likes_count: number | null;
          photo_url: string | null;
          rating: number | null;
          review_id: string | null;
          season_number: number | null;
          series_id: number | null;
          series_name: string | null;
          series_poster: string | null;
          updated_at: string | null;
          user_id: string | null;
          username: string | null;
        };
        Relationships: [];
      };
      series_ratings: {
        Row: {
          average_rating: number | null;
          ratings_count: number | null;
          reviewers_count: number | null;
          series_id: number | null;
          series_name: string | null;
          series_poster: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      delete_my_account: { Args: never; Returns: undefined };
      is_username_available: { Args: { p_username: string }; Returns: boolean };
      popular_list_tags: {
        Args: { p_limit?: number };
        Returns: { count: number; tag: string }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

/** Linha de uma tabela ou view do schema public. */
export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never;
