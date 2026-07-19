import type { Database } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { BusinessBrain } from "../types";
import { requireOrganizationId } from "./mappers";

type BusinessBrainRow = Database["public"]["Tables"]["business_brains"]["Row"];

function mapBusinessBrainRow(row: BusinessBrainRow): BusinessBrain {
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class BusinessBrainRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async findByOrganizationId(organizationId: string): Promise<BusinessBrain | null> {
    const { data, error } = await this.supabase
      .from("business_brains")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load Business Brain: ${error.message}`);
    }

    return data ? mapBusinessBrainRow(data) : null;
  }

  async create(organizationId: string | null | undefined): Promise<BusinessBrain> {
    const orgId = requireOrganizationId(organizationId);

    const { data, error } = await this.supabase
      .from("business_brains")
      .insert({ organization_id: orgId })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create Business Brain: ${error.message}`);
    }

    return mapBusinessBrainRow(data);
  }
}

export type { AppSupabaseClient };
