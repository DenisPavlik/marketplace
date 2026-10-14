// Generated from the Supabase schema (supabase gen types). Do not edit by hand.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      conversations: {
        Row: {
          buyer_id: string;
          buyer_last_read_at: string;
          created_at: string;
          id: string;
          last_message_at: string | null;
          last_message_preview: string | null;
          last_message_sender_id: string | null;
          listing_id: string;
          seller_id: string;
          seller_last_read_at: string;
        };
        Insert: {
          buyer_id: string;
          buyer_last_read_at?: string;
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          last_message_sender_id?: string | null;
          listing_id: string;
          seller_id: string;
          seller_last_read_at?: string;
        };
        Update: {
          buyer_id?: string;
          buyer_last_read_at?: string;
          created_at?: string;
          id?: string;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          last_message_sender_id?: string | null;
          listing_id?: string;
          seller_id?: string;
          seller_last_read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey";
            columns: ["buyer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_last_message_sender_id_fkey";
            columns: ["last_message_sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          listing_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          listing_id: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          listing_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey";
            columns: ["listing_id"];
            isOneToOne: false;
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listings: {
        Row: {
          category: string;
          condition: string | null;
          created_at: string;
          description: string;
          id: string;
          images: Json;
          lat: number;
          lng: number;
          location: unknown;
          location_name: string | null;
          price: number;
          search: unknown;
          seller_id: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: string;
          condition?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          images: Json;
          lat: number;
          lng: number;
          location?: unknown;
          location_name?: string | null;
          price: number;
          search?: unknown;
          seller_id?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          condition?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          images?: Json;
          lat?: number;
          lng?: number;
          location?: unknown;
          location_name?: string | null;
          price?: number;
          search?: unknown;
          seller_id?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listings_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          conversation_id: string;
          created_at: string;
          id: number;
          sender_id: string;
        };
        Insert: {
          body: string;
          conversation_id: string;
          created_at?: string;
          id?: never;
          sender_id?: string;
        };
        Update: {
          body?: string;
          conversation_id?: string;
          created_at?: string;
          id?: never;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_valid_listing_images: { Args: { imgs: Json }; Returns: boolean };
      mark_conversation_read: { Args: { p_conversation_id: string }; Returns: undefined };
      start_conversation: { Args: { p_listing_id: string }; Returns: string };
      unread_conversation_count: { Args: never; Returns: number };
      search_listings: {
        Args: {
          cat?: string;
          max_price?: number;
          min_price?: number;
          near_lat?: number;
          near_lng?: number;
          page_limit?: number;
          page_offset?: number;
          q?: string;
          radius_km?: number;
          sort?: string;
        };
        Returns: {
          category: string;
          condition: string;
          created_at: string;
          distance_km: number;
          id: string;
          images: Json;
          lat: number;
          lng: number;
          location_name: string;
          price: number;
          status: string;
          title: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
