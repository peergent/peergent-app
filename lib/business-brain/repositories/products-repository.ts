import type { Database } from "@/lib/supabase/database.types";
import type {
  BusinessBrainProduct,
  CreateProductInput,
  UpdateProductInput,
} from "../types";
import { parseRecord, toJson } from "./mappers";
import type { AppSupabaseClient } from "./business-brain-repository";

type ProductRow = Database["public"]["Tables"]["business_brain_products"]["Row"];

function mapProductRow(row: ProductRow): BusinessBrainProduct {
  return {
    id: row.id,
    businessBrainId: row.business_brain_id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    pricingModel: row.pricing_model ?? undefined,
    metadata: parseRecord(row.metadata),
    graphExternalId: row.graph_external_id ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProductsRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByBusinessBrainId(businessBrainId: string): Promise<BusinessBrainProduct[]> {
    const { data, error } = await this.supabase
      .from("business_brain_products")
      .select("*")
      .eq("business_brain_id", businessBrainId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to list products: ${error.message}`);
    }

    return (data ?? []).map(mapProductRow);
  }

  async findById(id: string): Promise<BusinessBrainProduct | null> {
    const { data, error } = await this.supabase
      .from("business_brain_products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load product: ${error.message}`);
    }

    return data ? mapProductRow(data) : null;
  }

  async create(
    businessBrainId: string,
    input: CreateProductInput
  ): Promise<BusinessBrainProduct> {
    const { data, error } = await this.supabase
      .from("business_brain_products")
      .insert({
        business_brain_id: businessBrainId,
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? null,
        pricing_model: input.pricingModel ?? null,
        metadata: toJson(input.metadata ?? {}),
        graph_external_id: input.graphExternalId ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return mapProductRow(data);
  }

  async update(id: string, input: UpdateProductInput): Promise<BusinessBrainProduct> {
    const payload: Database["public"]["Tables"]["business_brain_products"]["Update"] = {};

    if (input.name !== undefined) payload.name = input.name;
    if (input.description !== undefined) payload.description = input.description ?? null;
    if (input.category !== undefined) payload.category = input.category ?? null;
    if (input.pricingModel !== undefined) payload.pricing_model = input.pricingModel ?? null;
    if (input.metadata !== undefined) payload.metadata = toJson(input.metadata);
    if (input.graphExternalId !== undefined) {
      payload.graph_external_id = input.graphExternalId ?? null;
    }
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("business_brain_products")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return mapProductRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("business_brain_products")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
}
