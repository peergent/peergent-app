export type OrganizationRole =
  | "owner"
  | "admin"
  | "manager"
  | "member"
  | "viewer";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrganizationRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: OrganizationRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrganizationRole;
          created_at?: string;
        };
        Relationships: [];
      };
      peers: {
        Row: {
          id: string;
          name: string;
          role: string;
          website: string;
          objective: string;
          status: string;
          created_at: string | null;
          organization_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          role: string;
          website: string;
          objective: string;
          status: string;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          role?: string;
          website?: string;
          objective?: string;
          status?: string;
          created_at?: string | null;
          organization_id?: string | null;
        };
        Relationships: [];
      };
      website_intelligence_assessments: {
        Row: {
          id: string;
          organization_id: string;
          source_url: string;
          analyzed_at: string;
          assessment: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          source_url: string;
          analyzed_at: string;
          assessment: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          source_url?: string;
          analyzed_at?: string;
          assessment?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      company_dna: {
        Row: {
          id: string;
          organization_id: string;
          mission: string | null;
          values: Json;
          tone_of_voice: Json;
          risk_profile: Json;
          decision_principles: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          mission?: string | null;
          values?: Json;
          tone_of_voice?: Json;
          risk_profile?: Json;
          decision_principles?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          mission?: string | null;
          values?: Json;
          tone_of_voice?: Json;
          risk_profile?: Json;
          decision_principles?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_brains: {
        Row: {
          id: string;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_brain_products: {
        Row: {
          id: string;
          business_brain_id: string;
          name: string;
          description: string | null;
          category: string | null;
          pricing_model: string | null;
          metadata: Json;
          graph_external_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_brain_id: string;
          name: string;
          description?: string | null;
          category?: string | null;
          pricing_model?: string | null;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_brain_id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          pricing_model?: string | null;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_brain_services: {
        Row: {
          id: string;
          business_brain_id: string;
          name: string;
          description: string | null;
          category: string | null;
          delivery_model: string | null;
          metadata: Json;
          graph_external_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_brain_id: string;
          name: string;
          description?: string | null;
          category?: string | null;
          delivery_model?: string | null;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_brain_id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          delivery_model?: string | null;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_brain_customer_segments: {
        Row: {
          id: string;
          business_brain_id: string;
          name: string;
          description: string | null;
          segments: Json;
          pain_points: Json;
          buying_triggers: Json;
          metadata: Json;
          graph_external_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_brain_id: string;
          name: string;
          description?: string | null;
          segments?: Json;
          pain_points?: Json;
          buying_triggers?: Json;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_brain_id?: string;
          name?: string;
          description?: string | null;
          segments?: Json;
          pain_points?: Json;
          buying_triggers?: Json;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_brain_competitors: {
        Row: {
          id: string;
          business_brain_id: string;
          name: string;
          website: string | null;
          strengths: Json;
          weaknesses: Json;
          differentiators: Json;
          metadata: Json;
          graph_external_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_brain_id: string;
          name: string;
          website?: string | null;
          strengths?: Json;
          weaknesses?: Json;
          differentiators?: Json;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_brain_id?: string;
          name?: string;
          website?: string | null;
          strengths?: Json;
          weaknesses?: Json;
          differentiators?: Json;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_brain_internal_processes: {
        Row: {
          id: string;
          business_brain_id: string;
          name: string;
          description: string | null;
          category: string | null;
          steps: Json;
          metadata: Json;
          graph_external_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_brain_id: string;
          name: string;
          description?: string | null;
          category?: string | null;
          steps?: Json;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_brain_id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          steps?: Json;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_brain_knowledge_sources: {
        Row: {
          id: string;
          business_brain_id: string;
          title: string;
          source_type: string;
          summary: string | null;
          content: string | null;
          source_url: string | null;
          storage_ref: string | null;
          metadata: Json;
          graph_external_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_brain_id: string;
          title: string;
          source_type: string;
          summary?: string | null;
          content?: string | null;
          source_url?: string | null;
          storage_ref?: string | null;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_brain_id?: string;
          title?: string;
          source_type?: string;
          summary?: string | null;
          content?: string | null;
          source_url?: string | null;
          storage_ref?: string | null;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_brain_facts: {
        Row: {
          id: string;
          business_brain_id: string;
          subject: string;
          predicate: string;
          value: string;
          source: string | null;
          confidence: string;
          verified: boolean;
          importance: string;
          metadata: Json;
          graph_external_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_brain_id: string;
          subject: string;
          predicate: string;
          value: string;
          source?: string | null;
          confidence?: string;
          verified?: boolean;
          importance?: string;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_brain_id?: string;
          subject?: string;
          predicate?: string;
          value?: string;
          source?: string | null;
          confidence?: string;
          verified?: boolean;
          importance?: string;
          metadata?: Json;
          graph_external_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_profiles: {
        Row: {
          id: string;
          organization_id: string;
          brand_positioning: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brand_positioning?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          brand_positioning?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_goals: {
        Row: {
          id: string;
          marketing_profile_id: string;
          title: string;
          description: string | null;
          priority: number;
          timeframe: string | null;
          status: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          marketing_profile_id: string;
          title: string;
          description?: string | null;
          priority?: number;
          timeframe?: string | null;
          status?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          marketing_profile_id?: string;
          title?: string;
          description?: string | null;
          priority?: number;
          timeframe?: string | null;
          status?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      marketing_content_items: {
        Row: {
          id: string;
          marketing_profile_id: string;
          title: string;
          content_type: string;
          channel: string | null;
          summary: string | null;
          source_url: string | null;
          published_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          marketing_profile_id: string;
          title: string;
          content_type?: string;
          channel?: string | null;
          summary?: string | null;
          source_url?: string | null;
          published_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          marketing_profile_id?: string;
          title?: string;
          content_type?: string;
          channel?: string | null;
          summary?: string | null;
          source_url?: string | null;
          published_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
