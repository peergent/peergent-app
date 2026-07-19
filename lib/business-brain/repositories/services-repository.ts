import type { Database } from "@/lib/supabase/database.types";
import type {
  BrainService,
  CreateServiceInput,
  UpdateServiceInput,
} from "../types";
import { parseRecord, toJson } from "./mappers";
import type { AppSupabaseClient } from "./business-brain-repository";

type ServiceRow = Database["public"]["Tables"]["business_brain_services"]["Row"];

function mapServiceRow(row: ServiceRow): BrainService {
  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    deliveryModel: row.delivery_model ?? undefined,
    metadata: parseRecord(row.metadata),
    graphExternalId: row.graph_external_id ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ServicesRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByBusinessBrainId(businessBrainId: string): Promise<BrainService[]> {
    const { data, error } = await this.supabase
      .from("business_brain_services")
      .select("*")
      .eq("business_brain_id", businessBrainId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list services: ${error.message}`);
    }

    return (data ?? []).map(mapServiceRow);
  }

  async findById(id: string): Promise<BrainService | null> {
    const { data, error } = await this.supabase
      .from("business_brain_services")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load service: ${error.message}`);
    }

    return data ? mapServiceRow(data) : null;
  }

  async create(
    businessBrainId: string,
    input: CreateServiceInput
  ): Promise<BrainService> {
    const { data, error } = await this.supabase
      .from("business_brain_services")
      .insert({
        business_brain_id: businessBrainId,
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? null,
        delivery_model: input.deliveryModel ?? null,
        metadata: toJson(input.metadata ?? {}),
        graph_external_id: input.graphExternalId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create service: ${error.message}`);
    }

    return mapServiceRow(data);
  }

  async update(id: string, input: UpdateServiceInput): Promise<BrainService> {
    const payload: Database["public"]["Tables"]["business_brain_services"]["Update"] = {};

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description ?? null;
    if (input.category !== undefined) payload.category = input.category ?? null;
    if (input.deliveryModel !== undefined) payload.delivery_model = input.deliveryModel ?? null;
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    if (input.graphExternalId !== undefined) {
      payload.graph_external_id = input.graphExternalId ?? null;
    }
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("business_brain_services")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update service: ${error.message}`);
    }

    return mapServiceRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("business_brain_services")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete service: ${error.message}`);
    }
  }
}
