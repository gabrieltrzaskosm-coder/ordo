// Gerado a partir do schema do projeto Supabase (app-pedidos).
// Regenerar após alterações ao schema: `supabase gen types typescript --project-id wetlqdqtsyllvdxafbzh`
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      establishment_invoicing: {
        Row: {
          api_key: string | null;
          created_at: string;
          establishment_id: string;
          mode: string;
          provider: string;
          register_id: string | null;
          updated_at: string;
        };
        Insert: {
          api_key?: string | null;
          created_at?: string;
          establishment_id: string;
          mode?: string;
          provider?: string;
          register_id?: string | null;
          updated_at?: string;
        };
        Update: {
          api_key?: string;
          created_at?: string;
          establishment_id?: string;
          mode?: string;
          provider?: string;
          register_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "establishment_invoicing_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: true;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
      establishments: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          name: string;
          plan: Database["public"]["Enums"]["plan_tier"];
          slug: string;
          stripe_account_id: string | null;
          stripe_charges_enabled: boolean;
          vat_number: string | null;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          name: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          slug: string;
          stripe_account_id?: string | null;
          stripe_charges_enabled?: boolean;
          vat_number?: string | null;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          name?: string;
          plan?: Database["public"]["Enums"]["plan_tier"];
          slug?: string;
          stripe_account_id?: string | null;
          stripe_charges_enabled?: boolean;
          vat_number?: string | null;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          amount_cents: number | null;
          at_document_ref: string | null;
          created_at: string;
          error: string | null;
          establishment_id: string;
          id: string;
          number: string | null;
          payment_id: string;
          pdf_url: string | null;
          provider: string;
          status: string;
        };
        Insert: {
          amount_cents?: number | null;
          at_document_ref?: string | null;
          created_at?: string;
          error?: string | null;
          establishment_id: string;
          id?: string;
          number?: string | null;
          payment_id: string;
          pdf_url?: string | null;
          provider: string;
          status?: string;
        };
        Update: {
          amount_cents?: number | null;
          at_document_ref?: string | null;
          created_at?: string;
          error?: string | null;
          establishment_id?: string;
          id?: string;
          number?: string | null;
          payment_id?: string;
          pdf_url?: string | null;
          provider?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_categories: {
        Row: {
          created_at: string;
          establishment_id: string;
          id: string;
          name: string;
          sort: number;
        };
        Insert: {
          created_at?: string;
          establishment_id: string;
          id?: string;
          name: string;
          sort?: number;
        };
        Update: {
          created_at?: string;
          establishment_id?: string;
          id?: string;
          name?: string;
          sort?: number;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          available: boolean;
          category_id: string;
          created_at: string;
          description: string | null;
          establishment_id: string;
          id: string;
          image_url: string | null;
          name: string;
          price_cents: number;
          sort: number;
          vat_code: Database["public"]["Enums"]["vat_code"];
        };
        Insert: {
          available?: boolean;
          category_id: string;
          created_at?: string;
          description?: string | null;
          establishment_id: string;
          id?: string;
          image_url?: string | null;
          name: string;
          price_cents: number;
          sort?: number;
          vat_code?: Database["public"]["Enums"]["vat_code"];
        };
        Update: {
          available?: boolean;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          establishment_id?: string;
          id?: string;
          image_url?: string | null;
          name?: string;
          price_cents?: number;
          sort?: number;
          vat_code?: Database["public"]["Enums"]["vat_code"];
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "menu_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
      modifier_groups: {
        Row: {
          establishment_id: string;
          id: string;
          max_select: number;
          menu_item_id: string;
          min_select: number;
          name: string;
          sort: number;
        };
        Insert: {
          establishment_id: string;
          id?: string;
          max_select?: number;
          menu_item_id: string;
          min_select?: number;
          name: string;
          sort?: number;
        };
        Update: {
          establishment_id?: string;
          id?: string;
          max_select?: number;
          menu_item_id?: string;
          min_select?: number;
          name?: string;
          sort?: number;
        };
        Relationships: [];
      };
      modifiers: {
        Row: {
          available: boolean;
          establishment_id: string;
          group_id: string;
          id: string;
          name: string;
          price_delta_cents: number;
          sort: number;
        };
        Insert: {
          available?: boolean;
          establishment_id: string;
          group_id: string;
          id?: string;
          name: string;
          price_delta_cents?: number;
          sort?: number;
        };
        Update: {
          available?: boolean;
          establishment_id?: string;
          group_id?: string;
          id?: string;
          name?: string;
          price_delta_cents?: number;
          sort?: number;
        };
        Relationships: [];
      };
      order_item_modifiers: {
        Row: {
          establishment_id: string;
          id: string;
          modifier_id: string | null;
          name_snapshot: string;
          order_item_id: string;
          price_delta_cents: number;
        };
        Insert: {
          establishment_id: string;
          id?: string;
          modifier_id?: string | null;
          name_snapshot: string;
          order_item_id: string;
          price_delta_cents?: number;
        };
        Update: {
          establishment_id?: string;
          id?: string;
          modifier_id?: string | null;
          name_snapshot?: string;
          order_item_id?: string;
          price_delta_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey";
            columns: ["order_item_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_item_modifiers_modifier_id_fkey";
            columns: ["modifier_id"];
            isOneToOne: false;
            referencedRelation: "modifiers";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          establishment_id: string;
          id: string;
          menu_item_id: string | null;
          name_snapshot: string;
          notes: string | null;
          order_id: string;
          qty: number;
          unit_price_cents: number;
        };
        Insert: {
          created_at?: string;
          establishment_id: string;
          id?: string;
          menu_item_id?: string | null;
          name_snapshot: string;
          notes?: string | null;
          order_id: string;
          qty: number;
          unit_price_cents: number;
        };
        Update: {
          created_at?: string;
          establishment_id?: string;
          id?: string;
          menu_item_id?: string | null;
          name_snapshot?: string;
          notes?: string | null;
          order_id?: string;
          qty?: number;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_menu_item_id_fkey";
            columns: ["menu_item_id"];
            isOneToOne: false;
            referencedRelation: "menu_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          closed_at: string | null;
          created_at: string;
          customer_name: string | null;
          establishment_id: string;
          id: string;
          paid_at: string | null;
          status: Database["public"]["Enums"]["order_status"];
          subtotal_cents: number;
          table_id: string;
          tip_cents: number;
          total_cents: number;
          updated_at: string;
        };
        Insert: {
          closed_at?: string | null;
          created_at?: string;
          customer_name?: string | null;
          establishment_id: string;
          id?: string;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_cents?: number;
          table_id: string;
          tip_cents?: number;
          total_cents?: number;
          updated_at?: string;
        };
        Update: {
          closed_at?: string | null;
          created_at?: string;
          customer_name?: string | null;
          establishment_id?: string;
          id?: string;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal_cents?: number;
          table_id?: string;
          tip_cents?: number;
          total_cents?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount_cents: number;
          created_at: string;
          establishment_id: string;
          id: string;
          idempotency_key: string | null;
          method: Database["public"]["Enums"]["payment_method"] | null;
          order_id: string;
          provider: string;
          provider_ref: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          stripe_checkout_session_id: string | null;
          tip_cents: number;
          updated_at: string;
        };
        Insert: {
          amount_cents: number;
          created_at?: string;
          establishment_id: string;
          id?: string;
          idempotency_key?: string | null;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          order_id: string;
          provider: string;
          provider_ref?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          stripe_checkout_session_id?: string | null;
          tip_cents?: number;
          updated_at?: string;
        };
        Update: {
          amount_cents?: number;
          created_at?: string;
          establishment_id?: string;
          id?: string;
          idempotency_key?: string | null;
          method?: Database["public"]["Enums"]["payment_method"] | null;
          order_id?: string;
          provider?: string;
          provider_ref?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          stripe_checkout_session_id?: string | null;
          tip_cents?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      restaurant_tables: {
        Row: {
          active: boolean;
          created_at: string;
          establishment_id: string;
          id: string;
          label: string;
          qr_token: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          establishment_id: string;
          id?: string;
          label: string;
          qr_token?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          establishment_id?: string;
          id?: string;
          label?: string;
          qr_token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          auth_user_id: string;
          created_at: string;
          display_name: string | null;
          establishment_id: string;
          id: string;
          role: Database["public"]["Enums"]["staff_role"];
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          display_name?: string | null;
          establishment_id: string;
          id?: string;
          role?: Database["public"]["Enums"]["staff_role"];
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          display_name?: string | null;
          establishment_id?: string;
          id?: string;
          role?: Database["public"]["Enums"]["staff_role"];
        };
        Relationships: [];
      };
      waiter_calls: {
        Row: {
          created_at: string;
          establishment_id: string;
          id: string;
          note: string | null;
          resolved_at: string | null;
          status: Database["public"]["Enums"]["waiter_call_status"];
          table_id: string;
        };
        Insert: {
          created_at?: string;
          establishment_id: string;
          id?: string;
          note?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["waiter_call_status"];
          table_id: string;
        };
        Update: {
          created_at?: string;
          establishment_id?: string;
          id?: string;
          note?: string | null;
          resolved_at?: string | null;
          status?: Database["public"]["Enums"]["waiter_call_status"];
          table_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "waiter_calls_establishment_id_fkey";
            columns: ["establishment_id"];
            isOneToOne: false;
            referencedRelation: "establishments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "waiter_calls_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          payload: Json;
          processed_at: string | null;
          provider: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          payload: Json;
          processed_at?: string | null;
          provider: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          payload?: Json;
          processed_at?: string | null;
          provider?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    // Vazio de propósito: os helpers de RLS vivem no schema `private`, fora da
    // API exposta — não são chamáveis via /rest/v1/rpc.
    Functions: { [_ in never]: never };
    Enums: {
      order_status:
        | "draft"
        | "placed"
        | "in_prep"
        | "ready"
        | "served"
        | "cancelled";
      payment_method: "card" | "mbway" | "multibanco" | "cash";
      payment_status: "pending" | "paid" | "failed" | "refunded";
      plan_tier: "basic" | "pro" | "max";
      staff_role: "owner" | "manager" | "kitchen" | "waiter";
      vat_code: "NOR" | "INT" | "RED" | "ISE";
      waiter_call_status: "open" | "ack" | "resolved";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
