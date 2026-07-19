import type { Database } from "@/lib/supabase/database.types";
import type {
  CreateInternalProcessInput,
  InternalProcess,
  UpdateInternalProcessInput,
} from "../types";
import { parseRecord, parseStringArray, toJson } from "./mappers";
import type { AppSupabaseClient } from "./business-brain-repository";

type ProcessRow = Database["public"]["Tables"]["business_brain_internal_processes"]["Row"];

function mapRow(row: ProcessRow): InternalProcess {
  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    steps: parseStringArray(row.steps),
    metadata: parseRecord(row.metadata),
    graphExternalId: row.graph_external_id ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class InternalProcessesRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByBusinessBrainId(businessBrainId: string): Promise<InternalProcess[]> {
    const { data, error } = await this.supabase
      .from("business_brain_internal_processes")
      .select("*")
      .eq("business_brain_id", businessBrainId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list internal processes: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<InternalProcess | null> {
    const { data, error } = await this.supabase
      .from("business_brain_internal_processes")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load internal process: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(
    businessBrainId: string,
    input: CreateInternalProcessInput
  ): Promise<InternalProcess> {
    const { data, error } = await this.supabase
      .from("business_brain_internal_processes")
      .insert({
        business_brain_id: businessBrainId,
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? null,
        steps: toJson(input.steps ?? []),
        metadata: toJson(input.metadata ?? {}),
        graph_external_id: input.graphExternalId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create internal process: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, input: UpdateInternalProcessInput): Promise<InternalProcess> {
    const payload: Database["public"]["Tables"]["business_brain_internal_processes"]["Update"] =
      {};

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description ?? null;
    if (input.category !== undefined) payload.category = input.category ?? null;
    if (input.steps !== undefined) payload.steps = toJson(input.steps);
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    if (input.graphExternalId !== undefined) {
      payload.graph_external_id = input.graphExternalId ?? null;
    }
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("business_brain_internal_processes")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update internal process: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("business_brain_internal_processes")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete internal process: ${error.message}`);
    }
  }
}
