import type { Database } from "@/lib/supabase/database.types";
import type {
  CreateCustomerSegmentInput,
  CustomerSegment,
  UpdateCustomerSegmentInput,
} from "../types";
import { parseRecord, parseStringArray, toJson } from "./mappers";
import type { AppSupabaseClient } from "./business-brain-repository";

type SegmentRow = Database["public"]["Tables"]["business_brain_customer_segments"]["Row"];

function mapRow(row: SegmentRow): CustomerSegment {
  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    name: row.name,
    description: row.description ?? undefined,
    segments: parseStringArray(row.segments),
    painPoints: parseStringArray(row.pain_points),
    buyingTriggers: parseStringArray(row.buying_triggers),
    metadata: parseRecord(row.metadata),
    graphExternalId: row.graph_external_id ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class CustomerSegmentsRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByBusinessBrainId(businessBrainId: string): Promise<CustomerSegment[]> {
    const { data, error } = await this.supabase
      .from("business_brain_customer_segments")
      .select("*")
      .eq("business_brain_id", businessBrainId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list customer segments: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async findById(id: string): Promise<CustomerSegment | null> {
    const { data, error } = await this.supabase
      .from("business_brain_customer_segments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load customer segment: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(
    businessBrainId: string,
    input: CreateCustomerSegmentInput
  ): Promise<CustomerSegment> {
    const { data, error } = await this.supabase
      .from("business_brain_customer_segments")
      .insert({
        business_brain_id: businessBrainId,
        name: input.name,
        description: input.description ?? null,
        segments: toJson(input.segments ?? []),
        pain_points: toJson(input.painPoints ?? []),
        buying_triggers: toJson(input.buyingTriggers ?? []),
        metadata: toJson(input.metadata ?? {}),
        graph_external_id: input.graphExternalId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create customer segment: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, input: UpdateCustomerSegmentInput): Promise<CustomerSegment> {
    const payload: Database["public"]["Tables"]["business_brain_customer_segments"]["Update"] =
      {};

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description ?? null;
    if (input.segments !== undefined) payload.segments = toJson(input.segments);
    if (input.painPoints !== undefined) payload.pain_points = toJson(input.painPoints);
    if (input.buyingTriggers !== undefined) {
      payload.buying_triggers = toJson(input.buyingTriggers);
    }
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    if (input.graphExternalId !== undefined) {
      payload.graph_external_id = input.graphExternalId ?? null;
    }
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("business_brain_customer_segments")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update customer segment: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("business_brain_customer_segments")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete customer segment: ${error.message}`);
    }
  }
}
