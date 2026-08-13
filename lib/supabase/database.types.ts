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
      brain_layer_documents: {
        Row: {
          id: string;
          organization_id: string;
          brain_id: string;
          document_kind: string;
          document_id: string;
          scope_key: string;
          project_id: string | null;
          campaign_id: string | null;
          peer_id: string | null;
          output_ref: string;
          version: number;
          status: string | null;
          confidence: string | null;
          schema_version: string;
          payload: Json;
          supersedes_output_ref: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brain_id: string;
          document_kind: string;
          document_id: string;
          scope_key?: string;
          project_id?: string | null;
          campaign_id?: string | null;
          peer_id?: string | null;
          output_ref: string;
          version?: number;
          status?: string | null;
          confidence?: string | null;
          schema_version?: string;
          payload: Json;
          supersedes_output_ref?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          brain_id?: string;
          document_kind?: string;
          document_id?: string;
          scope_key?: string;
          project_id?: string | null;
          campaign_id?: string | null;
          peer_id?: string | null;
          output_ref?: string;
          version?: number;
          status?: string | null;
          confidence?: string | null;
          schema_version?: string;
          payload?: Json;
          supersedes_output_ref?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brain_layer_latest: {
        Row: {
          organization_id: string;
          brain_id: string;
          scope_key: string;
          latest_output_ref: string;
          latest_document_id: string;
          latest_version: number;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          brain_id: string;
          scope_key?: string;
          latest_output_ref: string;
          latest_document_id: string;
          latest_version?: number;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          brain_id?: string;
          scope_key?: string;
          latest_output_ref?: string;
          latest_document_id?: string;
          latest_version?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      brain_org_memory_records: {
        Row: {
          id: string;
          organization_id: string;
          memory_id: string;
          category: string | null;
          tags: Json;
          campaign_id: string | null;
          project_id: string | null;
          confidence: string | null;
          importance: string | null;
          durability: string | null;
          scope: string | null;
          content: Json;
          evidence: Json;
          relations: Json;
          graph_output_ref: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          memory_id: string;
          category?: string | null;
          tags?: Json;
          campaign_id?: string | null;
          project_id?: string | null;
          confidence?: string | null;
          importance?: string | null;
          durability?: string | null;
          scope?: string | null;
          content?: Json;
          evidence?: Json;
          relations?: Json;
          graph_output_ref?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          memory_id?: string;
          category?: string | null;
          tags?: Json;
          campaign_id?: string | null;
          project_id?: string | null;
          confidence?: string | null;
          importance?: string | null;
          durability?: string | null;
          scope?: string | null;
          content?: Json;
          evidence?: Json;
          relations?: Json;
          graph_output_ref?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brain_project_episodes: {
        Row: {
          organization_id: string;
          project_id: string;
          episode_id: string;
          peer_id: string;
          correlation_id: string;
          episode_status: string;
          current_state: string;
          current_brain: string | null;
          version: number;
          episode: Json;
          artifacts: Json;
          resolved_graphs: Json;
          cached_learning_proposals: Json;
          started_at: string;
          updated_at: string;
          completed_at: string | null;
          last_error: string | null;
        };
        Insert: {
          organization_id: string;
          project_id: string;
          episode_id: string;
          peer_id: string;
          correlation_id: string;
          episode_status: string;
          current_state: string;
          current_brain?: string | null;
          version?: number;
          episode: Json;
          artifacts: Json;
          resolved_graphs?: Json;
          cached_learning_proposals?: Json;
          started_at: string;
          updated_at: string;
          completed_at?: string | null;
          last_error?: string | null;
        };
        Update: {
          organization_id?: string;
          project_id?: string;
          episode_id?: string;
          peer_id?: string;
          correlation_id?: string;
          episode_status?: string;
          current_state?: string;
          current_brain?: string | null;
          version?: number;
          episode?: Json;
          artifacts?: Json;
          resolved_graphs?: Json;
          cached_learning_proposals?: Json;
          started_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          last_error?: string | null;
        };
        Relationships: [];
      };
      brain_project_events: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          event_id: string;
          event_type: string;
          brain_id: string | null;
          output_ref: string | null;
          correlation_id: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          project_id: string;
          event_id: string;
          event_type: string;
          brain_id?: string | null;
          output_ref?: string | null;
          correlation_id: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          event_id?: string;
          event_type?: string;
          brain_id?: string | null;
          output_ref?: string | null;
          correlation_id?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      brain_project_approvals: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          checkpoint_kind: string;
          decision: string;
          actor: string;
          comment: string | null;
          decided_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          project_id: string;
          checkpoint_kind: string;
          decision: string;
          actor: string;
          comment?: string | null;
          decided_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          checkpoint_kind?: string;
          decision?: string;
          actor?: string;
          comment?: string | null;
          decided_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      brain_performance_observations: {
        Row: {
          id: string;
          organization_id: string;
          project_id: string;
          observation: Json;
          observed_at: string;
          created_at: string;
        };
        Insert: {
          id: string;
          organization_id: string;
          project_id: string;
          observation: Json;
          observed_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          project_id?: string;
          observation?: Json;
          observed_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      brain_execution_idempotency: {
        Row: {
          organization_id: string;
          project_id: string;
          idempotency_key: string;
          execution_output_ref: string;
          status: string;
          payload: Json;
          reserved_at: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          project_id: string;
          idempotency_key: string;
          execution_output_ref?: string;
          status?: string;
          payload?: Json;
          reserved_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          project_id?: string;
          idempotency_key?: string;
          execution_output_ref?: string;
          status?: string;
          payload?: Json;
          reserved_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      upsert_brain_project_episode_versioned: {
        Args: {
          p_organization_id: string;
          p_project_id: string;
          p_expected_version: number;
          p_episode: Json;
          p_artifacts: Json;
          p_resolved_graphs: Json;
          p_cached_learning_proposals: Json;
          p_episode_id: string;
          p_peer_id: string;
          p_correlation_id: string;
          p_episode_status: string;
          p_current_state: string;
          p_current_brain: string | null;
          p_started_at: string;
          p_updated_at: string;
          p_completed_at: string | null;
          p_last_error: string | null;
        };
        Returns: {
          new_version: number;
          conflict: boolean;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
