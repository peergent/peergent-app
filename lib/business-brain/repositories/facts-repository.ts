import type { Database } from "@/lib/supabase/database.types";
import type {
  BusinessFact,
  CreateFactInput,
  UpdateFactInput,
} from "../types";
import {
  parseFactConfidence,
  parseFactImportance,
  parseRecord,
  toJson,
} from "./mappers";
import type { AppSupabaseClient } from "./business-brain-repository";

type FactRow = Database["public"]["Tables"]["business_brain_facts"]["Row"];

function mapFactRow(row: FactRow): BusinessFact {
  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    subject: row.subject,
    predicate: row.predicate,
    value: row.value,
    source: row.source ?? undefined,
    confidence: parseFactConfidence(row.confidence),
    verified: row.verified,
    importance: parseFactImportance(row.importance),
    lastUpdated: row.updated_at,
    metadata: parseRecord(row.metadata),
    graphExternalId: row.graph_external_id ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export class FactsRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByBusinessBrainId(businessBrainId: string): Promise<BusinessFact[]> {
    const { data, error } = await this.supabase
      .from("business_brain_facts")
      .select("*")
      .eq("business_brain_id", businessBrainId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list facts: ${error.message}`);
    }

    return (data ?? []).map(mapFactRow);
  }

  async findById(id: string): Promise<BusinessFact | null> {
    const { data, error } = await this.supabase
      .from("business_brain_facts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load fact: ${error.message}`);
    }

    return data ? mapFactRow(data) : null;
  }

  async create(businessBrainId: string, input: CreateFactInput): Promise<BusinessFact> {
    const { data, error } = await this.supabase
      .from("business_brain_facts")
      .insert({
        business_brain_id: businessBrainId,
        subject: input.subject,
        predicate: input.predicate,
        value: input.value,
        source: input.source ?? null,
        confidence: input.confidence ?? "moderate",
        verified: input.verified ?? false,
        importance: input.importance ?? "medium",
        metadata: toJson(input.metadata ?? {}),
        graph_external_id: input.graphExternalId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create fact: ${error.message}`);
    }

    return mapFactRow(data);
  }

  async update(id: string, input: UpdateFactInput): Promise<BusinessFact> {
    const payload: Database["public"]["Tables"]["business_brain_facts"]["Update"] = {};

    if (input.subject !== undefined) payload.subject = input.subject;
    if (input.predicate !== undefined) payload.predicate = input.predicate;
    if (input.value !== undefined) payload.value = input.value;
    if (input.source !== undefined) payload.source = input.source ?? null;
    if (input.confidence !== undefined) payload.confidence = input.confidence;
    if (input.verified !== undefined) payload.verified = input.verified;
    if (input.importance !== undefined) payload.importance = input.importance;
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    if (input.graphExternalId !== undefined) {
      payload.graph_external_id = input.graphExternalId ?? null;
    }
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("business_brain_facts")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update fact: ${error.message}`);
    }

    return mapFactRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("business_brain_facts")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete fact: ${error.message}`);
    }
  }
}
