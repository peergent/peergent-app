import type { Database } from "@/lib/supabase/database.types";
import type { Competitor, CreateCompetitorInput, UpdateCompetitorInput } from "../types";
import { parseRecord, parseStringArray, toJson } from "./mappers";
import type { AppSupabaseClient } from "./business-brain-repository";

type CompetitorRow = Database["public"]["Tables"]["business_brain_competitors"]["Row"];

function mapCompetitorRow(row: CompetitorRow): Competitor {
  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    name: row.name,
    website: row.website ?? undefined,
    strengths: parseStringArray(row.strengths),
    weaknesses: parseStringArray(row.weaknesses),
    differentiators: parseStringArray(row.differentiators),
    metadata: parseRecord(row.metadata),
    graphExternalId: row.graph_external_id ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CompetitorsRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByBusinessBrainId(businessBrainId: string): Promise<Competitor[]> {
    const { data, error } = await this.supabase
      .from("business_brain_competitors")
      .select("*")
      .eq("business_brain_id", businessBrainId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list competitors: ${error.message}`);
    }

    return (data ?? []).map(mapCompetitorRow);
  }

  async findById(id: string): Promise<Competitor | null> {
    const { data, error } = await this.supabase
      .from("business_brain_competitors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load competitor: ${error.message}`);
    }

    return data ? mapCompetitorRow(data) : null;
  }

  async create(
    businessBrainId: string,
    input: CreateCompetitorInput
  ): Promise<Competitor> {
    const { data, error } = await this.supabase
      .from("business_brain_competitors")
      .insert({
        business_brain_id: businessBrainId,
        name: input.name,
        website: input.website ?? null,
        strengths: toJson(input.strengths ?? []),
        weaknesses: toJson(input.weaknesses ?? []),
        differentiators: toJson(input.differentiators ?? []),
        metadata: toJson(input.metadata ?? {}),
        graph_external_id: input.graphExternalId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create competitor: ${error.message}`);
    }

    return mapCompetitorRow(data);
  }

  async update(id: string, input: UpdateCompetitorInput): Promise<Competitor> {
    const payload: Database["public"]["Tables"]["business_brain_competitors"]["Update"] = {};

    if (input.name !== undefined) payload.name = input.name;
    if (input.website !== undefined) payload.website = input.website ?? null;
    if (input.strengths !== undefined) payload.strengths = toJson(input.strengths);
    if (input.weaknesses !== undefined) payload.weaknesses = toJson(input.weaknesses);
    if (input.differentiators !== undefined) {
      payload.differentiators = toJson(input.differentiators);
    }
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    if (input.graphExternalId !== undefined) {
      payload.graph_external_id = input.graphExternalId ?? null;
    }
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("business_brain_competitors")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update competitor: ${error.message}`);
    }

    return mapCompetitorRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("business_brain_competitors")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete competitor: ${error.message}`);
    }
  }
}
