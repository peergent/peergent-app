import type { Database } from "@/lib/supabase/database.types";
import type { AppSupabaseClient } from "@/lib/intelligence/api/org-context";
import type {
  CreateMarketingContentInput,
  MarketingContentItem,
  UpdateMarketingContentInput,
} from "../types";
import { parseContentType } from "./mappers";

type MarketingContentRow = Database["public"]["Tables"]["marketing_content_items"]["Row"];

function mapRow(row: MarketingContentRow): MarketingContentItem {
  return {
    id: row.id,
    marketingProfileId: row.marketing_profile_id,
    title: row.title,
    contentType: parseContentType(row.content_type),
    channel: row.channel ?? undefined,
    summary: row.summary ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    publishedAt: row.published_at ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class MarketingContentRepository {
  constructor(private readonly supabase: AppSupabaseClient) {}

  async listByProfileId(profileId: string): Promise<MarketingContentItem[]> {
    const { data, error } = await this.supabase
      .from("marketing_content_items")
      .select("*")
      .eq("marketing_profile_id", profileId)
      .order("sort_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to list marketing content: ${error.message}`);
    }

    return (data ?? []).map(mapRow);
  }

  async create(
    profileId: string,
    input: CreateMarketingContentInput
  ): Promise<MarketingContentItem> {
    const { data, error } = await this.supabase
      .from("marketing_content_items")
      .insert({
        marketing_profile_id: profileId,
        title: input.title,
        content_type: input.contentType ?? "other",
        channel: input.channel ?? null,
        summary: input.summary ?? null,
        source_url: input.sourceUrl ?? null,
        published_at: input.publishedAt ?? null,
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create marketing content: ${error.message}`);
    }

    return mapRow(data);
  }

  async update(id: string, input: UpdateMarketingContentInput): Promise<MarketingContentItem> {
    const payload: Database["public"]["Tables"]["marketing_content_items"]["Update"] = {};

    if (input.title !== undefined) payload.title = input.title;
    if (input.contentType !== undefined) payload.content_type = input.contentType;
    if (input.channel !== undefined) payload.channel = input.channel ?? null;
    if (input.summary !== undefined) payload.summary = input.summary ?? null;
    if (input.sourceUrl !== undefined) payload.source_url = input.sourceUrl ?? null;
    if (input.publishedAt !== undefined) payload.published_at = input.publishedAt ?? null;
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await this.supabase
      .from("marketing_content_items")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update marketing content: ${error.message}`);
    }

    return mapRow(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("marketing_content_items")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete marketing content: ${error.message}`);
    }
  }

  async findById(id: string): Promise<MarketingContentItem | null> {
    const { data, error } = await this.supabase
      .from("marketing_content_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load marketing content: ${error.message}`);
    }

    return data ? mapRow(data) : null;
  }
}
