import type { Database } from "@/lib/supabase/database.types";
import type {
  CreateKnowledgeSourceInput,
  KnowledgeSource,
  UpdateKnowledgeSourceInput,
} from "../types";
import { parseKnowledgeSourceType, parseRecord, toJson } from "./mappers";
import type { AppSupabaseClient } from "./business-brain-repository";

type SourceRow = Database["public"]["Tables"]["business_brain_knowledge_sources"]["Row"];

function mapRow(row: SourceRow): KnowledgeSource {
  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    title: row.title,
    sourceType: parseKnowledgeSourceType(row.source_type),
    summary: row.summary ?? undefined,
    content: row.content ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    storageRef: row.storage_ref ?? undefined,
    metadata: parseRecord(row.metadata),
    graphExternalId: row.graph_external_id ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class KnowledgeSourcesRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByBusinessBrainId(businessBrainId: string): Promise<KnowledgeSource[]> {
    const { data, error } = await this.supabase
      .from("business_brain_knowledge_sources")
      .select("*")
      .eq("business_brain_id", businessBrainId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list knowledge sources: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<KnowledgeSource | null> {
    const { data, error } = await this.supabase
      .from("business_brain_knowledge_sources")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load knowledge source: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(
    businessBrainId: string,
    input: CreateKnowledgeSourceInput
  ): Promise<KnowledgeSource> {
    const { data, error } = await this.supabase
      .from("business_brain_knowledge_sources")
      .insert({
        business_brain_id: businessBrainId,
        title: input.title,
        source_type: input.sourceType,
        summary: input.summary ?? null,
        content: input.content ?? null,
        source_url: input.sourceUrl ?? null,
        storage_ref: input.storageRef ?? null,
        metadata: toJson(input.metadata ?? {}),
        graph_external_id: input.graphExternalId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create knowledge source: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, input: UpdateKnowledgeSourceInput): Promise<KnowledgeSource> {
    const payload: Database["public"]["Tables"]["business_brain_knowledge_sources"]["Update"] =
      {};

    if (input.title !== undefined) payload.title = input.title;
    if (input.sourceType !== undefined) payload.source_type = input.sourceType;
    if (input.summary !== undefined) payload.summary = input.summary ?? null;
    if (input.content !== undefined) payload.content = input.content ?? null;
    if (input.sourceUrl !== undefined) payload.source_url = input.sourceUrl ?? null;
    if (input.storageRef !== undefined) payload.storage_ref = input.storageRef ?? null;
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    if (input.graphExternalId !== undefined) {
      payload.graph_external_id = input.graphExternalId ?? null;
    }
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("business_brain_knowledge_sources")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update knowledge source: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("business_brain_knowledge_sources")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete knowledge source: ${error.message}`);
    }
  }
}
