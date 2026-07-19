import type { Database } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type { MarketingProfile, UpdateMarketingProfileInput } from "../types";
import {
  emptyBrandPositioning,
  parseBrandPositioning,
  requireOrganizationId,
  toJson,
} from "./mappers";

type MarketingProfileRow = Database["public"]["Tables"]["marketing_profiles"]["Row"];

function mapRow(row: MarketingProfileRow): MarketingProfile {
  return {
    id: row.id,
    organizationId: row.organization_id,
    brandPositioning: parseBrandPositioning(row.brand_positioning),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MarketingProfileRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async findByOrganizationId(organizationId: string): Promise<MarketingProfile | null> {
    const { data, error } = await this.supabase
      .from("marketing_profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load marketing profile: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }

  async create(organizationId: string | null | undefined): Promise<MarketingProfile> {
    const orgId = requireOrganizationId(organizationId);

    const { data, error } = await this.supabase
      .from("marketing_profiles")
      .insert({
        organization_id: orgId,
        brand_positioning: toJson(emptyBrandPositioning()),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create marketing profile: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, input: UpdateMarketingProfileInput): Promise<MarketingProfile> {
    const payload: Database["public"]["Tables"]["marketing_profiles"]["Update"] = {};

    if (input.brandPositioning !== undefined) {
      payload.brand_positioning = toJson(input.brandPositioning);
    }

    const { data, error } = await this.supabase
      .from("marketing_profiles")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update marketing profile: ${error.message}`);
    }

    return mapRow(data);
  }
}
